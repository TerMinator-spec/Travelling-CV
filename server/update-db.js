const { initializeDatabase } = require('./src/db/schema.js');
initializeDatabase();
console.log('Database updated successfully without server restart.');
