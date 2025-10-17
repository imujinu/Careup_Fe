import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const purchaseOrderApi = axios.create({
  baseURL: `${API_BASE_URL}/purchase-orders`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const purchaseOrderService = {
  // 발주 생성 (가맹점용)
  createPurchaseOrder: async (data) => {
    const response = await purchaseOrderApi.post('/', data);
    return response.data;
  },

  // 발주 목록 조회
  getPurchaseOrders: async (branchId) => {
    const response = await purchaseOrderApi.get(`/branch/${branchId}`);
    return response.data;
  },

  // 발주 상세 조회
  getPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.get(`/${purchaseOrderId}`);
    return response.data;
  },

  // 발주 승인 (본사용)
  approvePurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`/${purchaseOrderId}/approve`);
    return response.data;
  },

  // 발주 반려 (본사용)
  rejectPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`/${purchaseOrderId}/reject`);
    return response.data;
  },

  // 발주 부분 승인 (본사용)
  partialApprovePurchaseOrder: async (purchaseOrderId, data) => {
    const response = await purchaseOrderApi.post(`/${purchaseOrderId}/partial-approve`, data);
    return response.data;
  },

  // 발주 배송 시작 (본사용)
  shipPurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`/${purchaseOrderId}/ship`);
    return response.data;
  },

  // 발주 입고 완료 (가맹점용)
  completePurchaseOrder: async (purchaseOrderId) => {
    const response = await purchaseOrderApi.post(`/${purchaseOrderId}/complete`);
    return response.data;
  },
};


