const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// List sales
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = await db.query('SELECT * FROM sales ORDER BY sale_date DESC LIMIT 200');
    return res.json({ sales: q.rows });
  } catch (err) {
    console.error('list sales', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get sale with items
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const saleRes = await db.query('SELECT * FROM sales WHERE id = $1', [req.params.id]);
    if (saleRes.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const itemsRes = await db.query('SELECT si.*, p.product_name FROM sale_items si LEFT JOIN products p ON p.id = si.product_id WHERE si.sale_id = $1', [req.params.id]);
    return res.json({ sale: saleRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error('get sale', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a sale with items, deduct stock in a transaction
router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { items, payment_method } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'items required' });

    await client.query('BEGIN');

    // Validate and compute totals
    let total_amount = 0;
    const itemDetails = [];
    for (const it of items) {
      const { product_id, quantity, unit_price } = it;
      if (!product_id || !quantity || quantity <= 0) throw new Error('Invalid item');

      // lock product row
      const pRes = await client.query('SELECT id, product_name, current_stock_quantity FROM products WHERE id = $1 FOR UPDATE', [product_id]);
      if (pRes.rows.length === 0) throw new Error('Product not found');
      const product = pRes.rows[0];
      if (product.current_stock_quantity < quantity) throw new Error(`Insufficient stock for product ${product.product_name}`);

      const subtotal = parseFloat(unit_price) * parseInt(quantity, 10);
      total_amount += subtotal;
      itemDetails.push({ product_id, quantity, unit_price, subtotal, prev_stock: product.current_stock_quantity });
    }

    // Insert sale
    const saleInsert = await client.query(
      'INSERT INTO sales (sale_date, total_amount, payment_method, admin_id) VALUES (now(), $1, $2, $3) RETURNING *',
      [total_amount, payment_method, req.user.userId]
    );
    const sale = saleInsert.rows[0];

    // Insert items and update stock
    for (const it of itemDetails) {
      await client.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal) VALUES ($1,$2,$3,$4,$5)',
        [sale.id, it.product_id, it.quantity, it.unit_price, it.subtotal]
      );
      const newStock = it.prev_stock - it.quantity;
      await client.query('UPDATE products SET current_stock_quantity = $1 WHERE id = $2', [newStock, it.product_id]);
    }

    await client.query('COMMIT');
    return res.status(201).json({ saleId: sale.id, total_amount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('create sale', err);
    return res.status(400).json({ message: err.message || 'Failed to create sale' });
  } finally {
    client.release();
  }
});

module.exports = router;
