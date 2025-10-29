import axios from '../utils/axiosConfig'; // 관리자용 axios (직원 토큰 사용)
import customerAxios from '../utils/customerAxios'; // 고객용 axios

const ORDERING_API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8081';
const CUSTOMER_API_BASE_URL = import.meta.env.VITE_CUSTOMER_API_URL || 'http://localhost:8080';

// 관리자용 orderService (관리자/직원 토큰 사용)
export const orderService = {
  // 주문 목록 조회 (본사용 - 전체 주문)
  getAllOrders: async () => {
    try {
      console.log('주문 목록 조회 API 호출 (관리자용):', `${ORDERING_API_BASE_URL}/api/orders`);
      const response = await axios.get(`${ORDERING_API_BASE_URL}/api/orders`);
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
      const response = await axios.get(`${ORDERING_API_BASE_URL}/api/orders/branch/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('지점별 주문 조회 실패:', error);
      throw error;
    }
  },

  // 주문 상세 조회
  getOrderDetail: async (orderId) => {
    try {
      const response = await axios.get(`${ORDERING_API_BASE_URL}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      throw error;
    }
  },

  // 주문 승인
  approveOrder: async (orderId, approvedBy) => {
    try {
      const response = await axios.put(`${ORDERING_API_BASE_URL}/api/orders/${orderId}/approve?approvedBy=${approvedBy}`);
      return response.data;
    } catch (error) {
      console.error('주문 승인 실패:', error);
      throw error;
    }
  },

  // 주문 반려
  rejectOrder: async (orderId, reason) => {
    try {
      const response = await axios.put(`${ORDERING_API_BASE_URL}/api/orders/${orderId}/reject?reason=${encodeURIComponent(reason)}`);
      return response.data;
    } catch (error) {
      console.error('주문 반려 실패:', error);
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (orderId) => {
    try {
      const response = await axios.delete(`${ORDERING_API_BASE_URL}/api/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('주문 취소 실패:', error);
      throw error;
    }
  }
};

// 고객용 orderService (고객 토큰 사용) - storefront에서 사용
export const customerOrderService = {
  // 회원별 주문 조회
  getOrdersByMember: async (memberId) => {
    try {
      const response = await customerAxios.get(`/api/orders/member/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('회원 주문 조회 실패:', error);
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
  }
};

export default orderService;
