import React from 'react';

const OrderCompletePage = ({ orderData, paymentData, onBackToHome, onViewOrders }) => {
  return (
    <div className="container order-complete-page">
      <div className="complete-header">
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22,4 12,14.01 9,11.01"></polyline>
          </svg>
        </div>
        <h1>주문이 완료되었습니다!</h1>
        <p className="complete-message">
          주문이 성공적으로 처리되었습니다.<br />
          주문 내역은 마이페이지에서 확인하실 수 있습니다.
        </p>
      </div>

      <div className="order-details">
        <div className="detail-section">
          <h3>주문 정보</h3>
          <div className="detail-content">
            <div className="detail-row">
              <span className="label">주문번호</span>
              <span className="value">{orderData?.orderId || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="label">주문일시</span>
              <span className="value">
                {orderData?.createdAt ? 
                  new Date(orderData.createdAt).toLocaleString('ko-KR') : 
                  new Date().toLocaleString('ko-KR')
                }
              </span>
            </div>
            <div className="detail-row">
              <span className="label">주문상태</span>
              <span className="value status-pending">주문 접수</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>결제 정보</h3>
          <div className="detail-content">
            <div className="detail-row">
              <span className="label">결제금액</span>
              <span className="value amount">
                {paymentData?.amount ? 
                  paymentData.amount.toLocaleString() : 
                  orderData?.totalAmount?.toLocaleString() || '0'
                }원
              </span>
            </div>
            <div className="detail-row">
              <span className="label">결제수단</span>
              <span className="value">카드 결제</span>
            </div>
            <div className="detail-row">
              <span className="label">결제상태</span>
              <span className="value status-complete">결제 완료</span>
            </div>
          </div>
        </div>

        {/* 배송 정보 섹션 제거 */}
      </div>

      <div className="next-steps">
        <h3>다음 단계</h3>
        <div className="steps-list">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>주문 확인</h4>
              <p>지점에서 주문을 확인하고 상품을 준비합니다.</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>상품 준비</h4>
              <p>주문하신 상품을 포장하고 픽업 준비를 완료합니다.</p>
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>픽업 안내</h4>
              <p>준비 완료 시 픽업 안내 메시지를 받으실 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="complete-actions">
        <button 
          className="btn-primary"
          onClick={() => onBackToHome && onBackToHome()}
        >
          홈으로 가기
        </button>
        <button 
          className="btn-secondary"
          onClick={() => {
            if (onViewOrders) {
              onViewOrders();
            } else {
              alert('마이페이지로 이동합니다.');
            }
          }}
        >
          주문 내역 보기
        </button>
      </div>

      <div className="help-section">
        <h4>도움이 필요하신가요?</h4>
        <p>주문 관련 문의사항이 있으시면 고객센터로 연락해주세요.</p>
        <div className="contact-info">
          <span>고객센터: 1588-7813</span>
          <span>운영시간: 평일 10:00 - 18:00</span>
        </div>
      </div>
    </div>
  );
};

export default OrderCompletePage;
