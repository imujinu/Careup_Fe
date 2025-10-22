import axios from '../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BRANCH_URL || import.meta.env.VITE_API_URL || 'http://localhost:8081';

// 본점 관리자 지점 목록 조회 서비스
export const branchService = {
  // GET /branch?page=0&size=10&sort=createdAt,desc
  async fetchBranches({ page = 0, size = 10, sort = 'createdAt,desc' } = {}) {
    const params = { page, size, sort };
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
  Object.keys(branchData).forEach(key => {
    if (branchData[key] !== null && branchData[key] !== undefined && branchData[key] !== '') {
      formData.append(key, branchData[key]);
    }
  });
  
  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append('profileImage', profileImage);
  }
  
  const response = await axios.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export default branchService;


