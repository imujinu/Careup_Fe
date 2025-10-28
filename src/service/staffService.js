// src/service/staffService.js
import axios from '../utils/axiosConfig';

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

export const fetchStaffList = async (params = {}) => {
  const url = `${BASE_URL}/employees/list`;
  const res = await axios.get(url, { params });
  return res?.data?.result ?? res?.data;
};

export const fetchStaffListByBranch = async (branchId, params = {}) => {
  const url = `${BASE_URL}/employees/list/branch/${branchId}`;
  const res = await axios.get(url, { params });
  return res?.data?.result ?? res?.data;
};

export const getStaffDetail = async (staffId) => {
  const url = `${BASE_URL}/employees/detail/${staffId}`;
  const res = await axios.get(url);
  return res?.data?.result ?? res?.data;
};

export const createStaff = async (payload, profileImage) => {
  const url = `${BASE_URL}/employee/create`;
  const formData = new FormData();
  formData.append('meta', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (profileImage) formData.append('image', profileImage);
  const res = await axios.post(url, formData);
  return res?.data?.result ?? res?.data;
};

export const updateStaff = async (staffId, payload, profileImage) => {
  const url = `${BASE_URL}/employee/update/${staffId}`;
  const formData = new FormData();
  formData.append('meta', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  if (profileImage) formData.append('image', profileImage);
  const res = await axios.patch(url, formData);
  return res?.data?.result ?? res?.data;
};

export const deactivateStaff = async (staffId) => {
  const url = `${BASE_URL}/employee/delete/${staffId}`;
  const res = await axios.delete(url);
  return res?.data?.result ?? res?.data;
};

export const rehireStaff = async (staffId) => {
  const url = `${BASE_URL}/employee/rehire/${staffId}`;
  const res = await axios.patch(url);
  return res?.data?.result ?? res?.data;
};

export const fetchJobGrades = async () => {
  const url = `${BASE_URL}/job-grades/options`;
  const res = await axios.get(url);
  return res?.data?.result ?? res?.data ?? [];
};

export default {
  fetchStaffList,
  fetchStaffListByBranch,
  getStaffDetail,
  createStaff,
  updateStaff,
  deactivateStaff,
  rehireStaff,
  fetchJobGrades,
};
