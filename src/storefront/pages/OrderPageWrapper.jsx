import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import OrderPage from './OrderPage';
import { useShopAuth } from '../hooks/useShopAuth';

function OrderPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isLoggedIn } = useShopAuth();
  const orderDataFromState = location.state?.orderData;

  const handleProceedToPayment = (order) => {
    localStorage.setItem('currentOrderData', JSON.stringify(order));
    navigate('/shop/payment', { state: { orderData: order } });
  };

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>로그인이 필요합니다</h2>
        <p>주문을 하려면 로그인해주세요.</p>
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
    <OrderPage 
      onBack={() => navigate('/shop/cart')} 
      onProceedToPayment={handleProceedToPayment}
      currentUser={currentUser}
      orderData={orderDataFromState}
    />
  );
}

export default OrderPageWrapper;


