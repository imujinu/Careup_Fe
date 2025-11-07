// src/service/attendanceTemplateService.js
import axios from '../utils/axiosConfig';

const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
  return `${api}/branch-service`;
})();

const BASE = `${BASE_URL}/attendance-template`;

function unwrap(res) {
  const ct = (res?.headers?.['content-type'] || '').toLowerCase();
  const d = res?.data;
  if (typeof d === 'string' && !ct.includes('application/json')) {
    throw new Error('API 응답이 JSON이 아닙니다. baseURL 또는 프록시 설정을 확인하세요.');
  }
  if (d?.result !== undefined) return d.result;
  if (d?.data !== undefined) return d.data;
  return d ?? null;
}

function normalizePage(body) {
  if (!body) return { content: [], totalPages: 0, totalElements: 0 };
  if (Array.isArray(body)) return { content: body, totalPages: 1, totalElements: body.length };
  if (Array.isArray(body.content)) {
    return {
      content: body.content,
      totalPages: Number.isFinite(body.totalPages) ? body.totalPages : 1,
      totalElements: Number.isFinite(body.totalElements) ? body.totalElements : body.content.length,
    };
  }
  if (Array.isArray(body.items)) {
    return {
      content: body.items,
      totalPages: Number.isFinite(body.totalPages) ? body.totalPages : 1,
      totalElements: Number.isFinite(body.totalElements) ? body.totalElements : body.items.length,
    };
  }
  return { content: [], totalPages: 0, totalElements: 0 };
}

function toHHMMSS(v) {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  return v;
}

export async function listAttendanceTemplates(params = {}) {
  const { page = 0, size = 20, sort = 'name,asc' } = params;
  const res = await axios.get(`${BASE}/list`, { params: { page, size, sort } });
  return normalizePage(unwrap(res));
}

export async function getAttendanceTemplate(id) {
  const res = await axios.get(`${BASE}/detail/${id}`);
  return unwrap(res);
}

export async function createAttendanceTemplate(payload) {
  const body = {
    name: payload?.name,
    defaultClockIn: toHHMMSS(payload?.defaultClockIn),
    defaultBreakStart: toHHMMSS(payload?.defaultBreakStart),
    defaultBreakEnd: toHHMMSS(payload?.defaultBreakEnd),
    defaultClockOut: toHHMMSS(payload?.defaultClockOut),
  };
  const res = await axios.post(`${BASE}/create`, body);
  return unwrap(res);
}

export async function updateAttendanceTemplate(id, payload) {
  const body = {
    name: payload?.name,
    defaultClockIn: toHHMMSS(payload?.defaultClockIn),
    defaultBreakStart: toHHMMSS(payload?.defaultBreakStart),
    defaultBreakEnd: toHHMMSS(payload?.defaultBreakEnd),
    defaultClockOut: toHHMMSS(payload?.defaultClockOut),
    propagate: payload?.propagate,
    propagateFrom: payload?.propagateFrom,
    propagateTo: payload?.propagateTo,
    strategy: payload?.strategy,
  };
  const res = await axios.patch(`${BASE}/update/${id}`, body);
  return unwrap(res);
}

export async function deleteAttendanceTemplate(id) {
  const res = await axios.delete(`${BASE}/delete/${id}`);
  return unwrap(res);
}

export async function fetchAttendanceTemplates(limit = 1000) {
  const res = await axios.get(`${BASE}/list`, { params: { page: 0, size: limit, sort: 'name,asc' } });
  const body = unwrap(res);
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

export function broadcastAttendanceTemplateChanged() {
  try {
    window.dispatchEvent(new Event('attendanceTemplate:changed'));
    localStorage.setItem('attendanceTemplate:ping', String(Date.now()));
    localStorage.removeItem('attendanceTemplate:ping');
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('attendanceTemplate');
      bc.postMessage({ type: 'changed' });
      bc.close();
    }
  } catch {}
}
