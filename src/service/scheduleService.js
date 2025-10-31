// src/service/scheduleService.js
import axios from '../utils/axiosConfig';

/**
 * BASE_URL을 항상 "브랜치 서비스 루트"로 맞춥니다.
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
 * GET /schedule/calendar-range?from=YYYY-MM-DD&to=YYYY-MM-DD&employeeIds=1...
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

/**
 * 근무종류 옵션
 * 1순위: GET /api/work-types/options → [{ id, name, geofenceRequired }]
 * 폴백 : GET /work-type/list?page=0&size=1000 → Page<WorkTypeDetailDto>.content 매핑
 */
export const fetchWorkTypeOptions = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/work-types/options`);
    const data = unwrap(res) || [];
    if (Array.isArray(data) && data.length >= 0) return data;
  } catch { /* fallthrough */ }
  // fallback
  const res2 = await axios.get(`${BASE_URL}/work-type/list`, { params: { page: 0, size: 1000 } });
  const page = unwrap(res2);
  const content = page?.content || page?.data?.content || [];
  return content.map(x => ({
    id: x.id,
    name: x.name,
    geofenceRequired: !!x.geofenceRequired,
  }));
};

/**
 * 휴가종류 옵션
 * 1순위: GET /api/leave-types/options → [{ id, name, paid }]
 * 폴백 : GET /leave-type/list?page=0&size=1000 → Page<LeaveTypeDetailDto>.content 매핑
 */
export const fetchLeaveTypeOptions = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/leave-types/options`);
    const data = unwrap(res) || [];
    if (Array.isArray(data) && data.length >= 0) return data;
  } catch { /* fallthrough */ }
  // fallback
  const res2 = await axios.get(`${BASE_URL}/leave-type/list`, { params: { page: 0, size: 1000 } });
  const page = unwrap(res2);
  const content = page?.content || page?.data?.content || [];
  return content.map(x => ({
    id: x.id,
    name: x.name,
    paid: !!x.paid,
  }));
};

/* ====== 스케줄 작성/수정 API ====== */

/** 단건 생성: POST /schedule/create
 * 서버는 workTypeId 또는 leaveTypeId의 존재 여부로 종류(근무/휴가)를 판정합니다.
 */
export const createSchedule = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/create`, payload);
  return unwrap(res);
};

/**
 * 대량 생성: POST /schedule/mass-create
 * - 서버가 종류(근무/휴가)를 자동 판정합니다.
 * - 규격: { items: [{ branchId, employeeId, date, workTypeId?|leaveTypeId?, registeredClockInTime?, registeredBreakStartTime?, registeredBreakEndTime?, registeredClockOutTime?, attendanceTemplateId? }...] }
 * - 시간 필드는 "HH:mm" (LocalTime) 형식
 */
export const massCreateSchedules = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schedule/mass-create`, payload);
  return unwrap(res);
};

export const createSchedulesBulk = massCreateSchedules;

/** 단건 수정: PATCH /schedule/update/{id} */
export const updateSchedule = async (id, payload) => {
  const res = await axios.patch(`${BASE_URL}/schedule/update/${id}`, payload);
  return unwrap(res);
};

/** 캘린더 엑셀 내보내기 */
export const exportScheduleCalendar = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/schedule/calendar/export`, {
    params,
    responseType: 'blob',
  });
  return res?.data;
};
