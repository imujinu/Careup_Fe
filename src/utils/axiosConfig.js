/// src/utils/axiosConfig.js
/// 직원용 axios 전역 설정
import axios from 'axios';
import { tokenStorage, authService } from '../service/authService';

// ---- 단일 비행 리프레시 상태 ----
let refreshPromise = null;
const REFRESH_PATH = '/auth/refresh';
export const SKIP_FLAG = '__skipAuthRefresh'; // 개별 요청에서 리프레시 스킵하기 위한 플래그

// Request Interceptor - 모든 요청에 Authorization 헤더 추가
axios.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData인 경우 Content-Type을 설정하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - 401 에러 시 토큰 갱신 시도(단일 비행)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    // 403 Forbidden 에러 처리
    if (status === 403) {
      console.error('Access Denied:', error.response?.data);
      alert('접근 권한이 없습니다: ' + (error.response?.data?.status_message || '권한 부족'));
      return Promise.reject(error);
    }

    // 401이 아니면 그대로
    if (status !== 401) {
      return Promise.reject(error);
    }

    // 로그인/형식검증 등: 리프레시 스킵 지정된 요청
    if (originalRequest[SKIP_FLAG]) {
      return Promise.reject(error);
    }

    // 이미 재시도 했으면 중단
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // 리프레시 호출 그 자체의 401은 즉시 로그아웃
    const reqUrl = (originalRequest.url || '').toString();
    if (reqUrl.includes(REFRESH_PATH)) {
      authService.logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // 단일 비행: 이미 리프레시 중이면 그 결과를 공유
      if (!refreshPromise) {
        refreshPromise = authService.refreshToken();
      }
      const newAccessToken = await refreshPromise;
      refreshPromise = null;

      // 새 토큰으로 원요청 재시도
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      // 갱신 실패 → 로그아웃 후 로그인 페이지로
      authService.logout();
      window.location.href = '/login';
      return Promise.reject(refreshError);
    }
  }
);

export default axios;
