import customerAxios from '../utils/customerAxios';

/**
 * 상품 문의 서비스
 * 주문한 상품에 대한 문의 관련 API 호출
 */
export const productInquiryService = {
  // 문의 작성
  createInquiry: async (inquiryData) => {
    try {
      const response = await customerAxios.post('/api/product-inquiries', inquiryData);
      return response.data?.result || response.data;
    } catch (error) {
      console.error('문의 작성 실패:', error);
      throw error;
    }
  },

  // 내 문의 목록 조회
  getMyInquiries: async (memberId) => {
    try {
      const response = await customerAxios.get(`/api/product-inquiries/my-inquiries/${memberId}`);
      return response.data?.result || response.data;
    } catch (error) {
      console.error('내 문의 목록 조회 실패:', error);
      throw error;
    }
  },

  // 문의 상세 조회
  getInquiry: async (inquiryId) => {
    try {
      const response = await customerAxios.get(`/api/product-inquiries/${inquiryId}`);
      return response.data?.result || response.data;
    } catch (error) {
      console.error('문의 상세 조회 실패:', error);
      throw error;
    }
  },

  // 문의 수정
  updateInquiry: async (inquiryId, inquiryData) => {
    try {
      const response = await customerAxios.put(`/api/product-inquiries/${inquiryId}`, inquiryData);
      return response.data?.result || response.data;
    } catch (error) {
      console.error('문의 수정 실패:', error);
      throw error;
    }
  },

  // 문의 삭제
  deleteInquiry: async (inquiryId) => {
    try {
      const response = await customerAxios.delete(`/api/product-inquiries/${inquiryId}`);
      return response.data?.result || response.data;
    } catch (error) {
      console.error('문의 삭제 실패:', error);
      throw error;
    }
  },

  // 상품별 문의 목록 조회
  getInquiriesByBranchProduct: async (branchProductId) => {
    try {
      const response = await customerAxios.get(`/api/product-inquiries/branch-product/${branchProductId}`);
      return response.data?.result || response.data;
    } catch (error) {
      console.error('상품별 문의 목록 조회 실패:', error);
      throw error;
    }
  },
};

export default productInquiryService;


