import customerAxios from '../utils/customerAxios';
import { customerAuthService } from './customerAuthService';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL;

export const customerProductService = {
  // 상품 조회 기록 POST 요청 (로그인 상태에서만)
  recordProductView: async (productId) => {
    try {
      const userInfo = customerAuthService.getCurrentUser();
      
      // 유효한 productId인지 확인 (정수이고 0보다 커야 함)
      const isValidProductId = productId != null && 
                               typeof productId === 'number' && 
                               Number.isInteger(productId) && 
                               productId > 0;
      
      // 로그인 상태가 아니거나 유효하지 않은 productId면 요청하지 않음
      if (!userInfo || !userInfo.memberId || !isValidProductId) {
        return null;
      }

      const memberId = userInfo.memberId;
      
      // POST 요청: /customers/product/{productId}?memberId={memberId}
      // ordering-service URL을 full path로 사용
      const response = await customerAxios.post(
        `${API_BASE_URL}/customers/product/${productId}`,
        null,
        {
          params: { memberId: memberId }
        }
      );
      
      return response.data;
    } catch (error) {
      // 조회 기록 실패해도 상품 상세는 표시되도록 에러를 무시
      // 백엔드 API가 아직 준비되지 않았거나 500 에러인 경우 조용히 무시
      const status = error?.response?.status;
      if (status === 500 || status === 404) {
        // 백엔드 API가 아직 구현되지 않은 경우 조용히 무시
        if (import.meta.env.DEV) {
          console.warn('⚠️ 상품 조회 기록 API가 아직 준비되지 않았습니다.');
        }
      } else {
        // 다른 에러는 개발 환경에서만 로깅
        if (import.meta.env.DEV) {
          console.error('❌ 상품 조회 기록 실패:', error);
        }
      }
      return null;
    }
  },

  // 상품 조회 GET 요청 (클릭 시마다) - 로그인 여부와 상관없이 요청
  recordProductViewClick: async (productId) => {
    try {
      // 유효한 productId인지 확인 (정수이고 0보다 커야 함)
      const isValidProductId = productId != null && 
                               typeof productId === 'number' && 
                               Number.isInteger(productId) && 
                               productId > 0;
      
      // 유효하지 않은 productId면 요청하지 않음
      if (!isValidProductId) {
        return null;
      }
      
      // GET 요청: /customers/product/view/{productId} (productId만 전송)
      const response = await customerAxios.post(
        `${API_BASE_URL}/customers/product/view/${productId}`
      );
      
      return response.data;
    } catch (error) {
      // 조회 기록 실패해도 상품 상세는 표시되도록 에러를 무시
      // 백엔드 API가 아직 준비되지 않았거나 500 에러인 경우 조용히 무시
      const status = error?.response?.status;
      if (status === 500 || status === 404) {
        // 백엔드 API가 아직 구현되지 않은 경우 조용히 무시
        if (import.meta.env.DEV) {
          console.warn('⚠️ 상품 조회 API가 아직 준비되지 않았습니다.');
        }
      } else {
        // 다른 에러는 개발 환경에서만 로깅
        if (import.meta.env.DEV) {
          console.error('❌ 상품 조회 실패:', error);
        }
      }
      return null;
    }
  },
};

export default customerProductService;

