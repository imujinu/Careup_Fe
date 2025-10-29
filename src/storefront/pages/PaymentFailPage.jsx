import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentFailPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ textAlign: "center", padding: "60px 0" }}>
      <div className="error-message">
        <h2>❌ 결제가 실패했습니다</h2>
        <p>결제 처리 중 오류가 발생했습니다.</p>
        <p>다시 시도하거나 다른 결제 수단을 이용해주세요.</p>
        
        <div style={{ marginTop: "30px" }}>
          <button 
            className="btn-primary"
            onClick={() => navigate('/shop/cart')}
            style={{ marginRight: "10px" }}
          >
            장바구니로 돌아가기
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/shop')}
          >
            쇼핑몰로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailPage;
