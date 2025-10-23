import axios from "axios";

const CUSTOMER_API_BASE = import.meta.env.VITE_CUSTOMER_API_URL || "http://localhost:8080";

/**
 * 퍼블릭 API 전용 axios (인터셉터 없음)
 * - 401이어도 자동 리프레시/로그아웃/리다이렉트 절대 안 함
 */
const publicAxios = axios.create({
  baseURL: CUSTOMER_API_BASE,
  withCredentials: true,
});

export default publicAxios;
