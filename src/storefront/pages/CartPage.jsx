import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

const CartPage = ({ onBack, currentUser }) => {
  const dispatch = useDispatch();
  const { items, branchId, totalAmount } = useSelector(state => state.cart);
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // 장바구니가 비어있으면 홈으로 리다이렉트
  useEffect(() => {
    if (items.length === 0 && onBack) {
      onBack();
    }
  }, [items.length, onBack]);

  const handleQuantityChange = (branchProductId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(branchProductId));
    } else {
      dispatch(updateQuantity({ branchProductId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (branchProductId) => {
    if (window.confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
      dispatch(removeFromCart(branchProductId));
    }
  };

  const handleClearCart = () => {
    if (window.confirm('장바구니를 비우시겠습니까?')) {
      dispatch(clearCart());
      if (onBack) onBack();
    }
  };

  const handleOrder = async () => {
    if (items.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    if (!selectedBranch) {
      alert('지점을 선택해주세요.');
      return;
    }

    try {
      setOrderLoading(true);
      setOrderError(null);

      // 주문 데이터 구성 (백엔드 API 구조에 맞게)
      const orderData = {
        memberId: currentUser?.memberId || 1, // 로그인한 회원 ID 사용
        branchId: selectedBranch.branchId,
        orderType: 'ONLINE', // OrderType enum 값
        orderItems: items.map(item => ({
          branchProductId: item.branchProductId,
          quantity: item.quantity
        })),
        couponId: null // 쿠폰 미적용
      };

      console.log('주문 데이터:', orderData);

      // 주문 API 호출
      const response = await cartService.createOrder(orderData);
      
      console.log('주문 성공:', response);
      
      alert('주문이 완료되었습니다!');
      
      // 주문 완료 후 장바구니 비우기
      dispatch(clearCart());
      if (onBack) onBack();
      
    } catch (error) {
      console.error('주문 실패:', error);
      setOrderError(error.response?.data?.message || error.message || '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setOrderLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-cart">
          <h2>장바구니가 비어있습니다</h2>
          <p>상품을 담아보세요!</p>
          <button 
            className="btn-primary"
            onClick={() => onBack && onBack()}
          >
            쇼핑하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container cart-page">
      <div className="cart-header">
        <h1>장바구니</h1>
        <div className="cart-info">
          <span className="branch-info">
            📍 {selectedBranch?.branchName} ({selectedBranch?.address})
          </span>
          <span className="item-count">
            총 {items.length}개 상품
          </span>
        </div>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          <div className="cart-items-header">
            <h3>주문 상품</h3>
            <button 
              className="btn-secondary"
              onClick={handleClearCart}
            >
              전체 삭제
            </button>
          </div>
          
          {items.map((item) => (
            <div key={item.branchProductId} className="cart-item">
              <div className="item-image">
                <img 
                  src={item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80"} 
                  alt={item.productName}
                />
              </div>
              
              <div className="item-info">
                <h4 className="item-name">{item.productName}</h4>
                <div className="item-price">
                  {item.price.toLocaleString()}원
                </div>
                <div className="item-quantity">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.branchProductId, item.quantity - 1)}
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item.branchProductId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="item-total">
                <div className="total-price">
                  {(item.price * item.quantity).toLocaleString()}원
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.branchProductId)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-header">
            <h3>주문 요약</h3>
          </div>
          
          <div className="summary-content">
            <div className="summary-row">
              <span>상품 금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>무료</span>
            </div>
            <div className="summary-row total">
              <span>총 결제 금액</span>
              <span>{totalAmount.toLocaleString()}원</span>
            </div>
          </div>
          
          {orderError && (
            <div className="error-message">
              ❌ {orderError}
            </div>
          )}
          
          <button 
            className="order-btn"
            onClick={handleOrder}
            disabled={orderLoading || items.length === 0}
          >
            {orderLoading ? '주문 처리 중...' : '주문하기'}
          </button>
          
          <div className="cart-actions">
            <button 
              className="btn-secondary"
              onClick={() => onBack && onBack()}
            >
              계속 쇼핑하기
            </button>
            <button 
              className="btn-secondary"
              onClick={() => onBack && onBack()}
            >
              지점 변경
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
