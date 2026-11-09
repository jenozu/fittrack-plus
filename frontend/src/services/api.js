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
  search: (q, { signal, limit = 20 } = {}) =>
    api.get(`/food/search?q=${encodeURIComponent(q)}&limit=${limit}`, { signal }),
  byBarcode: (code) => api.get(`/food/barcode/${encodeURIComponent(code)}`),
  searchByBarcode: (code) => api.get(`/food/barcode/${encodeURIComponent(code)}`), // legacy alias for FoodLog.jsx
  get: (id) => api.get(`/food/${id}`),
  recent: () => api.get('/food/recent'),
  frequent: () => api.get('/food/frequent'),
  getEntries: (date) => api.get('/food/entries', { params: { entry_date: date } }),
  createEntry: (body) => api.post('/food/entries', body),
  updateEntry: (id, body) => api.put(`/food/entries/${id}`, body),
  deleteEntry: (id) => api.delete(`/food/entries/${id}`),
  copyEntries: (body) => api.post('/food/entries/copy', body),
  createCustom: (body) => api.post('/food/custom', body),
  copyFood: (id) => api.post(`/food/${id}/copy`),
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

// Export API
export const exportAPI = {
  exportCSV: (params) => {
    return api.get('/export/csv', {
      params,
      responseType: 'blob',
    });
  },
  exportJSON: (params) => {
    return api.get('/export/json', {
      params,
      responseType: 'blob',
    });
  },
  exportPDF: (params) => {
    return api.get('/export/pdf', {
      params,
      responseType: 'blob',
    });
  },
  exportAll: (params) => {
    return api.get('/export/all', {
      params,
      responseType: 'blob',
    });
  },
};

// Recipe API
export const recipeAPI = {
  create: (data) => api.post('/recipes/', data),
  getAll: (search = '') => api.get('/recipes/', { params: { search } }),
  getById: (id) => api.get(`/recipes/${id}`),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  delete: (id) => api.delete(`/recipes/${id}`),
  duplicate: (id, newName = null) => api.post(`/recipes/${id}/duplicate`, null, { params: { new_name: newName } }),
  logToDiary: (data) => api.post('/recipes/log-to-diary', data),
};

// AI Meal Recognition API
export const aiMealAPI = {
  getUsage: () => api.get('/ai/usage'),
  analyzeMeal: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/ai/analyze-meal', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  confirmFoods: (foods, mealType, entryDate) => {
    return api.post('/ai/confirm-foods', foods, {
      params: {
        meal_type: mealType,
        entry_date: entryDate,
      },
    });
  },
};

// Smart Coaching API
export const coachingAPI = {
  getDailyAnalysis: (date) => api.get('/coaching/daily-analysis', { params: { analysis_date: date } }),
  getSuggestions: (date) => api.get('/coaching/suggestions', { params: { analysis_date: date } }),
  getEncouragement: (date) => api.get('/coaching/encouragement', { params: { analysis_date: date } }),
  getWeeklyInsights: () => api.get('/coaching/weekly-insights'),
  getDashboardSummary: () => api.get('/coaching/dashboard-summary'),
};

// Meal Planning API
export const mealPlanAPI = {
  create: (data) => api.post('/meal-plans/', data),
  getAll: (activeOnly = true) => api.get('/meal-plans/', { params: { active_only: activeOnly } }),
  getById: (id) => api.get(`/meal-plans/${id}`),
  update: (id, data) => api.put(`/meal-plans/${id}`, data),
  delete: (id) => api.delete(`/meal-plans/${id}`),
  addMeal: (planId, mealData) => api.post(`/meal-plans/${planId}/meals`, mealData),
  deleteMeal: (planId, mealId) => api.delete(`/meal-plans/${planId}/meals/${mealId}`),
  generateGroceryList: (planId) => api.post(`/meal-plans/${planId}/grocery-list`),
  getGroceryList: (planId) => api.get(`/meal-plans/${planId}/grocery-list`),
  updateGroceryItem: (itemId, data) => api.put(`/meal-plans/grocery-items/${itemId}`, data),
  getDailyNutrition: (planId, targetDate) => api.get(`/meal-plans/${planId}/nutrition/${targetDate}`),
};

// Gamification API
export const gamificationAPI = {
  getProgress: () => api.get('/gamification/progress'),
  checkBadges: () => api.post('/gamification/check-badges'),
  getAllBadges: () => api.get('/gamification/badges'),
  getEarnedBadges: () => api.get('/gamification/badges/earned'),
  getLeaderboard: (limit = 10) => api.get('/gamification/leaderboard', { params: { limit } }),
  awardXP: (action) => api.post('/gamification/award-xp', null, { params: { action } }),
};

// Helper function to download blob as file
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default api;

