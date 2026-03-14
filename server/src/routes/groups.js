const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create group
router.post('/', authenticateToken, (req, res) => {
  const { name, description, destination_focus } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name is required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO groups (id, name, description, destination_focus, creator_id) VALUES (?, ?, ?, ?, ?)
  `).run(id, name, description || null, destination_focus || null, req.user.id);

  db.prepare(`
    INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, 'admin')
  `).run(uuidv4(), id, req.user.id);

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  res.status(201).json(group);
});

// Get all groups
router.get('/', (req, res) => {
  const { search, limit = 20, offset = 0 } = req.query;
  let query = 'SELECT g.*, u.name as creator_name FROM groups g JOIN users u ON g.creator_id = u.id';
  const params = [];

  if (search) {
    query += ` WHERE g.name LIKE ? OR g.description LIKE ? OR g.destination_focus LIKE ?`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY g.member_count DESC, g.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const groups = db.prepare(query).all(...params);
  res.json(groups);
});

// Get single group
router.get('/:id', (req, res) => {
  const group = db.prepare(`
    SELECT g.*, u.name as creator_name FROM groups g JOIN users u ON g.creator_id = u.id WHERE g.id = ?
  `).get(req.params.id);

  if (!group) return res.status(404).json({ error: 'Group not found' });

  const members = db.prepare(`
    SELECT gm.*, u.id as user_id, u.name, u.avatar
    FROM group_members gm JOIN users u ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).all(req.params.id);

  const posts = db.prepare(`
    SELECT gp.*, u.name as user_name, u.avatar as user_avatar
    FROM group_posts gp JOIN users u ON gp.user_id = u.id
    WHERE gp.group_id = ?
    ORDER BY gp.created_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...group, members, posts });
});

// Join group
router.post('/:id/join', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (existing) return res.status(409).json({ error: 'Already a member' });

  db.prepare('INSERT INTO group_members (id, group_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
  db.prepare('UPDATE groups SET member_count = member_count + 1 WHERE id = ?').run(req.params.id);

  res.json({ message: 'Joined group successfully' });
});

// Leave group
router.post('/:id/leave', authenticateToken, (req, res) => {
  db.prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?').run(req.params.id, req.user.id);
  db.prepare('UPDATE groups SET member_count = CASE WHEN member_count > 0 THEN member_count - 1 ELSE 0 END WHERE id = ?').run(req.params.id);
  res.json({ message: 'Left group' });
});

// Post in group
router.post('/:id/posts', authenticateToken, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const member = db.prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Must be a member to post' });

  const id = uuidv4();
  db.prepare('INSERT INTO group_posts (id, group_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, content);

  const post = db.prepare(`
    SELECT gp.*, u.name as user_name, u.avatar as user_avatar
    FROM group_posts gp JOIN users u ON gp.user_id = u.id WHERE gp.id = ?
  `).get(id);

  res.status(201).json(post);
});

module.exports = router;
