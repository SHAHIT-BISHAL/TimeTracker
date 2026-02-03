import axios from 'axios';
import { getApiUrl } from '../utils/apiUrl.js';

// Create axios instance with relative base URL
const api = axios.create({
  baseURL: getApiUrl()
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add company context to requests automatically
  const companyId = localStorage.getItem('selectedCompanyId');
  if (companyId) {
    // Add to params for GET requests
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        company_id: companyId
      };
    }
    // Add to data for POST/PUT/PATCH requests (ensure body exists)
    else if (!config.data) {
      config.data = { company_id: companyId };
    } else if (typeof config.data === 'object' && !config.data.company_id) {
      config.data = {
        ...config.data,
        company_id: companyId
      };
    }
  }

  return config;
});

// Response interceptor to detect HTML responses (reverse proxy misconfiguration)
api.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'];
    
    // If we got HTML when expecting JSON, the reverse proxy is misconfigured
    if (contentType && contentType.includes('text/html')) {
      const error = new Error(
        'Reverse proxy misconfiguration: API endpoint returned HTML instead of JSON. ' +
        'This typically means Nginx is serving the React app for /api/* routes. ' +
        'Check that the "location /api/" block is configured BEFORE "location /" in your Nginx config.'
      );
      error.code = 'PROXY_MISCONFIGURATION';
      error.response = response;
      return Promise.reject(error);
    }
    
    return response;
  },
  (error) => {
    // Check if error response contains HTML
    if (error.response) {
      const contentType = error.response.headers['content-type'];
      if (contentType && contentType.includes('text/html')) {
        const proxyError = new Error(
          'Reverse proxy misconfiguration: Received HTML error page instead of JSON API response. ' +
          'Verify Nginx configuration and that the backend server is running.'
        );
        proxyError.code = 'PROXY_MISCONFIGURATION';
        proxyError.originalError = error;
        proxyError.response = error.response;
        return Promise.reject(proxyError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Export configured API client
export default api;

// Export base URL for components that need it (e.g., file downloads)
export const API_BASE_URL = getApiUrl();

// Convenience service exports
export const authService = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (username, password) =>
    api.post('/auth/login', { username, password })
};

export const timeService = {
  clockIn: (data = {}) => api.post('/time/clock-in', data),
  clockOut: (data = {}) => api.post('/time/clock-out', data),
  getStatus: () => api.get('/time/status'),
  getEntries: (startDate, endDate) =>
    api.get('/time/entries', { params: { startDate, endDate } })
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateSettings: (hourly_rate, pay_cycle) =>
    api.put('/users/settings', { hourly_rate, pay_cycle })
};

export const payCycleService = {
  getCurrent: () => api.get('/paycycle/current'),
  calculate: (startDate, endDate) =>
    api.get('/paycycle/calculate', { params: { startDate, endDate } }),
  generateMessage: (startDate, endDate) =>
    api.get('/paycycle/generate-message', { params: { startDate, endDate } })
};
