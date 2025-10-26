import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';

const PaymentPage = ({ orderData, onBack, onPaymentSuccess, currentUser }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector(state => state.cart);
  
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  // 토스페이먼츠 SDK 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 결제 처리
  const handlePayment = async () => {
    if (!orderData) {
      alert('주문 정보가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setPaymentError(null);

      // 토스페이먼츠 결제 위젯 초기화
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
      
      if (!window.TossPayments) {
        throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다.');
      }

      const tossPayments = window.TossPayments(clientKey);

      // 토스페이먼츠용 orderId 생성 (영문 대소문자, 숫자, 특수문자(-, _)만 허용, 6자 이상 64자 이하)
      const tossOrderId = `CAREUP_ORDER_${orderData.orderId}`;

      // 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: totalAmount,
        orderId: tossOrderId,
        orderName: `Care Up 주문 (${items.length}개 상품)`,
        customerName: currentUser?.name || currentUser?.nickname || '고객',
        customerEmail: currentUser?.email || 'customer@example.com',
        successUrl: `${window.location.origin}/shop/payment-success`,
        failUrl: `${window.location.origin}/shop/payment-fail`,
      });

    } catch (error) {
      console.error('결제 실패:', error);
      setPaymentError(error.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 결제 성공 처리 (URL 파라미터에서 호출)
  const handlePaymentSuccess = async (paymentKey, orderId, amount, tossOrderId) => {
    try {
      setLoading(true);
      setPaymentError(null);

      // 결제 승인 API 호출 (실제 주문 ID 사용)
      const response = await cartService.processPayment(orderId, {
        paymentKey,
        orderId: tossOrderId, // 토스페이먼츠 orderId
        amount
      });

      console.log('결제 승인 성공:', response);

      // 장바구니 비우기
      dispatch(clearCart());

      // 주문 완료 페이지로 이동
      if (onPaymentSuccess) {
        onPaymentSuccess(response.data || response.result || response);
      }

    } catch (error) {
      console.error('결제 승인 실패:', error);
      setPaymentError(error.response?.data?.message || error.message || '결제 승인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // URL 파라미터 확인 (결제 성공/실패 처리)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentKey = urlParams.get('paymentKey');
    const orderId = urlParams.get('orderId'); // 실제 주문 ID
    const tossOrderId = urlParams.get('tossOrderId'); // 토스페이먼츠 orderId
    const amount = urlParams.get('amount');

    if (paymentKey && orderId && amount) {
      handlePaymentSuccess(paymentKey, orderId, parseInt(amount), tossOrderId);
    }
  }, []);

  if (!orderData) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>주문 정보가 없습니다</h2>
        <button 
          className="btn-primary"
          onClick={() => onBack && onBack()}
          style={{ marginTop: "20px" }}
        >
          주문 페이지로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="container payment-page">
      <div className="payment-header">
        <h1>결제하기</h1>
        <div className="order-info">
          <span>주문번호: {orderData.orderId}</span>
        </div>
      </div>

      {paymentError && (
        <div className="error-message">
          {paymentError}
        </div>
      )}

      <div className="payment-content">
        <div className="payment-items">
          <div className="payment-items-header">
            <h3>결제 상품</h3>
          </div>
          {items.map(item => (
            <div key={item.branchProductId} className="payment-item">
              <div className="item-image">
                <img src={item.imageUrl || 'https://via.placeholder.com/60'} alt={item.productName} />
              </div>
              <div className="item-info">
                <h4 className="item-name">{item.productName}</h4>
                <p className="item-price">{item.price.toLocaleString()}원 × {item.quantity}개</p>
              </div>
              <div className="item-total">
                <span className="total-price">{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>

        <div className="payment-summary">
          <div className="summary-header">
            <h3>결제 정보</h3>
          </div>
          <div className="summary-content">
            <div className="summary-row">
              <span>총 상품 금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>0원</span>
            </div>
            <div className="summary-row total">
              <span>총 결제 금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
          
          <div className="payment-methods">
            <h4>결제 수단</h4>
            <div className="payment-method-options">
              <label className="payment-method-option">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="card" 
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>카드 결제</span>
              </label>
              <label className="payment-method-option">
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="bank" 
                  checked={paymentMethod === 'bank'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>계좌이체</span>
              </label>
            </div>
          </div>
          
          <div className="payment-actions">
            <button 
              className="payment-btn" 
              onClick={handlePayment} 
              disabled={loading}
            >
              {loading ? '결제 처리 중...' : `${totalAmount.toLocaleString()}원 결제하기`}
            </button>
            
            <button 
              className="btn-secondary"
              onClick={() => onBack && onBack()}
            >
              주문 페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
