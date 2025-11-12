import axios from "../utils/axiosConfig";

const BRANCH_API_BASE_URL = import.meta.env.VITE_BRANCH_URL;
const ORDERING_API_BASE_URL = import.meta.env.VITE_ORDERING_URL;
const EXCEL_API_BASE_URL = import.meta.env.VITE_ORDERING_URL;

// 엑셀 파일 다운로드 헬퍼 함수
const downloadExcelFile = async (url, fileName) => {
  const response = await axios.get(url, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export const salesReportService = {
  // 전체 지점 매출 내역 기간별 조회
  getAllBranchesSales: async (startDate, endDate, periodType = "DAY") => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      periodType,
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/hq/sales/all?${params.toString()}`
    );
    return response.data.result; // AllBranchesSalesResponseDto
  },

  // 선택한 가맹점의 매출 내역 기간별 조회
  getBranchSalesDetail: async (
    branchId,
    startDate,
    endDate,
    periodType = "DAY"
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      periodType,
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/hq/sales/branch/${branchId}?${params.toString()}`
    );
    return response.data.result; // BranchSalesDetailResponseDto
  },

  // 가맹점 간 매출 비교
  compareBranchesSales: async (
    branchIds,
    startDate,
    endDate,
    periodType = "DAY"
  ) => {
    const params = new URLSearchParams({
      branchIds: branchIds.join(","),
      startDate,
      endDate,
      periodType,
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/hq/sales/comparison?${params.toString()}`
    );
    return response.data.result; // BranchComparisonResponseDto
  },

  // 예상 매출액 조회
  getBranchSalesForecast: async (branchId) => {
    const response = await axios.get(
      `${BRANCH_API_BASE_URL}/sales-forecast/branch/${branchId}`
    );
    return response.data.result;
  },

  // 예상 매출액 계산
  calculateSalesForecast: async (branchId, forecastDays = 30) => {
    const response = await axios.get(
      `${BRANCH_API_BASE_URL}/sales-forecast/calculate/${branchId}?forecastDays=${forecastDays}`
    );
    return response.data.result;
  },

  // 예상 매출액 전송 (단일)
  saveSalesForecast: async (request) => {
    const response = await axios.post(
      `${BRANCH_API_BASE_URL}/sales-forecast`,
      request
    );
    return response.data.result;
  },

  // 예상 매출액 일괄 전송
  saveBulkSalesForecasts: async (request) => {
    const response = await axios.post(
      `${BRANCH_API_BASE_URL}/sales-forecast/bulk`,
      request
    );
    return response.data.result;
  },

  // 모든 지점 예상 매출액 자동 계산 및 전송
  calculateAndSaveAllBranchForecasts: async (forecastDays = 30) => {
    const response = await axios.post(
      `${BRANCH_API_BASE_URL}/sales-forecast/calculate-all?forecastDays=${forecastDays}`
    );
    return response.data.result;
  },

  // 전체 지점 매출 엑셀 다운로드
  exportAllBranchesSales: async (startDate, endDate, periodType = "DAY") => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      periodType,
    });

    const url = `${EXCEL_API_BASE_URL}/hq/sales/excel/all-branches?${params.toString()}`;
    const fileName = `전체지점매출_${startDate}_${endDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 지점 상세 매출 엑셀 다운로드
  exportBranchDetailSales: async (
    branchId,
    startDate,
    endDate,
    periodType = "DAY"
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      periodType,
    });

    const url = `${EXCEL_API_BASE_URL}/hq/sales/excel/branch/${branchId}?${params.toString()}`;
    const fileName = `지점상세매출_${branchId}_${startDate}_${endDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 지점 비교 매출 엑셀 다운로드
  exportBranchComparisonSales: async (
    branchIds,
    startDate,
    endDate,
    periodType = "DAY"
  ) => {
    const params = new URLSearchParams({
      branchIds: branchIds.join(","),
      startDate,
      endDate,
      periodType,
    });

    const url = `${EXCEL_API_BASE_URL}/hq/sales/excel/comparison?${params.toString()}`;
    const fileName = `지점비교매출_${startDate}_${endDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 예상 매출액 엑셀 다운로드
  exportSalesForecast: async (forecastDays = 30) => {
    const url = `${EXCEL_API_BASE_URL}/hq/sales/excel/forecast?forecastDays=${forecastDays}`;
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const fileName = `예상매출액_${today}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // ========== Branch/Franchise Owner 전용 API ==========

  // 매출 통계 조회 (요일별, 시간별, 기간별)
  getBranchSalesStatistics: async (
    branchId,
    startDate,
    endDate,
    periodType = "DAY"
  ) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      startDate,
      endDate,
      periodType,
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/sales/statistics?${params.toString()}`
    );
    return response.data.result; // SalesStatisticsResponseDto
  },

  // 상품별 매출 조회 (마진율 높은 상품, 판매량 많은 상품 등)
  getBranchProductSales: async (
    branchId,
    startDate,
    endDate,
    sortType = "HIGH_SALES"
  ) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      startDate,
      endDate,
      sortType,
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/sales/products?${params.toString()}`
    );
    return response.data.result; // ProductSalesResponseDto
  },

  // 인근 지역 가맹점 평균 및 매출 비교
  compareNeighborhoodBranches: async (
    branchId,
    startDate,
    endDate,
    radiusKm = 10.0
  ) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      startDate,
      endDate,
      radiusKm: radiusKm.toString(),
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/sales/comparison?${params.toString()}`
    );
    return response.data.result; // List<BranchComparisonDto>
  },

  // 소속 가맹점의 예상 매출액 조회
  getBranchSalesForecastForBranch: async (branchId, targetDate) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      targetDate,
    });

    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/sales/forecast?${params.toString()}`
    );
    return response.data.result; // SalesForecastResponseDto
  },

  // ========== Branch/Franchise Owner 전용 엑셀 다운로드 ==========

  // 매출 통계 엑셀 다운로드
  exportBranchSalesStatistics: async (
    branchId,
    startDate,
    endDate,
    periodType = "DAY"
  ) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      startDate,
      endDate,
      periodType,
    });

    const url = `${EXCEL_API_BASE_URL}/sales/excel/statistics?${params.toString()}`;
    const fileName = `매출통계_${branchId}_${startDate}_${endDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 상품별 매출 엑셀 다운로드
  exportBranchProductSales: async (
    branchId,
    startDate,
    endDate,
    sortType = "HIGH_SALES"
  ) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      startDate,
      endDate,
      sortType,
    });

    const url = `${EXCEL_API_BASE_URL}/sales/excel/products?${params.toString()}`;
    const fileName = `상품별매출_${branchId}_${startDate}_${endDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 인근 지역 가맹점 비교 엑셀 다운로드
  exportNeighborhoodComparison: async (
    branchId,
    startDate,
    endDate,
    radiusKm = 10.0
  ) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      startDate,
      endDate,
      radiusKm: radiusKm.toString(),
    });

    const url = `${EXCEL_API_BASE_URL}/sales/excel/comparison?${params.toString()}`;
    const fileName = `인근지역비교_${branchId}_${startDate}_${endDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 예상 매출액 엑셀 다운로드 (Branch/Franchise Owner)
  exportBranchSalesForecast: async (branchId, targetDate) => {
    const params = new URLSearchParams({
      branchId: branchId.toString(),
      targetDate,
    });

    const url = `${EXCEL_API_BASE_URL}/sales/excel/forecast?${params.toString()}`;
    const fileName = `예상매출액_${branchId}_${targetDate}.xlsx`;

    await downloadExcelFile(url, fileName);
  },
};
