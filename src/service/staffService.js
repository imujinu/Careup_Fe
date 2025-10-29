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

/**
 * 지점 옵션 조회
 * - 백엔드 실제 제공 경로: /branch/public/list (공개), /branch (페이징, HQ 권한)
 * - 게이트웨이 프리픽스 경로도 함께 시도: /branch-service/branch/**
 * - 응답 래핑(CommonSuccessDto)와 페이징 구조(content|data) 모두 대응
 */
export const fetchBranchOptions = async () => {
  const candidates = [
    { url: `${BASE_URL}/branch/public/list`, mode: 'list' },
    { url: `${BASE_URL}/branch`, mode: 'paged', params: { page: 0, size: 1000, sort: 'name,asc' } },
    { url: `${BASE_URL}/branch-service/branch/public/list`, mode: 'list' },
    { url: `${BASE_URL}/branch-service/branch`, mode: 'paged', params: { page: 0, size: 1000, sort: 'name,asc' } },
  ];

  for (const ep of candidates) {
    try {
      const res = await axios.get(ep.url, ep.params ? { params: ep.params } : undefined);
      const data = res?.data?.result ?? res?.data;

      let raw = [];
      if (ep.mode === 'paged') {
        raw = data?.content ?? data?.data ?? [];
      } else if (Array.isArray(data)) {
        raw = data;
      } else {
        raw = data?.items ?? data?.content ?? data?.data ?? [];
      }

      const mapped = (raw || [])
        .map((b) => ({
          id: b.id ?? b.branchId,
          name: b.name ?? b.branchName,
        }))
        .filter((x) => x.id && x.name);

      if (mapped.length) return mapped;
    } catch (e) {
      // 다음 후보 경로로 계속 시도
    }
  }
  return [];
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
  fetchBranchOptions,
};
