import axios from '../utils/axiosConfig';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const AUTO_ORDER_API_URL = `${API_BASE_URL}/api/auto-order`;

export const autoOrderService = {
  // 자동 발주 상태 조회 (본사용)
  async getAutoOrderStatus() {
    try {
      const response = await axios.get(`${AUTO_ORDER_API_URL}/status`);
      return response.data;
    } catch (error) {
      console.error('자동 발주 상태 조회 실패:', error);
      throw error;
    }
  },

  // 지점별 자동 발주 실행 (본사용)
  async executeBranchAutoOrder(branchId) {
    try {
      const response = await axios.post(`${AUTO_ORDER_API_URL}/branch/${branchId}`);
      return response.data;
    } catch (error) {
      console.error('지점 자동 발주 실행 실패:', error);
      throw error;
    }
  },

  // 상품별 자동 발주 실행 (본사용)
  async executeProductAutoOrder(branchId, productId) {
    try {
      const response = await axios.post(`${AUTO_ORDER_API_URL}/branch/${branchId}/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error('상품 자동 발주 실행 실패:', error);
      throw error;
    }
  },

  // 가맹점용 자동 발주 설정 조회
  async getFranchiseAutoOrderSettings() {
    try {
      const response = await axios.get(`${AUTO_ORDER_API_URL}/franchise/settings`);
      return response.data;
    } catch (error) {
      console.error('가맹점 자동 발주 설정 조회 실패:', error);
      throw error;
    }
  },

  // 가맹점용 자동 발주 설정 업데이트
  async updateFranchiseAutoOrderSettings(settings) {
    try {
      const response = await axios.put(`${AUTO_ORDER_API_URL}/franchise/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('가맹점 자동 발주 설정 업데이트 실패:', error);
      throw error;
    }
  },

  // 가맹점용 자동 발주 히스토리 조회
  async getFranchiseAutoOrderHistory() {
    try {
      const response = await axios.get(`${AUTO_ORDER_API_URL}/franchise/history`);
      return response.data;
    } catch (error) {
      console.error('가맹점 자동 발주 히스토리 조회 실패:', error);
      throw error;
    }
  }
};
