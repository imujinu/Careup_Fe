import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';

const OrderPage = ({ onBack, onProceedToPayment, currentUser, orderData }) => {
  const dispatch = useDispatch();
  const { items: cartItems, branchId: cartBranchId, totalAmount: cartTotalAmount } = useSelector(state => state.cart);
  
  // orderData가 있으면 단일 주문, 없으면 장바구니 주문
  const isSingleOrder = orderData?.isSingleOrder;
  const items = orderData?.items || cartItems;
  const branchId = orderData?.branchId || cartBranchId;
  const totalAmount = orderData?.totalAmount || cartTotalAmount || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderId, setOrderId] = useState(null);
  
  // 주문 고객정보
  const [customerName, setCustomerName] = useState(currentUser?.name || currentUser?.nickname || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  
  // 배송정보
  const [deliveryType, setDeliveryType] = useState('배송'); // 배송 / 매장픽업
  const [postcode, setPostcode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');

  // 주문 생성 (장바구니 또는 단일 주문)
  const handleCreateOrder = async () => {
    if (items.length === 0) {
      alert('주문할 상품이 없습니다.');
      return;
    }

    // 고객정보 확인
    if (!customerName || !customerPhone || !customerEmail) {
      alert('주문 고객정보를 모두 입력해주세요.');
      return;
    }

    // 배송정보 확인 (배송인 경우만)
    if (deliveryType === '배송') {
      if (!postcode || !address || !addressDetail) {
        alert('배송정보를 모두 입력해주세요.');
        return;
      }
    }

    try {
      setLoading(true);
      setOrderError(null);
      
      // 주문 데이터 구성
      const orderItems = items.map(item => ({
        branchProductId: Number(item.branchProductId),
        quantity: item.quantity
      }));

      const orderRequestData = {
        memberId: Number(currentUser?.memberId || 1),
        branchId: Number(branchId),
        orderType: 'ONLINE',
        orderItems: orderItems,
        couponId: null
      };

      // 주문 생성 API 호출
      const response = await cartService.createOrder(orderRequestData);

      const created = response?.data?.data || response?.data || response;

      // 주문 ID 저장
      const orderId = created?.orderId;
      setOrderId(orderId);
      
      // 결제 페이지로 진행 (주문 정보 포함)
      if (onProceedToPayment) {
        onProceedToPayment({
          orderId,
          totalAmount: created?.totalAmount ?? totalAmount,
          items,
          branchId,
          customerName,
          customerPhone,
          customerEmail,
          deliveryType,
          postcode,
          address,
          addressDetail
        });
      }
      
    } catch (error) {
      console.error('주문 생성 실패:', error);
      // 백엔드 에러 메시지 추출
      const errorMessage = error.response?.data?.status_message || 
                          error.response?.data?.message || 
                          error.message || 
                          '주문 처리 중 오류가 발생했습니다.';
      setOrderError(errorMessage);
      
      // 재고 부족 에러인 경우 사용자에게 알림
      if (errorMessage.includes('재고') || errorMessage.includes('소진')) {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <h2>주문할 상품이 없습니다</h2>
        <p>상품을 선택해주세요!</p>
        <button 
          className="btn-primary"
          onClick={() => onBack && onBack()}
          style={{ marginTop: "20px" }}
        >
          {isSingleOrder ? '상품 상세로 돌아가기' : '쇼핑하러 가기'}
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
            <span>다중 지점 주문</span>
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
                <p className="item-price">{item.price.toLocaleString()}원</p>
                <div className="item-quantity">
                  <span>수량: {item.quantity}개</span>
                </div>
                <div className="item-branch">
                  <span>구매 지점: 지점 {branchId}</span>
                </div>
              </div>
              <div className="item-total">
                <span className="total-price">{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>

        <div className="order-forms">
          {/* 주문 고객정보 */}
          <div className="order-form-section">
            <h3>주문 고객정보</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>이름 *</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="이름"
                  required
                />
              </div>
              <div className="form-group">
                <label>휴대폰 번호 *</label>
                <input 
                  type="tel" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  required
                />
              </div>
              <div className="form-group">
                <label>이메일 *</label>
                <input 
                  type="email" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* 배송정보 */}
          <div className="order-form-section">
            <h3>배송정보</h3>
            <div className="delivery-tabs" style={{ marginBottom: '16px' }}>
              <button 
                className={`delivery-tab ${deliveryType === '배송' ? 'active' : ''}`}
                onClick={() => setDeliveryType('배송')}
              >
                일반 택배
              </button>
              <button 
                className={`delivery-tab ${deliveryType === '매장픽업' ? 'active' : ''}`}
                onClick={() => setDeliveryType('매장픽업')}
              >
                매장 픽업
              </button>
            </div>
            {deliveryType === '배송' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>우편번호 *</label>
                  <input 
                    type="text" 
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="우편번호"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>주소 *</label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="주소"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>상세 주소 *</label>
                  <input 
                    type="text" 
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    placeholder="상세 주소"
                    required
                  />
                </div>
              </div>
            )}
            {deliveryType === '매장픽업' && (
              <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p style={{ margin: 0, color: '#666' }}>매장 픽업을 선택하셨습니다. 주문 완료 후 매장에서 픽업 가능합니다.</p>
              </div>
            )}
          </div>
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
              {isSingleOrder ? '상품 상세로 돌아가기' : '장바구니로 돌아가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPage;
