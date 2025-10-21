// src/service/customerAuthService.js
import axios from 'axios';
import customerAxios from '../utils/customerAxios';
import { decodeToken } from '../utils/jwt';

const CUSTOMER_API_BASE = import.meta.env.VITE_CUSTOMER_API_URL || 'http://localhost:8080';

// 고객 토큰/유저 저장소
export const customerTokenStorage = {
  getAccessToken: () => localStorage.getItem('cust_accessToken'),
  getRefreshToken: () => localStorage.getItem('cust_refreshToken'),
  setTokens: (access, refresh) => {
    if (access) localStorage.setItem('cust_accessToken', access);
    if (refresh) localStorage.setItem('cust_refreshToken', refresh);
  },
  clear: () => {
    localStorage.removeItem('cust_accessToken');
    localStorage.removeItem('cust_refreshToken');
    localStorage.removeItem('cust_userInfo');
  },
  getUserInfo: () => {
    const s = localStorage.getItem('cust_userInfo');
    return s ? JSON.parse(s) : null;
  },
  setUserInfo: (info) => localStorage.setItem('cust_userInfo', JSON.stringify(info)),
};

// 토큰 클레임 → 유저정보
const getUserInfoFromToken = (accessToken) => {
  const d = decodeToken(accessToken);
  if (!d) return null;
  return {
    memberId: Number(d.memberId ?? d.sub),
    role: d.role || 'CUSTOMER',
    exp: d.exp,
    sub: d.sub,
  };
};

// 인터셉터 없는 raw axios (무한루프 방지용)
const raw = axios.create({
  baseURL: CUSTOMER_API_BASE,
  withCredentials: true,
});

export const customerAuthService = {
  // id = 이메일 또는 휴대폰번호
  login: async ({ id, password, rememberMe = false }) => {
    const res = await customerAxios.post('/auth/customers/login', { id, password, rememberMe });

    const {
      accessToken,
      refreshToken,
      memberId,
      role,
      email,
      nickname,
      name,
      phone,
    } = res.data.result;

    customerTokenStorage.setTokens(accessToken, refreshToken);

    const t = getUserInfoFromToken(accessToken) || {};
    const userInfo = {
      memberId: memberId ?? t.memberId,
      role: role ?? t.role ?? 'CUSTOMER',
      email,
      nickname,
      name,
      phone,
      exp: t.exp,
    };
    customerTokenStorage.setUserInfo(userInfo);

    return { accessToken, refreshToken, userInfo };
  },

  // **raw axios 사용**: 인터셉터 안 타게
  refreshToken: async () => {
    const rt = customerTokenStorage.getRefreshToken();
    if (!rt) throw new Error('No customer refresh token');

    const res = await raw.post('/auth/customers/refresh', { refreshToken: rt });
    const { accessToken, role, memberId } = res.data.result; // refresh는 access만 내려오는 스펙(백엔드 기준)

    customerTokenStorage.setTokens(accessToken); // refreshToken 갱신 없음
    const t = getUserInfoFromToken(accessToken) || {};
    const prev = customerTokenStorage.getUserInfo() || {};
    customerTokenStorage.setUserInfo({
      ...prev,
      exp: t.exp,
      role: role ?? t.role ?? prev.role,
      memberId: memberId ?? t.memberId ?? prev.memberId,
    });

    return accessToken;
  },

  // **raw axios 사용**: 로그아웃 중 401이 와도 인터셉터가 또 리프레시 안 걸리게
  logout: async () => {
    const rt = customerTokenStorage.getRefreshToken();
    try {
      if (rt) await raw.post('/auth/customers/logout', { refreshToken: rt });
    } catch {
      // 무시: RT가 이미 무효이면 여기서 실패할 수 있음
    } finally {
      customerTokenStorage.clear();
    }
  },

  isAuthenticated: () => {
    const at = customerTokenStorage.getAccessToken();
    if (!at) return false;
    const d = decodeToken(at);
    return !!d && d.exp > Date.now() / 1000;
  },

  getCurrentUser: () => customerTokenStorage.getUserInfo(),
};

export default customerAuthService;
