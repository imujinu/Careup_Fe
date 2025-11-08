import axios from '../utils/axiosConfig';

const BASE_URL = (() => {
  const trim = (s) => (s || '').replace(/\/+$/, '');
  const explicit = trim(import.meta.env.VITE_BRANCH_URL);
  if (explicit) return explicit;
  const api =
    trim(import.meta.env.VITE_API_URL) ||
    (typeof window !== 'undefined' ? trim(window.location.origin) : 'http://localhost:8080');
  return `${api}/branch-service`;
})();

function unwrap(res) {
  const ct = (res?.headers?.['content-type'] || '').toLowerCase();
  const d = res?.data;
  if (typeof d === 'string' && !ct.includes('application/json')) return null;
  if (d && typeof d === 'object') {
    if ('result' in d) return d.result;
    if ('data' in d) return d.data;
  }
  return d ?? null;
}
const st = (e) => Number(e?.response?.status || 0);
const isMethodIssue = (code) => [404, 405, 415].includes(Number(code));

async function safeUpdate(url, payload) {
  try {
    return unwrap(await axios.post(url, payload));
  } catch (e1) {
    if (!isMethodIssue(st(e1))) throw e1;
    try {
      return unwrap(await axios.put(url, payload));
    } catch (e2) {
      if (!isMethodIssue(st(e2))) throw e2;
      return unwrap(await axios.patch(url, payload));
    }
  }
}
async function safeDelete(urlDelete, urlPostDelete) {
  try {
    return unwrap(await axios.delete(urlDelete));
  } catch (e1) {
    if (!isMethodIssue(st(e1))) throw e1;
    return unwrap(await axios.post(urlPostDelete));
  }
}

function normalizePage(body) {
  if (!body) return { content: [], totalPages: 0, totalElements: 0, size: 0, number: 0 };
  if (Array.isArray(body)) return { content: body, totalPages: 1, totalElements: body.length, size: body.length, number: 0 };
  const page = body?.page || body;
  const content = page?.content ?? [];
  const totalPages = page?.totalPages ?? 0;
  const totalElements = page?.totalElements ?? content.length ?? 0;
  const size = page?.size ?? content.length ?? 0;
  const number = page?.number ?? 0;
  return { content, totalPages, totalElements, size, number };
}

/* =========================
 * Templates
 * ========================= */
export async function listAttendanceTemplates({ page = 0, size = 20, sort = 'name,asc' } = {}) {
  const res = await axios.get(`${BASE_URL}/attendance-template/list`, { params: { page, size, sort } });
  return normalizePage(unwrap(res));
}
export async function createAttendanceTemplate(payload) {
  return safeUpdate(`${BASE_URL}/attendance-template/create`, payload);
}
export async function updateAttendanceTemplate(id, payload) {
  const pathId = encodeURIComponent(String(id));
  try {
    return await safeUpdate(`${BASE_URL}/attendance-template/update/${pathId}`, payload);
  } catch (e) {
    if (isMethodIssue(st(e))) {
      return safeUpdate(`${BASE_URL}/attendance-template/update`, { id, ...payload });
    }
    throw e;
  }
}
export async function deleteAttendanceTemplate(id) {
  const pathId = encodeURIComponent(String(id));
  return safeDelete(
    `${BASE_URL}/attendance-template/delete/${pathId}`,
    `${BASE_URL}/attendance-template/delete/${pathId}`
  );
}
export async function moveTemplateOrder(id, direction, step = 1) {
  const pathId = encodeURIComponent(String(id));
  const body = { direction, step };
  try {
    return await safeUpdate(`${BASE_URL}/attendance-template/${pathId}/move-order`, body);
  } catch (e) {
    if (isMethodIssue(st(e))) {
      return safeUpdate(`${BASE_URL}/attendance-template/move-order`, { id, ...body });
    }
    throw e;
  }
}

/* =========================
 * Broadcast utils
 * ========================= */
export const TEMPLATE_CHANGED_EVENT = 'attendance-template:changed';

export function broadcastAttendanceTemplateChanged(detail) {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(TEMPLATE_CHANGED_EVENT, { detail: detail ?? null }));
  }
}

export function addAttendanceTemplateChangedListener(handler) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
  const h = (e) => handler?.(e?.detail);
  window.addEventListener(TEMPLATE_CHANGED_EVENT, h);
  return () => window.removeEventListener(TEMPLATE_CHANGED_EVENT, h);
}

export function removeAttendanceTemplateChangedListener(handler) {
  if (typeof window === 'undefined' || typeof window.removeEventListener !== 'function') return;
  window.removeEventListener(TEMPLATE_CHANGED_EVENT, handler);
}

/* =========================
 * Compatibility aliases
 * ========================= */
export async function fetchAttendanceTemplates(opts) {
  return listAttendanceTemplates(opts);
}
export const listTemplates = listAttendanceTemplates;
export const createTemplate = createAttendanceTemplate;
export const updateTemplate = updateAttendanceTemplate;
export const deleteTemplate = deleteAttendanceTemplate;

export default {
  listAttendanceTemplates,
  createAttendanceTemplate,
  updateAttendanceTemplate,
  deleteAttendanceTemplate,
  moveTemplateOrder,
  TEMPLATE_CHANGED_EVENT,
  broadcastAttendanceTemplateChanged,
  addAttendanceTemplateChangedListener,
  removeAttendanceTemplateChangedListener,
  fetchAttendanceTemplates,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
