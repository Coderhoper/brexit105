const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Returns revenue, COGS, expenses, gross profit, net profit, deficit for a date range
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start || '1970-01-01';
    const endDate = end || new Date().toISOString().slice(0,10);

    const salesRes = await db.query('SELECT COALESCE(SUM(total_amount),0) AS total_sales FROM sales WHERE sale_date::date BETWEEN $1 AND $2', [startDate, endDate]);
    const total_sales = parseFloat(salesRes.rows[0].total_sales || 0);

    const cogsRes = await db.query(
      `SELECT COALESCE(SUM(si.quantity * COALESCE(p.unit_cost_price,0)),0) AS cogs
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       WHERE s.sale_date::date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    const cogs = parseFloat(cogsRes.rows[0].cogs || 0);

    const expensesRes = await db.query('SELECT COALESCE(SUM(amount),0) AS expenses FROM expenses WHERE date::date BETWEEN $1 AND $2', [startDate, endDate]);
    const expenses = parseFloat(expensesRes.rows[0].expenses || 0);

    const expected_profit = total_sales - cogs;
    const actual_net_profit = expected_profit - expenses;
    const deficit = expected_profit - actual_net_profit; // equals expenses

    return res.json({
      start: startDate,
      end: endDate,
      total_sales,
      cogs,
      expected_profit,
      expenses,
      actual_net_profit,
      deficit
    });
  } catch (err) {
    console.error('analytics summary', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/pnl', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = start || '1970-01-01';
    const endDate = end || new Date().toISOString().slice(0, 10);

    const salesRes = await db.query('SELECT COALESCE(SUM(total_amount),0) AS total_sales FROM sales WHERE sale_date::date BETWEEN $1 AND $2', [startDate, endDate]);
    const expensesRes = await db.query('SELECT COALESCE(SUM(amount),0) AS expenses FROM expenses WHERE date::date BETWEEN $1 AND $2', [startDate, endDate]);
    const cogsRes = await db.query(
      `SELECT COALESCE(SUM(si.quantity * COALESCE(p.unit_cost_price,0)),0) AS cogs
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       WHERE s.sale_date::date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );

    const total_sales = parseFloat(salesRes?.rows?.[0]?.total_sales || 0);
    const expenses = parseFloat(expensesRes?.rows?.[0]?.expenses || 0);
    const cogs = parseFloat(cogsRes?.rows?.[0]?.cogs || 0);
    const expected_profit = total_sales - cogs;
    const actual_net_profit = expected_profit - expenses;

    return res.json({
      start: startDate,
      end: endDate,
      total_sales,
      cogs,
      expenses,
      expected_profit,
      actual_net_profit,
      gross_margin: expected_profit,
      net_margin: actual_net_profit,
      status: actual_net_profit >= 0 ? 'surplus' : 'deficit'
    });
  } catch (err) {
    console.error('analytics pnl', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
