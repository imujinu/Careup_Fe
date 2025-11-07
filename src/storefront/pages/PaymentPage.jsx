import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';

const PaymentPage = ({ orderData, onBack, onPaymentSuccess, currentUser }) => {
  const dispatch = useDispatch();
  const { items: cartItems, totalAmount } = useSelector(state => state.cart);
  
  const [loading, setLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const hasProcessedPayment = useRef(false);
  const [orderStatus, setOrderStatus] = useState(null); // 주문 상태 확인용
  const [isOrderCancelled, setIsOrderCancelled] = useState(false);
  const [orderCreatedAt, setOrderCreatedAt] = useState(null); // 주문 생성 시간
  const [timeRemaining, setTimeRemaining] = useState(null); // 남은 시간 (초 단위)
  
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

  // orderData prop이 변경되면 actualOrderData 업데이트
  useEffect(() => {
    if (orderData) {
      console.log('🔄 orderData prop 변경됨:', orderData);
      setActualOrderData(orderData);
      localStorage.setItem('currentOrderData', JSON.stringify(orderData));
    }
  }, [orderData]);

  // orderData에 items가 있으면 단일 주문 (구매하기), 없으면 장바구니 주문
  const items = actualOrderData?.items || orderData?.items || cartItems;

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

  // 주문 생성 시간 확인 및 저장
  useEffect(() => {
    if (actualOrderData?.orderId && !orderCreatedAt) {
      // 주문 상세 조회하여 생성 시간 확인
      cartService.getOrderDetail(actualOrderData.orderId)
        .then(response => {
          const order = response?.data || response;
          const createdAt = order.createdAt || order.created_at;
          if (createdAt) {
            setOrderCreatedAt(new Date(createdAt).getTime());
          }
        })
        .catch(error => {
          console.error('주문 생성 시간 조회 실패:', error);
          // 현재 시간을 기준으로 추정 (백엔드에서 주문 생성 시간을 반환하지 않는 경우)
          setOrderCreatedAt(Date.now());
        });
    }
  }, [actualOrderData?.orderId, orderCreatedAt]);

  // 남은 시간 계산 및 표시
  useEffect(() => {
    if (!orderCreatedAt || isOrderCancelled) {
      setTimeRemaining(null);
      return;
    }

    const timeoutMs = 60 * 1000; // 1분
    const updateTimeRemaining = () => {
      const elapsed = Date.now() - orderCreatedAt;
      const remaining = timeoutMs - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsOrderCancelled(true);
        alert('주문시간이 초과되어 결제가 취소되었습니다.\n\n장바구니로 돌아갑니다.');
        localStorage.removeItem('currentOrderData');
        window.location.href = '/shop?page=cart';
        return;
      }

      setTimeRemaining(Math.floor(remaining / 1000)); // 초 단위로 변환
    };

    // 즉시 한 번 실행
    updateTimeRemaining();

    // 1초마다 업데이트
    const intervalId = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(intervalId);
  }, [orderCreatedAt, isOrderCancelled]);

  // 시간 포맷 함수 (초를 MM:SS 형식으로 변환)
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 주문 상태 주기적 확인 (타임아웃 주문 감지)
  useEffect(() => {
    if (!actualOrderData?.orderId || isOrderCancelled) return;

    const checkOrderStatus = async () => {
      try {
        const response = await cartService.getOrderDetail(actualOrderData.orderId);
        const order = response?.data || response;
        const status = order.orderStatus || order.status;
        
        setOrderStatus(status);
        
        // 주문 생성 시간 업데이트 (처음 한 번만)
        if (!orderCreatedAt && order.createdAt) {
          setOrderCreatedAt(new Date(order.createdAt).getTime());
        }
        
        // 주문이 취소된 경우
        if (status === 'CANCELLED') {
          setIsOrderCancelled(true);
          
          // 전체 화면 alert로 표시하고 결제 페이지 종료
          alert('주문시간이 초과되어 결제가 취소되었습니다.\n\n장바구니로 돌아갑니다.');
          
          // 주문 정보 삭제
          localStorage.removeItem('currentOrderData');
          
          // 장바구니로 이동
          window.location.href = '/shop?page=cart';
          
          return; // 더 이상 확인하지 않음
        }
      } catch (error) {
        console.error('주문 상태 확인 실패:', error);
        // 에러가 발생해도 결제는 계속 진행 가능하도록 함
      }
    };

    // 즉시 한 번 확인
    checkOrderStatus();

    // 1초마다 주문 상태 확인 (더 빠른 반응을 위해 주기 단축)
    const interval = setInterval(checkOrderStatus, 1000);

    return () => clearInterval(interval);
  }, [actualOrderData?.orderId, onBack, isOrderCancelled, orderCreatedAt]);

  // 결제 처리
  const handlePayment = async () => {
    if (!actualOrderData) {
      alert('주문 정보가 없습니다.');
      return;
    }

    // 주문이 취소된 경우 결제 불가
    if (isOrderCancelled || orderStatus === 'CANCELLED') {
      alert('주문시간이 초과되어 결제가 취소되었습니다.\n\n장바구니로 돌아갑니다.');
      // 주문 정보 삭제
      localStorage.removeItem('currentOrderData');
      // 장바구니로 이동
      window.location.href = '/shop?page=cart';
      return;
    }

    try {
      setLoading(true);
      setPaymentError(null);

      // 결제 전 마지막으로 주문 상태 한 번 더 확인
      try {
        const response = await cartService.getOrderDetail(actualOrderData.orderId);
        const order = response?.data || response;
        const status = order.orderStatus || order.status;
        
        if (status === 'CANCELLED') {
          throw new Error('주문이 취소되었습니다. 새로운 주문을 생성해주세요.');
        }
      } catch (error) {
        if (error.message.includes('취소')) {
          throw error;
        }
        // 다른 에러는 무시하고 결제 진행
      }

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
              color: timeRemaining < 10 ? '#dc3545' : '#666',
              fontWeight: timeRemaining < 10 ? 'bold' : 'normal'
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
                <img 
                  src={item.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"} 
                  alt={item.productName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
                  }}
                />
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
            {isOrderCancelled && (
              <div className="error-message" style={{ marginBottom: '16px', backgroundColor: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '8px' }}>
                ⚠️ 주문시간이 초과되어 결제가 취소되었습니다. 다시 결제해주세요.
              </div>
            )}
            <button 
              className="payment-btn" 
              onClick={handlePayment} 
              disabled={loading || isOrderCancelled}
              style={isOrderCancelled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {loading ? '결제 처리 중...' : 
               isOrderCancelled ? '주문이 취소되었습니다' :
               `${actualOrderData?.totalAmount ? actualOrderData.totalAmount.toLocaleString() : '0'}원 결제하기`}
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
