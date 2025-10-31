import axios from "../utils/axiosConfig";

// Use absolute base URL to avoid dev-server HTML fallback
const API_BASE =
  import.meta.env.VITE_BRANCH_URL;
const BASE_PATH = `${API_BASE}/api/dashboard`;

// Simple helpers for formatting in the UI layer where needed
export const formatCurrencyKRW = (amount) =>
  new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(
    amount || 0
  );

export const branchDashboardService = {
  // GET /branch/{branchId}?period=MONTHLY
  async getDashboard(branchId, period = "MONTHLY") {
    try {
      const response = await axios.get(`${BASE_PATH}/branch/${branchId}`, {
        params: { period },
      });
      console.log("[대시보드 API] 응답:", response);
      console.log("[대시보드 API] 응답 데이터:", response.data);
      
      // 응답 정규화: 항상 { status_code, status_message, result } 반환
      const body = response.data;
      const normalizedResult =
        body?.result ?? body?.data ?? (typeof body === 'object' ? body : null);
      const normalizedStatus =
        body?.status_code ?? (normalizedResult ? 200 : undefined);
      const normalized = {
        status_code: normalizedStatus,
        status_message: body?.status_message ?? body?.message ?? '',
        result: normalizedResult,
      };
      return normalized;
    } catch (error) {
      console.error("[대시보드 API] 에러 발생:", error);
      console.error("[대시보드 API] 에러 응답:", error.response);
      console.error("[대시보드 API] 에러 데이터:", error.response?.data);
      
      // 에러 응답에서 메시지 추출
      const errorMessage = 
        error.response?.data?.status_message ||
        error.response?.data?.message ||
        error.message ||
        "대시보드 조회 중 오류가 발생했습니다.";
      
      // 에러 객체를 확장하여 메시지를 포함
      const enhancedError = new Error(errorMessage);
      enhancedError.response = error.response;
      enhancedError.status = error.response?.status;
      enhancedError.data = error.response?.data;
      throw enhancedError;
    }
  },

  async getSalesSummary(branchId) {
    try {
      const response = await axios.get(
        `${BASE_PATH}/branch/${branchId}/sales-summary`
      );
      return response.data?.result || response.data;
    } catch (error) {
      console.error("[대시보드 API] 매출 현황 조회 실패:", error);
      throw error;
    }
  },

  async getInventorySummary(branchId) {
    try {
      const response = await axios.get(
        `${BASE_PATH}/branch/${branchId}/inventory-summary`
      );
      return response.data?.result || response.data;
    } catch (error) {
      console.error("[대시보드 API] 재고 현황 조회 실패:", error);
      throw error;
    }
  },

  async getEmployeeSummary(branchId) {
    try {
      const response = await axios.get(
        `${BASE_PATH}/branch/${branchId}/employee-summary`
      );
      return response.data?.result || response.data;
    } catch (error) {
      console.error("[대시보드 API] 직원 현황 조회 실패:", error);
      throw error;
    }
  },

  async getAttendanceSummary(branchId) {
    try {
      const response = await axios.get(
        `${BASE_PATH}/branch/${branchId}/attendance-summary`
      );
      return response.data?.result || response.data;
    } catch (error) {
      console.error("[대시보드 API] 출근 현황 조회 실패:", error);
      throw error;
    }
  },
};

export default branchDashboardService;


