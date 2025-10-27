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
  
  // orderData에서 지점 정보 가져오기
  const selectedBranches = actualOrderData?.selectedBranches || {};
  const availableBranches = actualOrderData?.availableBranches || {};

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
    if (!actualOrderData) {
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
      const tossOrderId = `CAREUP_ORDER_${actualOrderData.orderId}`;
      
      // ✅ 백엔드가 DB에서 계산한 실제 주문 금액 사용 (orderData.totalAmount)
      // 프론트엔드가 계산한 금액과 불일치를 방지하기 위해 백엔드가 저장한 금액 사용
      const actualAmount = actualOrderData.totalAmount;
      
      console.log(`💰 총 결제 금액: ${actualAmount}원 (백엔드 DB 금액)`);
      console.log(`📋 주문 정보 전체:`, actualOrderData);
      console.log(`📦 주문 ID: ${actualOrderData.orderId}`);
      console.log(`💵 주문 금액 (totalAmount): ${actualOrderData.totalAmount}`);

      // 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: actualAmount,
        orderId: tossOrderId,
        orderName: `Care Up 주문 (${items.length}개 상품)`,
        customerName: currentUser?.name || currentUser?.nickname || '고객',
        customerEmail: currentUser?.email || 'customer@example.com',
        successUrl: `${window.location.origin}/shop/payment-success?orderId=${actualOrderData.orderId}`,
        failUrl: `${window.location.origin}/shop/payment-fail?orderId=${actualOrderData.orderId}`,
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

      console.log('🎉 결제 승인 시작 - paymentKey:', paymentKey, 'orderId:', orderId, 'amount:', amount);

      // CAREUP_ORDER_X에서 숫자만 추출해서 백엔드로 전달
      const numericOrderId = orderId.replace('CAREUP_ORDER_', '');
      console.log('숫자로 변환된 주문 ID:', numericOrderId);
      
      // 결제 승인 API 호출
      const response = await cartService.processPayment(numericOrderId, {
        paymentKey,
        orderId: numericOrderId, // 숫자만 전달 (백엔드에서 getTossOrderId()로 변환)
        amount
      });

      console.log('✅ 결제 승인 성공:', response);

      // 장바구니 비우기 (프론트엔드)
      dispatch(clearCart());
      
      // 백엔드 장바구니도 삭제
      try {
        const memberId = currentUser?.memberId;
        if (memberId) {
          await cartService.clearCart(memberId);
          console.log('백엔드 장바구니 삭제 완료');
        }
      } catch (error) {
        console.error('백엔드 장바구니 삭제 실패:', error);
      }

      // 결제 완료 정보를 localStorage에 저장
      const paymentResult = {
        orderId: parseInt(numericOrderId),
        paymentData: response.data || response.result || response,
        orderData: actualOrderData
      };
      localStorage.setItem('paymentCompleted', JSON.stringify(paymentResult));
      
      // localStorage 정리 (orderData)
      localStorage.removeItem('currentOrderData');
      
      console.log('✅ 결제 완료 정보 저장:', paymentResult);
      
      // 주문 완료 페이지로 리다이렉트
      window.location.href = `${window.location.origin}/shop/order-complete`;

    } catch (error) {
      console.error('결제 승인 실패:', error);
      setPaymentError(error.response?.data?.message || error.message || '결제 승인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // URL 파라미터 확인 (결제 성공/실패 처리) - 리다이렉트 후 체크
  useEffect(() => {
    let intervalId;
    
    const checkAndProcessPayment = () => {
      // localStorage로 중복 처리 체크 (영구적)
      const urlParams = new URLSearchParams(window.location.search);
      const paymentKey = urlParams.get('paymentKey');
      
      if (!paymentKey) {
        return false;
      }
      
      // 이미 처리된 paymentKey인지 확인
      const processedKey = `payment_processed_${paymentKey}`;
      if (localStorage.getItem(processedKey) === 'true') {
        console.log('⚠️ 이미 처리된 결제입니다. (localStorage 체크)', paymentKey);
        if (intervalId) clearInterval(intervalId);
        return true;
      }

      // 이미 처리된 경우 중복 실행 방지
      if (hasProcessedPayment.current) {
        console.log('⚠️ 이미 처리된 결제입니다. (current 플래그)');
        if (intervalId) clearInterval(intervalId);
        return true;
      }

      console.log('📍 현재 URL:', window.location.href);

      const allOrderIds = urlParams.getAll('orderId');
      const orderId = allOrderIds.length > 0 ? allOrderIds[0] : null;
      const tossOrderId = urlParams.get('tossOrderId');
      const amount = urlParams.get('amount');

      console.log('✅ 결제 성공 URL 파라미터:', { paymentKey, orderId, tossOrderId, amount, allOrderIds });

      if (paymentKey && orderId && amount) {
        hasProcessedPayment.current = true;
        
        // localStorage에 처리 완료 표시
        localStorage.setItem(processedKey, 'true');
        
        console.log('🔐 결제 승인 처리 시작:', { paymentKey, orderId, amount });
        if (intervalId) clearInterval(intervalId); // 즉시 interval 종료
        handlePaymentSuccess(paymentKey, orderId, parseInt(amount), tossOrderId);
        return true;
      }

      return false;
    };

    // 즉시 체크
    if (!checkAndProcessPayment()) {
      // URL 체크를 주기적으로 반복 (리다이렉트 감지)
      intervalId = setInterval(() => {
        const processed = checkAndProcessPayment();
        if (processed) {
          clearInterval(intervalId);
        }
      }, 500);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

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
                <p className="item-price">
                  {(() => {
                    const selectedBranchId = selectedBranches[item.productId];
                    const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                    const displayPrice = branch?.price || item.price;
                    return displayPrice.toLocaleString();
                  })()}원 × {item.quantity}개
                </p>
              </div>
              <div className="item-total">
                <span className="total-price">
                  {(() => {
                    const selectedBranchId = selectedBranches[item.productId];
                    const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                    const displayPrice = branch?.price || item.price;
                    return (displayPrice * item.quantity).toLocaleString();
                  })()}원
                </span>
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
