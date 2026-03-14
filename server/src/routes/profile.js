const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Get own profile/CV
router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
  const cv = db.prepare('SELECT * FROM travelling_cv WHERE user_id = ?').get(req.user.id);
  const history = db.prepare('SELECT * FROM travel_history WHERE user_id = ? ORDER BY visit_date DESC').all(req.user.id);
  const badges = db.prepare('SELECT * FROM badges WHERE user_id = ?').all(req.user.id);
  const gallery = db.prepare('SELECT * FROM profile_gallery WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const stats = generateStats(req.user.id);

  res.json({
    ...user,
    cv: cv || {},
    travelHistory: history,
    badges,
    gallery,
    stats,
    completion: calculateCompletion(user, cv || {}, stats, gallery.length)
  });
});

// Get public profile by ID
router.get('/:userId', (req, res) => {
  const user = db.prepare('SELECT id, name, avatar, created_at FROM users WHERE id = ?').get(req.params.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const cv = db.prepare('SELECT * FROM travelling_cv WHERE user_id = ?').get(req.params.userId);
  const history = db.prepare('SELECT * FROM travel_history WHERE user_id = ? ORDER BY visit_date DESC').all(req.params.userId);
  const badges = db.prepare('SELECT * FROM badges WHERE user_id = ?').all(req.params.userId);
  const postCount = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(req.params.userId);
  const gallery = db.prepare('SELECT * FROM profile_gallery WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
  const stats = generateStats(req.params.userId);

  res.json({
    ...user,
    cv: cv || {},
    travelHistory: history,
    badges,
    gallery,
    stats,
    postCount: postCount.count,
    completion: calculateCompletion(user, cv || {}, stats, gallery.length)
  });
});

// Update profile
router.put('/me', authenticateToken, (req, res) => {
  const { name, bio, current_location, nationality, travel_style, budget_preference, preferred_months, wishlist_destinations, languages, skills, interests } = req.body;

  if (name) {
    db.prepare('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, req.user.id);
  }

  db.prepare(`
    UPDATE travelling_cv SET
      bio = COALESCE(?, bio),
      current_location = COALESCE(?, current_location),
      nationality = COALESCE(?, nationality),
      travel_style = COALESCE(?, travel_style),
      budget_preference = COALESCE(?, budget_preference),
      preferred_months = COALESCE(?, preferred_months),
      wishlist_destinations = COALESCE(?, wishlist_destinations),
      languages = COALESCE(?, languages),
      skills = COALESCE(?, skills),
      interests = COALESCE(?, interests),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `).run(bio, current_location, nationality, travel_style, budget_preference, preferred_months, wishlist_destinations, languages, skills, interests, req.user.id);

  // Check and award badges
  checkBadges(req.user.id);

  res.json({ message: 'Profile updated successfully' });
});

// Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const avatarUrl = `/uploads/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatarUrl, req.user.id);
  
  res.json({ avatar: avatarUrl });
});

// Add travel history entry
router.post('/travel-history', authenticateToken, upload.array('photos', 5), (req, res) => {
  const { country, city, description, visit_date, rating } = req.body;
  if (!country) return res.status(400).json({ error: 'Country is required' });

  const photos = req.files ? req.files.map(f => `/uploads/${f.filename}`).join(',') : '';
  const id = uuidv4();

  db.prepare(`
    INSERT INTO travel_history (id, user_id, country, city, description, visit_date, photos, rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, country, city || null, description || null, visit_date || null, photos, rating || null);

  checkBadges(req.user.id);

  res.status(201).json({ id, country, city, description, visit_date, photos, rating });
});

// Delete travel history entry
router.delete('/travel-history/:id', authenticateToken, (req, res) => {
  const entry = db.prepare('SELECT * FROM travel_history WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  db.prepare('DELETE FROM travel_history WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted successfully' });
});

// Upload gallery image
router.post('/gallery', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  const caption = req.body.caption || null;
  const id = uuidv4();
  
  db.prepare('INSERT INTO profile_gallery (id, user_id, image_url, caption) VALUES (?, ?, ?, ?)').run(id, req.user.id, imageUrl, caption);
  checkBadges(req.user.id);
  
  res.status(201).json({ id, user_id: req.user.id, image_url: imageUrl, caption, created_at: new Date().toISOString() });
});

// Delete gallery image
router.delete('/gallery/:id', authenticateToken, (req, res) => {
  const img = db.prepare('SELECT * FROM profile_gallery WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!img) return res.status(404).json({ error: 'Image not found' });

  db.prepare('DELETE FROM profile_gallery WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted successfully' });
});

// Get all travelers (for discover page)
router.get('/', (req, res) => {
  const { travel_style, country, location, limit = 20, offset = 0 } = req.query;
  
  let query = `
    SELECT u.id, u.name, u.avatar, u.created_at,
           cv.bio, cv.current_location, cv.nationality, cv.travel_style, cv.interests,
           cv.wishlist_destinations
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
  if (location) {
    query += ` AND cv.current_location LIKE ?`;
    params.push(`%${location}%`);
  }

  query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const travelers = db.prepare(query).all(...params);

  // Add stats and country count for each traveler
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

function generateStats(userId) {
  const countries = db.prepare('SELECT DISTINCT country FROM travel_history WHERE user_id = ?').all(userId);
  const cities = db.prepare('SELECT DISTINCT city FROM travel_history WHERE user_id = ? AND city IS NOT NULL').all(userId);
  
  const continentMap = {
    'France': 'Europe', 'Germany': 'Europe', 'Italy': 'Europe', 'Spain': 'Europe', 'UK': 'Europe', 'Portugal': 'Europe', 'Netherlands': 'Europe', 'Greece': 'Europe', 'Switzerland': 'Europe', 'Austria': 'Europe', 'Sweden': 'Europe', 'Norway': 'Europe', 'Denmark': 'Europe', 'Belgium': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe', 'Ireland': 'Europe', 'Croatia': 'Europe', 'Iceland': 'Europe', 'Turkey': 'Europe',
    'USA': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
    'Brazil': 'South America', 'Argentina': 'South America', 'Colombia': 'South America', 'Peru': 'South America', 'Chile': 'South America',
    'India': 'Asia', 'Japan': 'Asia', 'China': 'Asia', 'Thailand': 'Asia', 'Vietnam': 'Asia', 'Indonesia': 'Asia', 'Nepal': 'Asia', 'Sri Lanka': 'Asia', 'Malaysia': 'Asia', 'Philippines': 'Asia', 'South Korea': 'Asia', 'Singapore': 'Asia', 'Cambodia': 'Asia', 'Myanmar': 'Asia', 'Laos': 'Asia',
    'Egypt': 'Africa', 'Morocco': 'Africa', 'South Africa': 'Africa', 'Kenya': 'Africa', 'Tanzania': 'Africa', 'Ethiopia': 'Africa', 'Nigeria': 'Africa', 'Ghana': 'Africa',
    'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Fiji': 'Oceania',
    'UAE': 'Asia', 'Israel': 'Asia', 'Jordan': 'Asia'
  };

  const continents = new Set();
  countries.forEach(c => {
    if (continentMap[c.country]) continents.add(continentMap[c.country]);
  });

  return {
    totalCountries: countries.length,
    totalCities: cities.length,
    continentsExplored: continents.size,
    continentsList: [...continents],
    travelDistanceEstimate: countries.length * 3500 // rough km estimate
  };
}

function checkBadges(userId) {
  const stats = generateStats(userId);
  const existingBadges = db.prepare('SELECT badge_type FROM badges WHERE user_id = ?').all(userId).map(b => b.badge_type);
  const postCountRes = db.prepare('SELECT COUNT(*) as count FROM posts WHERE user_id = ?').get(userId);
  const trekkerCountRes = db.prepare(`SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND (tags LIKE '%mountain%' OR tags LIKE '%trek%' OR tags LIKE '%hike%')`).get(userId);

  const postCount = postCountRes ? postCountRes.count : 0;
  const trekkerCount = trekkerCountRes ? trekkerCountRes.count : 0;

  const badgeCriteria = [
    { type: 'explorer', name: 'Explorer', condition: stats.totalCountries >= 10 },
    { type: 'nomad', name: 'Digital Nomad', condition: stats.totalCities >= 10 },
    { type: 'storyteller', name: 'Storyteller', condition: postCount >= 20 },
    { type: 'trekker', name: 'Trekker', condition: trekkerCount >= 5 },
    { type: 'globetrotter', name: 'Globetrotter', condition: stats.continentsExplored >= 3 }
  ];

  badgeCriteria.forEach(badge => {
    if (badge.condition && !existingBadges.includes(badge.type)) {
      db.prepare(`INSERT INTO badges (id, user_id, badge_type, badge_name) VALUES (?, ?, ?, ?)`)
        .run(uuidv4(), userId, badge.type, badge.name);
    }
  });
}

function calculateCompletion(user, cv, stats, galleryCount) {
  let score = 0;
  if (user && user.avatar) score += 10;
  if (cv && cv.bio) score += 10;
  if (cv && cv.current_location) score += 10;
  if (cv && cv.nationality) score += 10;
  if (cv && cv.travel_style) score += 10;
  if (cv && cv.wishlist_destinations) score += 10;
  if (cv && (cv.languages || cv.skills || cv.interests)) score += 10;
  if (stats && stats.totalCountries > 0) score += 15;
  if (galleryCount > 0) score += 15;
  return Math.min(100, score);
}

module.exports = router;
