const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get conversations list
router.get('/conversations', authenticateToken, (req, res) => {
  const conversations = db.prepare(`
    SELECT DISTINCT
      CASE 
        WHEN sender_id = ? THEN receiver_id 
        ELSE sender_id 
      END as partner_id,
      MAX(created_at) as last_message_at
    FROM messages
    WHERE (sender_id = ? OR receiver_id = ?) AND group_id IS NULL
    GROUP BY partner_id
    ORDER BY last_message_at DESC
  `).all(req.user.id, req.user.id, req.user.id);

  const enriched = conversations.map(conv => {
    const partner = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(conv.partner_id);
    const lastMessage = db.prepare(`
      SELECT * FROM messages 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
        AND group_id IS NULL
      ORDER BY created_at DESC LIMIT 1
    `).get(req.user.id, conv.partner_id, conv.partner_id, req.user.id);
    const unread = db.prepare(`
      SELECT COUNT(*) as count FROM messages 
      WHERE sender_id = ? AND receiver_id = ? AND read = 0 AND group_id IS NULL
    `).get(conv.partner_id, req.user.id);

    return {
      partner,
      lastMessage,
      unreadCount: unread.count
    };
  });

  res.json(enriched);
});

// Get messages with a user
router.get('/user/:userId', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id = u.id
    WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
      AND m.group_id IS NULL
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all(req.user.id, req.params.userId, req.params.userId, req.user.id);

  // Mark as read
  db.prepare(`
    UPDATE messages SET read = 1 
    WHERE sender_id = ? AND receiver_id = ? AND read = 0 AND group_id IS NULL
  `).run(req.params.userId, req.user.id);

  res.json(messages);
});

// Send message
router.post('/', authenticateToken, (req, res) => {
  const { receiver_id, group_id, content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });
  if (!receiver_id && !group_id) return res.status(400).json({ error: 'Receiver or group is required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO messages (id, sender_id, receiver_id, group_id, content) VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, receiver_id || null, group_id || null, content);

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?
  `).get(id);

  res.status(201).json(message);
});

// Get group messages
router.get('/group/:groupId', authenticateToken, (req, res) => {
  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m JOIN users u ON m.sender_id = u.id
    WHERE m.group_id = ?
    ORDER BY m.created_at ASC
    LIMIT 100
  `).all(req.params.groupId);

  res.json(messages);
});

module.exports = router;
