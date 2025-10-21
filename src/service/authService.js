/// src/service/authService.js
/// 직원용
import axios from 'axios';
import { decodeToken } from '../utils/jwt';

const AUTH_API_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8081';

// 토큰 저장/조회/삭제
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
  },
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },
  setUserInfo: (userInfo) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }
};

// 토큰에서 사용자 정보 추출
export const getUserInfoFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    employeeId: decoded.employeeId,
    role: decoded.role,
    branchId: decoded.branchId,
    userType: decoded.branchId === 1 ? 'headquarters' : 'franchise',
    exp: decoded.exp,
    sub: decoded.sub
  };
};

// Auth API
export const authService = {
  // 로그인
  login: async (credentials) => {
    try {
      const response = await axios.post(`${AUTH_API_URL}/auth/login`, {
        id: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe || false
      });

      // 백엔드 응답 구조: { result: { accessToken, refreshToken, ... }, status_code, status_message }
      const { accessToken, refreshToken } = response.data.result;

      // 토큰 저장
      tokenStorage.setTokens(accessToken, refreshToken);

      // 토큰에서 사용자 정보 추출 및 저장
      const userInfo = getUserInfoFromToken(accessToken);
      if (userInfo) {
        tokenStorage.setUserInfo(userInfo);
      }

      return {
        accessToken,
        refreshToken,
        userInfo
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // 로그아웃
  logout: () => {
    tokenStorage.clearTokens();
  },

  // 토큰 갱신
  refreshToken: async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${AUTH_API_URL}/auth/refresh`, {
        refreshToken
      });

      // 백엔드 응답 구조: { result: { accessToken, refreshToken, ... }, status_code, status_message }
      const { accessToken, refreshToken: newRefreshToken } = response.data.result;
      
      // 새 토큰 저장
      tokenStorage.setTokens(accessToken, newRefreshToken);

      // 사용자 정보 업데이트
      const userInfo = getUserInfoFromToken(accessToken);
      if (userInfo) {
        tokenStorage.setUserInfo(userInfo);
      }

      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      tokenStorage.clearTokens();
      throw error;
    }
  },

  // 현재 로그인 상태 확인
  isAuthenticated: () => {
    const token = tokenStorage.getAccessToken();
    if (!token) return false;

    const userInfo = getUserInfoFromToken(token);
    if (!userInfo) return false;

    // 토큰 만료 확인
    const now = Date.now() / 1000;
    if (userInfo.exp < now) {
      return false;
    }

    return true;
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: () => {
    return tokenStorage.getUserInfo();
  }
};

export default authService;
