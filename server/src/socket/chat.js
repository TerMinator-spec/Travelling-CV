const jwt = require('jsonwebtoken');
const { db } = require('../db/schema');

const JWT_SECRET = process.env.JWT_SECRET || 'travelling-cv-secret-key-2024';

function setupSocket(io) {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    
    console.log(`User connected: ${socket.user.name}`);
    io.emit('user_online', { userId, online: true });

    // Direct message
    socket.on('send_message', (data) => {
      const { receiver_id, content } = data;
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();

      db.prepare(`
        INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)
      `).run(id, userId, receiver_id, content);

      const message = {
        id,
        sender_id: userId,
        sender_name: socket.user.name,
        receiver_id,
        content,
        created_at: new Date().toISOString()
      };

      // Send to receiver if online
      const receiverSocket = onlineUsers.get(receiver_id);
      if (receiverSocket) {
        io.to(receiverSocket).emit('new_message', message);
      }
      socket.emit('message_sent', message);
    });

    // Group message
    socket.on('send_group_message', (data) => {
      const { group_id, content } = data;
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();

      db.prepare(`
        INSERT INTO messages (id, sender_id, group_id, content) VALUES (?, ?, ?, ?)
      `).run(id, userId, group_id, content);

      io.to(`group_${group_id}`).emit('new_group_message', {
        id,
        sender_id: userId,
        sender_name: socket.user.name,
        group_id,
        content,
        created_at: new Date().toISOString()
      });
    });

    // Join group room
    socket.on('join_group', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    // Leave group room
    socket.on('leave_group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { receiver_id } = data;
      const receiverSocket = onlineUsers.get(receiver_id);
      if (receiverSocket) {
        io.to(receiverSocket).emit('user_typing', { userId, name: socket.user.name });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_online', { userId, online: false });
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
}

module.exports = { setupSocket };
