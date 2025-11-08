// src/service/attendanceTypeService.js
import axios from '../utils/axiosConfig';

/** 브랜치 서비스 루트 계산 (기존 유지) */
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

/** 상태코드/네트워크 헬퍼 */
const codeOf = (e) => Number(e?.response?.status || 0);
const shouldTryNext = (e) => {
  const c = codeOf(e);
  // 🔧 404/405/415 뿐 아니라, 5xx(서버 매핑/바인딩 오류)도 다음 후보 시도
  return [0, 404, 405, 415, 500, 501, 502, 503].includes(c); // 🆕
};

/** 🆕 단일 시도 */
async function httpTry(method, url, data) {
  const cfg = { method, url, data };
  // JSON 보장
  if (method !== 'get') cfg.headers = { 'Content-Type': 'application/json;charset=UTF-8' };
  return axios(cfg);
}

/** 🆕 여러 조합을 순차 시도하고, 성공하면 언랩 반환 */
async function callAny(variants = []) {
  let lastErr;
  for (const v of variants) {
    try {
      const res = await httpTry(v.method, v.url, v.data);
      return unwrap(res);
    } catch (e) {
      lastErr = e;
      if (!shouldTryNext(e)) throw e; // 🔧 치명적(400/401/403 등)이면 즉시 중단
      // 다음 후보 계속 시도
    }
  }
  throw lastErr;
}

/* =========================
 * Work Type (근무 종류)
 * ========================= */

export async function listWorkTypes({ page = 0, size = 20, sort = 'name,asc', keyword } = {}) {
  // 🔧 다양한 리스트 엔드포인트 폴백
  const params = { page, size, sort, keyword };
  return callAny([
    { method: 'get', url: `${BASE_URL}/work-type/list`, data: { params } },         // 표준
    { method: 'get', url: `${BASE_URL}/work-type`, data: { params } },              // REST 스타일
    { method: 'get', url: `${BASE_URL}/work-type/all`, data: { params } },          // 변형
  ].map((v) => (v.method === 'get' ? { ...v, data: undefined, params } : v))); // axios get은 params 사용
}

export async function createWorkType(payload) {
  // 🔧 메서드/경로 전천후 시도
  return callAny([
    { method: 'post', url: `${BASE_URL}/work-type/create`, data: payload }, // 기존
    { method: 'post', url: `${BASE_URL}/work-type`, data: payload },        // REST
    { method: 'put',  url: `${BASE_URL}/work-type`, data: payload },        // 변형
  ]);
}

export async function updateWorkType(id, payload) {
  const pid = encodeURIComponent(String(id));
  const body = { id, ...payload };
  // 🔧 PUT → PATCH → POST, 경로 {id} /update/{id} /update 바디 아이디 포함까지 전부 시도
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
  // 🔧 DELETE 우선, 이후 변형들 시도
  return callAny([
    { method: 'delete', url: `${BASE_URL}/work-type/${pid}` },
    { method: 'delete', url: `${BASE_URL}/work-type/delete/${pid}` },
    { method: 'post',   url: `${BASE_URL}/work-type/delete/${pid}` },
    { method: 'post',   url: `${BASE_URL}/work-type/delete`, data: { id } },
  ]);
}

/* =========================
 * Leave Type (휴가 종류)
 * ========================= */

export async function listLeaveTypes({ page = 0, size = 20, sort = 'name,asc', keyword } = {}) {
  const params = { page, size, sort, keyword };
  return callAny([
    { method: 'get', url: `${BASE_URL}/leave-type/list`, data: { params } },
    { method: 'get', url: `${BASE_URL}/leave-type`, data: { params } },
    { method: 'get', url: `${BASE_URL}/leave-type/all`, data: { params } },
  ].map((v) => (v.method === 'get' ? { ...v, data: undefined, params } : v)));
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
