const store = require('../database/database.postgrace');
const { NotFoundError, AuthorizationError } = require('../exceptions');

/**
 * MessageService handles messaging business logic.
 */
class MessageService {
  /**
   * Send a message in a conversation or group.
   */
  async sendMessage(senderId, { content, type, conversationId, groupId, parentId }) {
    // Verify the sender is a member of the conversation or group
    if (conversationId) {
      const isMember = await store.findConversationMember({
        userId: senderId,
        conversationId,
      });

      if (!isMember) {
        throw new AuthorizationError('You are not a member of this conversation');
      }
    }

    if (groupId) {
      const isMember = await store.findGroupMember({
        userId: senderId,
        groupId,
      });

      if (!isMember) {
        throw new AuthorizationError('You are not a member of this group');
      }
    }

    // Verify parent message exists if provided
    if (parentId) {
      const parentMessage = await store.findMessageById(parentId);

      if (!parentMessage) {
        throw new NotFoundError('Parent message not found');
      }
    }

    const message = await store.createMessage({
      content,
      type: type || 'TEXT',
      senderId,
      conversationId,
      groupId,
      parentId,
    });

    // Update conversation's last message timestamp
    if (conversationId) {
      await store.updateConversation(conversationId, { lastMessageAt: new Date() });
    }

    return this._formatMessage(message);
  }

  /**
   * Get messages for a conversation with cursor-based pagination.
   */
  async getConversationMessages(conversationId, userId, cursor = null, limit = 50) {
    // Verify membership
    const isMember = await store.findConversationMember({
      userId,
      conversationId,
    });

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this conversation');
    }

    const where = {
      conversationId,
      isDeleted: false,
    };

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await store.findMessages(where, { take: limit + 1 });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      messages: await Promise.all(items.reverse().map((m) => this._formatMessage(m))),
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  /**
   * Get messages for a group with cursor-based pagination.
   */
  async getGroupMessages(groupId, userId, cursor = null, limit = 50) {
    // Verify membership
    const isMember = await store.findGroupMember({
      userId,
      groupId,
    });

    if (!isMember) {
      throw new AuthorizationError('You are not a member of this group');
    }

    const where = {
      groupId,
      isDeleted: false,
    };

    if (cursor) {
      where.createdAt = { lt: new Date(cursor) };
    }

    const messages = await store.findMessages(where, { take: limit + 1 });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      messages: await Promise.all(items.reverse().map((m) => this._formatMessage(m))),
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  /**
   * Edit a message.
   */
  async editMessage(messageId, userId, newContent) {
    const message = await store.findMessageById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.senderId !== userId) {
      throw new AuthorizationError('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new NotFoundError('Message has been deleted');
    }

    const updated = await store.updateMessage(messageId, {
      content: newContent,
      isEdited: true,
    });

    return this._formatMessage(updated);
  }

  /**
   * Get a single message by ID (for socket emission purposes).
   */
  async getMessageById(messageId) {
    const message = await store.findMessageById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }
    return this._formatMessage(message);
  }

  /**
   * Soft delete a message.
   */
  async deleteMessage(messageId, userId) {
    const message = await store.findMessageById(messageId);

    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.senderId !== userId) {
      throw new AuthorizationError('You can only delete your own messages');
    }

    await store.updateMessage(messageId, {
      isDeleted: true,
      content: null,
    });

    return { id: messageId, isDeleted: true };
  }

  /**
   * Mark messages as read.
   */
  async markAsRead(messageIds, userId) {
    const reads = messageIds.map((messageId) => ({
      messageId,
      userId,
    }));

    await store.createManyMessageReads(reads);

    // Return updated read status for the messages
    const messages = await Promise.all(
      messageIds.map(async (id) => {
        const msg = await store.findMessageById(id);
        if (!msg) return null;
        return {
          ...msg,
          readBy: await store.getMessageReads(id),
        };
      })
    );
    const filteredMessages = messages.filter(Boolean);

    return filteredMessages;
  }

  /**
   * Format message with sender and read info.
   */
  async _formatMessage(message) {
    if (!message) return null;

    const sender = await store.findUserById(message.senderId);
    const readBy = await store.getMessageReads(message.id);
    let parent = null;

    if (message.parentId) {
      const parentMsg = await store.findMessageById(message.parentId);
      if (parentMsg) {
        const parentSender = await store.findUserById(parentMsg.senderId);
        parent = {
          id: parentMsg.id,
          content: parentMsg.content,
          senderId: parentMsg.senderId,
          sender: parentSender ? store.sanitizeUser(parentSender) : null,
        };
      }
    }

    return {
      ...message,
      sender: sender ? store.sanitizeUser(sender) : null,
      readBy: readBy.map((r) => ({ userId: r.userId, readAt: r.readAt })),
      parent,
    };
  }
}

module.exports = new MessageService();
