const express = require('express');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { calculateCompatibility } = require('../utils/compatibility');

const router = express.Router();

// Discover travelers
router.get('/', (req, res) => {
  const { travel_style, country, destination, location, limit = 20, offset = 0 } = req.query;
  
  let query = `
    SELECT u.id, u.name, u.avatar, u.created_at,
           cv.bio, cv.current_location, cv.nationality, cv.travel_style,
           cv.wishlist_destinations, cv.interests
    FROM users u
    LEFT JOIN travelling_cv cv ON u.id = cv.user_id
    WHERE 1=1
  `;
  const params = [];

  if (travel_style) {
    query += ` AND cv.travel_style LIKE ?`;
    params.push(`%${travel_style}%`);
  }
  if (country) {
    query += ` AND u.id IN (SELECT user_id FROM travel_history WHERE country LIKE ?)`;
    params.push(`%${country}%`);
  }
  if (destination) {
    query += ` AND cv.wishlist_destinations LIKE ?`;
    params.push(`%${destination}%`);
  }
  if (location) {
    query += ` AND cv.current_location LIKE ?`;
    params.push(`%${location}%`);
  }

  query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const travelers = db.prepare(query).all(...params);

  const enriched = travelers.map(t => {
    const countries = db.prepare('SELECT DISTINCT country FROM travel_history WHERE user_id = ?').all(t.id);
    return {
      ...t,
      countriesVisited: countries.map(c => c.country),
      countryCount: countries.length
    };
  });

  res.json(enriched);
});

// Get compatibility score
router.get('/compatibility/:userId', authenticateToken, (req, res) => {
  const result = calculateCompatibility(req.user.id, req.params.userId);
  res.json(result);
});

// Search
router.get('/search', (req, res) => {
  const { q, type = 'all' } = req.query;
  if (!q) return res.status(400).json({ error: 'Search query is required' });

  const results = {};

  if (type === 'all' || type === 'travelers') {
    results.travelers = db.prepare(`
      SELECT u.id, u.name, u.avatar, cv.current_location, cv.travel_style
      FROM users u LEFT JOIN travelling_cv cv ON u.id = cv.user_id
      WHERE u.name LIKE ? OR cv.nationality LIKE ? OR cv.current_location LIKE ?
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (type === 'all' || type === 'posts') {
    results.posts = db.prepare(`
      SELECT p.id, p.title, p.destination, p.type, p.tags, u.name as user_name
      FROM posts p JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active' AND (p.title LIKE ? OR p.destination LIKE ? OR p.tags LIKE ? OR p.description LIKE ?)
      ORDER BY p.created_at DESC LIMIT 10
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (type === 'all' || type === 'groups') {
    results.groups = db.prepare(`
      SELECT id, name, description, destination_focus, member_count
      FROM groups
      WHERE name LIKE ? OR description LIKE ? OR destination_focus LIKE ?
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (type === 'all' || type === 'destinations') {
    results.destinations = db.prepare(`
      SELECT DISTINCT country, city, COUNT(*) as visitor_count
      FROM travel_history
      WHERE country LIKE ? OR city LIKE ?
      GROUP BY country, city
      ORDER BY visitor_count DESC
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`);
  }

  res.json(results);
});

module.exports = router;
