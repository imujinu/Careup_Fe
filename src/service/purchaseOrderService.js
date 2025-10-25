import axios from '../utils/axiosConfig';

// 발주(purchase order)는 branch 서버에서 처리
const API_BASE_URL = import.meta.env.VITE_BRANCH_API_URL || 'http://localhost:8081';

// axios 인스턴스 대신 기본 axios 사용 (interceptor가 적용됨)
const purchaseOrderApi = axios;

export const purchaseOrderService = {
  // 발주 생성 (가맹점용)
  createPurchaseOrder: async (data) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders`, data);
    return response.data;
  },

  // 발주 목록 조회 (본사/가맹점 구분)
  getPurchaseOrders: async (branchId) => {
    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/branch/${branchId}`);
    return response.data;
  },

  // 발주 상세 조회
  getPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}`);
    return response.data;
  },

  // 발주 승인 (본사용)
  approvePurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/approve`);
    return response.data;
  },

  // 발주 반려 (본사용)
  rejectPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/reject`);
    return response.data;
  },

  // 발주 부분 승인 (본사용)
  partialApprovePurchaseOrder: async (purchaseOrderId, data) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/partial-approve`, data);
    return response.data;
  },

  // 발주 배송 시작 (본사용)
  shipPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/ship`);
    return response.data;
  },

  // 발주 입고 완료 (가맹점용)
  completePurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/complete`);
    return response.data;
  },

  // 발주 취소 (가맹점용)
  cancelPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/cancel`);
    return response.data;
  },

  // 발주 내역 엑셀 다운로드 (본사/가맹점)
  exportToExcel: async (branchId, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    params.append('branchId', branchId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/export/excel?${params}`, {
      responseType: 'blob'
    });
    
    // 파일 다운로드
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchase_orders_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // 특정 발주 내역 엑셀 다운로드 (단일 발주)
  exportSingleOrderToExcel: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/export/excel`, {
      responseType: 'blob'
    });
    
    // 파일 다운로드
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchase_order_${purchaseOrderId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // 본사용 발주 통계 조회 (전체)
  getHQStatistics: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/hq?${params}`);
    console.log('본사 발주 통계 API 응답:', response);
    return response.data;
  },

  // 본사용 전체현황 통계 조회
  getHQOverallStatistics: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/hq/overall?${params}`);
    return response.data;
  },

  // 본사용 상태별 통계 조회
  getHQStatusStatistics: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/hq/status?${params}`);
    return response.data;
  },

  // 본사용 지점별 통계 조회
  getHQBranchStatistics: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/hq/branch?${params}`);
    return response.data;
  },

  // 본사용 상품별 통계 조회
  getHQProductStatistics: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/hq/product?${params}`);
    return response.data;
  },

  // 가맹점용 발주 통계 조회
  getFranchiseStatistics: async (branchId, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/franchise/${branchId}?${params}`);
    return response.data;
  },

  // 가맹점용 상품별 발주 통계 조회
  getFranchiseProductStatistics: async (branchId, startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await purchaseOrderApi.get(`${API_BASE_URL}/purchase-orders/statistics/franchise/${branchId}/product?${params}`);
    return response.data;
  }
};