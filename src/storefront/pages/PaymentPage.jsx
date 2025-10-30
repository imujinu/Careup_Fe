import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';

const PaymentPage = ({ orderData, onBack, onPaymentSuccess, currentUser }) => {
  const dispatch = useDispatch();
  const { items, totalAmount } = useSelector(state => state.cart);
  
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const hasProcessedPayment = useRef(false);
  
  // orderData가 없으면 localStorage에서 복원 시도
  const [actualOrderData, setActualOrderData] = useState(() => {
    if (orderData) return orderData;
    const saved = localStorage.getItem('currentOrderData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('📦 localStorage에서 orderData 복원:', parsed);
        return parsed;
      } catch (error) {
        console.error('localStorage 파싱 실패:', error);
        return null;
      }
    }
    return null;
  });

  // 토스페이먼츠 SDK 로드 (v2)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v2/standard';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 결제 처리
  const handlePayment = async () => {
    if (!actualOrderData) {
      alert('주문 정보가 없습니다.');
      return;
    }

    try {
      setLoading(true);
      setPaymentError(null);

      // 토스페이먼츠 v2 초기화
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
      const customerKey = `customer_${currentUser?.memberId || 1}`;
      
      if (!window.TossPayments) {
        throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다.');
      }

      const tossPayments = window.TossPayments(clientKey);
      
      // 토스페이먼츠용 orderId 생성 (타임스탬프 추가하여 중복 방지)
      const timestamp = Date.now();
      const tossOrderId = `CAREUP_ORDER_${actualOrderData.orderId}_${timestamp}`;
      const actualAmount = actualOrderData.totalAmount;
      
      console.log('결제 요청:', { tossOrderId, actualAmount });

      // 주문 정보 저장 (PaymentSuccessPage에서 사용)
      localStorage.setItem('currentOrderData', JSON.stringify(actualOrderData));

      // v2 Payment 인스턴스 생성
      const payment = tossPayments.payment({ customerKey });
      
      // 결제 요청 (v2 방식)
      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: actualAmount,
        },
        orderId: tossOrderId,
        orderName: `Care Up 주문 (${items.length}개 상품)`,
        customerEmail: currentUser?.email || 'customer@example.com',
        customerName: currentUser?.name || currentUser?.nickname || '고객',
        successUrl: `${window.location.origin}/shop/payment-success`,
        failUrl: `${window.location.origin}/shop/payment-fail`,
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });

    } catch (error) {
      if (error.code === 'USER_CANCEL') {
        console.log('사용자가 결제를 취소했습니다.');
      } else {
        console.error('결제 실패:', error);
        setPaymentError(error.message || '결제 처리 중 오류가 발생했습니다.');
      }
      setLoading(false);
    }
  };



  if (!actualOrderData) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>주문 정보가 없습니다</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          주문 정보를 복원할 수 없습니다. 장바구니에서 다시 주문해주세요.
        </p>
        <button 
          className="btn-primary"
          onClick={() => {
            localStorage.removeItem('currentOrderData');
            onBack && onBack();
          }}
          style={{ marginTop: "20px" }}
        >
          장바구니로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="container payment-page">
      <div className="payment-header">
        <h1>결제하기</h1>
        <div className="order-info">
          <span>주문번호: {actualOrderData?.orderId}</span>
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
              <span>
                {actualOrderData?.totalAmount ? actualOrderData.totalAmount.toLocaleString() : '0'}원
              </span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>0원</span>
            </div>
            <div className="summary-row total">
              <span>총 결제 금액</span>
              <span>
                {actualOrderData?.totalAmount ? actualOrderData.totalAmount.toLocaleString() : '0'}원
              </span>
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
              {loading ? '결제 처리 중...' : `${actualOrderData?.totalAmount ? actualOrderData.totalAmount.toLocaleString() : '0'}원 결제하기`}
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
