import axios from "../utils/axiosConfig";

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

// 본점 관리자 지점 목록 조회 서비스
export const branchService = {
  // GET /branch?page=0&size=10&sort=createdAt,desc&keyword=검색어&status=상태
  async fetchBranches({ page = 0, size = 10, sort = "createdAt,desc", keyword, status } = {}) {
    const params = { page, size, sort };
    // keyword와 status 파라미터가 있는 경우에만 추가
    if (keyword && keyword.trim()) {
      params.keyword = keyword.trim();
    }
    if (status) {
      params.status = status;
    }
    const url = `${BASE_URL}/branch`;
    const response = await axios.get(url, { params });

    // 기대 응답: BranchListResDto { data, currentPage, totalPages, totalElements, size, first, last }
    return response.data?.result || response.data; // 백엔드 통합 응답 또는 직접 페이로드 대응
  },
};

// 지점 등록 서비스
export const createBranch = async (branchData, profileImage) => {
  const url = `${BASE_URL}/branch/register`;

  // FormData 객체 생성
  const formData = new FormData();

  // 텍스트 데이터 추가
  Object.keys(branchData).forEach((key) => {
    if (
      branchData[key] !== null &&
      branchData[key] !== undefined &&
      branchData[key] !== ""
    ) {
      formData.append(key, branchData[key]);
    }
  });

  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const response = await axios.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// 지점 상세 조회 서비스
export const getBranchDetail = async (branchId) => {
  const url = `${BASE_URL}/branch/${branchId}`;
  const response = await axios.get(url);
  // 백엔드 통합 응답 구조에 맞게 데이터 추출
  return response.data?.result || response.data;
};

// 지점 수정 서비스
export const updateBranch = async (branchId, branchData, profileImage) => {
  const url = `${BASE_URL}/branch/${branchId}`;

  // FormData 객체 생성
  const formData = new FormData();

  // 텍스트 데이터 추가
  Object.keys(branchData).forEach((key) => {
    if (
      branchData[key] !== null &&
      branchData[key] !== undefined &&
      branchData[key] !== ""
    ) {
      formData.append(key, branchData[key]);
    }
  });

  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const response = await axios.patch(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// 지점 삭제 서비스
export const deleteBranch = async (branchId) => {
  const url = `${BASE_URL}/branch/${branchId}`;
  const response = await axios.delete(url);
  return response.data;
};

// 직영점장/가맹점장 자신의 지점 정보 조회 서비스
export const getMyBranch = async () => {
  // 백엔드 Controller 라우팅 순서 문제로 인해 /branch/my를 /branch/my-branch로 변경
  // 백엔드에서 /branch/{branchId}보다 특정 경로(/branch/my, /branch/register 등)를 먼저 매핑해야 함
  const url = `${BASE_URL}/branch/my`;
  const response = await axios.get(url);
  return response.data?.result || response.data;
};

// 직영점장/가맹점장 자신의 지점 정보 수정 요청 서비스
export const requestBranchUpdate = async (branchData, profileImage) => {
  const url = `${BASE_URL}/branch/my-branch`;

  // FormData 객체 생성
  const formData = new FormData();

  // JSON 데이터를 직렬화하여 추가
  const dataBlob = new Blob([JSON.stringify(branchData)], {
    type: "application/json",
  });
  formData.append("data", dataBlob);

  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const response = await axios.put(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// 본사 관리자용 지점 수정 요청 목록 조회
export const getBranchUpdateRequests = async ({ page = 0, size = 10, status } = {}) => {
  const params = { page, size, sort: "createdAt,desc" };
  let url = `${BASE_URL}/branch/update-requests`;
  
  if (status) {
    url = `${BASE_URL}/branch/update-requests/status/${status}`;
  }
  
  const response = await axios.get(url, { params });
  return response.data?.result || response.data;
};

// 본사 관리자용 지점 수정 요청 상세 조회
export const getBranchUpdateRequest = async (requestId) => {
  const url = `${BASE_URL}/branch/update-requests/${requestId}`;
  const response = await axios.get(url);
  return response.data?.result || response.data;
};

// 본사 관리자용 지점 수정 요청 승인
export const approveBranchUpdateRequest = async (requestId) => {
  const url = `${BASE_URL}/branch/update-requests/${requestId}/approve`;
  const response = await axios.post(url);
  return response.data;
};

// 본사 관리자용 지점 수정 요청 거부
export const rejectBranchUpdateRequest = async (requestId) => {
  const url = `${BASE_URL}/branch/update-requests/${requestId}/reject`;
  const response = await axios.post(url);
  return response.data;
};

export default branchService;
