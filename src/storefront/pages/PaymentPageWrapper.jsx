import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PaymentPage from './PaymentPage';
import { useShopAuth } from '../hooks/useShopAuth';
import { useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';

function PaymentPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentUser, isLoggedIn } = useShopAuth();
  const orderDataFromState = location.state?.orderData;

  const handleBack = () => {
    const orderData = orderDataFromState || JSON.parse(localStorage.getItem('currentOrderData') || '{}');
    if (orderData?.isSingleOrder) {
      navigate(-1);
    } else {
      navigate('/shop/order');
    }
  };

  const handlePaymentSuccess = (payment) => {
    dispatch(clearCart());
    const orderData = orderDataFromState || JSON.parse(localStorage.getItem('currentOrderData') || '{}');
    const paymentCompleted = {
      orderData,
      paymentData: payment
    };
    localStorage.setItem('paymentCompleted', JSON.stringify(paymentCompleted));
    navigate('/shop/order-complete', { state: { orderData, paymentData: payment } });
  };

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>로그인이 필요합니다</h2>
        <p>결제를 하려면 로그인해주세요.</p>
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
    <PaymentPage 
      orderData={orderDataFromState}
      onBack={handleBack}
      onPaymentSuccess={handlePaymentSuccess}
      currentUser={currentUser}
    />
  );
}

export default PaymentPageWrapper;

