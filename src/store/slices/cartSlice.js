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
      const { branchProductId, branchId, productName, price, quantity = 1 } = action.payload;
      
      // 다른 지점의 상품인지 확인
      if (state.branchId && state.branchId !== branchId) {
        throw new Error('다른 지점의 상품은 담을 수 없습니다. 지점을 변경하면 장바구니가 비워집니다.');
      }
      
      // 첫 상품이거나 같은 지점 상품
      if (!state.branchId) {
        state.branchId = branchId;
      }
      
      // 이미 장바구니에 있는 상품인지 확인
      const existingItem = state.items.find(item => item.branchProductId === branchProductId);
      
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          branchProductId,
          branchId,
          productName,
          price,
          quantity,
        });
      }
      
      // 총 금액 계산
      state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
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
  changeBranch 
} = cartSlice.actions;

export default cartSlice.reducer;
