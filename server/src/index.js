require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { initializeDatabase } = require('./db/schema');
const { setupSocket } = require('./socket/chat');

// Initialize database
initializeDatabase();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/discover', require('./routes/discover'));
app.use('/api/collaboration', require('./routes/collaboration'));
app.use('/api/moderation', require('./routes/moderation'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.io
setupSocket(io);

// Seed demo data for development
seedDemoData();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║    🌍 Travelling CV API Server           ║
  ║    Running on http://localhost:${PORT}       ║
  ╚══════════════════════════════════════════╝
  `);
});

function seedDemoData() {
  const { db } = require('./db/schema');
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (existingUsers.count > 0) return;

  console.log('Seeding demo data...');

  const demoUsers = [
    {
      name: 'Alex Rivera',
      email: 'alex@demo.com',
      bio: 'Digital nomad exploring the world one country at a time. Currently based in Bali.',
      current_location: 'Bali, Indonesia',
      nationality: 'American',
      travel_style: 'backpacking,digital nomad,adventure',
      budget_preference: 'moderate',
      preferred_months: 'march,april,september,october',
      wishlist_destinations: 'Japan,Peru,Iceland,Morocco,New Zealand',
      languages: 'English,Spanish,Basic Indonesian',
      skills: 'photography,hiking,camping,surfing,cooking',
      interests: 'trekking,beaches,city travel,culture,food',
      countries: ['Thailand', 'Vietnam', 'Indonesia', 'India', 'Nepal', 'Portugal', 'Spain', 'Mexico', 'Colombia'],
      cities: ['Bangkok', 'Hanoi', 'Bali', 'Mumbai', 'Kathmandu', 'Lisbon', 'Barcelona', 'Mexico City', 'Medellin']
    },
    {
      name: 'Sophia Chen',
      email: 'sophia@demo.com',
      bio: 'Travel photographer & writer. Capturing moments across 30+ countries.',
      current_location: 'Tokyo, Japan',
      nationality: 'Canadian',
      travel_style: 'luxury,photography,cultural',
      budget_preference: 'comfort',
      preferred_months: 'april,may,october,november',
      wishlist_destinations: 'Iceland,Peru,Greece,Morocco,Australia',
      languages: 'English,Mandarin,Japanese,French',
      skills: 'photography,languages,navigation,writing',
      interests: 'city travel,culture,food,art,history',
      countries: ['Japan', 'France', 'Italy', 'Greece', 'India', 'Thailand', 'USA', 'UK', 'South Korea', 'Vietnam'],
      cities: ['Tokyo', 'Paris', 'Rome', 'Athens', 'Delhi', 'Chiang Mai', 'New York', 'London', 'Seoul', 'Ho Chi Minh City']
    },
    {
      name: 'Marcus Wolf',
      email: 'marcus@demo.com',
      bio: 'Mountain trekker and adventure seeker. Summited 3 of the 7 summits.',
      current_location: 'Zurich, Switzerland',
      nationality: 'German',
      travel_style: 'trekking,adventure,backpacking',
      budget_preference: 'budget',
      preferred_months: 'june,july,august,september',
      wishlist_destinations: 'Nepal,Peru,Patagonia,Iceland,Tanzania',
      languages: 'German,English,French',
      skills: 'trekking,camping,climbing,navigation,first aid',
      interests: 'trekking,mountains,adventure,nature,wildlife',
      countries: ['Nepal', 'Peru', 'Switzerland', 'Austria', 'Norway', 'USA', 'Canada', 'Argentina', 'New Zealand', 'Tanzania'],
      cities: ['Kathmandu', 'Cusco', 'Zurich', 'Vienna', 'Oslo', 'Denver', 'Banff', 'Mendoza', 'Queenstown', 'Arusha']
    },
    {
      name: 'Priya Sharma',
      email: 'priya@demo.com',
      bio: 'Solo female traveler documenting off-the-beaten-path destinations.',
      current_location: 'Mumbai, India',
      nationality: 'Indian',
      travel_style: 'solo,backpacking,cultural',
      budget_preference: 'budget',
      preferred_months: 'october,november,february,march',
      wishlist_destinations: 'Japan,Iceland,Norway,Portugal,Peru',
      languages: 'Hindi,English,Basic Thai,Basic Spanish',
      skills: 'budgeting,photography,cooking,navigation',
      interests: 'culture,food,trekking,spirituality,beaches',
      countries: ['India', 'Thailand', 'Vietnam', 'Sri Lanka', 'Nepal', 'Indonesia', 'Cambodia', 'Malaysia'],
      cities: ['Mumbai', 'Bangkok', 'Hanoi', 'Colombo', 'Pokhara', 'Bali', 'Siem Reap', 'Kuala Lumpur']
    },
    {
      name: 'James Mitchell',
      email: 'james@demo.com',
      bio: 'European backpacker turned nomad. Love hostels and local food.',
      current_location: 'Lisbon, Portugal',
      nationality: 'British',
      travel_style: 'backpacking,digital nomad,solo',
      budget_preference: 'budget',
      preferred_months: 'may,june,september,october',
      wishlist_destinations: 'Colombia,Japan,Morocco,Vietnam,Chile',
      languages: 'English,Portuguese,Basic French',
      skills: 'budgeting,hiking,cooking,web development',
      interests: 'culture,food,nightlife,surfing,city travel',
      countries: ['Portugal', 'Spain', 'France', 'Germany', 'Italy', 'Netherlands', 'Czech Republic', 'Greece', 'Croatia', 'Turkey'],
      cities: ['Lisbon', 'Madrid', 'Paris', 'Berlin', 'Rome', 'Amsterdam', 'Prague', 'Athens', 'Dubrovnik', 'Istanbul']
    }
  ];

  const passwordHash = bcrypt.hashSync('demo123', 10);

  for (const user of demoUsers) {
    const userId = uuidv4();
    
    db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
      .run(userId, user.email, passwordHash, user.name);

    db.prepare(`
      INSERT INTO travelling_cv (id, user_id, bio, current_location, nationality, travel_style, budget_preference, preferred_months, wishlist_destinations, languages, skills, interests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, user.bio, user.current_location, user.nationality, user.travel_style, user.budget_preference, user.preferred_months, user.wishlist_destinations, user.languages, user.skills, user.interests);

    // Add travel history
    user.countries.forEach((country, i) => {
      db.prepare('INSERT INTO travel_history (id, user_id, country, city, visit_date) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), userId, country, user.cities[i] || null, `202${Math.floor(i / 3)}-0${(i % 9) + 1}-15`);
    });

    // Add badges
    db.prepare('INSERT INTO badges (id, user_id, badge_type, badge_name) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), userId, 'explorer', 'Explorer');
    if (user.countries.length >= 10) {
      db.prepare('INSERT INTO badges (id, user_id, badge_type, badge_name) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), userId, 'globetrotter', 'Globetrotter');
    }
  }

  // Create demo posts
  const users = db.prepare('SELECT id, name FROM users').all();
  
  const demoPosts = [
    { type: 'collaboration', title: 'Backpacking Through Southeast Asia', destination: 'Thailand, Vietnam, Cambodia', description: 'Looking for travel buddies to backpack through Southeast Asia for 3 weeks. Starting in Bangkok, ending in Siem Reap.', travel_dates: '2026-04-15 to 2026-05-05', budget_estimate: '$1500', travelers_wanted: 3, tags: 'backpacking,southeast asia,group trip,budget' },
    { type: 'experience', title: 'My Solo Trek to Everest Base Camp', destination: 'Nepal', description: 'Just completed the EBC trek solo! Here\'s everything I learned about altitude sickness, gear, and the incredible views.', tags: 'trekking,nepal,solo,mountains,adventure' },
    { type: 'advice', title: 'Japan Travel Guide on a Budget', destination: 'Japan', description: 'How I spent 2 weeks in Japan for under $1000 including flights. Tips on JR Pass, hostels, ¥100 sushi, and hidden free attractions.', tags: 'japan,budget,advice,asia' },
    { type: 'collaboration', title: 'Road Trip Across Iceland', destination: 'Iceland', description: 'Planning a Ring Road trip in Iceland. Looking for 2-3 people to share car rental and fuel costs. Northern lights season!', travel_dates: '2026-09-20 to 2026-09-30', budget_estimate: '$2000', travelers_wanted: 3, tags: 'iceland,road trip,adventure,northern lights' },
    { type: 'experience', title: 'Digital Nomad Life in Lisbon', destination: 'Portugal', description: 'Living as a digital nomad in Lisbon for 6 months. Best coworking spaces, affordable apartments, and the incredible food scene.', tags: 'digital nomad,portugal,europe,remote work' },
    { type: 'collaboration', title: 'Trekking Patagonia\'s W Circuit', destination: 'Chile', description: 'Planning to trek the W Circuit in Torres del Paine. Need 1-2 experienced trekkers to join. Already reserved refugios.', travel_dates: '2026-12-01 to 2026-12-08', budget_estimate: '$1200', travelers_wanted: 2, tags: 'trekking,patagonia,chile,adventure' },
    { type: 'advice', title: 'Ultimate Bali Guide for First-Timers', destination: 'Indonesia', description: 'Everything you need to know about visiting Bali: from Ubud rice terraces to Uluwatu temples, best surf spots, and hidden waterfalls.', tags: 'bali,indonesia,asia,beaches,surfing' },
  ];

  demoPosts.forEach((post, i) => {
    const userId = users[i % users.length].id;
    db.prepare(`
      INSERT INTO posts (id, user_id, type, title, destination, description, travel_dates, budget_estimate, travelers_wanted, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, post.type, post.title, post.destination, post.description, post.travel_dates || null, post.budget_estimate || null, post.travelers_wanted || null, post.tags);
  });

  // Create demo groups
  const demoGroups = [
    { name: 'Europe Backpackers', description: 'A community for backpackers exploring Europe on a budget.', destination_focus: 'Europe' },
    { name: 'Solo Travelers India', description: 'Connect with solo travelers in India. Share tips, routes, and travel together.', destination_focus: 'India' },
    { name: 'Digital Nomads Asia', description: 'For digital nomads living and working across Asian countries.', destination_focus: 'Asia' },
    { name: 'Himalayan Trekkers', description: 'For trekking enthusiasts who love the Himalayas and high-altitude adventures.', destination_focus: 'Himalayas' },
  ];

  demoGroups.forEach((group, i) => {
    const groupId = uuidv4();
    const creatorId = users[i % users.length].id;
    db.prepare('INSERT INTO groups (id, name, description, destination_focus, creator_id, member_count) VALUES (?, ?, ?, ?, ?, ?)')
      .run(groupId, group.name, group.description, group.destination_focus, creatorId, Math.floor(Math.random() * 20) + 5);
    
    db.prepare('INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)')
      .run(uuidv4(), groupId, creatorId, 'admin');
    
    // Add some other members
    users.filter(u => u.id !== creatorId).slice(0, 2).forEach(u => {
      db.prepare('INSERT INTO group_members (id, group_id, user_id, role) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), groupId, u.id, 'member');
    });
  });

  console.log('Demo data seeded successfully!');
}
