import customerAxios from '../utils/customerAxios';
import { customerAuthService } from './customerAuthService';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL;

export const customerProductService = {
  // 상품 조회 기록 POST 요청 (로그인 상태에서만)
  recordProductView: async (productId) => {
    try {
      const userInfo = customerAuthService.getCurrentUser();
      
      // 로그인 상태가 아니면 요청하지 않음
      if (!userInfo || !userInfo.memberId || !productId) {
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
      console.error('❌ 상품 조회 기록 실패:', error);
      return null;
    }
  },
};

export default customerProductService;

