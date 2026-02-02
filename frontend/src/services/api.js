import axios from 'axios';
import { getApiUrl } from '../utils/apiUrl.js';

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL
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

export default api;
