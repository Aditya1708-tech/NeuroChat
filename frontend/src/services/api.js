import axios from 'axios';

// Create a reusable Axios instance
// Uses the Vite proxy — all /api requests are forwarded to the backend
const api = axios.create({
  baseURL: '/api'
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('neurochat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
