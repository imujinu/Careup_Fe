// src/utils/branchPublicAxios.js
import axios from "axios";

const BRANCH_API_BASE =
  import.meta.env.VITE_BRANCH_URL ||
  "http://localhost:8080";

/**
 * 직원용 "퍼블릭" 엔드포인트 전용 axios
 * - 인터셉터/토큰 갱신 없음
 * - 쿠키 미사용
 * - 401이어도 자동 리다이렉트/로그아웃 없음
 * - API Gateway(8080) 경유
 */
const branchPublicAxios = axios.create({
  baseURL: BRANCH_API_BASE,
  withCredentials: false,
});

export default branchPublicAxios;
