import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  completeOnboarding: (data) => api.post('/users/onboarding', data),
};

// Food API
export const foodAPI = {
  search: (query, limit = 20) => api.get(`/food/search?q=${query}&limit=${limit}`),
  searchByBarcode: (barcode) => api.get(`/food/barcode/${barcode}`),
  getEntries: (date) => api.get('/food/entries', { params: { entry_date: date } }),
  createEntry: (data) => api.post('/food/entries', data),
  updateEntry: (id, data) => api.put(`/food/entries/${id}`, data),
  deleteEntry: (id) => api.delete(`/food/entries/${id}`),
};

// Exercise API
export const exerciseAPI = {
  getEntries: (date) => api.get('/exercise/entries', { params: { entry_date: date } }),
  createEntry: (data) => api.post('/exercise/entries', data),
  updateEntry: (id, data) => api.put(`/exercise/entries/${id}`, data),
  deleteEntry: (id) => api.delete(`/exercise/entries/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getDailySummary: (date) => api.get('/dashboard/summary', { params: { summary_date: date } }),
  getCalorieProgress: (days = 7) => api.get('/dashboard/progress/calories', { params: { days } }),
  getMacroProgress: (days = 7) => api.get('/dashboard/progress/macros', { params: { days } }),
  getStreak: () => api.get('/dashboard/streak'),
  logWeight: (data) => api.post('/dashboard/weight', data),
  getWeightLogs: (days = 30) => api.get('/dashboard/weight', { params: { days } }),
};

// Water API
export const waterAPI = {
  logWater: (data) => api.post('/water/', data),
  getSummary: (date) => api.get('/water/summary', { params: { summary_date: date } }),
  getLogs: (days = 30) => api.get('/water/logs', { params: { days } }),
  getProgress: (days = 7) => api.get('/water/progress', { params: { days } }),
  getGoal: () => api.get('/water/goal'),
  updateGoal: (cups) => api.put('/water/goal', { water_goal_cups: cups }),
  deleteLog: (id) => api.delete(`/water/${id}`),
  updateLog: (id, data) => api.put(`/water/${id}`, data),
};

// Measurements API
export const measurementsAPI = {
  create: (data) => api.post('/measurements/', data),
  getAll: (days = 90) => api.get('/measurements/', { params: { days } }),
  getLatest: () => api.get('/measurements/latest'),
  getById: (id) => api.get(`/measurements/${id}`),
  update: (id, data) => api.put(`/measurements/${id}`, data),
  delete: (id) => api.delete(`/measurements/${id}`),
  getComparison: () => api.get('/measurements/comparison/current'),
  getSummary: () => api.get('/measurements/progress/summary'),
  getChartData: (days = 90) => api.get('/measurements/progress/chart', { params: { days } }),
};

export default api;

