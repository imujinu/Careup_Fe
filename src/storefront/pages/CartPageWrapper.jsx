import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CartPage from './CartPage';
import { useShopAuth } from '../hooks/useShopAuth';

function CartPageWrapper() {
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useShopAuth();

  const handleProceedToOrder = (order) => {
    localStorage.setItem('currentOrderData', JSON.stringify(order));
    navigate('/shop/payment', { state: { orderData: order } });
  };

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>로그인이 필요합니다</h2>
        <p>장바구니를 사용하려면 로그인해주세요.</p>
        <button 
          className="btn-primary"
          onClick={() => navigate('/shop/login')}
          style={{ marginTop: "20px" }}
        >
          로그인하기
        </button>
      </div>
    );
  }

  return (
    <CartPage 
      onBack={() => navigate('/shop/products')} 
      currentUser={currentUser} 
      onProceedToOrder={handleProceedToOrder} 
    />
  );
}

export default CartPageWrapper;




