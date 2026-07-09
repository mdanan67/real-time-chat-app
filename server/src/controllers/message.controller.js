const messageService = require('../services/message.service');
const ApiResponse = require('../responses/apiResponse');

/**
 * Message Controller - Handles message HTTP requests.
 */
class MessageController {
  async send(req, res, next) {
    try {
      const message = await messageService.sendMessage(req.user.id, req.body);

      // Emit socket event for real-time delivery
      const io = req.app.get('io');
      if (io) {
        if (message.conversationId) {
          // Emit to conversation room (for users who have it open)
          io.to(`conversation:${message.conversationId}`).emit('new:message', message);
          // Emit to BOTH participants' personal rooms for instant delivery
          // regardless of whether they have the conversation tab open
          io.to(`user:${req.user.id}`).emit('new:message', message);
          // Also emit to all members of this conversation
          try {
            const { getConversationMembers } = require('../database/database.postgrace');
            const members = await getConversationMembers(message.conversationId);
            members.forEach((m) => {
              io.to(`user:${m.userId}`).emit('new:message', message);
            });
          } catch (e) {
            console.error('Failed to emit to conversation members:', e.message);
          }
        }
        if (message.groupId) {
          io.to(`group:${message.groupId}`).emit('new:message', message);
          io.to(`user:${req.user.id}`).emit('new:message', message);
          try {
            const { getGroupMembers } = require('../database/database.postgrace');
            const members = await getGroupMembers(message.groupId);
            members.forEach((m) => {
              io.to(`user:${m.userId}`).emit('new:message', message);
            });
          } catch (e) {
            console.error('Failed to emit to group members:', e.message);
          }
        }
      }

      return ApiResponse.created(res, { message }, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  }

  async getConversationMessages(req, res, next) {
    try {
      const { cursor, limit } = req.query;
      const result = await messageService.getConversationMessages(
        req.params.conversationId,
        req.user.id,
        cursor,
        limit
      );
      return ApiResponse.success(res, result, 'Messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getGroupMessages(req, res, next) {
    try {
      const { cursor, limit } = req.query;
      const result = await messageService.getGroupMessages(
        req.params.groupId,
        req.user.id,
        cursor,
        limit
      );
      return ApiResponse.success(res, result, 'Messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async edit(req, res, next) {
    try {
      const message = await messageService.editMessage(
        req.params.id,
        req.user.id,
        req.body.content
      );

      // Emit socket event for real-time update
      const io = req.app.get('io');
      if (io && message) {
        if (message.conversationId) {
          io.to(`conversation:${message.conversationId}`).emit('message:edited', message);
        }
        if (message.groupId) {
          io.to(`group:${message.groupId}`).emit('message:edited', message);
        }
      }

      return ApiResponse.success(res, { message }, 'Message edited successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const message = await messageService.deleteMessage(req.params.id, req.user.id);

      // Emit socket event for real-time deletion
      const io = req.app.get('io');
      if (io && message) {
        // Get the message to find its conversationId/groupId for socket emission
        const fullMessage = await messageService.getMessageById(req.params.id).catch(() => null);
        const conversationId = fullMessage?.conversationId;
        const groupId = fullMessage?.groupId;

        if (conversationId) {
          io.to(`conversation:${conversationId}`).emit('message:deleted', {
            messageId: req.params.id,
          });
        }
        if (groupId) {
          io.to(`group:${groupId}`).emit('message:deleted', { messageId: req.params.id });
        }
      }

      return ApiResponse.success(res, null, 'Message deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const messages = await messageService.markAsRead(req.body.messageIds, req.user.id);
      return ApiResponse.success(res, { messages }, 'Messages marked as read');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
