import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, updateQuantity, clearCart, setItemBranchSelection } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';
import axios from 'axios';

const CartPage = ({ onBack, currentUser, onProceedToOrder }) => {
  const dispatch = useDispatch();
  const { items, branchId, totalAmount } = useSelector(state => {
    console.log('🛒 CartPage Redux store 읽기:', {
      itemsCount: state.cart?.items?.length || 0,
      items: state.cart?.items,
      branchId: state.cart?.branchId,
      totalAmount: state.cart?.totalAmount,
      fullState: state.cart
    });
    return state.cart;
  });
  // 수량 입력 중 임시 값 저장
  const [quantityInputs, setQuantityInputs] = useState({});
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  
  console.log('🛒 CartPage 렌더링:', {
    itemsCount: items?.length || 0,
    items,
    branchId,
    totalAmount
  });
  
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [selectedBranches, setSelectedBranches] = useState({});
  const [availableBranches, setAvailableBranches] = useState({});
  const [referenceBranches, setReferenceBranches] = useState({});

  const getItemKey = (item) => String(item.branchProductId ?? `${item.productId}-${item.branchId ?? 'na'}`);

  // 비어 있어도 진입 가능: 상단 안내와 버튼으로 쇼핑 이동 유도

  // 각 상품별로 재고 있는 지점 조회 (선택 기본값 복원)
  useEffect(() => {
    const loadBranchInfo = async () => {
      const branchesData = {};
      const restoredSelections = {};
      const referenceInfo = {};

      for (const item of items) {
        const itemKey = getItemKey(item);
        try {
          const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
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
              .filter(bp => bp.branchProductId)
              .map(bp => ({
                productId: bp.productId,
                branchProductId: bp.branchProductId,
                branchId: bp.branchId,
                branchName: bp.branchName,
                stockQuantity: bp.stockQuantity || 0,
                price: bp.price || item.price,
                attributeTypeName: bp.attributeTypeName,
                attributeValueId: bp.attributeValueId,
                attributeValueName: bp.attributeValueName
              }));

            if (branchesData[item.productId].length > 0) {
              referenceInfo[item.productId] = product.availableBranches;
              // 기본 선택값: 현재 아이템 지점 또는 첫 지점
              restoredSelections[itemKey] = String(
                selectedBranches[itemKey]
                || item.selectedBranchProductId
                || item.branchProductId
                || branchesData[item.productId][0].branchProductId
              );
            } else {
              // 재고 있는 지점이 없으면 기본값만 설정
              const fallback = {
                productId: item.productId,
                branchProductId: item.branchProductId,
                branchId: item.branchId,
                branchName: item.branchName || `지점 ${item.branchId}`,
                stockQuantity: 0,
                price: item.price,
                attributeTypeName: item.attributeTypeName,
                attributeValueId: item.attributeValueId,
                attributeValueName: item.attributeValueName
              };
              branchesData[item.productId] = [fallback];
              referenceInfo[item.productId] = [fallback];
              restoredSelections[itemKey] = String(
                selectedBranches[itemKey]
                || item.selectedBranchProductId
                || item.branchProductId
              );
            }
          } else {
            // 상품 정보가 없으면 기존 아이템 정보 사용
            const fallback = {
              productId: item.productId,
              branchProductId: item.branchProductId,
              branchId: item.branchId,
              branchName: item.branchName || `지점 ${item.branchId}`,
              stockQuantity: 0,
              price: item.price,
              attributeTypeName: item.attributeTypeName,
              attributeValueId: item.attributeValueId,
              attributeValueName: item.attributeValueName
            };
            branchesData[item.productId] = [fallback];
            referenceInfo[item.productId] = [fallback];
            restoredSelections[itemKey] = String(
              selectedBranches[itemKey]
              || item.selectedBranchProductId
              || item.branchProductId
            );
          }
        } catch (error) {
          console.error(`❌ 상품 ${item.productName} 지점 정보 조회 실패:`, error);
          const fallback = {
            productId: item.productId,
            branchProductId: item.branchProductId,
            branchId: item.branchId,
            branchName: item.branchName || `지점 ${item.branchId}`,
            stockQuantity: 0,
            price: item.price,
            attributeTypeName: item.attributeTypeName,
            attributeValueId: item.attributeValueId,
            attributeValueName: item.attributeValueName
          };
          branchesData[item.productId] = [fallback];
          referenceInfo[item.productId] = [fallback];
          restoredSelections[itemKey] = String(
            selectedBranches[itemKey]
            || item.selectedBranchProductId
            || item.branchProductId
          );
        }
      }

      setAvailableBranches(branchesData);
      setSelectedBranches(prev => ({ ...restoredSelections }));
      setReferenceBranches(referenceInfo);
    };

    if (items.length > 0) {
      loadBranchInfo();
    } else {
      setAvailableBranches({});
      setSelectedBranches({});
      setReferenceBranches({});
    }
  }, [items]);

  const handleBranchSelect = (item, branchProductId) => {
    const productId = item.productId;
    const itemKey = getItemKey(item);
    const numericBranchProductId = Number(branchProductId);
    
    console.log('📍 장바구니 지점 선택:', {
      itemKey,
      branchProductId,
      numericBranchProductId,
      availableBranches: availableBranches[productId]?.length || 0
    });
    
    if (isNaN(numericBranchProductId) || numericBranchProductId <= 0) {
      console.error('❌ 유효하지 않은 branchProductId:', branchProductId);
      return;
    }
    
    setSelectedBranches(prev => ({
      ...prev,
      [itemKey]: String(numericBranchProductId)
    }));
    
    // 스토어에도 선택 정보 반영 (선택된 branchProductId/가격 포함)
    const branch = availableBranches[productId]?.find(b => String(b.branchProductId) === String(numericBranchProductId));
    
    console.log('📍 찾은 지점:', branch ? {
      branchName: branch.branchName,
      branchId: branch.branchId,
      branchProductId: branch.branchProductId,
      price: branch.price
    } : '없음');
    
    dispatch(setItemBranchSelection({
      productId,
      selectedBranchId: branch?.branchId ? Number(branch.branchId) : item.selectedBranchId || item.branchId || null,
      selectedBranchProductId: branch?.branchProductId ? Number(branch.branchProductId) : item.selectedBranchProductId || item.branchProductId || null,
      selectedPrice: branch?.price ?? item.selectedPrice ?? item.price
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
      const allSelected = items.every(item => selectedBranches[getItemKey(item)]);
      if (!allSelected) {
        alert('모든 상품의 구매 지점을 선택해주세요.');
        setOrderLoading(false);
        return;
      }

      // 모든 선택 지점이 동일한지 확인 (단일 지점 주문 제약)
      const selectedBranchProducts = items.map(it => {
        const selectedValue = selectedBranches[getItemKey(it)] || it.selectedBranchProductId || it.branchProductId;
        return selectedValue ? String(selectedValue) : '';
      });
      const branchIdsSet = new Set();
      items.forEach(it => {
        const productBranches = availableBranches[it.productId] || [];
        const selectedBranchProductId = selectedBranches[getItemKey(it)] || it.selectedBranchProductId || it.branchProductId;
        const branch = productBranches.find(b => String(b.branchProductId) === String(selectedBranchProductId));
        if (branch?.branchId) {
          branchIdsSet.add(String(branch.branchId));
        } else if (it.branchId) {
          branchIdsSet.add(String(it.branchId));
        }
      });

      if (branchIdsSet.size !== 1) {
        alert('한 번에 한 지점의 상품만 주문할 수 있습니다. 동일한 지점을 선택해주세요.');
        setOrderLoading(false);
        return;
      }

      // 선택한 지점의 branchProductId/가격 적용
      const orderItems = items.map(item => {
        const selectedBranchProductId = selectedBranches[getItemKey(item)];
        const branch = availableBranches[item.productId]?.find(b => String(b.branchProductId) === String(selectedBranchProductId));
        const branchProductId = branch?.branchProductId || item.selectedBranchProductId || item.branchProductId;
        return {
          branchProductId: Number(branchProductId),
          quantity: item.quantity
        };
      });

      // 선택한 지점 ID 사용
      const selectedBranchProductId = selectedBranchProducts[0];
      const referenceBranch = availableBranches[items[0].productId]?.find(b => String(b.branchProductId) === String(selectedBranchProducts[0]));
      const selectedBranchId = referenceBranch?.branchId ? Number(referenceBranch.branchId) : Number(items[0].branchId);
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
          const sel = selectedBranches[getItemKey(it)];
          const br = availableBranches[it.productId]?.find(b => String(b.branchProductId) === String(sel));
          const price = br?.price || it.selectedPrice || it.price;
          return sum + (price * it.quantity);
        }, 0),
        items,
        branchId: selectedBranchId,
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

  console.log('🛒 CartPage 렌더링 체크:', {
    itemsLength: items?.length || 0,
    items,
    isEmpty: !items || items.length === 0
  });

  if (!items || items.length === 0) {
    console.log('⚠️ 장바구니가 비어있음 - 빈 화면 표시');
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
          
          {items.map((item) => {
            const itemKey = getItemKey(item);
            const referenceList = referenceBranches[item.productId] || [];
            const fallbackBranch = {
              productId: item.productId,
              branchProductId: item.selectedBranchProductId || item.branchProductId,
              branchId: item.selectedBranchId || item.branchId,
              branchName: item.branchName || `지점 ${item.branchId}`,
              stockQuantity: typeof item.stockQuantity === 'number' ? item.stockQuantity : undefined,
              price: item.selectedPrice || item.price,
              attributeTypeName: item.attributeTypeName,
              attributeValueId: item.attributeValueId,
              attributeValueName: item.attributeValueName
            };
            const rawBranchList = availableBranches[item.productId] && availableBranches[item.productId].length > 0
              ? availableBranches[item.productId]
              : referenceList;

            console.log('🔍 branchList 구성:', {
              productId: item.productId,
              availableBranchesCount: availableBranches[item.productId]?.length || 0,
              referenceListCount: referenceList.length,
              rawBranchListCount: rawBranchList?.length || 0,
              fallbackBranchProductId: fallbackBranch.branchProductId,
              fallbackBranchName: fallbackBranch.branchName
            });

            const branchMap = new Map();
            // availableBranches의 데이터를 먼저 추가 (최신 데이터 우선)
            if (rawBranchList && rawBranchList.length > 0) {
              rawBranchList.forEach(bp => {
                if (bp && bp.branchProductId) {
                  const key = String(bp.branchProductId);
                  // 이미 있는 경우 덮어쓰지 않음 (첫 번째 데이터가 우선)
                  if (!branchMap.has(key)) {
                    branchMap.set(key, { ...bp });
                    console.log(`✅ branchMap에 추가: ${key} - ${bp.branchName} (branchId: ${bp.branchId})`);
                  }
                }
              });
            }
            // fallbackBranch는 availableBranches에 없는 경우에만 추가
            if (fallbackBranch.branchProductId) {
              const key = String(fallbackBranch.branchProductId);
              const existing = branchMap.get(key);
              if (!existing) {
                // availableBranches에 없을 때만 fallbackBranch 추가
                branchMap.set(key, { ...fallbackBranch });
                console.log(`⚠️ fallbackBranch 추가: ${key} - ${fallbackBranch.branchName}`);
              } else {
                console.log(`ℹ️ fallbackBranch 무시 (기존 데이터 있음): ${key} - 기존: ${existing.branchName}, fallback: ${fallbackBranch.branchName}`);
              }
            }
            const branchList = branchMap.size > 0
              ? Array.from(branchMap.values())
              : (fallbackBranch.branchProductId ? [fallbackBranch] : []);
            const selectedBranchProductId = selectedBranches[itemKey]
              ?? item.selectedBranchProductId
              ?? item.branchProductId
              ?? '';
            const selectedBranchProductValue = selectedBranchProductId ? String(selectedBranchProductId) : '';
            
            console.log('🛒 장바구니 아이템 렌더링:', {
              itemKey,
              selectedBranchProductId,
              selectedBranchProductValue,
              branchListLength: branchList.length,
              itemBranchProductId: item.branchProductId,
              branchListBranchProductIds: branchList.map(b => b.branchProductId)
            });
            
            let selectedBranch = null;
            if (selectedBranchProductId) {
              selectedBranch = branchList.find(b => {
                const match = String(b.branchProductId) === String(selectedBranchProductId);
                console.log(`🔍 지점 찾기: ${b.branchProductId} === ${selectedBranchProductId}? ${match}`, {
                  branchName: b.branchName,
                  branchProductId: b.branchProductId,
                  selectedBranchProductId
                });
                return match;
              });
            }
            
            if (!selectedBranch && item.branchProductId && String(item.branchProductId) === String(selectedBranchProductId)) {
              console.log('⚠️ fallback 지점 사용:', item.branchName);
              selectedBranch = {
                branchProductId: item.branchProductId,
                branchId: item.branchId,
                branchName: item.branchName,
                stockQuantity: item.stockQuantity,
                price: item.selectedPrice || item.price,
                attributeTypeName: item.attributeTypeName,
                attributeValueId: item.attributeValueId,
                attributeValueName: item.attributeValueName
              };
            }
            
            console.log('✅ 최종 selectedBranch:', selectedBranch ? {
              branchName: selectedBranch.branchName,
              branchProductId: selectedBranch.branchProductId,
              branchId: selectedBranch.branchId
            } : '없음');
            const optionList = Array.isArray(item.options) && item.options.length > 0
              ? item.options
              : (item.attributeName || item.attributeValue)
              ? [{
                  label: item.attributeName || '옵션',
                  value: item.attributeValue || ''
                }]
              : [];

            return (
            <div key={item.branchProductId} className="cart-item">
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
                {optionList.length > 0 && (
                  <div className="item-options">
                    {optionList.map((opt, idx) => (
                      <span key={`${opt.label}-${opt.value || idx}`} className="item-option-chip">
                        {opt.label ? `${opt.label}: ` : ''}{opt.value}
                      </span>
                    ))}
                  </div>
                )}
                <div className="item-price">
                  {(() => {
                    const displayPrice = selectedBranch?.price ?? item.selectedPrice ?? item.price;
                    console.log('💰 가격 표시:', {
                      selectedBranchPrice: selectedBranch?.price,
                      itemSelectedPrice: item.selectedPrice,
                      itemPrice: item.price,
                      displayPrice,
                      selectedBranchName: selectedBranch?.branchName
                    });
                    return displayPrice.toLocaleString();
                  })()}원
                </div>
                
                {/* 지점 선택 드롭다운 */}
                <div className="branch-selection" style={{ marginTop: 8 }}>
                  <label style={{ marginRight: 8 }}>구매 지점:</label>
                  <select
                    value={selectedBranchProductValue}
                    onChange={(e) => {
                      console.log('📍 드롭다운 변경:', e.target.value);
                      handleBranchSelect(item, e.target.value);
                    }}
                    className="branch-select"
                  >
                    <option value="">지점을 선택하세요</option>
                    {branchList.map(branch => (
                      <option key={`${item.productId}-${branch.branchProductId}`} value={String(branch.branchProductId)}>
                        {branch.branchName || `지점 ${branch.branchId}`} (재고: {branch.stockQuantity || 0}개, 가격: {branch.price?.toLocaleString() || '0'}원)
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
                      
                      const branch = selectedBranch;
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
                      const branch = selectedBranch;
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
                      const branch = selectedBranch;
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
                  {((selectedBranch?.price || item.price) * item.quantity).toLocaleString()}원
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.branchProductId)}
                >
                  삭제
                </button>
              </div>
            </div>
            );
          })}
        </div>

        <div className="cart-summary">
          <div className="summary-header">
            <h3>주문 요약</h3>
          </div>
          
          <div className="summary-content">
            <div className="summary-row">
              <span>상품 금액</span>
              <span>{items.reduce((sum, item) => {
                const branchList = availableBranches[item.productId] || [];
                const selectedBranchProductId = selectedBranches[getItemKey(item)] || item.selectedBranchProductId || item.branchProductId;
                const branch = branchList.find(b => String(b.branchProductId) === String(selectedBranchProductId));
                const displayPrice = branch?.price || item.selectedPrice || item.price;
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
                const branchList = availableBranches[item.productId] || [];
                const selectedBranchProductId = selectedBranches[getItemKey(item)] || item.selectedBranchProductId || item.branchProductId;
                const branch = branchList.find(b => String(b.branchProductId) === String(selectedBranchProductId));
                const displayPrice = branch?.price || item.selectedPrice || item.price;
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
