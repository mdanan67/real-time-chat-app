import apiClient from './client';

export const authApi = {
  register(data) {
    return apiClient.post('/auth/register', data);
  },

  login(data) {
    return apiClient.post('/auth/login', data);
  },

  logout() {
    return apiClient.post('/auth/logout');
  },

  refreshToken(refreshToken) {
    return apiClient.post('/auth/refresh-token', { refreshToken });
  },

  getMe() {
    return apiClient.get('/auth/me');
  },
};

export default authApi;
