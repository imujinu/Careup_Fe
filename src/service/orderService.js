import axios from '../utils/axiosConfig'; // 관리자용 axios (직원 토큰 사용)
import customerAxios from '../utils/customerAxios'; // 고객용 axios

// API Gateway를 통해 ordering 서버로 라우팅 (다른 서비스들과 동일)
const API_BASE_URL = import.meta.env.VITE_CUSTOMER_API_URL;

// 관리자용 orderService (관리자/직원 토큰 사용)
export const orderService = {
  // 주문 목록 조회 (본사용 - 전체 주문)
  getAllOrders: async () => {
    try {
      // 관리자 토큰 확인
      const adminToken = localStorage.getItem('accessToken');
      const customerToken = localStorage.getItem('cust_accessToken');
      console.log('🔐 관리자 토큰 확인:', adminToken ? '있음' : '없음', adminToken?.substring(0, 20) + '...');
      console.log('🔐 고객 토큰 확인:', customerToken ? '있음 (혼선 가능)' : '없음');
      
      console.log('주문 목록 조회 API 호출 (관리자용 - API Gateway 경유):', `${API_BASE_URL}/api/orders`);
      const response = await axios.get(`${API_BASE_URL}/api/orders`);
      console.log('주문 목록 조회 응답:', response);
      // 통합 래핑 대응: { result: [...] } 또는 직접 배열
      return response.data?.result ?? response.data;
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      console.error('에러 상세:', error.response);
      if (error.response?.status === 403) {
        console.error('⚠️ 권한 오류: 관리자 토큰이 아닌 다른 토큰이 전송되었을 수 있습니다.');
      }
      throw error;
    }
  },

  // 지점별 주문 조회
  getOrdersByBranch: async (branchId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/branch/${branchId}`);
      return response.data?.result ?? response.data;
    } catch (error) {
      console.error('지점별 주문 조회 실패:', error);
      throw error;
    }
  },

  // 주문 상세 조회
  getOrderDetail: async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`);
      // 상세도 래핑 대응
      return response.data?.result ?? response.data;
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      throw error;
    }
  },

  // 주문 승인
  approveOrder: async (orderId, approvedBy) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/orders/${orderId}/approve?approvedBy=${approvedBy}`);
      return response.data;
    } catch (error) {
      console.error('주문 승인 실패:', error);
      throw error;
    }
  },

  // 주문 반려
  rejectOrder: async (orderId, reason) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/orders/${orderId}/reject?reason=${encodeURIComponent(reason)}`);
      return response.data;
    } catch (error) {
      console.error('주문 반려 실패:', error);
      throw error;
    }
  },

  // 주문 취소
  cancelOrder: async (orderId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/orders/${orderId}`);
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
