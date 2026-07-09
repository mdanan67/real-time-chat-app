const jwt = require('jsonwebtoken');
const config = require('../config');
const store = require('../database/database.postgrace');
const logger = require('../config/logger');

/**
 * Maps userId -> Set of socket IDs for online tracking
 */
const onlineUsers = new Map();

/**
 * Maps socketId -> userId for quick lookup
 */
const socketToUser = new Map();

/**
 * Setup Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
const setupSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, config.jwt.accessSecret);
      const user = await store.findUserById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = store.sanitizeUser(user);
      next();
    } catch (error) {
      logger.error('Socket auth error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`User connected: ${userId} (socket: ${socket.id})`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    socketToUser.set(socket.id, userId);

    // Update user status to online
    store.updateUser(userId, { status: 'ONLINE', lastSeenAt: new Date() }).catch((err) => {
      logger.error('Failed to update user status:', err.message);
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Broadcast user online status
    io.emit('user:online', { userId, status: 'ONLINE' });

    // Handle joining conversation rooms
    socket.on('conversation:join', async (conversationId) => {
      try {
        // Verify membership
        const isMember = await store.findConversationMember({ userId, conversationId });
        if (isMember) {
          socket.join(`conversation:${conversationId}`);
          logger.debug(`User ${userId} joined conversation room: ${conversationId}`);
        }
      } catch (err) {
        logger.error('Error joining conversation room:', err.message);
      }
    });

    // Handle leaving conversation rooms
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle joining group rooms
    socket.on('group:join', async (groupId) => {
      try {
        // Verify membership
        const isMember = await store.findGroupMember({ userId, groupId });
        if (isMember) {
          socket.join(`group:${groupId}`);
          logger.debug(`User ${userId} joined group room: ${groupId}`);
        }
      } catch (err) {
        logger.error('Error joining group room:', err.message);
      }
    });

    // Handle leaving group rooms
    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // Handle typing indicators
    socket.on('typing:start', ({ conversationId, groupId }) => {
      const room = conversationId
        ? `conversation:${conversationId}`
        : groupId
          ? `group:${groupId}`
          : null;
      if (room) {
        socket.to(room).emit('typing:start', {
          userId,
          username: socket.user.username,
          conversationId,
          groupId,
        });
      }
    });

    socket.on('typing:stop', ({ conversationId, groupId }) => {
      const room = conversationId
        ? `conversation:${conversationId}`
        : groupId
          ? `group:${groupId}`
          : null;
      if (room) {
        socket.to(room).emit('typing:stop', {
          userId,
          username: socket.user.username,
          conversationId,
          groupId,
        });
      }
    });

    // Handle marking messages as read
    socket.on('messages:read', async ({ messageIds, conversationId, groupId }) => {
      try {
        const reads = messageIds.map((messageId) => ({ messageId, userId }));
        await store.createManyMessageReads(reads);

        const room = conversationId
          ? `conversation:${conversationId}`
          : groupId
            ? `group:${groupId}`
            : null;

        if (room) {
          socket.to(room).emit('messages:read', {
            userId,
            messageIds,
            conversationId,
            groupId,
          });
        }
      } catch (err) {
        logger.error('Error marking messages as read:', err.message);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info(`User disconnected: ${userId} (socket: ${socket.id})`);

      socketToUser.delete(socket.id);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          try {
            // Update user status to offline
            await store.updateUser(userId, { status: 'OFFLINE', lastSeenAt: new Date() });
            // Broadcast user offline status
            io.emit('user:offline', { userId, status: 'OFFLINE', lastSeenAt: new Date() });
          } catch (err) {
            logger.error('Failed to update user offline status:', err.message);
          }
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${userId}:`, error.message);
    });
  });

  // Make onlineUsers accessible
  io.onlineUsers = onlineUsers;
  io.socketToUser = socketToUser;

  logger.info('Socket.io initialized');
};

module.exports = setupSocket;
