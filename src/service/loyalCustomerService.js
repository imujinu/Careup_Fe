import axios from '../utils/axiosConfig';

// API Gateway를 통해 ordering 서버로 라우팅 (다른 서비스들과 동일)
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * 단골고객 관리 서비스
 * 관리자용: 단골고객 등록, 수정, 삭제, 조회
 */
export const loyalCustomerService = {
  /**
   * 지점별 단골고객 목록 조회
   * @param {number} branchId - 지점 ID
   * @returns {Promise<Array>}
   */
  getLoyalCustomersByBranch: async (branchId) => {
    // 게이트웨이를 통해 ordering 서버로 라우팅
    const url = `${API_BASE_URL}/api/loyal-customers/branch/${branchId}`;
    const response = await axios.get(url);
    // 단골고객 기준 정보 확인용 로그
    console.log('[단골고객 API 응답 확인]', {
      url,
      responseData: response.data,
      dataField: response.data?.data,
      resultField: response.data?.result,
      fullResponse: response.data
    });
    // 응답 구조: { success, code, message, data: [...] }
    // 또는: { result: [...] }
    // 또는: 배열 직접
    const data = response.data?.data ?? response.data?.result ?? 
                 (Array.isArray(response.data) ? response.data : []);
    return Array.isArray(data) ? data : [];
  },

  /**
   * 단골고객 상세 조회
   * @param {number} loyalCustomerId - 단골고객 ID
   * @returns {Promise<Object>}
   */
  getLoyalCustomer: async (loyalCustomerId) => {
    // 게이트웨이를 통해 ordering 서버로 라우팅
    const url = `${API_BASE_URL}/api/loyal-customers/${loyalCustomerId}`;
    const response = await axios.get(url);
    // 응답 구조: { success, code, message, data: {...} }
    // 또는: { result: {...} }
    return response.data?.data ?? response.data?.result ?? response.data;
  },

  /**
   * 단골고객 등록
   * @param {Object} data - { memberId, branchId, initialAmount?, initialOrderCount? }
   * @returns {Promise<Object>}
   */
  registerLoyalCustomer: async (data) => {
    // 게이트웨이를 통해 ordering 서버로 라우팅
    const url = `${API_BASE_URL}/api/loyal-customers`;
    const response = await axios.post(url, data);
    // 응답 구조: { success, code, message, data: {...} }
    // 또는: { result: {...} }
    return response.data?.data ?? response.data?.result ?? response.data;
  },

  /**
   * 단골고객 수정
   * @param {number} loyalCustomerId - 단골고객 ID
   * @param {Object} data - { totalAmount?, orderCount?, grade? }
   * @returns {Promise<Object>}
   */
  updateLoyalCustomer: async (loyalCustomerId, data) => {
    // 게이트웨이를 통해 ordering 서버로 라우팅
    const url = `${API_BASE_URL}/api/loyal-customers/${loyalCustomerId}`;
    const response = await axios.put(url, data);
    // 응답 구조: { success, code, message, data: {...} }
    // 또는: { result: {...} }
    return response.data?.data ?? response.data?.result ?? response.data;
  },

  /**
   * 단골고객 삭제
   * @param {number} loyalCustomerId - 단골고객 ID
   * @returns {Promise<void>}
   */
  deleteLoyalCustomer: async (loyalCustomerId) => {
    // 게이트웨이를 통해 ordering 서버로 라우팅
    const url = `${API_BASE_URL}/api/loyal-customers/${loyalCustomerId}`;
    await axios.delete(url);
  },

  /**
   * 등급별 단골고객 조회
   * @param {number} branchId - 지점 ID
   * @param {string} grade - 등급 (BRONZE, SILVER, GOLD, VIP)
   * @returns {Promise<Array>}
   */
  getLoyalCustomersByGrade: async (branchId, grade) => {
    // 게이트웨이를 통해 ordering 서버로 라우팅
    const url = `${API_BASE_URL}/api/loyal-customers/branch/${branchId}/grade/${grade}`;
    const response = await axios.get(url);
    // 응답 구조: { success, code, message, data: [...] }
    // 또는: { result: [...] }
    // 또는: 배열 직접
    const data = response.data?.data ?? response.data?.result ?? 
                 (Array.isArray(response.data) ? response.data : []);
    return Array.isArray(data) ? data : [];
  },
};

export default loyalCustomerService;

