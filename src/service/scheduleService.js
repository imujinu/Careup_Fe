import axios from '../utils/axiosConfig';

/**
 * BASE_URL을 항상 "브랜치 서비스 루트"로 맞춤
 */
const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${api}/branch-service`;
})();

/** 공통 응답 언랩 */
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'result' in data) return data.result;
  return data;
};

/**
 * 달력 데이터 조회(기간 기반)
 * 선호: GET /schedule/calendar-range?from=YYYY-MM-DD&to=YYYY-MM-DD&branchId=...&employeeIds=1&employeeIds=2...
 * 폴백: GET /schedule/calendar?...
 */
export const fetchScheduleCalendar = async ({ from, to, branchId, employeeIds, employeeId } = {}) => {
  const q = new URLSearchParams();
  if (from) q.set('from', from);
  if (to) q.set('to', to);
  if (branchId != null) q.set('branchId', String(branchId));

  const ids = Array.isArray(employeeIds)
    ? employeeIds
    : (employeeId != null ? [employeeId] : []);

  ids.forEach((id) => {
    if (id != null) q.append('employeeIds', String(id));
  });

  const url1 = `${BASE_URL}/schedule/calendar-range?${q.toString()}`;
  try {
    const res = await axios.get(url1);
    return unwrap(res) || [];
  } catch (e) {
    if (e?.response?.status && [404, 405].includes(e.response.status)) {
      const url2 = `${BASE_URL}/schedule/calendar?${q.toString()}`;
      const res2 = await axios.get(url2);
      return unwrap(res2) || [];
    }
    throw e;
  }
};

/** 직원 옵션 */
export const fetchEmployeeOptions = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/api/employees/options`, { params });
  return unwrap(res) || [];
};

/** 지점 옵션 */
export const fetchBranchOptions = async (keyword = '') => {
  const res = await axios.get(`${BASE_URL}/api/branches/options`, { params: { keyword } });
  return unwrap(res) || [];
};

/** 근무종류 옵션 */
export const fetchWorkTypeOptions = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/work-types/options`);
    const data = unwrap(res) || [];
    if (Array.isArray(data) && data.length >= 0) return data;
  } catch { /* fallthrough */ }
  const res2 = await axios.get(`${BASE_URL}/work-type/list`, { params: { page: 0, size: 1000 } });
  const page = unwrap(res2);
  const content = page?.content || page?.data?.content || [];
  return content.map(x => ({
    id: x.id,
    name: x.name,
    geofenceRequired: !!x.geofenceRequired,
  }));
};

/** 휴가종류 옵션 */
export const fetchLeaveTypeOptions = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/leave-types/options`);
    const data = unwrap(res) || [];
    if (Array.isArray(data) && data.length >= 0) return data;
  } catch { /* fallthrough */ }
  const res2 = await axios.get(`${BASE_URL}/leave-type/list`, { params: { page: 0, size: 1000 } });
  const page = unwrap(res2);
  const content = page?.content || page?.data?.content || [];
  return content.map(x => ({
    id: x.id,
    name: x.name,
    paid: !!x.paid,
  }));
};

/* ====== 스케줄 작성/수정/상세 API ====== */

/** 단건 생성 */
export const createSchedule = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/create`, payload);
  return unwrap(res);
};

/** 대량 생성 */
export const massCreateSchedules = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/mass-create`, payload);
  return unwrap(res);
};
export const createSchedulesBulk = massCreateSchedules;

/** 단건 수정(계획/등록 시간) */
export const updateSchedule = async (id, payload) => {
  const res = await axios.patch(`${BASE_URL}/schedule/update/${id}`, payload);
  return unwrap(res);
};

/** 실제 기록(근태 이벤트) 보정/저장 */
export const upsertAttendanceEvent = async (scheduleId, payload) => {
  // ScheduleEventUpdateDto: { eventDate, clockInAt?, breakStartAt?, breakEndAt?, clockOutAt?, clearMissedCheckout? }
  const res = await axios.patch(`${BASE_URL}/attendance/event/${scheduleId}`, payload);
  return unwrap(res);
};

/** 캘린더 엑셀 */
export const exportScheduleCalendar = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/schedule/calendar/export`, {
    params,
    responseType: 'blob',
  });
  return res?.data;
};

/** 스케줄 상세 */
export const getScheduleDetail = async (id) => {
  const res = await axios.get(`${BASE_URL}/schedule/detail/${id}`);
  return unwrap(res) || null;
};
