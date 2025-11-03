import axios from "../utils/axiosConfig";
import { branchService } from "./branchService";

const BRANCH_API_BASE_URL = import.meta.env.VITE_BRANCH_URL || "http://localhost:8080";
const ORDERING_API_BASE_URL = import.meta.env.VITE_ORDERING_URL || "http://localhost:8081";

export const dashboardService = {
  // 전체 지점 수 조회
  getTotalBranchesCount: async () => {
    // 여러 후보 경로 시도
    const candidates = [
      // 직접 호출 (게이트웨이 없이)
      { url: `${BRANCH_API_BASE_URL}/branch`, params: { page: 0, size: 1 } },
      // 게이트웨이를 통한 호출
      { url: `${BRANCH_API_BASE_URL}/branch-service/branch`, params: { page: 0, size: 1 } },
      // 공개 API 사용 (개수만 확인)
      { url: `${BRANCH_API_BASE_URL}/branch/public/list` },
    ];

    for (const candidate of candidates) {
      try {
        const response = await axios.get(candidate.url, candidate.params ? { params: candidate.params } : undefined);
        const data = response.data?.result || response.data;
        
        // 페이징 응답에서 totalElements 추출
        if (data?.totalElements !== undefined) {
          console.log("Branch API Response:", data);
          console.log("Total Branches:", data.totalElements);
          return data.totalElements;
        }
        
        // 리스트 응답인 경우 배열 길이 사용
        if (Array.isArray(data)) {
          console.log("Branch List Response (count from array):", data.length);
          return data.length;
        }
      } catch (error) {
        // 다음 후보 경로로 계속 시도
        console.log(`Failed to get branches from ${candidate.url}, trying next...`);
      }
    }
    
    // 모든 경로 실패 시 fallback
    console.error("All branch API endpoints failed");
    return 324;
  },

  // 전체 직원 수 조회
  getTotalEmployeesCount: async () => {
    try {
      const response = await axios.get(`${BRANCH_API_BASE_URL}/employees/list?page=0&size=1`);
      console.log("Employee API Response:", response.data);
      console.log("Total Employees:", response.data?.result?.totalElements);
      return response.data?.result?.totalElements || 0;
    } catch (error) {
      console.error("Failed to get total employees count:", error);
      // Fallback to dummy data for demonstration
      return 1247;
    }
  },

  // 전체 지점 목록 조회 (간단한 정보만)
  getAllBranches: async () => {
    try {
      const response = await axios.get(`${BRANCH_API_BASE_URL}/branch?page=0&size=1000`);
      return response.data?.result?.data || [];
    } catch (error) {
      console.error("Failed to get branches:", error);
      return [];
    }
  },

  // 전체 매출 통계 조회
  getSalesStatistics: async (period = "MONTH") => {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      if (period === "WEEK") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === "MONTH") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (period === "YEAR") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/all?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&periodType=DAY`
      );
      
      return response.data?.result || null;
    } catch (error) {
      console.error("Failed to get sales statistics:", error);
      return null;
    }
  },

  // 대시보드 주요 지표 조회
  getDashboardKPI: async () => {
    try {
      const [branches, employees, salesStats] = await Promise.all([
        dashboardService.getTotalBranchesCount(),
        dashboardService.getTotalEmployeesCount(),
        dashboardService.getSalesStatistics("MONTH"),
      ]);

      // 매출 통계에서 평균 매출 계산 (원 단위로 유지)
      let avgMonthlySales = 0;
      if (salesStats && salesStats.salesData) {
        const totalSales = salesStats.totalSales || 0;
        const branchCount = salesStats.totalBranchCount || branches;
        avgMonthlySales = Math.floor(totalSales / branchCount); // 원 단위
      }

      // 전월 대비 증가율 계산 (임시로 더미 데이터 사용)
      const branchGrowthRate = 12.5;
      const employeeGrowthRate = 8.2;
      const salesGrowthRate = 23.1;
      const annualGrowthRate = 18.2;

      return {
        totalBranches: branches,
        totalEmployees: employees,
        avgMonthlySales,
        branchGrowthRate,
        employeeGrowthRate,
        salesGrowthRate,
        annualGrowthRate,
      };
    } catch (error) {
      console.error("Failed to get dashboard KPI:", error);
      return {
        totalBranches: 324,
        totalEmployees: 1247,
        avgMonthlySales: 24000000, // 원 단위 (2,400만원)
        branchGrowthRate: 12.5,
        employeeGrowthRate: 8.2,
        salesGrowthRate: 23.1,
        annualGrowthRate: 18.2,
      };
    }
  },

  // 월별 매출 추이 조회
  getMonthlySalesTrend: async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 12);

      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/all?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&periodType=MONTH`
      );
      
      return response.data?.result || null;
    } catch (error) {
      console.error("Failed to get monthly sales trend:", error);
      return null;
    }
  },

  // 주간 매출 추이 조회
  getWeeklySalesTrend: async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/all?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&periodType=DAY`
      );
      
      return response.data?.result || null;
    } catch (error) {
      console.error("Failed to get weekly sales trend:", error);
      return null;
    }
  },

  // 재고 부족 현황 조회
  getLowStockStatus: async () => {
    try {
      // TODO: 재고 부족 현황 API 엔드포인트 확인 및 구현
      // 임시로 빈 배열 반환
      return [];
    } catch (error) {
      console.error("Failed to get low stock status:", error);
      return [];
    }
  },

  // 공지사항 조회
  getNotifications: async () => {
    try {
      // TODO: 공지사항 API 엔드포인트 확인 및 구현
      // 임시로 빈 배열 반환
      return [];
    } catch (error) {
      console.error("Failed to get notifications:", error);
      return [];
    }
  },

  // 인기 상품 조회
  getPopularProducts: async () => {
    try {
      // TODO: 인기 상품 API 엔드포인트 확인 및 구현
      // 임시로 더미 데이터 반환
      return null;
    } catch (error) {
      console.error("Failed to get popular products:", error);
      return null;
    }
  },

  // 우수 지점 조회
  getTopBranch: async () => {
    try {
      // TODO: 우수 지점 API 엔드포인트 확인 및 구현
      return null;
    } catch (error) {
      console.error("Failed to get top branch:", error);
      return null;
    }
  },

  // 판매왕 조회
  getTopSalesPerson: async () => {
    try {
      // TODO: 판매왕 API 엔드포인트 확인 및 구현
      return null;
    } catch (error) {
      console.error("Failed to get top sales person:", error);
      return null;
    }
  },

  // 저조 지점 조회
  getLowSalesBranch: async () => {
    try {
      // TODO: 저조 지점 API 엔드포인트 확인 및 구현
      return null;
    } catch (error) {
      console.error("Failed to get low sales branch:", error);
      return null;
    }
  },

  // 카테고리별 매출 비중 조회
  getSalesByCategory: async () => {
    try {
      // TODO: 카테고리별 매출 API 엔드포인트 확인 및 구현
      return null;
    } catch (error) {
      console.error("Failed to get sales by category:", error);
      return null;
    }
  },
};

// 날짜 포맷팅 헬퍼
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default dashboardService;

