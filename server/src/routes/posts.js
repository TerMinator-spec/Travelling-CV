const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Create post
router.post('/', authenticateToken, upload.array('images', 5), (req, res) => {
  const { type, title, destination, description, travel_dates, budget_estimate, travelers_wanted, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const images = req.files ? req.files.map(f => `/uploads/${f.filename}`).join(',') : '';
  const id = uuidv4();

  db.prepare(`
    INSERT INTO posts (id, user_id, type, title, destination, description, travel_dates, budget_estimate, travelers_wanted, tags, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, type || 'experience', title, destination || null, description || null, travel_dates || null, budget_estimate || null, travelers_wanted || null, tags || null, images);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  const user = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(req.user.id);

  res.status(201).json({ ...post, user });
});

// Get feed
router.get('/feed', optionalAuth, (req, res) => {
  const { sort = 'recent', type, tag, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT p.*, u.name as user_name, u.avatar as user_avatar
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'active'
  `;
  const params = [];

  if (type) {
    if (type.includes(',')) {
      const types = type.split(',').map(t => t.trim());
      query += ` AND p.type IN (${types.map(() => '?').join(',')})`;
      params.push(...types);
    } else {
      query += ` AND p.type = ?`;
      params.push(type);
    }
  }
  if (tag) {
    query += ` AND p.tags LIKE ?`;
    params.push(`%${tag}%`);
  }

  if (sort === 'popular') {
    query += ` ORDER BY p.likes_count DESC, p.created_at DESC`;
  } else {
    query += ` ORDER BY p.created_at DESC`;
  }

  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const posts = db.prepare(query).all(...params);

  const enriched = posts.map(post => {
    const liked = req.user ? db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id) : null;
    const saved = req.user ? db.prepare('SELECT id FROM saved_posts WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id) : null;
    const commentsList = db.prepare(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar 
      FROM comments c JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = ? ORDER BY c.created_at DESC LIMIT 3
    `).all(post.id);

    return {
      ...post,
      liked: !!liked,
      saved: !!saved,
      comments: commentsList
    };
  });

  res.json(enriched);
});

// Get single post
router.get('/:id', optionalAuth, (req, res) => {
  const post = db.prepare(`
    SELECT p.*, u.name as user_name, u.avatar as user_avatar
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar as user_avatar 
    FROM comments c JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ? ORDER BY c.created_at ASC
  `).all(req.params.id);

  const joinRequests = post.type === 'collaboration' ? db.prepare(`
    SELECT jr.*, u.name as user_name, u.avatar as user_avatar
    FROM join_requests jr JOIN users u ON jr.user_id = u.id
    WHERE jr.post_id = ?
  `).all(req.params.id) : [];

  const liked = req.user ? !!db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id) : false;
  const saved = req.user ? !!db.prepare('SELECT id FROM saved_posts WHERE post_id = ? AND user_id = ?').get(post.id, req.user.id) : false;

  res.json({ ...post, comments, joinRequests, liked, saved });
});

// Like/unlike post
router.post('/:id/like', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO likes (id, post_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(req.params.id);
    res.json({ liked: true });
  }
});

// Comment on post
router.post('/:id/comment', authenticateToken, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, content);
  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?').run(req.params.id);

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar as user_avatar 
    FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(id);

  res.status(201).json(comment);
});

// Save/unsave post
router.post('/:id/save', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT id FROM saved_posts WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user.id);

  if (existing) {
    db.prepare('DELETE FROM saved_posts WHERE id = ?').run(existing.id);
    res.json({ saved: false });
  } else {
    db.prepare('INSERT INTO saved_posts (id, post_id, user_id) VALUES (?, ?, ?)').run(uuidv4(), req.params.id, req.user.id);
    res.json({ saved: true });
  }
});

// Get saved posts
router.get('/user/saved', authenticateToken, (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.name as user_name, u.avatar as user_avatar
    FROM saved_posts sp
    JOIN posts p ON sp.post_id = p.id
    JOIN users u ON p.user_id = u.id
    ORDER BY sp.created_at DESC
  `).all();
  res.json(posts);
});

// Delete post
router.delete('/:id', authenticateToken, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post deleted' });
});

module.exports = router;
