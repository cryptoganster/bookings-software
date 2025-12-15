import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@shared/config/env';

/**
 * Axios instance configured for the backend API
 * Includes request/response interceptors for authentication and error handling
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds JWT token to requests
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (will be managed by auth store)
    const authStorage = localStorage.getItem('auth-storage');
    
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const token = state?.token;
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles common error scenarios
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth storage
      localStorage.removeItem('auth-storage');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      console.error('Resource not found:', error.config?.url);
    }
    
    // Handle 500 Server Error
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error:', error.message);
    }
    
    return Promise.reject(error);
  }
);
