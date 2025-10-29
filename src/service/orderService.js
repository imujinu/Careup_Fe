import customerAxios from '../utils/customerAxios';

const API_BASE_URL = import.meta.env.VITE_CUSTOMER_API_URL || 'http://localhost:8080';

export const orderService = {
  // 주문 목록 조회 (본사용 - 전체 주문)
  getAllOrders: async () => {
    try {
      console.log('주문 목록 조회 API 호출:', `${API_BASE_URL}/api/orders`);
      const response = await customerAxios.get('/api/orders');
      console.log('주문 목록 조회 응답:', response);
      return response.data;
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      console.error('에러 상세:', error.response);
      throw error;
    }
  },

  // 지점별 주문 조회
  getOrdersByBranch: async (branchId) => {
    try {
      const response = await customerAxios.get(`/api/orders/branch/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('지점별 주문 조회 실패:', error);
      throw error;
    }
  },

  // 주문 상세 조회
  getOrderDetail: async (orderId) => {
    try {
      const response = await customerAxios.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      throw error;
    }
  },

  // 주문 승인
  approveOrder: async (orderId, approvedBy) => {
    try {
      const response = await customerAxios.put(`/api/orders/${orderId}/approve?approvedBy=${approvedBy}`);
      return response.data;
    } catch (error) {
      console.error('주문 승인 실패:', error);
      throw error;
    }
  },

  // 주문 반려
  rejectOrder: async (orderId, reason) => {
    try {
      const response = await customerAxios.put(`/api/orders/${orderId}/reject?reason=${encodeURIComponent(reason)}`);
      return response.data;
    } catch (error) {
      console.error('주문 반려 실패:', error);
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (orderId) => {
    try {
      const response = await customerAxios.delete(`/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('주문 취소 실패:', error);
      throw error;
    }
  }
};

export default orderService;
