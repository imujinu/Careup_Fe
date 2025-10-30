// src/service/scheduleService.js
import axios from '../utils/axiosConfig';

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

// 응답 래핑 해제
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object') {
    if ('result' in data) return data.result;
    if ('success' in data && 'result' in data) return data.result;
  }
  return data;
};

/**
 * 달력 데이터 조회
 * GET /schedule/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId&employeeId
 * 응답: ScheduleCalendarDto[]
 */
export const fetchScheduleCalendar = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/schedule/calendar`, { params });
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

/**
 * 대한민국 공휴일 조회 (백엔드 프록시/내부 계산 엔드포인트)
 * GET /calendar/holidays?from=YYYY-MM-DD&to=YYYY-MM-DD
 * 응답: string[]  (예: ["2025-09-14", "2025-09-15", ...])
 */
export const fetchKoreanHolidays = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/calendar/holidays`, { params });
  return unwrap(res) || [];
};

/* ====== 작성/수정 API: 이후 단계 연결 예정 ====== */
export const createSchedule = async (meta) => {
  const res = await axios.post(`${BASE_URL}/schedule/create`, meta);
  return unwrap(res);
};
export const createSchedulesBulk = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/mass/create`, payload);
  return unwrap(res);
};
export const updateSchedule = async (id, meta) => {
  const res = await axios.put(`${BASE_URL}/schedule/update`, { id, ...meta });
  return unwrap(res);
};
export const updateScheduleEvent = async (meta) => {
  const res = await axios.put(`${BASE_URL}/schedule/event/update`, meta);
  return unwrap(res);
};
export const exportScheduleCalendar = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/schedule/calendar/export`, {
    params,
    responseType: 'blob',
  });
  return res?.data;
};
