import axios from 'axios';
import { tokenStorage, authService } from '../service/authService';

// Request Interceptor - 모든 요청에 Authorization 헤더 추가
axios.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - 401 에러 시 토큰 갱신 시도
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized 에러 처리
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 시도
        const newAccessToken = await authService.refreshToken();
        
        // 새 토큰으로 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // 갱신 실패 시 로그아웃
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // 403 Forbidden 에러 처리
    if (error.response?.status === 403) {
      console.error('Access Denied:', error.response.data);
      alert('접근 권한이 없습니다: ' + (error.response.data.status_message || '권한 부족'));
    }

    return Promise.reject(error);
  }
);

export default axios;

