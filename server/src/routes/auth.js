const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)
    `).run(id, email, password_hash, name);

    // Create empty travelling CV
    db.prepare(`
      INSERT INTO travelling_cv (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), id);

    // Award first badge
    db.prepare(`
      INSERT INTO badges (id, user_id, badge_type, badge_name) VALUES (?, ?, 'newcomer', 'New Explorer')
    `).run(uuidv4(), id);

    const token = jwt.sign({ id, email, name, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id, email, name, avatar: null }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Google OAuth (stub)
router.post('/google', (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, name, avatar, auth_provider) VALUES (?, ?, ?, ?, 'google')
    `).run(id, email, name, avatar || null);

    db.prepare(`
      INSERT INTO travelling_cv (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), id);

    db.prepare(`
      INSERT INTO badges (id, user_id, badge_type, badge_name) VALUES (?, ?, 'newcomer', 'New Explorer')
    `).run(uuidv4(), id);

    user = { id, email, name, avatar, role: 'user' };
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }
  });
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, avatar, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

module.exports = router;
