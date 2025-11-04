// src/utils/axiosConfig.js
// 직원용 axios 전역 설정

import axios from 'axios';
import { tokenStorage, authService } from '../service/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
axios.defaults.baseURL = API_BASE_URL;

axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

let refreshPromise = null;
const REFRESH_PATH = '/auth/refresh';
export const SKIP_FLAG = '__skipAuthRefresh';

axios.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;

      if (config.url && config.url.includes('/api/orders')) {
        console.log('[axiosConfig] Authorization 헤더 설정:', {
          url: config.url,
          tokenPrefix: token.substring(0, 20) + '...',
          tokenLength: token.length
        });
      }
    } else {
      if (config.url && config.url.includes('/api/orders')) {
        console.warn('[axiosConfig] accessToken이 없습니다!');
      }
    }

    if (config.data instanceof FormData) {
      if (config.headers) delete config.headers['Content-Type'];
    }

    if (config.url) {
      const normalizeIdAfter = (u, seg) =>
        u.replace(new RegExp(`(/${seg}/)([^/?#]+)`), (_, p1, id) => p1 + String(id).split(':')[0]);

      config.url = normalizeIdAfter(config.url, 'attendance/event');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 403) {
      console.error('Access Denied:', error.response?.data);
      alert('접근 권한이 없습니다: ' + (error.response?.data?.status_message || '권한 부족'));
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest[SKIP_FLAG]) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const reqUrl = (originalRequest.url || '').toString();
    if (reqUrl.includes(REFRESH_PATH)) {
      await authService.logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        refreshPromise = authService.refreshToken();
      }
      const newAccessToken = await refreshPromise;
      refreshPromise = null;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      await authService.logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default axios;
