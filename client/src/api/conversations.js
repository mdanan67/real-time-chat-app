import apiClient from './client';

export const conversationsApi = {
  createOrGet(participantId) {
    return apiClient.post('/conversations', { participantId });
  },

  getAll(page = 1, limit = 20) {
    return apiClient.get('/conversations', { page, limit });
  },

  getById(id) {
    return apiClient.get(`/conversations/${id}`);
  },
};

export default conversationsApi;
