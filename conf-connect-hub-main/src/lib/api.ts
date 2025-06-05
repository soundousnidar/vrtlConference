import axios from 'axios';

// In development, use the Vite proxy
const API_URL = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the JWT token to requests
api.interceptors.request.use(
  (config) => {
    // Don't add token for public endpoints
    if (config.url === '/conferences' && config.method?.toLowerCase() === 'get') {
      console.log('Public endpoint, skipping token'); // Debug log
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      // Make sure we're using the correct format for the Authorization header
      const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      config.headers.Authorization = authToken;
      console.log('Request with token:', {
        url: config.url,
        method: config.method,
        token: authToken
      }); // Debug log
    } else {
      console.log('No token found in localStorage'); // Debug log
    }
    
    // Don't set Content-Type for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error); // Debug log
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('Response success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    }); // Debug log
    return response;
  },
  async (error) => {
    console.error('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    }); // Debug log
    
    if (error.response?.status === 401) {
      console.log('Unauthorized access detected, clearing credentials...'); // Debug log
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use navigate instead of window.location for better SPA handling
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
    return Promise.reject(error);
  }
);

export default api; 