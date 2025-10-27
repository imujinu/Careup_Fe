// src/utils/customerAxios.js
// 고객용 axios 전역 설정

import axios from 'axios';
import { customerTokenStorage, customerAuthService } from '../service/customerAuthService.js';

const CUSTOMER_API_BASE = import.meta.env.VITE_CUSTOMER_API_URL || 'http://localhost:8080';

const customerAxios = axios.create({
  baseURL: CUSTOMER_API_BASE,
  withCredentials: true,
});

// ----
// 무한루프 방지용 상태
// ----
let refreshPromise = null;
const REFRESH_PATH = '/auth/customers/refresh';

// 요청 인터셉터: 고객 AT 주입
customerAxios.interceptors.request.use(
  (config) => {
    // 공개 API 등의 경우 토큰 주입 스킵
    if (!config.__skipAuthHeader) {
      const token = customerTokenStorage.getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
customerAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    // 403은 단순 안내
    if (status === 403) {
      alert('고객 권한이 없습니다: ' + (error.response?.data?.status_message || '권한 부족'));
      return Promise.reject(error);
    }

    // 401이 아니면 패스
    if (status !== 401) {
      return Promise.reject(error);
    }

    // (A) 이미 한 번 재시도했다면 더 이상 안 함
    if (original.__retried) {
      return Promise.reject(error);
    }
    original.__retried = true;

    // (B) 리프레시 호출 자체거나, 명시적으로 스킵 지시한 요청이면 즉시 로그아웃(기존 동작)
    //     비밀번호 재설정 등 공개 엔드포인트는 __skipAuthRefresh: true 로 오므로 여기로 들어옴
    const url = original.url || '';
    if (url.includes(REFRESH_PATH) || original.__skipAuthRefresh) {
      try { await customerAuthService.logout(); } catch {}
      window.location.href = '/customer/login';
      return Promise.reject(error);
    }

    // (C) 단일 비행으로 AT 재발급
    try {
      if (!refreshPromise) {
        refreshPromise = customerAuthService.refreshToken(); // 내부에서 "raw axios"로 호출
      }
      const newAccess = await refreshPromise;
      refreshPromise = null;

      // 새 토큰으로 원 요청 재시도
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return customerAxios(original);
    } catch (e) {
      refreshPromise = null;

      const msg =
        e?.response?.data?.status_message ||
        error?.response?.data?.status_message ||
        '세션이 만료되었습니다. 다시 로그인해 주세요.';
      alert(msg);

      try { await customerAuthService.logout(); } finally {
        window.location.href = '/customer/login';
      }
      return Promise.reject(e);
    }
  }
);

export default customerAxios;
