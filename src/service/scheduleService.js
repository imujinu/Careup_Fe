// src/service/scheduleService.js
import axios from '../utils/axiosConfig';

/**
 * BASE_URL을 항상 "브랜치 서비스 루트"로 맞춤
 */
const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_CUSTOMER_API_URL).replace(/\/$/, '');
  return `${api}/branch-service`;
})();

/** 공통 응답 언랩 */
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'result' in data) return data.result;
  return data;
};

/** 안전한 ID 정규화: "123:TAIL" / "123:2025-11-04" → "123" */
const normalizeId = (val) => {
  const s = String(val ?? '');
  return s.includes(':') ? s.split(':')[0] : s;
};

/** YYYY-MM-DD로 잘라내기 */
const toYMD = (v) => (v ? String(v).slice(0, 10) : '');

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
  const sid = normalizeId(id);
  const res = await axios.patch(`${BASE_URL}/schedule/update/${encodeURIComponent(sid)}`, payload);
  return unwrap(res);
};

/**
 * 실제 기록(근태 이벤트) 보정/저장 (업서트 의도)
 * - 서버가 PATCH만 받으면 그대로 사용
 * - 혹시 405(Method Not Allowed)면 PUT로 재시도
 */
export const upsertAttendanceEvent = async (scheduleId, payload = {}) => {
  const sid = normalizeId(scheduleId);

  // DTO에 맞게 안전 정제 (eventDate는 YYYY-MM-DD만 허용)
  const body = {
    eventDate: toYMD(payload.eventDate) || undefined,
    clockInAt: payload.clockInAt || undefined,
    breakStartAt: payload.breakStartAt || undefined,
    breakEndAt: payload.breakEndAt || undefined,
    clockOutAt: payload.clockOutAt || undefined,
    clearMissedCheckout: payload.clearMissedCheckout || undefined,
    part: payload.part || undefined,
  };

  const url = `${BASE_URL}/attendance/event/${encodeURIComponent(sid)}`;

  try {
    const res = await axios.patch(url, body);
    return unwrap(res);
  } catch (e) {
    if (e?.response?.status === 405) {
      const res2 = await axios.put(url, body);
      return unwrap(res2);
    }
    throw e;
  }
};

/** 근무 기록(AttendanceEvent) 삭제 */
export const deleteAttendanceEvent = async (scheduleId) => {
  const sid = normalizeId(scheduleId);
  const res = await axios.delete(`${BASE_URL}/attendance/event/${encodeURIComponent(sid)}`);
  return unwrap(res);
};

/** 스케줄 상세 */
export const getScheduleDetail = async (id) => {
  const sid = normalizeId(id);
  const res = await axios.get(`${BASE_URL}/schedule/detail/${encodeURIComponent(sid)}`);
  return unwrap(res) || null;
};

/** 스케줄 계획 삭제
 *  우선 DELETE /schedule/delete/{id} 사용, 없으면 /schedule/{id}로 폴백
 */
export const deleteSchedule = async (id) => {
  const sid = normalizeId(id);
  const url1 = `${BASE_URL}/schedule/delete/${encodeURIComponent(sid)}`;
  try {
    const res = await axios.delete(url1);
    return unwrap(res);
  } catch (e) {
    if (e?.response?.status && [404, 405].includes(e.response.status)) {
      const url2 = `${BASE_URL}/schedule/${encodeURIComponent(sid)}`;
      const res2 = await axios.delete(url2);
      return unwrap(res2);
    }
    throw e;
  }
};

/** 캘린더 엑셀 */
export const exportScheduleCalendar = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/schedule/calendar/export`, {
    params,
    responseType: 'blob',
  });
  return res?.data;
};

export default {
  fetchScheduleCalendar,
  fetchEmployeeOptions,
  fetchBranchOptions,
  fetchWorkTypeOptions,
  fetchLeaveTypeOptions,
  createSchedule,
  massCreateSchedules,
  createSchedulesBulk,
  updateSchedule,
  upsertAttendanceEvent,
  deleteAttendanceEvent,
  getScheduleDetail,
  deleteSchedule,
  exportScheduleCalendar,
};
