import axios from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').trim();
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
if (!rawBaseUrl.includes('/api/v1')) {
  rawBaseUrl += '/api/v1';
}

export const axiosClient = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Bearer Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cmp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('cmp_token');
      localStorage.removeItem('cmp_user');
      window.location.href = '/login?expired=true';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default axiosClient;
