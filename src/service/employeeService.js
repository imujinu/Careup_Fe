import axios from '../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BRANCH_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';

// 직원(점주) 목록 조회
export const fetchEmployeeList = async (params = {}) => {
  const { page = 0, size = 20, sort = 'id' } = params;
  const url = `${BASE_URL}/employees/list`;
  const response = await axios.get(url, { 
    params: { page, size, sort } 
  });
  return response.data?.result || response.data;
};

// 지점별 직원(점주) 목록 조회
export const fetchEmployeeListByBranch = async (branchId, params = {}) => {
  const { page = 0, size = 20, sort = 'employmentStatus,asc' } = params;
  const url = `${BASE_URL}/employees/list/branch/${branchId}`;
  const response = await axios.get(url, { 
    params: { page, size, sort } 
  });
  return response.data?.result || response.data;
};

// 직원(점주) 상세 조회
export const getEmployeeDetail = async (employeeId) => {
  const url = `${BASE_URL}/employees/detail/${employeeId}`;
  const response = await axios.get(url);
  return response.data?.result || response.data;
};

// 직원(점주) 등록
export const createEmployee = async (employeeData, profileImage) => {
  const url = `${BASE_URL}/employee/create`;
  
  const formData = new FormData();
  
  // 메타 데이터를 JSON 문자열로 변환하여 추가
  formData.append('meta', JSON.stringify(employeeData));
  
  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append('image', profileImage);
  }
  
  const response = await axios.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data?.result || response.data;
};

// 직원(점주) 수정
export const updateEmployee = async (employeeId, employeeData, profileImage) => {
  const url = `${BASE_URL}/employee/update/${employeeId}`;
  
  const formData = new FormData();
  
  // 메타 데이터를 JSON 문자열로 변환하여 추가
  formData.append('meta', JSON.stringify(employeeData));
  
  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append('image', profileImage);
  }
  
  const response = await axios.patch(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data?.result || response.data;
};

// 직원(점주) 비활성화(퇴사) 처리
export const deactivateEmployee = async (employeeId) => {
  const url = `${BASE_URL}/employee/delete/${employeeId}`;
  const response = await axios.delete(url);
  return response.data;
};

// 직원(점주) 재입사 처리
export const rehireEmployee = async (employeeId) => {
  const url = `${BASE_URL}/employee/rehire/${employeeId}`;
  const response = await axios.patch(url);
  return response.data?.result || response.data;
};

export default {
  fetchEmployeeList,
  fetchEmployeeListByBranch,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  rehireEmployee,
};
