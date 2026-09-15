const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const path = require('path');
const multer = require('multer');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, uploadsDir); },
  filename: function (req, file, cb) { const unique = `${Date.now()}-${Math.round(Math.random()*1e9)}-${file.originalname.replace(/\s+/g,'_')}`; cb(null, unique); }
});
const upload = multer({ storage });

// List all products - staff can view, owners can manage
router.get('/', requireAuth, async (req, res) => {
  try {
    const q = await db.query('SELECT * FROM products ORDER BY product_name');
    return res.json({ products: q.rows });
  } catch (err) {
    console.error('list products', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Low-stock alerts
router.get('/low-stock', async (req, res) => {
  try {
    const q = await db.query('SELECT * FROM products WHERE current_stock_quantity <= min_stock_alert_threshold ORDER BY current_stock_quantity');
    return res.json({ products: q.rows });
  } catch (err) {
    console.error('low stock', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get product
router.get('/:id', async (req, res) => {
  try {
    const q = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ product: q.rows[0] });
  } catch (err) {
    console.error('get product', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Create product
router.post('/', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const { product_name, category, sku, unit_cost_price = 0, unit_selling_price = 0, current_stock_quantity = 0, min_stock_alert_threshold = 0 } = req.body;
    if (!product_name) return res.status(400).json({ message: 'product_name required' });

    const insert = await db.query(
      `INSERT INTO products (product_name, category, sku, unit_cost_price, unit_selling_price, current_stock_quantity, min_stock_alert_threshold)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [product_name, category, sku, unit_cost_price, unit_selling_price, current_stock_quantity, min_stock_alert_threshold]
    );

    return res.status(201).json({ product: insert.rows[0] });
  } catch (err) {
    console.error('create product', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update product
router.put('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const fields = ['product_name','category','sku','unit_cost_price','unit_selling_price','current_stock_quantity','min_stock_alert_threshold'];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = $${idx}`);
        values.push(req.body[f]);
        idx++;
      }
    }
    if (updates.length === 0) return res.status(400).json({ message: 'No fields to update' });
    values.push(req.params.id);
    const q = `UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
    const resq = await db.query(q, values);
    if (resq.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ product: resq.rows[0] });
  } catch (err) {
    console.error('update product', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', requireAuth, requireRole('owner'), async (req, res) => {
  try {
    const q = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ deleted: q.rows[0] });
  } catch (err) {
    console.error('delete product', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload product image
router.post('/:id/image', requireAuth, requireRole('owner'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'image file required' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const q = await db.query('UPDATE products SET product_image = $1 WHERE id = $2 RETURNING *', [imageUrl, req.params.id]);
    if (q.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    return res.json({ product: q.rows[0] });
  } catch (err) {
    console.error('upload product image', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
