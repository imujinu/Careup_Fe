import axios from "../utils/axiosConfig";

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL;

// KPI 서비스 (새로운 API 구조)
export const branchKpiService = {
  // POST /kpi/create - KPI 생성
  async createBranchKpi(data) {
    const url = `${BASE_URL}/kpi/create`;
    const response = await axios.post(url, data);
    return response.data?.result || response.data;
  },

  // GET /kpi?page=0&size=10 - KPI 목록 조회 (페이지네이션)
  async getBranchKpiList({ page = 0, size = 10 } = {}) {
    const params = { page, size };
    const url = `${BASE_URL}/kpi`;
    const response = await axios.get(url, { params });
    return response.data?.result || response.data;
  },

  // GET /kpi/{id} - KPI 단건 조회
  async getBranchKpi(id) {
    const url = `${BASE_URL}/kpi/${id}`;
    const response = await axios.get(url);
    return response.data?.result || response.data;
  },

  // PATCH /kpi/update/{id} - KPI 수정
  async updateBranchKpi(id, data) {
    const url = `${BASE_URL}/kpi/update/${id}`;
    const response = await axios.patch(url, data);
    return response.data?.result || response.data;
  },

  // DELETE /kpi/{kpiId} - KPI 삭제
  async deleteBranchKpi(kpiId) {
    const url = `${BASE_URL}/kpi/${kpiId}`;
    const response = await axios.delete(url);
    return response.data?.result || response.data;
  },

  // KPI 공식 유틸리티 API들
  // GET /kpi/formula/variables - 사용 가능한 변수 목록 조회
  async getFormulaVariables() {
    const url = `${BASE_URL}/kpi/formula/variables`;
    const response = await axios.get(url);
    return response.data?.result || response.data;
  },

  // GET /kpi/formula/examples - 공식 예제 조회
  async getFormulaExamples() {
    const url = `${BASE_URL}/kpi/formula/examples`;
    const response = await axios.get(url);
    return response.data?.result || response.data;
  },

  // POST /kpi/formula/validate - 공식 유효성 검증
  async validateFormula(formula) {
    const url = `${BASE_URL}/kpi/formula/validate`;
    const response = await axios.post(url, { formula });
    return response.data?.result || response.data;
  },

  // POST /kpi/formula/test - 공식 테스트 계산
  async testFormula(formula, variables) {
    const url = `${BASE_URL}/kpi/formula/test`;
    const response = await axios.post(url, { formula, variables });
    return response.data?.result || response.data;
  },
};

export default branchKpiService;
