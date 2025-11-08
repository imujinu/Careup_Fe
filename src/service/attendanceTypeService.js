// src/service/attendanceTypeService.js
import axios from '../utils/axiosConfig';

/* ===== 안정형 BASE_URL (중복/누락 자동 방지) ===== */
const BASE_URL = (() => {
  const trim = (s) => (s || '').replace(/\/+$/, '');
  const withBranch = (u) => (u.endsWith('/branch-service') ? u : `${u}/branch-service`);

  const explicit = trim(import.meta.env.VITE_BRANCH_URL);
  if (explicit) return withBranch(explicit);

  const api = trim(import.meta.env.VITE_API_URL || 'http://localhost:8080');
  return withBranch(api);
})();

/** CommonSuccessDto 언랩 */
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'result' in data) return data.result;
  return data;
};

/* ===== 폴백 유틸 (405/404 시 대안 시도) ===== */
const tryPatchThenPut = async (url, payload) => {
  try {
    const res = await axios.patch(url, payload);
    return unwrap(res);
  } catch (e) {
    const st = e?.response?.status;
    if (st === 405) {
      const res = await axios.put(url, payload);
      return unwrap(res);
    }
    throw e;
  }
};
const tryDeleteFallback = async (primaryUrl, fallbackUrl) => {
  try {
    const res = await axios.delete(primaryUrl);
    return unwrap(res);
  } catch (e) {
    const st = e?.response?.status;
    if (st === 404 || st === 405) {
      const res = await axios.delete(fallbackUrl);
      return unwrap(res);
    }
    throw e;
  }
};

/** ===== WorkType ===== */
export const listWorkTypes = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/work-type/list`, { params });
  return unwrap(res);
};
export const createWorkType = async (payload) => {
  const res = await axios.post(`${BASE_URL}/work-type/create`, payload);
  return unwrap(res);
};
export const updateWorkType = async (id, payload) => {
  try {
    // 선호 경로
    return await tryPatchThenPut(`${BASE_URL}/work-type/update/${id}`, payload);
  } catch (e) {
    if (e?.response?.status === 404) {
      // REST 기본형 폴백
      return await tryPatchThenPut(`${BASE_URL}/work-type/${id}`, payload);
    }
    throw e;
  }
};
export const deleteWorkType = async (id) => {
  return await tryDeleteFallback(
    `${BASE_URL}/work-type/delete/${id}`,
    `${BASE_URL}/work-type/${id}`
  );
};

/** ===== LeaveType ===== */
export const listLeaveTypes = async (params = {}) => {
  const res = await axios.get(`${BASE_URL}/leave-type/list`, { params });
  return unwrap(res);
};
export const createLeaveType = async (payload) => {
  const res = await axios.post(`${BASE_URL}/leave-type/create`, payload);
  return unwrap(res);
};
export const updateLeaveType = async (id, payload) => {
  try {
    return await tryPatchThenPut(`${BASE_URL}/leave-type/update/${id}`, payload);
  } catch (e) {
    if (e?.response?.status === 404) {
      return await tryPatchThenPut(`${BASE_URL}/leave-type/${id}`, payload);
    }
    throw e;
  }
};
export const deleteLeaveType = async (id) => {
  return await tryDeleteFallback(
    `${BASE_URL}/leave-type/delete/${id}`,
    `${BASE_URL}/leave-type/${id}`
  );
};
