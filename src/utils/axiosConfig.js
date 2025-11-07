// src/utils/axiosConfig.js
// 직원용 axios 전역 설정

import axios from 'axios';
import { tokenStorage, authService } from '../service/authService';

// ✅ 게이트웨이 baseURL (Vite .env에서 VITE_API_URL 제공 권장)
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080');
axios.defaults.baseURL = API_BASE_URL;

// 공용 기본값
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

// ---- 단일 비행 리프레시 상태 ----
let refreshPromise = null;
const REFRESH_PATH = '/auth/refresh';
const LOGOUT_PATH = '/auth/logout';
export const SKIP_FLAG = '__skipAuthRefresh'; // 개별 요청에서 리프레시 스킵하기 위한 플래그

// ✅ 로그인 경로 헬퍼(모바일 분기)
const goLogin = () => {
  const isMobile = typeof window !== 'undefined' && window.location.pathname.startsWith('/m');
  window.location.replace(isMobile ? '/m/login' : '/login');
};

// ---- Request Interceptor ----
axios.interceptors.request.use(
  (config) => {
    // AT 부착
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;

      // 디버깅: 주문 API 호출 시 토큰 확인
      if (config.url && config.url.includes('/api/orders')) {
        console.log('[axiosConfig] Authorization 헤더 설정:', {
          url: config.url,
          tokenPrefix: token.substring(0, 20) + '...',
          tokenLength: token.length,
        });
      }

      // 디버깅: 브랜치 서비스 호출 토큰/URL 확인
      if (config.url && config.url.includes('/branch-service')) {
        console.debug('[axiosConfig] branch-service call', {
          url: config.url,
          hasAuth: !!token,
        });
      }
    } else {
      if (config.url && config.url.includes('/api/orders')) {
        console.warn('[axiosConfig] accessToken이 없습니다!');
      }
    }

    // FormData의 경우 브라우저가 경계(boundary) 포함한 Content-Type 자동 설정
    if (config.data instanceof FormData) {
      if (config.headers) delete config.headers['Content-Type'];
    }

    // 일부 경로의 ID에 :가 섞여 들어오는 케이스 정규화
    if (config.url) {
      const normalizeIdAfter = (u, seg) =>
        u.replace(new RegExp(`(/${seg}/)([^/?#]+)`), (_, p1, id) => p1 + String(id).split(':')[0]);

      // 예: /attendance/event/123:clock → /attendance/event/123
      config.url = normalizeIdAfter(config.url, 'attendance/event');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor ----
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    // 권한 없음(403)
    if (status === 403) {
      const url = (originalRequest?.url || '').toString();

      // 지점 내 정보: 403은 호출부에서 폴백 처리하도록 알림 없이 그대로 던짐
      if (url.includes('/branch-service/branch/my')) {
        console.warn('[axiosConfig] 403 on /branch/my — caller will handle fallback', error.response?.data);
        return Promise.reject(error);
      }

      console.error('Access Denied:', error.response?.data);
      alert('접근 권한이 없습니다: ' + (error.response?.data?.status_message || '권한 부족'));
      return Promise.reject(error);
    }

    // 401 이외 에러는 그대로 통과
    if (status !== 401) {
      return Promise.reject(error);
    }

    // 이 요청은 리프레시 스킵
    if (originalRequest[SKIP_FLAG]) {
      return Promise.reject(error);
    }

    // ✅ RT가 없으면 리프레시 시도 금지 → 즉시 로그인 이동
    if (!tokenStorage.getRefreshToken()) {
      try { tokenStorage.clearTokens(); } catch {}
      goLogin();
      return Promise.reject(error);
    }

    // refresh 자체가 401이면 -> 루프 방지: 바로 토큰 제거 & 로그인 이동 (logout 호출 금지)
    const reqUrl = (originalRequest.url || '').toString();
    if (reqUrl.includes(REFRESH_PATH)) {
      try { tokenStorage.clearTokens(); } catch {}
      goLogin();
      return Promise.reject(error);
    }

    // 로그아웃 호출이 401이어도 "최선의 시도"로 간주하고 종료(리프레시 금지)
    if (reqUrl.includes(LOGOUT_PATH)) {
      try { tokenStorage.clearTokens(); } catch {}
      return Promise.reject(error);
    }

    // 중복 재시도 방지
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      // 여러 401 동시 발생 시 하나의 refreshPromise 공유
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
      try { tokenStorage.clearTokens(); } catch {}
      goLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default axios;
