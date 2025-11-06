import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart, setItemBranchSelection } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';
import axios from 'axios';

const CartPage = ({ onBack, currentUser, onProceedToOrder }) => {
  const dispatch = useDispatch();
  const { items, branchId, totalAmount } = useSelector(state => state.cart);
  // 수량 입력 중 임시 값 저장
  const [quantityInputs, setQuantityInputs] = useState({});
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedBranches, setSelectedBranches] = useState({});
  const [availableBranches, setAvailableBranches] = useState({});

  // 비어 있어도 진입 가능: 상단 안내와 버튼으로 쇼핑 이동 유도

  // 각 상품별로 재고 있는 지점 조회 (선택 기본값 복원)
  useEffect(() => {
    const loadBranchInfo = async () => {
      const branchesData = {};
      const restoredSelections = {};

      for (const item of items) {
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

          // 상품 상세와 동일한 API 사용: 상품 ID로 지점 정보 조회
          // 방법 1: 상품 상세 API 직접 호출 (productId로 필터링)
          const response = await shopApi.get(`/api/public/products/with-branches`, {
            params: { 
              page: 0, 
              size: 100 // 충분히 큰 사이즈로 모든 상품 조회
            }
          });

          const responseData = response?.data?.data;
          const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
          const products = isPageResponse ? (responseData.content || []) : (responseData || []);

          // 현재 상품 찾기
          const product = products.find(p => p.productId === item.productId);

          if (product && product.availableBranches && product.availableBranches.length > 0) {
            // 상품 상세와 동일한 구조로 매핑
            branchesData[item.productId] = product.availableBranches
              .filter(bp => bp.stockQuantity > 0) // 재고 있는 지점만
              .map(bp => ({
                branchProductId: bp.branchProductId,
                branchId: bp.branchId,
                branchName: bp.branchName, // ✅ 실제 지점명 사용
                stockQuantity: bp.stockQuantity || 0,
                price: bp.price || item.price
              }));

            if (branchesData[item.productId].length > 0) {
              // 기본 선택값: 현재 아이템 지점 또는 첫 지점
              restoredSelections[item.productId] = selectedBranches[item.productId] || item.branchId || branchesData[item.productId][0].branchId;
            } else {
              // 재고 있는 지점이 없으면 기본값만 설정
              branchesData[item.productId] = [{
                branchProductId: item.branchProductId,
                branchId: item.branchId,
                branchName: item.branchName || `지점 ${item.branchId}`,
                stockQuantity: 0,
                price: item.price
              }];
              restoredSelections[item.productId] = selectedBranches[item.productId] || item.branchId;
            }
          } else {
            // 상품 정보가 없으면 기존 아이템 정보 사용
            branchesData[item.productId] = [{
              branchProductId: item.branchProductId,
              branchId: item.branchId,
              branchName: item.branchName || `지점 ${item.branchId}`,
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
            branchName: item.branchName || `지점 ${item.branchId}`,
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

      // 선택한 지점 ID 사용
      const selectedBranchId = Number(selectedIds[0]);
      console.log('📝 주문 생성 요청 - 선택한 지점 ID:', selectedBranchId);
      
      const orderRequestData = {
        memberId: Number(currentUser?.memberId || 1),
        branchId: selectedBranchId, // 선택한 지점 ID 사용
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
      setOrderLoading(false);
    }
  };

  const handleQuantityChange = (branchProductId, newQuantity) => {
    if (newQuantity < 1) {
      // 수량이 0 이하가 되면 장바구니에서 삭제
      if (window.confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
        dispatch(removeFromCart(branchProductId));
      }
      return;
    }
    dispatch(updateQuantity({ branchProductId, quantity: newQuantity }));
  };

  // 수량 직접 입력 핸들러
  const handleQuantityInput = (branchProductId, inputValue, maxStock) => {
    // 숫자가 아닌 값 제거
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    // 빈 값은 허용
    if (numericValue === '') {
      // 입력 중에는 빈 값으로 유지
      return;
    }
    
    const newQuantity = parseInt(numericValue, 10);
    
    // 0이면 빈 값으로 처리 (입력 중)
    if (newQuantity === 0) {
      return;
    }
    
    // 최대 재고량 제한
    if (maxStock && newQuantity > maxStock) {
      alert(`재고가 부족합니다. 최대 ${maxStock}개까지 주문 가능합니다.`);
      return;
    }
    
    if (newQuantity < 1) {
      return;
    }
    
    dispatch(updateQuantity({ branchProductId, quantity: newQuantity }));
  };

  // 수량 입력 필드 포커스 아웃 시 검증
  const handleQuantityBlur = (branchProductId, inputValue, maxStock) => {
    const numericValue = inputValue.replace(/[^0-9]/g, '');
    
    if (numericValue === '' || numericValue === '0') {
      // 빈 값이나 0이면 장바구니에서 삭제
      if (window.confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
        dispatch(removeFromCart(branchProductId));
      } else {
        // 취소하면 1개로 복구
        dispatch(updateQuantity({ branchProductId, quantity: 1 }));
      }
    } else {
      const newQuantity = parseInt(numericValue, 10);
      
      // 최대 재고량 제한
      if (maxStock && newQuantity > maxStock) {
        alert(`재고가 부족합니다. 최대 ${maxStock}개까지 주문 가능합니다.`);
        dispatch(updateQuantity({ branchProductId, quantity: maxStock }));
      } else if (newQuantity < 1) {
        // 1 미만이면 삭제 확인
        if (window.confirm('이 상품을 장바구니에서 제거하시겠습니까?')) {
          dispatch(removeFromCart(branchProductId));
        } else {
          dispatch(updateQuantity({ branchProductId, quantity: 1 }));
        }
      }
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
      setOrderLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <div className="empty-cart">
          <h2>장바구니가 비어있습니다</h2>
          <p>빈 장바구니에 구매할 상품을 넣어주세요.</p>
          <button 
            className="btn-primary"
            onClick={() => onBack && onBack()}
          >
            SHOP으로 이동
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
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=200&q=80";
                  }}
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
                  <input
                    type="text"
                    className="quantity-input"
                    value={quantityInputs[item.branchProductId] !== undefined ? quantityInputs[item.branchProductId] : item.quantity}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      setQuantityInputs(prev => ({
                        ...prev,
                        [item.branchProductId]: inputValue
                      }));
                      
                      const selectedBranchId = selectedBranches[item.productId];
                      const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                      const maxStock = branch?.stockQuantity || item.stockQuantity || 9999;
                      handleQuantityInput(item.branchProductId, inputValue, maxStock);
                    }}
                    onFocus={(e) => {
                      // 포커스 시 현재 값으로 초기화
                      setQuantityInputs(prev => ({
                        ...prev,
                        [item.branchProductId]: e.target.value
                      }));
                    }}
                    onBlur={(e) => {
                      const selectedBranchId = selectedBranches[item.productId];
                      const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                      const maxStock = branch?.stockQuantity || item.stockQuantity || 9999;
                      handleQuantityBlur(item.branchProductId, e.target.value, maxStock);
                      
                      // 포커스 아웃 시 임시 값 제거
                      setQuantityInputs(prev => {
                        const newInputs = { ...prev };
                        delete newInputs[item.branchProductId];
                        return newInputs;
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.target.blur();
                      }
                    }}
                    style={{
                      width: '50px',
                      textAlign: 'center',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '4px',
                      fontSize: '14px'
                    }}
                  />
                  <button 
                    className="quantity-btn"
                    onClick={() => {
                      const selectedBranchId = selectedBranches[item.productId];
                      const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                      const maxStock = branch?.stockQuantity || item.stockQuantity || 9999;
                      if (item.quantity >= maxStock) {
                        alert(`재고가 부족합니다. 최대 ${maxStock}개까지 주문 가능합니다.`);
                        return;
                      }
                      handleQuantityChange(item.branchProductId, item.quantity + 1);
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="item-total">
                <div className="total-price">
                  {(() => {
                    const selectedBranchId = selectedBranches[item.productId];
                    const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                    const displayPrice = branch?.price || item.price;
                    return (displayPrice * item.quantity).toLocaleString();
                  })()}원
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
              <span>{items.reduce((sum, item) => {
                const selectedBranchId = selectedBranches[item.productId];
                const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                const displayPrice = branch?.price || item.price;
                return sum + (displayPrice * item.quantity);
              }, 0).toLocaleString()}원</span>
            </div>
            <div className="summary-row">
              <span>배송비</span>
              <span>무료</span>
            </div>
            <div className="summary-row total">
              <span>총 결제 금액</span>
              <span>{items.reduce((sum, item) => {
                const selectedBranchId = selectedBranches[item.productId];
                const branch = availableBranches[item.productId]?.find(b => b.branchId == selectedBranchId);
                const displayPrice = branch?.price || item.price;
                return sum + (displayPrice * item.quantity);
              }, 0).toLocaleString()}원</span>
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
