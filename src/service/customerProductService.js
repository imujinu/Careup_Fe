import customerAxios from '../utils/customerAxios';
import { customerAuthService } from './customerAuthService';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL;

export const customerProductService = {
  // 상품 조회 기록 POST 요청
  recordProductView: async (productId) => {
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
      
      // 로그인한 고객 정보 확인
      const isAuthenticated = customerAuthService.isAuthenticated();
      const currentUser = customerAuthService.getCurrentUser();
      const memberId = currentUser?.memberId;
      
      // 로그인하지 않았거나 memberId가 없으면 요청하지 않음
      if (!isAuthenticated || !memberId) {
        if (import.meta.env.DEV) {
          console.debug('상품 조회 기록: 로그인하지 않은 사용자이므로 스킵합니다.');
        }
        return null;
      }
      
      // POST 요청: /customers/product/{productId}?memberId={memberId}
      // ordering-service URL을 full path로 사용
      const response = await customerAxios.post(
        `${API_BASE_URL}/customers/product/${productId}?memberId=${memberId}`
      );
      
      return response.data;
    } catch (error) {
      // 조회 기록 실패해도 상품 상세는 표시되도록 에러를 무시
      const status = error?.response?.status;
      if (status === 500) {
        // 500 에러는 서버 내부 오류 (memberId 누락, DB 오류 등)
        if (import.meta.env.DEV) {
          console.warn('⚠️ 상품 조회 기록 API 서버 오류 (500):', error?.response?.data || error?.message);
        }
      } else if (status === 404) {
        // 404 에러는 엔드포인트가 없거나 상품이 없는 경우
        if (import.meta.env.DEV) {
          console.warn('⚠️ 상품 조회 기록 API가 아직 준비되지 않았습니다. (404 에러)');
        }
      } else if (status === 401 || status === 403) {
        // 인증/권한 에러는 조용히 무시 (고객이 로그인하지 않은 경우 정상)
        if (import.meta.env.DEV) {
          console.debug('상품 조회 기록: 인증이 필요합니다. (401/403 무시)');
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

  // 상품 조회 GET 요청 (클릭 시마다)
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
      
      // GET 요청: /customers/product/view/{productId}
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

