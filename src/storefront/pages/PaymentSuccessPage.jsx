import React, { useEffect, useRef, useState } from 'react';
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
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;
      try {
        setLoading(true);
        
        // URL 파라미터에서 결제 정보 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const paymentKey = urlParams.get('paymentKey');
        const amount = urlParams.get('amount');
        const orderId = urlParams.get('orderId'); // v2에서는 단일 orderId만 전달

        if (!paymentKey || !orderId || !amount) {
          throw new Error('결제 정보가 올바르지 않습니다.');
        }

        // localStorage에서 저장된 주문 정보 가져오기
        const orderData = JSON.parse(localStorage.getItem('currentOrderData') || '{}');
        
        // CAREUP_ORDER_X 또는 CAREUP_ORDER_X_timestamp 형식에서 실제 주문 ID만 추출
        // 형식: CAREUP_ORDER_123 또는 CAREUP_ORDER_123_1234567890
        const match = orderId.match(/^CAREUP_ORDER_(\d+)(?:_\d+)?$/);
        const numericOrderIdInt = match ? parseInt(match[1]) : parseInt(orderId.replace('CAREUP_ORDER_', ''));
        
        console.log('💳 결제 승인 요청 시작:', { orderId: numericOrderIdInt, paymentKey, amount });
        
        // 백엔드에 결제 승인 요청
        // 백엔드는 Long.parseLong(request.getOrderId())를 사용하므로 숫자만 보내야 함
        const paymentRequestData = {
          paymentKey: paymentKey,
          orderId: numericOrderIdInt.toString(), // 숫자만 전송 (예: "4")
          amount: parseInt(amount)
        };
        
        console.log('📤 결제 승인 API 호출:', paymentRequestData);
        
        const paymentResponse = await cartService.processPayment(numericOrderIdInt, paymentRequestData);
        console.log('✅ 결제 승인 성공:', paymentResponse);
        
        // 장바구니 비우기
        dispatch(clearCart());
        
        // 백엔드 장바구니 삭제
        try {
          const customerUser = JSON.parse(localStorage.getItem('customerUser') || '{}');
          const memberId = customerUser?.memberId;
          
          if (memberId) {
            await cartService.clearCart(memberId);
          }
        } catch (error) {
          console.error('백엔드 장바구니 삭제 실패:', error);
        }

        // localStorage에 결제 완료 정보 저장
        const paymentResult = {
          orderId: numericOrderIdInt,
          paymentData: { paymentKey, amount: parseInt(amount), orderId },
          orderData: orderData,
          paymentResponse: paymentResponse
        };
        
        localStorage.setItem('paymentCompleted', JSON.stringify(paymentResult));
        localStorage.removeItem('currentOrderData');
        
        console.log('🎉 결제 완료! 주문 완료 페이지로 이동합니다.');
        
        // 주문 완료 페이지로 이동
        window.location.href = `/shop/order-complete`;

      } catch (error) {
        console.error('결제 성공 처리 실패:', error);
        setError(error.message || '결제 처리 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [dispatch]);

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
