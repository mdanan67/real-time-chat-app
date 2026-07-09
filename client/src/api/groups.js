import apiClient from './client';

export const groupsApi = {
  create(data) {
    return apiClient.post('/groups', data);
  },

  getAll(page = 1, limit = 20) {
    return apiClient.get('/groups', { page, limit });
  },

  getById(id) {
    return apiClient.get(`/groups/${id}`);
  },

  update(id, data) {
    return apiClient.patch(`/groups/${id}`, data);
  },

  addMembers(id, memberIds) {
    return apiClient.post(`/groups/${id}/members`, { memberIds });
  },

  removeMember(id, memberId) {
    return apiClient.delete(`/groups/${id}/members/${memberId}`);
  },

  leave(id) {
    return apiClient.post(`/groups/${id}/leave`);
  },

  delete(id) {
    return apiClient.delete(`/groups/${id}`);
  },

  updateMemberRole(id, memberId, role) {
    return apiClient.patch(`/groups/${id}/members/${memberId}/role`, { role });
  },
};

export default groupsApi;
