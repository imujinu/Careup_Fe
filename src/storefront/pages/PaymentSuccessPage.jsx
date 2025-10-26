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
        const orderId = urlParams.get('orderId');
        const amount = urlParams.get('amount');

        if (!paymentKey || !orderId || !amount) {
          throw new Error('결제 정보가 올바르지 않습니다.');
        }

        // 결제 승인 API 호출
        const response = await cartService.processPayment(orderId, {
          paymentKey,
          orderId,
          amount: parseInt(amount)
        });

        console.log('결제 승인 성공:', response);
        
        // 장바구니 비우기
        dispatch(clearCart());
        
        setPaymentData(response.data || response.result || response);
        
        // 3초 후 주문 완료 페이지로 이동
        setTimeout(() => {
          navigate('/shop/order-complete', { 
            state: { 
              orderData: { orderId: parseInt(orderId) },
              paymentData: response.data || response.result || response
            }
          });
        }, 3000);

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
