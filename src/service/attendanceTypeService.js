import axios from '../utils/axiosConfig';

/** 브랜치 서비스 루트 계산 */
const BASE_URL = (() => {
  const trim = (s) => (s || '').replace(/\/+$/, '');
  const explicit = trim(import.meta.env.VITE_BRANCH_URL);
  if (explicit) return explicit; // e.g. https://server.careup.store/branch-service
  const api =
    trim(import.meta.env.VITE_API_URL) ||
    (typeof window !== 'undefined' ? trim(window.location.origin) : 'http://localhost:8080');
  return `${api}/branch-service`;
})();

/** 공통 언랩 */
const unwrap = (res) => {
  const d = res?.data;
  if (d && typeof d === 'object') {
    if ('result' in d) return d.result;
    if ('data' in d) return d.data;
  }
  return d ?? null;
};

/** 에러 상태코드 헬퍼 */
const st = (e) => Number(e?.response?.status || 0);
const isMethodIssue = (code) => [404, 405, 415].includes(Number(code)); // 엔드포인트/메서드 불일치

/** 안전 업데이트 호출: POST → PUT → PATCH */
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

/** 안전 삭제 호출: DELETE → POST /delete/{id} 폴백 */
async function safeDelete(urlDelete, urlPostDelete) {
  try {
    return unwrap(await axios.delete(urlDelete));
  } catch (e1) {
    if (!isMethodIssue(st(e1))) throw e1;
    return unwrap(await axios.post(urlPostDelete));
  }
}

/* =========================
 * Work Type (근무 종류)
 * ========================= */
export async function listWorkTypes({ page = 0, size = 20, sort = 'name,asc' } = {}) {
  const res = await axios.get(`${BASE_URL}/work-type/list`, { params: { page, size, sort } });
  return unwrap(res);
}
export async function createWorkType(payload) {
  return safeUpdate(`${BASE_URL}/work-type/create`, payload);
}
export async function updateWorkType(id, payload) {
  const pathId = encodeURIComponent(String(id));
  try {
    return await safeUpdate(`${BASE_URL}/work-type/update/${pathId}`, payload);
  } catch (e) {
    if (isMethodIssue(st(e))) {
      return safeUpdate(`${BASE_URL}/work-type/update`, { id, ...payload });
    }
    throw e;
  }
}
export async function deleteWorkType(id) {
  const pathId = encodeURIComponent(String(id));
  return safeDelete(
    `${BASE_URL}/work-type/delete/${pathId}`,
    `${BASE_URL}/work-type/delete/${pathId}`
  );
}

/* =========================
 * Leave Type (휴가 종류)
 * ========================= */
export async function listLeaveTypes({ page = 0, size = 20, sort = 'name,asc' } = {}) {
  const res = await axios.get(`${BASE_URL}/leave-type/list`, { params: { page, size, sort } });
  return unwrap(res);
}
export async function createLeaveType(payload) {
  return safeUpdate(`${BASE_URL}/leave-type/create`, payload);
}
export async function updateLeaveType(id, payload) {
  const pathId = encodeURIComponent(String(id));
  try {
    return await safeUpdate(`${BASE_URL}/leave-type/update/${pathId}`, payload);
  } catch (e) {
    if (isMethodIssue(st(e))) {
      return safeUpdate(`${BASE_URL}/leave-type/update`, { id, ...payload });
    }
    throw e;
  }
}
export async function deleteLeaveType(id) {
  const pathId = encodeURIComponent(String(id));
  return safeDelete(
    `${BASE_URL}/leave-type/delete/${pathId}`,
    `${BASE_URL}/leave-type/delete/${pathId}`
  );
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
};
