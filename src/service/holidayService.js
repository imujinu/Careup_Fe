import axios from '../utils/axiosConfig';

/**
 * BASE_URL을 항상 "브랜치 서비스 루트"로 맞춥니다.
 * - VITE_BRANCH_URL이 있으면 그것을 사용(보통 http://localhost:8080/branch-service)
 * - 없으면 VITE_API_URL + '/branch-service'로 구성
 * - 마지막 슬래시는 제거해 일관성 유지
 */
const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${api}/branch-service`;
})();

/**
 * 공휴일 조회 (게이트웨이 경유)
 * 백엔드 응답: [{ ymd: "YYYY-MM-DD", name: "설날" }, ...]
 * FE에서는 맵으로 변환하여 사용: { "YYYY-MM-DD": "휴일명" }
 */
export const fetchKoreanHolidays = async ({ from, to }) => {
  const res = await axios.get(`${BASE_URL}/calendar/holidays`, { params: { from, to } });

  const arr = Array.isArray(res?.data) ? res.data : [];
  const map = {};
  for (const item of arr) {
    if (!item) continue;
    const ymd = String(item.ymd || '').slice(0, 10);
    const name = String(item.name || '').trim();
    if (ymd) map[ymd] = name || '공휴일';
  }
  return map;
};
