const store = require('../database/database.postgrace');
const { NotFoundError, ValidationError } = require('../exceptions');

/**
 * ConversationService handles one-to-one chat business logic.
 */
class ConversationService {
  /**
   * Create or get an existing one-to-one conversation.
   */
  async createOrGetConversation(currentUserId, participantId) {
    if (currentUserId === participantId) {
      throw new ValidationError('Cannot start a conversation with yourself');
    }

    // Check if participant exists
    const participant = await store.findUserById(participantId);

    if (!participant) {
      throw new NotFoundError('User not found');
    }

    // Check if conversation already exists between these two users
    const existingConversation = await store.findConversationFirst({
      type: 'ONE_TO_ONE',
      AND: [
        {
          conversationMembers: {
            some: [{ userId: currentUserId }, { userId: participantId }],
          },
        },
      ],
    });

    if (existingConversation) {
      return this._formatConversation(existingConversation.id);
    }

    // Create new conversation
    const conversation = await store.createConversation({ type: 'ONE_TO_ONE' });
    await store.createConversationMember({
      userId: currentUserId,
      conversationId: conversation.id,
    });
    await store.createConversationMember({
      userId: participantId,
      conversationId: conversation.id,
    });

    return this._formatConversation(conversation.id);
  }

  /**
   * Get all conversations for the current user.
   */
  async getUserConversations(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const conversations = await store.findConversations(
      {
        conversationMembers: {
          some: { userId },
        },
      },
      { skip, take: limit }
    );

    const total = await store.countConversations({
      conversationMembers: {
        some: { userId },
      },
    });

    const formattedConversations = await Promise.all(
      conversations.map((c) => this._formatConversation(c.id))
    );

    return {
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }

  /**
   * Get a single conversation by ID.
   */
  async getConversationById(conversationId, userId) {
    const conv = await store.findConversationFirst({
      id: conversationId,
      AND: [
        {
          conversationMembers: {
            some: [{ userId }],
          },
        },
      ],
    });

    if (!conv) {
      throw new NotFoundError('Conversation not found');
    }

    return this._formatConversation(conv.id);
  }

  /**
   * Get a formatted conversation by ID without checking a specific viewer.
   * Used after membership was already verified by the message flow.
   */
  async getConversationSnapshot(conversationId) {
    return this._formatConversation(conversationId);
  }

  /**
   * Format conversation with member and message details.
   */
  async _formatConversation(conversationId) {
    const conv = await store.findConversationFirst({ id: conversationId });
    if (!conv) return null;

    const members = await store.getConversationMembers(conversationId);
    const formattedMembers = await Promise.all(
      members.map(async (m) => {
        const user = await store.findUserById(m.userId);
        return {
          ...m,
          user: user ? store.sanitizeUser(user) : null,
        };
      })
    );

    const conversationMessages = await store.findMessages(
      { conversationId, isDeleted: false },
      { take: 1 }
    );

    return {
      ...conv,
      conversationMembers: formattedMembers,
      messages: conversationMessages.slice(0, 1),
    };
  }
}

module.exports = new ConversationService();
