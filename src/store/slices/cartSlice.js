import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    branchId: null,
    totalAmount: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const {
        productId,
        branchProductId,
        branchId,
        productName,
        price,
        quantity = 1,
        imageUrl,
        options = [],
        branchName,
        stockQuantity,
        attributeTypeName,
        attributeValueId,
        attributeValueName,
        attributeName,
        attributeValue,
        selectedAttributes
      } = action.payload;
      
      console.log('🛒 Redux addToCart 호출:', {
        productId,
        branchProductId,
        branchId,
        productName,
        currentBranchId: state.branchId,
        currentItemsCount: state.items.length
      });
      
      // 다른 지점의 상품인지 확인
      if (state.branchId && branchId && state.branchId !== branchId) {
        const errorMsg = '다른 지점의 상품은 담을 수 없습니다. 지점을 변경하면 장바구니가 비워집니다.';
        console.error('❌ 지점 불일치:', { currentBranchId: state.branchId, newBranchId: branchId });
        throw new Error(errorMsg);
      }
      
      // 첫 상품이거나 같은 지점 상품
      if (!state.branchId && branchId) {
        state.branchId = branchId;
        console.log('✅ 첫 상품 추가, 지점 설정:', branchId);
      }
      
      // 이미 장바구니에 있는 상품인지 확인 (옵션도 고려)
      // 같은 branchProductId이고 같은 옵션인 경우에만 수량 증가
      const existingItem = state.items.find(item => {
        if (item.branchProductId !== branchProductId) return false;
        // 옵션이 있는 경우 옵션도 비교
        if (selectedAttributes && Object.keys(selectedAttributes).length > 0) {
          const itemAttrs = item.selectedAttributes || {};
          const newAttrs = selectedAttributes || {};
          // 옵션 키와 값이 모두 일치해야 함
          const itemKeys = Object.keys(itemAttrs).sort();
          const newKeys = Object.keys(newAttrs).sort();
          if (itemKeys.length !== newKeys.length) return false;
          return itemKeys.every(key => 
            String(itemAttrs[key]) === String(newAttrs[key])
          );
        }
        // 옵션이 없는 경우 attributeName/attributeValue로 비교
        if (attributeName || attributeValue) {
          return item.attributeName === attributeName && item.attributeValue === attributeValue;
        }
        // 옵션이 없는 경우
        return !item.selectedAttributes || Object.keys(item.selectedAttributes).length === 0;
      });
      
      console.log('🔍 기존 아이템 찾기:', existingItem ? '찾음' : '없음');
      
      if (existingItem) {
        console.log('➕ 기존 아이템 수량 증가:', existingItem.quantity, '->', existingItem.quantity + quantity);
        existingItem.quantity += quantity;
        if (options && options.length > 0) {
          existingItem.options = options;
        }
        if (branchName) existingItem.branchName = branchName;
        if (typeof stockQuantity === 'number') existingItem.stockQuantity = stockQuantity;
        if (attributeTypeName) existingItem.attributeTypeName = attributeTypeName;
        if (attributeValueId) existingItem.attributeValueId = attributeValueId;
        if (attributeValueName) existingItem.attributeValueName = attributeValueName;
      } else {
        console.log('➕ 새 아이템 추가:', { productName, branchProductId, branchId });
        state.items.push({
          productId,
          branchProductId,
          branchId,
          productName,
          price,
          quantity,
          imageUrl,
          options,
          branchName,
          stockQuantity,
          attributeTypeName,
          attributeValueId,
          attributeValueName,
          attributeName,
          attributeValue,
          selectedAttributes
        });
      }
      
      // 총 금액 계산
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
      console.log('✅ 장바구니 업데이트 완료:', {
        itemsCount: state.items.length,
        totalAmount: state.totalAmount,
        branchId: state.branchId
      });
    },
    
    // 각 상품에 선택된 지점 정보를 저장 (주문 전 UI/로직용)
    setItemBranchSelection: (state, action) => {
      const { productId, selectedBranchId, selectedBranchProductId, selectedPrice } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      if (item) {
        item.selectedBranchId = selectedBranchId;
        if (selectedBranchProductId) item.selectedBranchProductId = selectedBranchProductId;
        if (typeof selectedPrice === 'number') item.selectedPrice = selectedPrice;
      }
    },

    removeFromCart: (state, action) => {
      const branchProductId = action.payload;
      state.items = state.items.filter(item => item.branchProductId !== branchProductId);
      
      // 장바구니가 비면 지점 정보도 초기화
      if (state.items.length === 0) {
        state.branchId = null;
      }
      
      // 총 금액 재계산
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    updateQuantity: (state, action) => {
      const { branchProductId, quantity } = action.payload;
      const item = state.items.find(item => item.branchProductId === branchProductId);
      
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.branchProductId !== branchProductId);
        } else {
          item.quantity = quantity;
        }
      }
      
      // 장바구니가 비면 지점 정보도 초기화
      if (state.items.length === 0) {
        state.branchId = null;
      }
      
      // 총 금액 재계산
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.branchId = null;
      state.totalAmount = 0;
    },
    
    changeBranch: (state, action) => {
      // 지점 변경 시 장바구니 비우기
      state.items = [];
      state.branchId = action.payload.branchId;
      state.totalAmount = 0;
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  changeBranch,
  setItemBranchSelection
} = cartSlice.actions;

export default cartSlice.reducer;
