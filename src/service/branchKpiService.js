import axios from "../utils/axiosConfig";

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";

// 지점별 KPI 서비스
export const branchKpiService = {
  // POST /branch-kpi - KPI 생성
  async createBranchKpi(data) {
    const url = `${BASE_URL}/branch-kpi`;
    const response = await axios.post(url, data);
    return response.data?.result || response.data;
  },

  // GET /branch-kpi?page=0&size=10 - KPI 목록 조회
  async getBranchKpiList({ page = 0, size = 10, sort = "id,DESC" } = {}) {
    const params = { page, size, sort };
    const url = `${BASE_URL}/branch-kpi`;
    const response = await axios.get(url, { params });
    return response.data?.result || response.data;
  },

  // GET /branch-kpi/{id} - KPI 단건 조회
  async getBranchKpi(id) {
    const url = `${BASE_URL}/branch-kpi/${id}`;
    const response = await axios.get(url);
    return response.data?.result || response.data;
  },

  // PATCH /branch-kpi/{id} - KPI 수정
  async updateBranchKpi(id, data) {
    const url = `${BASE_URL}/branch-kpi/${id}`;
    const response = await axios.patch(url, data);
    return response.data?.result || response.data;
  },

  // DELETE /branch-kpi/{id} - KPI 삭제
  async deleteBranchKpi(id) {
    const url = `${BASE_URL}/branch-kpi/${id}`;
    const response = await axios.delete(url);
    return response.data?.result || response.data;
  },
};

export default branchKpiService;
