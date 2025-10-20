import axios from 'axios';
import { customerTokenStorage, customerAuthService } from '../service/customerAuthService.js';

// 고객 API 기본 URL (백엔드 8080)
const CUSTOMER_API_BASE = import.meta.env.VITE_CUSTOMER_API_URL || 'http://localhost:8080';

const customerAxios = axios.create({
  baseURL: CUSTOMER_API_BASE,
  withCredentials: true, // 필요 없으면 false로
});

// 요청 인터셉터: 고객 토큰만 사용
customerAxios.interceptors.request.use(
  (config) => {
    const token = customerTokenStorage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401→refresh 시도, 403 안내
customerAxios.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newAccess = await customerAuthService.refreshToken();
        original.headers.Authorization = `Bearer ${newAccess}`;
        return customerAxios(original);
      } catch (e) {
        await customerAuthService.logout();
        window.location.href = '/customer/login';
        return Promise.reject(e);
      }
    }

    if (error.response?.status === 403) {
      // 서버에서 status_message 내려주면 표시
      alert('고객 권한이 없습니다: ' + (error.response.data?.status_message || '권한 부족'));
    }

    return Promise.reject(error);
  }
);

export default customerAxios;
