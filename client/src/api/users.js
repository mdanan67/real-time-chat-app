import apiClient from './client';

export const usersApi = {
  getProfile() {
    return apiClient.get('/users/profile');
  },

  updateProfile(data) {
    return apiClient.patch('/users/profile', data);
  },

  searchUsers(q, page = 1, limit = 20) {
    return apiClient.get('/users/search', { q, page, limit });
  },

  getUserById(id) {
    return apiClient.get(`/users/${id}`);
  },
};

export default usersApi;
