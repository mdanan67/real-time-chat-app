const conversationService = require('../services/conversation.service');
const ApiResponse = require('../responses/apiResponse');

/**
 * Conversation Controller - Handles conversation HTTP requests.
 */
class ConversationController {
  async createOrGet(req, res, next) {
    try {
      const conversation = await conversationService.createOrGetConversation(
        req.user.id,
        req.body.participantId
      );
      return ApiResponse.success(res, { conversation }, 'Conversation retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await conversationService.getUserConversations(req.user.id, page, limit);
      return ApiResponse.success(res, result, 'Conversations retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const conversation = await conversationService.getConversationById(
        req.params.id,
        req.user.id
      );
      return ApiResponse.success(res, { conversation }, 'Conversation retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ConversationController();
