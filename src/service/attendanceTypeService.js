// src/service/attendanceTypeService.js
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

const unwrap = (res) => {
  const d = res?.data;
  if (d && typeof d === 'object') {
    if ('result' in d) return d.result;
    if ('data' in d) return d.data;
  }
  return d ?? null;
};

const codeOf = (e) => Number(e?.response?.status || 0);
const shouldTryNext = (e) => {
  const c = codeOf(e);
  return [0, 404, 405, 415, 500, 501, 502, 503].includes(c);
};

async function httpTry(cfg) {
  const c = { ...cfg };
  const method = (c.method || 'get').toLowerCase();
  if (method !== 'get') {
    c.headers = { 'Content-Type': 'application/json;charset=UTF-8', ...(c.headers || {}) };
  }
  return axios(c);
}

async function callAny(variants = []) {
  let lastErr;
  for (const v of variants) {
    try {
      const res = await httpTry(v);
      return unwrap(res);
    } catch (e) {
      lastErr = e;
      if (!shouldTryNext(e)) throw e;
    }
  }
  throw lastErr;
}

export async function listWorkTypes({ page = 0, size = 20, sort = 'name,asc', keyword } = {}) {
  const params = { page, size, sort, keyword };
  return callAny(
    [
      { method: 'get', url: `${BASE_URL}/work-type/list` },
      { method: 'get', url: `${BASE_URL}/work-type` },
      { method: 'get', url: `${BASE_URL}/work-type/all` },
    ].map((v) => ({ ...v, params }))
  );
}

export async function createWorkType(payload) {
  return callAny([
    { method: 'post', url: `${BASE_URL}/work-type/create`, data: payload },
    { method: 'post', url: `${BASE_URL}/work-type`, data: payload },
    { method: 'put',  url: `${BASE_URL}/work-type`, data: payload },
  ]);
}

export async function updateWorkType(id, payload) {
  const pid = encodeURIComponent(String(id));
  const body = { id, ...payload };
  return callAny([
    { method: 'put',   url: `${BASE_URL}/work-type/${pid}`, data: payload },
    { method: 'patch', url: `${BASE_URL}/work-type/${pid}`, data: payload },
    { method: 'put',   url: `${BASE_URL}/work-type/update/${pid}`, data: payload },
    { method: 'patch', url: `${BASE_URL}/work-type/update/${pid}`, data: payload },
    { method: 'post',  url: `${BASE_URL}/work-type/update/${pid}`, data: payload },
    { method: 'put',   url: `${BASE_URL}/work-type/update`, data: body },
    { method: 'patch', url: `${BASE_URL}/work-type/update`, data: body },
    { method: 'post',  url: `${BASE_URL}/work-type/update`, data: body },
  ]);
}

export async function deleteWorkType(id) {
  const pid = encodeURIComponent(String(id));
  return callAny([
    { method: 'delete', url: `${BASE_URL}/work-type/${pid}` },
    { method: 'delete', url: `${BASE_URL}/work-type/delete/${pid}` },
    { method: 'post',   url: `${BASE_URL}/work-type/delete/${pid}` },
    { method: 'post',   url: `${BASE_URL}/work-type/delete`, data: { id } },
  ]);
}

export async function listLeaveTypes({ page = 0, size = 20, sort = 'name,asc', keyword } = {}) {
  const params = { page, size, sort, keyword };
  return callAny(
    [
      { method: 'get', url: `${BASE_URL}/leave-type/list` },
      { method: 'get', url: `${BASE_URL}/leave-type` },
      { method: 'get', url: `${BASE_URL}/leave-type/all` },
    ].map((v) => ({ ...v, params }))
  );
}

export async function createLeaveType(payload) {
  return callAny([
    { method: 'post', url: `${BASE_URL}/leave-type/create`, data: payload },
    { method: 'post', url: `${BASE_URL}/leave-type`, data: payload },
    { method: 'put',  url: `${BASE_URL}/leave-type`, data: payload },
  ]);
}

export async function updateLeaveType(id, payload) {
  const pid = encodeURIComponent(String(id));
  const body = { id, ...payload };
  return callAny([
    { method: 'put',   url: `${BASE_URL}/leave-type/${pid}`, data: payload },
    { method: 'patch', url: `${BASE_URL}/leave-type/${pid}`, data: payload },
    { method: 'put',   url: `${BASE_URL}/leave-type/update/${pid}`, data: payload },
    { method: 'patch', url: `${BASE_URL}/leave-type/update/${pid}`, data: payload },
    { method: 'post',  url: `${BASE_URL}/leave-type/update/${pid}`, data: payload },
    { method: 'put',   url: `${BASE_URL}/leave-type/update`, data: body },
    { method: 'patch', url: `${BASE_URL}/leave-type/update`, data: body },
    { method: 'post',  url: `${BASE_URL}/leave-type/update`, data: body },
  ]);
}

export async function deleteLeaveType(id) {
  const pid = encodeURIComponent(String(id));
  return callAny([
    { method: 'delete', url: `${BASE_URL}/leave-type/${pid}` },
    { method: 'delete', url: `${BASE_URL}/leave-type/delete/${pid}` },
    { method: 'post',   url: `${BASE_URL}/leave-type/delete/${pid}` },
    { method: 'post',   url: `${BASE_URL}/leave-type/delete`, data: { id } },
  ]);
}

/* ↓↓↓ 추가: 워크타입 단건 조회 (geofenceRequired 확보용) ↓↓↓ */
export async function getWorkType(id) {
  const pid = encodeURIComponent(String(id));
  return callAny([
    { method: 'get', url: `${BASE_URL}/work-type/${pid}` },
    { method: 'get', url: `${BASE_URL}/work-type/detail/${pid}` },
    { method: 'get', url: `${BASE_URL}/work-type`, params: { id } },
    { method: 'post', url: `${BASE_URL}/work-type/detail`, data: { id } },
  ]);
}

export default {
  listWorkTypes,
  createWorkType,
  updateWorkType,
  deleteWorkType,
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getWorkType,
};
