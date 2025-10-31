// src/service/scheduleService.js
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

/** 공통 응답 래핑 해제 */
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'result' in data) return data.result;
  return data;
};

/**
 * 달력 데이터 조회(기간 기반)
 * GET /schedule/calendar-range?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeIds=1&employeeIds=2...
 * - 기존 /schedule/calendar?from&to 호출을 /schedule/calendar-range로 변경
 * - params.employeeId 가 오면 employeeIds=[employeeId]로 변환
 * - Axios 배열 직렬화 호환을 위해 URLSearchParams로 직접 구성
 * 응답: ScheduleCalendarDto[]
 */
export const fetchScheduleCalendar = async ({ from, to, employeeIds, employeeId } = {}) => {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);

  const ids = Array.isArray(employeeIds)
    ? employeeIds
    : (employeeId != null ? [employeeId] : []);

  ids.forEach((id) => {
    if (id != null) q.append('employeeIds', String(id));
  });

  const url = `${BASE_URL}/schedule/calendar-range?${q.toString()}`;
  const res = await axios.get(url);
  return unwrap(res) || [];
};

/**
 * 직원 옵션 조회 (OptionController)
 * GET /api/employees/options?branchIds&from&to&keyword&all
 * 응답: EmployeeOptionDto[]
 */
export const fetchEmployeeOptions = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/api/employees/options`, { params });
  return unwrap(res) || [];
};

/* ====== 스케줄 작성/수정 API (백엔드 시그니처에 맞춤) ====== */

/** 단건 생성: POST /schedule/create */
export const createSchedule = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/create`, payload);
  return unwrap(res);
};

/** 대량 생성: POST /schedule/mass-create  (하이픈 주의) */
export const createSchedulesBulk = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/mass-create`, payload);
  return unwrap(res);
};

/** 단건 수정: PATCH /schedule/update/{id} */
export const updateSchedule = async (id, payload) => {
  const res = await axios.patch(`${BASE_URL}/schedule/update/${id}`, payload);
  return unwrap(res);
};

/**
 * (선택) 이벤트 단건 수정: 백엔드 엔드포인트 준비되면 연결
 * 현재 컨트롤러에 매핑이 없으므로 보류/플레이스홀더
 */
// export const updateScheduleEvent = async (payload) => {
//   const res = await axios.put(`${BASE_URL}/schedule/event/update`, payload);
//   return unwrap(res);
// };

/**
 * (선택) 캘린더 엑셀 내보내기: 백엔드 구현 시 연결
 * GET /schedule/calendar/export (blob)
 */
export const exportScheduleCalendar = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/schedule/calendar/export`, {
    params,
    responseType: 'blob',
  });
  return res?.data;
};
