import axios from 'axios';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { secureStorage } from './secureStorage';

// Base API URL configuration
const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api/v1').trim();
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Registry for 401 Unauthorized handler
let onUnauthorizedCallback = null;

export const setUnauthorizedCallback = (callback) => {
  onUnauthorizedCallback = callback;
};

// Request Interceptor: Attach stored JWT Bearer token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Do not log credentials or token values
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unpack data & handle 401 session expiration without redirect loops
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response?.status;

    // Handle 401 Unauthorized
    if (status === 401) {
      try {
        await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        await secureStorage.removeItem(STORAGE_KEYS.USER_DATA);
      } catch {
        // Safe error suppression
      }

      if (typeof onUnauthorizedCallback === 'function') {
        onUnauthorizedCallback(error);
      }
    }

    const normalizedError = {
      success: false,
      status: status || 0,
      message:
        error.response?.data?.message ||
        (status === 0 ? 'Unable to reach college server. Check network connection.' : error.message),
      data: error.response?.data || null,
      isNetworkError: !error.response,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;

