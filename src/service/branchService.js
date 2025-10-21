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

export default branchService;


