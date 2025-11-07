
import axios from '../utils/axiosConfig';

/** 게이트웨이/브랜치 서비스 Base URL */
const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${api}/branch-service`;
})();

/** CommonSuccessDto 언랩 */
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'result' in data) return data.result;
  return data;
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
  const res = await axios.patch(`${BASE_URL}/work-type/update/${id}`, payload);
  return unwrap(res);
};
export const deleteWorkType = async (id) => {
  const res = await axios.delete(`${BASE_URL}/work-type/delete/${id}`);
  return unwrap(res);
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
  const res = await axios.patch(`${BASE_URL}/leave-type/update/${id}`, payload);
  return unwrap(res);
};
export const deleteLeaveType = async (id) => {
  const res = await axios.delete(`${BASE_URL}/leave-type/delete/${id}`);
  return unwrap(res);
};
