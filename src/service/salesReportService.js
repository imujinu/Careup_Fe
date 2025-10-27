import axios from '../utils/axiosConfig';

const BRANCH_API_BASE_URL = import.meta.env.REACT_APP_API_BRANCH_URL || 'http://localhost:8081';
const ORDERING_API_BASE_URL = import.meta.env.REACT_APP_API_ORDERING_URL || 'http://localhost:8080';
const EXCEL_API_BASE_URL = import.meta.env.REACT_APP_API_EXCEL_URL || 'http://localhost:8080';

// 엑셀 파일 다운로드 헬퍼 함수
const downloadExcelFile = async (url, fileName) => {
  const response = await axios.get(url, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export const salesReportService = {
  // 전체 지점 매출 내역 기간별 조회
  getAllBranchesSales: async (startDate, endDate, periodType = 'DAY') => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      periodType
    });
    
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/hq/sales/all?${params.toString()}`
    );
    return response.data.result; // AllBranchesSalesResponseDto
  },

  // 선택한 가맹점의 매출 내역 기간별 조회
  getBranchSalesDetail: async (branchId, startDate, endDate, periodType = 'DAY') => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      periodType
    });
    
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/hq/sales/branch/${branchId}?${params.toString()}`
    );
    return response.data.result; // BranchSalesDetailResponseDto
  },

  // 가맹점 간 매출 비교
  compareBranchesSales: async (branchIds, startDate, endDate, periodType = 'DAY') => {
    const params = new URLSearchParams({
      branchIds: branchIds.join(','),
      startDate,
      endDate,
      periodType
    });
    
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/hq/sales/comparison?${params.toString()}`
    );
    return response.data.result; // BranchComparisonResponseDto
  },

  // 예상 매출액 조회
  getBranchSalesForecast: async (branchId) => {
    const response = await axios.get(`${BRANCH_API_BASE_URL}/sales-forecast/branch/${branchId}`);
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
    const response = await axios.post(`${BRANCH_API_BASE_URL}/sales-forecast`, request);
    return response.data.result;
  },

  // 예상 매출액 일괄 전송
  saveBulkSalesForecasts: async (request) => {
    const response = await axios.post(`${BRANCH_API_BASE_URL}/sales-forecast/bulk`, request);
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
  exportAllBranchesSales: async (startDate, endDate, periodType = 'DAY') => {
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
  exportBranchDetailSales: async (branchId, startDate, endDate, periodType = 'DAY') => {
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
  exportBranchComparisonSales: async (branchIds, startDate, endDate, periodType = 'DAY') => {
    const params = new URLSearchParams({
      branchIds: branchIds.join(','),
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
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `예상매출액_${today}.xlsx`;
    
    await downloadExcelFile(url, fileName);
  },
};

