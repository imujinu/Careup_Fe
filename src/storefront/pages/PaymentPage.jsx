import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';

const PaymentPage = ({ orderData, onBack, onPaymentSuccess, currentUser }) => {
  const dispatch = useDispatch();
  const { items: cartItems, totalAmount } = useSelector(state => state.cart);
  
  // orderData에 items가 있으면 단일 주문 (구매하기), 없으면 장바구니 주문
  const items = orderData?.items || cartItems;
  
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const hasProcessedPayment = useRef(false);
  const timeoutTimerRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState(null); // 남은 시간 (초)
  
  // 결제 타임아웃 설정 (30분 = 1800000ms)
  const PAYMENT_TIMEOUT = 30 * 60 * 1000; // 30분
  
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

  // 타임아웃 시 주문 취소 처리
  const handleTimeoutCancel = React.useCallback(async () => {
    if (!actualOrderData?.orderId) return;

    try {
      console.log('타임아웃으로 인한 주문 취소 처리 - orderId:', actualOrderData.orderId);
      await cartService.cancelOrder(actualOrderData.orderId);
      console.log('타임아웃 주문 취소 완료 - orderId:', actualOrderData.orderId);
      
      // 사용자에게 알림
      alert('결제 시간이 초과되어 주문이 자동으로 취소되었습니다.\n다시 주문해주세요.');
      
      // localStorage 정리
      localStorage.removeItem('currentOrderData');
      
      // 이전 페이지로 이동
      if (onBack) {
        onBack();
      } else {
        window.location.href = '/shop/cart';
      }
    } catch (error) {
      console.error('타임아웃 주문 취소 API 호출 실패:', error);
      // 에러가 나도 사용자에게는 알림 표시
      alert('주문이 자동 취소되었습니다.');
    }
  }, [actualOrderData?.orderId, onBack]);

  // 결제 페이지 타임아웃 처리 (30분 경과 시 주문 자동 취소)
  useEffect(() => {
    if (!actualOrderData?.orderId) return;

    // 주문 생성 시간 확인
    const orderCreatedTime = actualOrderData.createdAt 
      ? new Date(actualOrderData.createdAt).getTime() 
      : Date.now();
    
    const elapsedTime = Date.now() - orderCreatedTime;
    const remainingTime = PAYMENT_TIMEOUT - elapsedTime;

    // 이미 타임아웃이 지났다면 즉시 취소
    if (remainingTime <= 0) {
      console.log('주문이 이미 타임아웃되었습니다. 자동 취소 처리...');
      handleTimeoutCancel();
      return;
    }

    // 남은 시간 표시를 위한 타이머
    setTimeRemaining(Math.floor(remainingTime / 1000));

    const updateTimer = setInterval(() => {
      const newElapsedTime = Date.now() - orderCreatedTime;
      const newRemainingTime = PAYMENT_TIMEOUT - newElapsedTime;

      if (newRemainingTime <= 0) {
        clearInterval(updateTimer);
        handleTimeoutCancel();
      } else {
        setTimeRemaining(Math.floor(newRemainingTime / 1000));
      }
    }, 1000);

    // 타임아웃 발생 시 주문 취소
    timeoutTimerRef.current = setTimeout(() => {
      console.log('결제 타임아웃 발생. 주문 자동 취소 처리...');
      handleTimeoutCancel();
    }, remainingTime);

    // 컴포넌트 언마운트 또는 페이지 이탈 시 타이머 정리
    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
      clearInterval(updateTimer);
    };
  }, [actualOrderData?.orderId, actualOrderData?.createdAt, handleTimeoutCancel]);

  // 시간 포맷팅 (분:초)
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 결제 처리
  const handlePayment = async () => {
    if (!actualOrderData) {
      alert('주문 정보가 없습니다.');
      return;
    }

    // 타임아웃 타이머 취소 (결제 시작 시)
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    setTimeRemaining(null);

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
      const orderItemCount = items?.length || 1;
      const orderItemName = orderItemCount === 1 
        ? items[0]?.productName || '상품'
        : `${orderItemCount}개 상품`;
      
      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: actualAmount,
        },
        orderId: tossOrderId,
        orderName: `Care Up 주문 (${orderItemName})`,
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
        
        // 사용자가 결제를 취소한 경우 주문 취소 처리
        if (actualOrderData?.orderId) {
          try {
            console.log('결제 취소로 인한 주문 취소 처리 - orderId:', actualOrderData.orderId);
            await cartService.cancelOrder(actualOrderData.orderId);
            console.log('주문 취소 완료 - orderId:', actualOrderData.orderId);
          } catch (cancelError) {
            console.error('주문 취소 API 호출 실패:', cancelError);
            // 주문 취소 실패해도 사용자에게는 에러 표시하지 않음 (사용자가 취소한 것이므로)
          }
        }
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
          {timeRemaining !== null && timeRemaining > 0 && (
            <span style={{ 
              marginLeft: '20px', 
              color: timeRemaining < 300 ? '#dc3545' : '#666',
              fontWeight: timeRemaining < 300 ? 'bold' : 'normal'
            }}>
              ⏱️ 남은 시간: {formatTime(timeRemaining)}
            </span>
          )}
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
