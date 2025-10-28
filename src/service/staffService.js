// src/service/staffService.js
import axios from '../utils/axiosConfig';

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

const JOB_GRADE_PATH = import.meta.env.VITE_JOB_GRADE_PATH || '/job-grades';

const omitEmpty = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => !(v === '' || v === undefined || v === null)
    )
  );

const buildQuery = (params = {}) => {
  const {
    page = 0,
    size = 20,
    sort = 'id,asc',        // 기본 정렬은 ID 오름차순
    search = '',
    targets,
    ...rest
  } = params;
  const qp = omitEmpty({
    page,
    size,
    sort,
    search,
    keyword: search,
    targets,
    searchTargets: targets, // 백엔드 파라미터 명칭과 맞춤(겸용)
    ...rest,
  });
  return qp;
};

export const fetchStaffList = async (params = {}) => {
  const url = `${BASE_URL}/employees/list`;
  const { data } = await axios.get(url, { params: buildQuery(params) });
  return data?.result || data;
};

export const fetchStaffListByBranch = async (branchId, params = {}) => {
  const url = `${BASE_URL}/employees/list/branch/${branchId}`;
  const { data } = await axios.get(url, { params: buildQuery(params) });
  return data?.result || data;
};

export const getStaffDetail = async (staffId) => {
  const url = `${BASE_URL}/employees/detail/${staffId}`;
  const { data } = await axios.get(url);
  return data?.result || data;
};

export const createStaff = async (payload, profileImage) => {
  const url = `${BASE_URL}/employee/create`;
  const clean = { ...payload };
  delete clean.dispatches; // 파일 필드 분리(백엔드에서 meta/dispatches 따로 받는 구조)
  const formData = new FormData();
  formData.append('meta', new Blob([JSON.stringify(clean)], { type: 'application/json' }));
  if (profileImage) formData.append('image', profileImage);
  const { data } = await axios.post(url, formData);
  return data?.result || data;
};

export const updateStaff = async (staffId, payload, profileImage) => {
  const url = `${BASE_URL}/employee/update/${staffId}`;
  const clean = { ...payload };
  delete clean.dispatches;
  const formData = new FormData();
  formData.append('meta', new Blob([JSON.stringify(clean)], { type: 'application/json' }));
  if (profileImage) formData.append('image', profileImage);
  const { data } = await axios.patch(url, formData);
  return data?.result || data;
};

export const deactivateStaff = async (staffId) => {
  const url = `${BASE_URL}/employee/delete/${staffId}`;
  const { data } = await axios.delete(url);
  return data?.result || data;
};

export const rehireStaff = async (staffId) => {
  const url = `${BASE_URL}/employee/rehire/${staffId}`;
  const { data } = await axios.patch(url);
  return data?.result || data;
};

export const fetchJobGrades = async () => {
  const url = `${BASE_URL}${JOB_GRADE_PATH}`;
  const { data } = await axios.get(url);
  return data?.result || data;
};

const staffService = {
  fetchStaffList,
  fetchStaffListByBranch,
  getStaffDetail,
  createStaff,
  updateStaff,
  deactivateStaff,
  rehireStaff,
  fetchJobGrades,
};
export default staffService;
