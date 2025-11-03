import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../../service/cartService';

const PaymentFailPage = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePaymentFail = async () => {
      try {
        // URL 파라미터에서 결제 정보 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const message = urlParams.get('message');
        const orderId = urlParams.get('orderId'); // 토스페이먼츠 orderId (CAREUP_ORDER_X 형식)

        console.log('결제 실패 정보:', { code, message, orderId });

        // orderId가 있으면 실제 주문 ID 추출하여 주문 취소 처리
        if (orderId) {
          // CAREUP_ORDER_X 또는 CAREUP_ORDER_X_timestamp 형식에서 실제 주문 ID만 추출
          const match = orderId.match(/^CAREUP_ORDER_(\d+)(?:_\d+)?$/);
          const numericOrderId = match ? parseInt(match[1]) : null;

          if (numericOrderId) {
            console.log('주문 취소 처리 시작 - orderId:', numericOrderId);
            try {
              // 주문 취소 API 호출
              await cartService.cancelOrder(numericOrderId);
              console.log('주문 취소 완료 - orderId:', numericOrderId);
            } catch (cancelError) {
              console.error('주문 취소 API 호출 실패:', cancelError);
              // 주문 취소 실패해도 사용자에게는 에러 표시하지 않음 (이미 결제 실패 상태)
            }
          }
        } else {
          // localStorage에서 주문 정보 확인
          const orderData = JSON.parse(localStorage.getItem('currentOrderData') || '{}');
          if (orderData?.orderId) {
            console.log('localStorage에서 주문 ID 확인 - orderId:', orderData.orderId);
            try {
              await cartService.cancelOrder(orderData.orderId);
              console.log('주문 취소 완료 - orderId:', orderData.orderId);
            } catch (cancelError) {
              console.error('주문 취소 API 호출 실패:', cancelError);
            }
          }
        }
      } catch (error) {
        console.error('결제 실패 처리 중 오류:', error);
        setError('결제 실패 처리를 완료하지 못했습니다.');
      } finally {
        setProcessing(false);
      }
    };

    handlePaymentFail();
  }, []);

  if (processing) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="loading-spinner">
          <h2>결제 실패 처리 중...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
      <div className="error-message">
        <h2>❌ 결제가 실패했습니다</h2>
        <p>결제 처리 중 오류가 발생했습니다.</p>
        <p>다시 시도하거나 다른 결제 수단을 이용해주세요.</p>
        {error && (
          <p style={{ color: '#dc3545', marginTop: '10px' }}>{error}</p>
        )}
        
        <div style={{ marginTop: "30px" }}>
          <button 
            className="btn-primary"
            onClick={() => navigate('/shop/cart')}
            style={{ marginRight: "10px" }}
          >
            장바구니로 돌아가기
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/shop')}
          >
            쇼핑몰로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailPage;
