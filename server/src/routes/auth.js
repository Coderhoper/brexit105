const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Register a new user (owners limited to 3)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'staff', phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    // If creating an owner, enforce max 2 owners
    if (role === 'owner') {
      const ownerCountRes = await db.query('SELECT COUNT(*) FROM users WHERE role = $1', ['owner']);
      const ownerCount = parseInt(ownerCountRes.rows[0].count, 10);
      if (ownerCount >= 2) {
        return res.status(403).json({ message: 'Owner limit reached (max 2)' });
      }
    }

    // Check existing email
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(409).json({ message: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const insertRes = await db.query(
      `INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, created_at`,
      [name, email, password_hash, role, phone]
    );

    const user = insertRes.rows[0];
    return res.status(201).json({ user });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login and get JWT
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'email and password required' });

    const userRes = await db.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = userRes.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    return res.json({ user: userRes.rows[0] });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
