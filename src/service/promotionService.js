import axios from '../utils/axiosConfig';

const ORDERING_API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8081';

/**
 * 프로모션 관리 서비스
 * 관리자용: 프로모션 등록, 수정, 삭제, 조회
 */
export const promotionService = {
  /**
   * 프로모션 등록
   * @param {Object} data - { branchProductId, discountRate, startDate, endDate }
   * @returns {Promise<Object>}
   */
  createPromotion: async (data) => {
    const response = await axios.post(
      `${ORDERING_API_BASE_URL}/api/promotions`,
      data
    );
    return response.data?.result || response.data;
  },

  /**
   * 프로모션 수정
   * @param {number} promotionId - 프로모션 ID
   * @param {Object} data - { discountRate, startDate, endDate }
   * @returns {Promise<Object>}
   */
  updatePromotion: async (promotionId, data) => {
    const response = await axios.put(
      `${ORDERING_API_BASE_URL}/api/promotions/${promotionId}`,
      data
    );
    return response.data?.result || response.data;
  },

  /**
   * 프로모션 삭제
   * @param {number} promotionId - 프로모션 ID
   * @returns {Promise<void>}
   */
  deletePromotion: async (promotionId) => {
    await axios.delete(
      `${ORDERING_API_BASE_URL}/api/promotions/${promotionId}`
    );
  },

  /**
   * 프로모션 목록 조회
   * @returns {Promise<Array>}
   */
  getAllPromotions: async () => {
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/api/promotions`
    );
    return response.data?.result || response.data || [];
  },

  /**
   * 프로모션 상세 조회
   * @param {number} promotionId - 프로모션 ID
   * @returns {Promise<Object>}
   */
  getPromotion: async (promotionId) => {
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/api/promotions/${promotionId}`
    );
    return response.data?.result || response.data;
  },

  /**
   * 지점 상품별 프로모션 조회
   * @param {number} branchProductId - 지점 상품 ID
   * @returns {Promise<Array>}
   */
  getPromotionsByBranchProduct: async (branchProductId) => {
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/api/promotions/branch-product/${branchProductId}`
    );
    return response.data?.result || response.data || [];
  },

  /**
   * 활성화된 프로모션 조회
   * @returns {Promise<Array>}
   */
  getActivePromotions: async () => {
    const response = await axios.get(
      `${ORDERING_API_BASE_URL}/api/promotions/active`
    );
    return response.data?.result || response.data || [];
  },
};

export default promotionService;





