import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import OrderCompletePage from './OrderCompletePage';

function OrderCompletePageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const orderData = location.state?.orderData || JSON.parse(localStorage.getItem('paymentCompleted') || '{}')?.orderData;
  const paymentData = location.state?.paymentData || JSON.parse(localStorage.getItem('paymentCompleted') || '{}')?.paymentData;

  const handleBackToHome = () => {
    localStorage.removeItem('paymentCompleted');
    dispatch(clearCart());
    navigate('/shop');
  };

  const handleViewOrders = () => {
    navigate('/shop/mypage?tab=purchase');
  };

  if (!orderData && !paymentData) {
    // 데이터가 없으면 홈으로 리다이렉트
    navigate('/shop');
    return null;
  }

  return (
    <OrderCompletePage 
      orderData={orderData}
      paymentData={paymentData}
      onBackToHome={handleBackToHome}
      onViewOrders={handleViewOrders}
    />
  );
}

export default OrderCompletePageWrapper;

