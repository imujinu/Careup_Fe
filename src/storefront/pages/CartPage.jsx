import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart, setItemBranchSelection } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';
import axios from 'axios';

const CartPage = ({ onBack, currentUser, onProceedToOrder }) => {
  const dispatch = useDispatch();
  const { items, branchId, totalAmount } = useSelector(state => state.cart);
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedBranches, setSelectedBranches] = useState({});
  const [availableBranches, setAvailableBranches] = useState({});

  // 장바구니가 비어있으면 홈으로 리다이렉트
  useEffect(() => {
    if (items.length === 0 && onBack) {
      onBack();
    }
  }, [items.length, onBack]);

  // 각 상품별로 재고 있는 지점 조회 (선택 기본값 복원)
  useEffect(() => {
    const loadBranchInfo = async () => {
      const branchesData = {};
      const restoredSelections = {};

      for (const item of items) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

          // 상품별 지점 재고/가격 조회
          const response = await shopApi.get(`/inventory/branch-products/search`, {
            params: { keyword: item.productName }
          });

          const branchProducts = response?.data?.data || [];
          const productBranches = branchProducts.filter(bp => bp.productId === item.productId);

          if (productBranches.length > 0) {
            branchesData[item.productId] = productBranches.map(bp => ({
              branchProductId: bp.branchProductId || bp.id,
              branchId: bp.branchId,
              branchName: `지점 ${bp.branchId}`,
              stockQuantity: bp.stockQuantity || 0,
              price: bp.price || item.price
            }));
            // 기본 선택값: 현재 아이템 지점 또는 첫 지점
            restoredSelections[item.productId] = selectedBranches[item.productId] || item.branchId || productBranches[0].branchId;
          } else {
            branchesData[item.productId] = [{
              branchProductId: item.branchProductId,
              branchId: item.branchId,
              branchName: `지점 ${item.branchId}`,
              stockQuantity: 0,
              price: item.price
            }];
            restoredSelections[item.productId] = selectedBranches[item.productId] || item.branchId;
          }
        } catch (error) {
          console.error(`❌ 상품 ${item.productName} 지점 정보 조회 실패:`, error);
          branchesData[item.productId] = [{
            branchProductId: item.branchProductId,
            branchId: item.branchId,
            branchName: `지점 ${item.branchId}`,
            stockQuantity: 0,
            price: item.price
          }];
          restoredSelections[item.productId] = selectedBranches[item.productId] || item.branchId;
        }
      }

      setAvailableBranches(branchesData);
      setSelectedBranches(prev => ({ ...restoredSelections }));
    };

    if (items.length > 0) {
      loadBranchInfo();
    } else {
      setAvailableBranches({});
      setSelectedBranches({});
    }
  }, [items]);

  const handleBranchSelect = (productId, branchId) => {
    setSelectedBranches(prev => ({
      ...prev,
      [productId]: branchId
    }));
    // 스토어에도 선택 정보 반영 (선택된 branchProductId/가격 포함)
    const branch = availableBranches[productId]?.find(b => b.branchId == branchId);
    dispatch(setItemBranchSelection({
      productId,
      selectedBranchId: Number(branchId),
      selectedBranchProductId: branch?.branchProductId,
      selectedPrice: branch?.price
    }));
  };

  const handleProceedToOrder = async () => {
    if (items.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    if (!branchId) {
      alert('지점 정보가 없습니다. 지점을 먼저 선택해주세요.');
      return;
    }

    try {
      setOrderLoading(true);
      setOrderError(null);

      // 모든 상품의 지점 선택 여부 확인
      const allSelected = items.every(item => selectedBranches[item.productId]);
      if (!allSelected) {
        alert('모든 상품의 구매 지점을 선택해주세요.');
        setOrderLoading(false);
        return;
      }

      // 모든 선택 지점이 동일한지 확인 (단일 지점 주문 제약)
      const selectedIds = Array.from(new Set(items.map(it => selectedBranches[it.productId])));
      if (selectedIds.length !== 1) {
        alert('한 번에 한 지점의 상품만 주문할 수 있습니다. 동일한 지점을 선택해주세요.');
        setOrderLoading(false);
        return;
      }

      // 선택한 지점의 branchProductId/가격 적용
      const orderItems = items.map(item => {
        const selectedBranchId = selectedBranches[item.productId];
        const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
        const branchProductId = branch?.branchProductId || item.branchProductId;
        return {
          branchProductId: Number(branchProductId),
          quantity: item.quantity
        };
      });

      const orderRequestData = {
        memberId: Number(currentUser?.memberId || 1),
        branchId: Number(branchId),
        orderType: 'ONLINE',
        orderItems,
        couponId: null
      };

      const response = await cartService.createOrder(orderRequestData);
      const created = response?.data?.data || response?.data || response;

      const orderPayload = {
        orderId: created?.orderId,
        totalAmount: created?.totalAmount ?? items.reduce((sum, it) => {
          const sel = selectedBranches[it.productId];
          const br = availableBranches[it.productId]?.find(b => b.branchId == sel);
          const price = br?.price || it.price;
          return sum + (price * it.quantity);
        }, 0),
        items,
        branchId: Number(selectedIds[0]),
        selectedBranches,
        availableBranches
      };

      if (onProceedToOrder) {
        onProceedToOrder(orderPayload);
      }
    } catch (error) {
      console.error('주문 생성 실패:', error);
      setOrderError(error.response?.data?.message || error.message || '주문 처리 중 오류가 발생했습니다.');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleQuantityChange = (branchProductId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }
    dispatch(updateQuantity({ branchProductId, quantity: newQuantity }));
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
        memberId: Number(currentUser?.memberId || 1), // 로그인한 회원 ID 사용
        branchId: Number(selectedBranch.branchId),
        orderType: 'ONLINE', // OrderType enum 값
        orderItems: items.map(item => ({
          branchProductId: Number(item.branchProductId),
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
                  {(() => {
                    const selectedBranchId = selectedBranches[item.productId];
                    const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                    const displayPrice = branch?.price || item.price;
                    return displayPrice.toLocaleString();
                  })()}원
                </div>
                
                {/* 지점 선택 드롭다운 */}
                <div className="branch-selection" style={{ marginTop: 8 }}>
                  <label style={{ marginRight: 8 }}>구매 지점:</label>
                  <select
                    value={selectedBranches[item.productId] || ''}
                    onChange={(e) => handleBranchSelect(item.productId, e.target.value)}
                    className="branch-select"
                  >
                    <option value="">지점을 선택하세요</option>
                    {availableBranches[item.productId]?.map(branch => (
                      <option key={`${item.productId}-${branch.branchId}`} value={branch.branchId}>
                        {branch.branchName || `지점 ${branch.branchId}`} (재고: {branch.stockQuantity}개, 가격: {branch.price?.toLocaleString()}원)
                      </option>
                    ))}
                  </select>
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
              <span>{items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}원</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>무료</span>
            </div>
            <div className="summary-row total">
              <span>총 결제 금액</span>
              <span>{items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}원</span>
            </div>
          </div>
          
          {orderError && (
            <div className="error-message">
              ❌ {orderError}
            </div>
          )}
          
              <button 
                className="order-btn" 
                onClick={handleProceedToOrder} 
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
          </div>
          
          <div className="branch-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>지점 변경 안내</strong>
              <p>장바구니에 상품이 담겨있는 동안에는 지점을 변경할 수 없습니다.</p>
              <p>다른 지점의 상품을 주문하려면 장바구니를 비운 후 지점을 변경해주세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
