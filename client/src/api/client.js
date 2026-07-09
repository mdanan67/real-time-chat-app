/**
 * API Client - Base fetch wrapper for all API calls.
 */
const API_BASE_URL = '/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this._token = null;
  }

  setToken(token) {
    this._token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    if (!this._token) {
      this._token = localStorage.getItem('auth_token');
    }
    return this._token;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body, params, isFormData } = options;

    let url = `${this.baseUrl}${endpoint}`;

    // Add query params
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers = {};

    // Add auth token
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add content type for non-form-data
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      method,
      headers,
      credentials: 'include',
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const response = await fetch(url, config);

    // Handle 401 - try refresh token
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      const refreshed = await this._tryRefreshToken();
      if (refreshed) {
        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        config.headers = headers;
        const retryResponse = await fetch(url, config);
        return this._handleResponse(retryResponse);
      }
    }

    return this._handleResponse(response);
  }

  async _tryRefreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.setToken(null);
        localStorage.removeItem('refresh_token');
        return false;
      }

      const data = await response.json();
      if (data.status && data.data?.tokens) {
        this.setToken(data.data.tokens.accessToken);
        localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
        return true;
      }
      return false;
    } catch {
      this.setToken(null);
      localStorage.removeItem('refresh_token');
      return false;
    }
  }

  async _handleResponse(response) {
    // Handle empty responses (204 No Content, etc.)
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      const error = new Error(data?.message || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data?.data;
  }

  // Convenience methods
  get(endpoint, params) {
    return this.request(endpoint, { method: 'GET', params });
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
