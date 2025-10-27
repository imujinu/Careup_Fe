import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../../service/cartService';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        setLoading(true);
        
        // URL 파라미터에서 결제 정보 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get('paymentKey');
        const amount = urlParams.get('amount');
        
        // orderId는 여러 개 올 수 있음 (첫 번째 것 사용)
        const allOrderIds = urlParams.getAll('orderId');
        const orderId = allOrderIds[0];

        console.log('✅ URL 파라미터:', { paymentKey, orderId, amount, allOrderIds });

        if (!paymentKey || !orderId || !amount) {
          throw new Error('결제 정보가 올바르지 않습니다.');
        }

        // CAREUP_ORDER_X에서 숫자만 추출해서 백엔드로 전달
        const numericOrderId = orderId.replace('CAREUP_ORDER_', '');
        console.log('숫자로 변환된 주문 ID:', numericOrderId);
        
        // 결제 승인 API 호출
        const response = await cartService.processPayment(numericOrderId, {
          paymentKey,
          orderId: numericOrderId, // 숫자만 전달 (백엔드에서 getTossOrderId()로 변환)
          amount: parseInt(amount)
        });

        console.log('결제 승인 성공:', response);
        
        // 주문된 상품들만 백엔드 장바구니에서 삭제
        try {
          const memberId = JSON.parse(localStorage.getItem('customerUser'))?.memberId;
          
          if (memberId) {
            // 회원의 장바구니 전체 조회
            const cartList = await cartService.getCartsByMember(memberId);
            console.log('회원의 장바구니:', cartList);
            
            // 주문된 상품들의 branchProductId 목록
            const orderedProductIds = new Set(
              (response?.data?.order?.orderItems || response?.order?.orderItems || []).map(item => 
                item.branchProductId || item.branch_product_id
              )
            );
            
            console.log('주문된 상품 IDs:', orderedProductIds);
            
            // 주문된 상품만 장바구니에서 삭제
            if (cartList && Array.isArray(cartList)) {
              for (const cartItem of cartList) {
                if (orderedProductIds.has(cartItem.branchProductId || cartItem.branch_product_id)) {
                  try {
                    await cartService.deleteCart(cartItem.cartId || cartItem.cart_id);
                    console.log('장바구니 항목 삭제:', cartItem.cartId);
                  } catch (error) {
                    console.error('개별 장바구니 항목 삭제 실패:', error);
                  }
                }
              }
            }
            
            console.log('백엔드 장바구니에서 주문 상품 삭제 완료');
          }
        } catch (error) {
          console.error('장바구니 삭제 실패:', error);
        }
        
        // 프론트엔드 장바구니는 전체 비우기 (주문 완료 후)
        dispatch(clearCart());
        
        setPaymentData(response.data || response.result || response);
        
        // 즉시 주문 완료 페이지로 이동
        navigate('/shop/order-complete', { 
          state: { 
            orderData: { orderId: parseInt(orderId) },
            paymentData: response.data || response.result || response
          }
        });

      } catch (error) {
        console.error('결제 승인 실패:', error);
        setError(error.message || '결제 승인 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [navigate, dispatch]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="loading-spinner">
          <h2>결제 승인 중...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="error-message">
          <h2>결제 승인 실패</h2>
          <p>{error}</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/shop')}
            style={{ marginTop: "20px" }}
          >
            쇼핑몰로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
      <div className="success-message">
        <h2>✅ 결제가 완료되었습니다!</h2>
        <p>주문 완료 페이지로 이동합니다...</p>
        <div className="loading-spinner" style={{ marginTop: "20px" }}>
          <div className="spinner"></div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
