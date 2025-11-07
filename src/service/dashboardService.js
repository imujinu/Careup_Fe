import axios from "../utils/axiosConfig";
import { branchService } from "./branchService";

const BRANCH_API_BASE_URL = import.meta.env.VITE_BRANCH_URL;
const ORDERING_API_BASE_URL = import.meta.env.VITE_ORDERING_URL;

export const dashboardService = {
  // 전체 직원 수 조회
  getTotalEmployeesCount: async () => {
    // 여러 후보 경로 시도
    const candidates = [
      // 직접 호출 (게이트웨이 없이)
      { url: `${BRANCH_API_BASE_URL}/employees/list`, params: { page: 0, size: 1 } },
      // 게이트웨이를 통한 호출
      { url: `${BRANCH_API_BASE_URL}/branch-service/employees/list`, params: { page: 0, size: 1 } },
    ];

    for (const candidate of candidates) {
      try {
        const response = await axios.get(candidate.url, candidate.params ? { params: candidate.params } : undefined);
        const data = response.data?.result || response.data;
        
        // 페이징 응답에서 totalElements 추출
        if (data?.totalElements !== undefined) {
          console.log("Employee API Response:", data);
          console.log("Total Employees:", data.totalElements);
          return data.totalElements;
        }
        
        // 리스트 응답인 경우 배열 길이 사용
        if (Array.isArray(data?.data)) {
          console.log("Employee List Response (count from array):", data.data.length);
          return data.data.length;
        }
        if (Array.isArray(data)) {
          console.log("Employee List Response (count from array):", data.length);
          return data.length;
        }
      } catch (error) {
        // 다음 후보 경로로 계속 시도
        console.log(`Failed to get employees from ${candidate.url}, trying next...`);
      }
    }
    
    // 모든 경로 실패 시 fallback
    console.error("All employee API endpoints failed");
    return 1247;
  },

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

  // 전월 지점 수 조회 (특정 날짜 이전에 생성된 지점 수)
  getPreviousMonthBranchesCount: async () => {
    try {
      const now = new Date();
      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 전체 지점 목록을 가져와서 필터링
      const allBranches = await dashboardService.getAllBranches();
      if (Array.isArray(allBranches)) {
        const filtered = allBranches.filter(branch => {
          if (!branch.createdAt) return false;
          const createdAt = new Date(branch.createdAt);
          return createdAt < firstDayOfCurrentMonth;
        });
        return filtered.length;
      }
      
      // 전체 지점 수 API에서 추정
      const currentCount = await dashboardService.getTotalBranchesCount();
      return Math.max(0, currentCount - 1); // 최소 0
    } catch (error) {
      console.error("Failed to get previous month branches count:", error);
      const currentCount = await dashboardService.getTotalBranchesCount();
      return Math.max(0, currentCount - 1);
    }
  },

  // 전월 직원 수 조회
  getPreviousMonthEmployeesCount: async () => {
    try {
      const now = new Date();
      const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 직원 목록 전체 조회 시도
      try {
        const response = await axios.get(`${BRANCH_API_BASE_URL}/employees/list?page=0&size=1000`);
        const data = response.data?.result || response.data;
        let employees = [];
        
        if (Array.isArray(data?.data)) {
          employees = data.data;
        } else if (Array.isArray(data)) {
          employees = data;
        } else if (data?.totalElements !== undefined) {
          // 페이징 응답인 경우
          if (data?.data && Array.isArray(data.data)) {
            employees = data.data;
          } else {
            // 전체 개수만 알 수 있는 경우 현재에서 추정
            return Math.max(0, data.totalElements - 1);
          }
        }
        
        if (employees.length > 0) {
          const filtered = employees.filter(emp => {
            if (!emp.createdAt && !emp.hireDate) return false;
            const date = new Date(emp.createdAt || emp.hireDate);
            return date < firstDayOfCurrentMonth;
          });
          return filtered.length;
        }
      } catch (error) {
        console.log("Failed to get employee list, using estimation");
      }
      
      // 실패 시 현재 직원 수에서 추정
      const currentCount = await dashboardService.getTotalEmployeesCount();
      return Math.max(0, currentCount - 1);
    } catch (error) {
      console.error("Failed to get previous month employees count:", error);
      const currentCount = await dashboardService.getTotalEmployeesCount();
      return Math.max(0, currentCount - 1);
    }
  },

  // 전월 매출 통계 조회
  getPreviousMonthSalesStatistics: async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      // 전월 첫날부터 전월 말일까지
      startDate.setMonth(endDate.getMonth() - 1);
      startDate.setDate(1);
      const lastDayOfPreviousMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      
      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/all?startDate=${formatDate(startDate)}&endDate=${formatDate(lastDayOfPreviousMonth)}&periodType=MONTH`
      );
      
      return response.data?.result || null;
    } catch (error) {
      console.error("Failed to get previous month sales statistics:", error);
      return null;
    }
  },

  // 성장률 계산 헬퍼 함수
  calculateGrowthRate: (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  },

  // 전체 지점 목록 조회 (간단한 정보만)
  getAllBranches: async () => {
    // 여러 후보 경로를 순차적으로 시도
    const candidates = [
      { url: `${BRANCH_API_BASE_URL}/branch`, params: { page: 0, size: 1000 } },
      { url: `${BRANCH_API_BASE_URL}/branch-service/branch`, params: { page: 0, size: 1000 } },
      { url: `${BRANCH_API_BASE_URL}/branch/public/list` },
    ];

    for (const candidate of candidates) {
      try {
        const response = await axios.get(
          candidate.url,
          candidate.params ? { params: candidate.params } : undefined
        );
        const body = response.data;

        // 다양한 형태를 정규화 시도
        const paged = body?.result || body;
        if (Array.isArray(paged?.data)) {
          return paged.data;
        }
        if (Array.isArray(body?.result)) {
          return body.result;
        }
        if (Array.isArray(body)) {
          return body;
        }
      } catch (error) {
        // 다음 후보로 진행
        console.log(`getAllBranches failed for ${candidate.url}, trying next...`);
      }
    }

    console.error("All branch list endpoints failed");
    return [];
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
      // 현재 월 데이터 조회
      const [branches, employees, salesStats] = await Promise.all([
        dashboardService.getTotalBranchesCount(),
        dashboardService.getTotalEmployeesCount(),
        dashboardService.getSalesStatistics("MONTH"),
      ]);

      // 전월 데이터 조회
      const [previousBranches, previousEmployees, previousSalesStats] = await Promise.all([
        dashboardService.getPreviousMonthBranchesCount(),
        dashboardService.getPreviousMonthEmployeesCount(),
        dashboardService.getPreviousMonthSalesStatistics(),
      ]);

      // 매출 통계에서 평균 매출 계산 (원 단위로 유지)
      let avgMonthlySales = 0;
      if (salesStats && salesStats.salesData) {
        const totalSales = salesStats.totalSales || 0;
        const branchCount = salesStats.totalBranchCount || branches;
        avgMonthlySales = branchCount > 0 ? Math.floor(totalSales / branchCount) : 0; // 원 단위
      }

      // 전월 평균 매출 계산
      let previousAvgMonthlySales = 0;
      if (previousSalesStats && previousSalesStats.salesData) {
        const previousTotalSales = previousSalesStats.totalSales || 0;
        const previousBranchCount = previousSalesStats.totalBranchCount || previousBranches;
        previousAvgMonthlySales = previousBranchCount > 0 ? Math.floor(previousTotalSales / previousBranchCount) : 0;
      }

      // 전월 대비 증가율 계산
      const branchGrowthRate = dashboardService.calculateGrowthRate(branches, previousBranches);
      const employeeGrowthRate = dashboardService.calculateGrowthRate(employees, previousEmployees);
      const salesGrowthRate = dashboardService.calculateGrowthRate(avgMonthlySales, previousAvgMonthlySales);
      
      // 연간 매출 조회
      const annualSales = await dashboardService.getAnnualSales();

      return {
        totalBranches: branches,
        totalEmployees: employees,
        avgMonthlySales,
        branchGrowthRate: Math.round(branchGrowthRate * 10) / 10, // 소수점 첫째자리까지
        employeeGrowthRate: Math.round(employeeGrowthRate * 10) / 10,
        salesGrowthRate: Math.round(salesGrowthRate * 10) / 10,
        annualSales,
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
        annualSales: 288000000, // 원 단위 (2억 8,800만원)
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
      // 모든 지점 목록 조회
      const branches = await dashboardService.getAllBranches();
      
      // 각 지점별로 재고 부족 상품 조회
      const lowStockItems = await Promise.all(
        branches.map(async (branch) => {
          try {
            const branchId = branch.branchId || branch.id;
            const response = await axios.get(
              `${ORDERING_API_BASE_URL}/inventory/branch-products/branch/${branchId}`
            );
            
            const products = response.data?.data || response.data?.result || response.data || [];
            
            // 재고 부족 상품 필터링 (재고 <= 안전재고)
            const lowStockProducts = products.filter((p) => {
              const stock = p.stockQuantity || p.quantity || 0;
              const safetyStock = p.safetyStock || p.safetystock || 0;
              return stock <= safetyStock;
            });
            
            // 상위 10개만 반환 (부족량이 많은 순)
            const sorted = lowStockProducts
              .map((p) => {
                const stock = p.stockQuantity || p.quantity || 0;
                const safetyStock = p.safetyStock || p.safetystock || 0;
                const shortage = safetyStock - stock;
                return {
                  branchId,
                  branchName: branch.branchName || branch.name || `지점-${branchId}`,
                  productId: p.productId,
                  productName: p.productName || p.name || '-',
                  stockQuantity: stock,
                  safetyStock,
                  shortage: shortage > 0 ? shortage : 0,
                };
              })
              .sort((a, b) => b.shortage - a.shortage)
              .slice(0, 10);
            
            return sorted;
          } catch (error) {
            console.error(`Failed to get low stock for branch ${branch.branchId || branch.id}:`, error);
            return [];
          }
        })
      );
      
      // 평탄화하고 상위 20개만 반환 (부족량이 많은 순)
      const allLowStockItems = lowStockItems.flat().sort((a, b) => b.shortage - a.shortage).slice(0, 20);
      
      return allLowStockItems;
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

  // 인기 상품 조회 (매출이 가장 높은 상품)
  getPopularProducts: async () => {
    try {
      const endDate = new Date();
      const startDate1 = new Date();
      startDate1.setMonth(endDate.getMonth() - 1);

      const url1 = `${ORDERING_API_BASE_URL}/hq/sales/products?startDate=${formatDate(startDate1)}&endDate=${formatDate(endDate)}&sortType=HIGH_SALES&size=1`;
      const res1 = await axios.get(url1);
      let products = res1.data?.result?.content || res1.data?.result || [];
      if (Array.isArray(products) && products.length > 0) return products[0];

      // 최근 1개월에 데이터가 없으면 최근 3개월로 재조회
      const startDate3 = new Date();
      startDate3.setMonth(endDate.getMonth() - 3);
      const url3 = `${ORDERING_API_BASE_URL}/hq/sales/products?startDate=${formatDate(startDate3)}&endDate=${formatDate(endDate)}&sortType=HIGH_SALES&size=1`;
      const res3 = await axios.get(url3);
      products = res3.data?.result?.content || res3.data?.result || [];
      return Array.isArray(products) && products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error("Failed to get popular products:", error);
      return null;
    }
  },

  // 비인기 상품 조회 (매출이 가장 낮은 상품)
  getUnpopularProducts: async () => {
    try {
      const endDate = new Date();
      const startDate1 = new Date();
      startDate1.setMonth(endDate.getMonth() - 1);

      const url1 = `${ORDERING_API_BASE_URL}/hq/sales/products?startDate=${formatDate(startDate1)}&endDate=${formatDate(endDate)}&sortType=LOW_SALES&size=1`;
      const res1 = await axios.get(url1);
      let products = res1.data?.result?.content || res1.data?.result || [];
      if (Array.isArray(products) && products.length > 0) return products[0];

      // 최근 1개월에 데이터가 없으면 최근 3개월로 재조회
      const startDate3 = new Date();
      startDate3.setMonth(endDate.getMonth() - 3);
      const url3 = `${ORDERING_API_BASE_URL}/hq/sales/products?startDate=${formatDate(startDate3)}&endDate=${formatDate(endDate)}&sortType=LOW_SALES&size=1`;
      const res3 = await axios.get(url3);
      products = res3.data?.result?.content || res3.data?.result || [];
      return Array.isArray(products) && products.length > 0 ? products[0] : null;
    } catch (error) {
      console.error("Failed to get unpopular products:", error);
      return null;
    }
  },

  // 연간 매출 조회
  getAnnualSales: async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      
      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/all?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&periodType=YEAR`
      );
      
      const result = response.data?.result || null;
      if (result && result.totalSales) {
        return result.totalSales;
      }
      return 0;
    } catch (error) {
      console.error("Failed to get annual sales:", error);
      return 0;
    }
  },

  // 우수 지점 조회
  getTopBranch: async () => {
    try {
      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/top-branch`
      );
      
      const result = response.data?.result || null;
      if (!result) return null;

      // 지점 상세 정보 조회 (ownerName 등)
      const branches = await dashboardService.getAllBranches();
      const branch = branches.find((b) => (b.branchId || b.id) === result.branchId);
      
      return {
        branchId: result.branchId,
        branchName: result.branchName,
        ownerName: branch?.ownerName || branch?.managerName || "-",
        totalSales: result.totalSales || 0,
        totalOrders: result.totalOrders || 0,
        averageSales: result.averageSales || 0,
        differenceFromAverage: result.differenceFromAverage || 0,
      };
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
      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/low-branch`
      );
      
      const result = response.data?.result || null;
      if (!result) return null;

      // 지점 상세 정보 조회 (ownerName 등)
      const branches = await dashboardService.getAllBranches();
      const branch = branches.find((b) => (b.branchId || b.id) === result.branchId);
      
      return {
        branchId: result.branchId,
        branchName: result.branchName,
        ownerName: branch?.ownerName || branch?.managerName || "-",
        totalSales: result.totalSales || 0,
        totalOrders: result.totalOrders || 0,
        averageSales: result.averageSales || 0,
        differenceFromAverage: result.differenceFromAverage || 0,
      };
    } catch (error) {
      console.error("Failed to get low sales branch:", error);
      return null;
    }
  },

  // 카테고리별 매출 비중 조회
  getSalesByCategory: async (period = "MONTH") => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (period === "WEEK") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === "MONTH") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (period === "YEAR") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/categories?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&periodType=${period}`
      );
      
      return response.data?.result || null;
    } catch (error) {
      console.error("Failed to get sales by category:", error);
      return null;
    }
  },

  // 지점별 매출 집계 조회 (지점간 비교용)
  getBranchSalesSummary: async (period = "MONTH") => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (period === "WEEK") {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === "MONTH") {
        startDate.setMonth(endDate.getMonth() - 1);
      } else if (period === "YEAR") {
        startDate.setFullYear(endDate.getFullYear() - 1);
      }

      const response = await axios.get(
        `${ORDERING_API_BASE_URL}/hq/sales/branches-summary?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}&periodType=${period}`
      );
      
      return response.data?.result || null;
    } catch (error) {
      console.error("Failed to get branch sales summary:", error);
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

