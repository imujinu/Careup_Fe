import axios from 'axios';
import customerAxios from '../utils/customerAxios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 쇼핑몰 전용 axios 인스턴스 (직원용 인터셉터 없음)
const shopApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const cartService = {
  // 장바구니에 상품 추가
  addToCart: async (cartData) => {
    try {
      const response = await customerAxios.post('/api/cart', cartData);
      return response.data;
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      throw error;
    }
  },

  // 장바구니 한건 조회
  getCart: async (cartId) => {
    try {
      const response = await customerAxios.get(`/api/cart/${cartId}`);
      return response.data;
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
      throw error;
    }
  },

  // 회원별 장바구니 목록 조회
  getCartsByMember: async (memberId) => {
    try {
      const response = await customerAxios.get(`/api/cart/member/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('회원 장바구니 조회 실패:', error);
      throw error;
    }
  },

  // 회원별 장바구니 개수 조회
  getCartCount: async (memberId) => {
    try {
      const response = await customerAxios.get(`/api/cart/member/${memberId}/count`);
      return response.data;
    } catch (error) {
      console.error('장바구니 개수 조회 실패:', error);
      throw error;
    }
  },

  // 장바구니 수량 수정
  updateCart: async (cartId, quantity) => {
    try {
      const response = await customerAxios.put(`/api/cart/${cartId}?quantity=${quantity}`);
      return response.data;
    } catch (error) {
      console.error('장바구니 수량 변경 실패:', error);
      throw error;
    }
  },

  // 장바구니 한건 삭제
  deleteCart: async (cartId) => {
    try {
      const response = await customerAxios.delete(`/api/cart/${cartId}`);
      return response.data;
    } catch (error) {
      console.error('장바구니 삭제 실패:', error);
      throw error;
    }
  },

  // 회원별 장바구니 전체 삭제
  clearCart: async (memberId) => {
    try {
      const response = await customerAxios.delete(`/api/cart/member/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('장바구니 비우기 실패:', error);
      throw error;
    }
  },

  // 주문 생성
  createOrder: async (orderData) => {
    try {
      const response = await customerAxios.post('/api/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('주문 생성 실패:', error);
      throw error;
    }
  },

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

  // 지점별 주문 조회
  getOrdersByBranch: async (branchId) => {
    try {
      const response = await customerAxios.get(`/api/orders/branch/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('지점 주문 조회 실패:', error);
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

  // 결제 처리
  processPayment: async (orderId, paymentData) => {
    try {
      const response = await customerAxios.post('/api/payments/confirm', paymentData);
      return response.data;
    } catch (error) {
      console.error('결제 처리 실패:', error);
      throw error;
    }
  },

  // 주문 취소 (고객만 가능, 사유는 선택사항)
  cancelOrder: async (orderId, reason = null) => {
    try {
      const params = {};
      if (reason) {
        params.reason = reason;
      }
      const response = await customerAxios.delete(`/api/orders/${orderId}`, { params });
      return response.data;
    } catch (error) {
      console.error('주문 취소 실패:', error);
      throw error;
    }
  },
};

export default cartService;
