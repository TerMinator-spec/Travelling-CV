const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Report a post
router.post('/report', authenticateToken, (req, res) => {
  const { post_id, reason } = req.body;
  if (!post_id || !reason) return res.status(400).json({ error: 'Post ID and reason are required' });

  const id = uuidv4();
  db.prepare('INSERT INTO reports (id, post_id, reported_by, reason) VALUES (?, ?, ?, ?)').run(id, post_id, req.user.id, reason);

  res.status(201).json({ message: 'Report submitted' });
});

// Get all reports (admin)
router.get('/reports', authenticateToken, requireAdmin, (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, p.title as post_title, p.description as post_description, p.type as post_type,
           u.name as reporter_name, pu.name as post_author
    FROM reports r
    JOIN posts p ON r.post_id = p.id
    JOIN users u ON r.reported_by = u.id
    JOIN users pu ON p.user_id = pu.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  `).all();

  res.json(reports);
});

// Moderate post (admin)
router.put('/moderate/:postId', authenticateToken, requireAdmin, (req, res) => {
  const { action } = req.body;
  if (!['remove', 'approve'].includes(action)) {
    return res.status(400).json({ error: 'Action must be remove or approve' });
  }

  if (action === 'remove') {
    db.prepare("UPDATE posts SET status = 'removed' WHERE id = ?").run(req.params.postId);
  }

  db.prepare("UPDATE reports SET status = 'resolved' WHERE post_id = ?").run(req.params.postId);
  res.json({ message: `Post ${action}d` });
});

// Get admin stats
router.get('/stats', authenticateToken, requireAdmin, (req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const posts = db.prepare('SELECT COUNT(*) as count FROM posts').get();
  const groups = db.prepare('SELECT COUNT(*) as count FROM groups').get();
  const reports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get();

  res.json({
    totalUsers: users.count,
    totalPosts: posts.count,
    totalGroups: groups.count,
    pendingReports: reports.count
  });
});

module.exports = router;
