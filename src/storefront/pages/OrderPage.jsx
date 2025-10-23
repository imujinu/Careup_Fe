import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';

const OrderPage = ({ onBack, onProceedToPayment, currentUser }) => {
  const dispatch = useDispatch();
  const { items, branchId, totalAmount } = useSelector(state => state.cart);
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // 주문 생성
  const handleCreateOrder = async () => {
    if (items.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    if (!selectedBranch) {
      alert('지점을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setOrderError(null);

      // 주문 데이터 구성
      const orderData = {
        memberId: currentUser?.memberId || 1,
        branchId: selectedBranch.branchId,
        orderType: 'ONLINE',
        orderItems: items.map(item => ({
          branchProductId: item.branchProductId,
          quantity: item.quantity
        })),
        couponId: null
      };

      console.log('주문 데이터:', orderData);

      // 주문 생성 API 호출
      const response = await cartService.createOrder(orderData);
      
      console.log('주문 생성 성공:', response);
      
      // 주문 ID 저장
      setOrderId(response.result.orderId);
      
      // 결제 페이지로 진행
      if (onProceedToPayment) {
        onProceedToPayment(response.result);
      }
      
    } catch (error) {
      console.error('주문 생성 실패:', error);
      setOrderError(error.response?.data?.message || error.message || '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>장바구니가 비어있습니다</h2>
        <p>상품을 담아보세요!</p>
        <button 
          className="btn-primary"
          onClick={() => onBack && onBack()}
          style={{ marginTop: "20px" }}
        >
          쇼핑하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="container order-page">
      <div className="order-header">
        <h1>주문하기</h1>
        <div className="order-info">
          <div className="branch-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>{selectedBranch?.branchName || '지점 미선택'}</span>
          </div>
          <span className="item-count">총 {items.length}개 상품</span>
        </div>
      </div>

      {orderError && (
        <div className="error-message">
          {orderError}
        </div>
      )}

      <div className="order-content">
        <div className="order-items">
          <div className="order-items-header">
            <h3>주문 상품</h3>
          </div>
          {items.map(item => (
            <div key={item.branchProductId} className="order-item">
              <div className="item-image">
                <img src={item.imageUrl || 'https://via.placeholder.com/80'} alt={item.productName} />
              </div>
              <div className="item-info">
                <h4 className="item-name">{item.productName}</h4>
                <p className="item-price">{item.price.toLocaleString()}원</p>
                <div className="item-quantity">
                  <span>수량: {item.quantity}개</span>
                </div>
              </div>
              <div className="item-total">
                <span className="total-price">{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>

        <div className="order-summary">
          <div className="summary-header">
            <h3>주문 정보</h3>
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
              <span>총 결제 예정 금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
          
          <div className="order-actions">
            <button 
              className="order-btn" 
              onClick={handleCreateOrder} 
              disabled={loading || items.length === 0}
            >
              {loading ? '주문 처리 중...' : '주문하기'}
            </button>
            
            <button 
              className="btn-secondary"
              onClick={() => onBack && onBack()}
            >
              장바구니로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
