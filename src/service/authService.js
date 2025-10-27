// src/service/authService.js

import axios from 'axios';
import { decodeToken } from '../utils/jwt';

const AUTH_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8080';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken, refreshToken) => {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },
  getUserInfo: () => {
    const raw = localStorage.getItem('userInfo');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  setUserInfo: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },
};

const pickRole = (decoded) => {
  if (!decoded) return undefined;
  if (decoded.role) return decoded.role;
  if (Array.isArray(decoded.roles) && decoded.roles.length) return decoded.roles[0];
  if (typeof decoded.auth === 'string') return decoded.auth.replace(/^ROLE_/, '');
  if (Array.isArray(decoded.authorities) && decoded.authorities.length) {
    const r = decoded.authorities[0];
    return typeof r === 'string' ? r.replace(/^ROLE_/, '') : r?.authority;
  }
  return undefined;
};

export const isHQAdmin = (u) =>
  !!u && (u.role === 'HQ_ADMIN' || u.roles?.includes?.('HQ_ADMIN') || u.branchType === 'HQ' || u.branchId === 1);

export const getUserInfoFromToken = (token) => {
  const d = decodeToken(token);
  if (!d) return null;

  const branchId = d.branchId ?? d.branch_id ?? d.branch?.id ?? d.orgId ?? null;
  const employeeId = d.employeeId ?? d.empId ?? d.userId ?? d.sub ?? null;
  const role = pickRole(d);

  const base = {
    employeeId,
    role,
    branchId,
    sub: d.sub,
    exp: d.exp,
  };

  return {
    ...base,
    userType: isHQAdmin({ ...base }) ? 'headquarters' : 'franchise',
    roles: Array.isArray(d.roles) ? d.roles : (role ? [role] : []),
    name: d.name ?? d.username ?? d.nick ?? undefined,
    email: d.email ?? d.user_email ?? undefined,
  };
};

const unwrapLoginResult = (data) => {
  const box = data?.result ?? data?.data ?? data;
  return {
    accessToken: box?.accessToken ?? box?.access_token ?? box?.token,
    refreshToken: box?.refreshToken ?? box?.refresh_token,
    user: box?.user ?? box?.profile ?? undefined,
    statusMessage: data?.status_message ?? data?.message,
    statusCode: data?.status_code ?? data?.status,
    errorCode: data?.error_code,
  };
};

export const authService = {
  login: async (credentials) => {
    const payload = {
      id: credentials.email,
      password: credentials.password,
      rememberMe: !!credentials.rememberMe,
    };

    // 로그인 요청은 401이어도 리프레시 시도 금지
    const config = {};
    config['__skipAuthRefresh'] = true;

    const { data } = await axios.post(`${AUTH_API_URL}/auth/login`, payload, config);

    const r = unwrapLoginResult(data);
    if (!r.accessToken) {
      const msg = r.statusMessage || '로그인 응답에 accessToken이 없습니다.';
      throw new Error(msg);
    }

    tokenStorage.setTokens(r.accessToken, r.refreshToken);

    const fromJwt = getUserInfoFromToken(r.accessToken) || {};
    const userInfo = { ...fromJwt, ...(r.user || {}) };

    tokenStorage.setUserInfo(userInfo);

    return {
      accessToken: r.accessToken,
      refreshToken: r.refreshToken,
      userInfo,
    };
  },

  // 서버 RT 폐기 포함 로그아웃
  logout: async () => {
    const rt = tokenStorage.getRefreshToken();
    try {
      if (rt) {
        await axios.post(`${AUTH_API_URL}/auth/logout`, { refreshToken: rt });
      }
    } catch (_e) {
      // 이미 폐기되었을 수 있으므로 무시
    } finally {
      tokenStorage.clearTokens();
    }
  },

  refreshToken: async () => {
    const rt = tokenStorage.getRefreshToken();
    if (!rt) throw new Error('No refresh token available');

    const { data } = await axios.post(`${AUTH_API_URL}/auth/refresh`, { refreshToken: rt });

    const box = data?.result ?? data?.data ?? data;
    const newAT = box?.accessToken ?? box?.access_token;
    const newRT = box?.refreshToken ?? box?.refresh_token ?? rt;

    if (!newAT) throw new Error('No access token in refresh response');

    tokenStorage.setTokens(newAT, newRT);

    const userInfo = getUserInfoFromToken(newAT);
    if (userInfo) tokenStorage.setUserInfo(userInfo);

    return newAT;
  },

  isAuthenticated: () => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;
    const u = getUserInfoFromToken(token);
    if (!u) return false;
    const now = Math.floor(Date.now() / 1000);
    return (u.exp ?? 0) > now;
  },

  getCurrentUser: () => tokenStorage.getUserInfo(),
};

export default authService;
