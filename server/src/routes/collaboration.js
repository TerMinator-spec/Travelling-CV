const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Send join request
router.post('/join-request', authenticateToken, (req, res) => {
  const { post_id, message } = req.body;
  if (!post_id) return res.status(400).json({ error: 'Post ID is required' });

  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND type = ?').get(post_id, 'collaboration');
  if (!post) return res.status(404).json({ error: 'Collaboration post not found' });

  if (post.user_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot join your own trip' });
  }

  const existing = db.prepare('SELECT id FROM join_requests WHERE post_id = ? AND user_id = ?').get(post_id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already requested to join' });

  const id = uuidv4();
  db.prepare('INSERT INTO join_requests (id, post_id, user_id, message) VALUES (?, ?, ?, ?)').run(id, post_id, req.user.id, message || null);

  res.status(201).json({ id, post_id, message, status: 'pending' });
});

// Get join requests for a post
router.get('/join-requests/:postId', authenticateToken, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.postId, req.user.id);
  if (!post) return res.status(403).json({ error: 'Unauthorized' });

  const requests = db.prepare(`
    SELECT jr.*, u.name as user_name, u.avatar as user_avatar
    FROM join_requests jr JOIN users u ON jr.user_id = u.id
    WHERE jr.post_id = ?
    ORDER BY jr.created_at DESC
  `).all(req.params.postId);

  res.json(requests);
});

// Accept/reject join request
router.put('/join-request/:id', authenticateToken, (req, res) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be accepted or rejected' });
  }

  const request = db.prepare(`
    SELECT jr.*, p.user_id as post_owner_id FROM join_requests jr
    JOIN posts p ON jr.post_id = p.id
    WHERE jr.id = ?
  `).get(req.params.id);

  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.post_owner_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  db.prepare('UPDATE join_requests SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: `Request ${status}` });
});

// Get my join requests
router.get('/my-requests', authenticateToken, (req, res) => {
  const requests = db.prepare(`
    SELECT jr.*, p.title as post_title, p.destination as post_destination, u.name as post_author
    FROM join_requests jr
    JOIN posts p ON jr.post_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE jr.user_id = ?
    ORDER BY jr.created_at DESC
  `).all(req.user.id);

  res.json(requests);
});

module.exports = router;
