import apiClient from './client';

export const messagesApi = {
  send(data) {
    return apiClient.post('/messages', data);
  },

  getConversationMessages(conversationId, cursor, limit = 50) {
    return apiClient.get(`/messages/conversations/${conversationId}`, { cursor, limit });
  },

  getGroupMessages(groupId, cursor, limit = 50) {
    return apiClient.get(`/messages/groups/${groupId}`, { cursor, limit });
  },

  edit(id, content) {
    return apiClient.patch(`/messages/${id}`, { content });
  },

  delete(id) {
    return apiClient.delete(`/messages/${id}`);
  },

  markAsRead(messageIds) {
    return apiClient.post('/messages/read', { messageIds });
  },
};

export default messagesApi;
