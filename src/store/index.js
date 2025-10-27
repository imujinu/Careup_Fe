import { configureStore } from '@reduxjs/toolkit';
import branchReducer from './slices/branchSlice';
import cartReducer from './slices/cartSlice';

// 로컬 스토리지에서 상태 복원
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('careup-storefront-state');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.warn('로컬 스토리지에서 상태 복원 실패:', err);
    return undefined;
  }
};

// 상태를 로컬 스토리지에 저장
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('careup-storefront-state', serializedState);
  } catch (err) {
    console.warn('로컬 스토리지에 상태 저장 실패:', err);
  }
};

export const store = configureStore({
  reducer: {
    branch: branchReducer,
    cart: cartReducer,
  },
  preloadedState: loadState(),
});

// 상태 변경 시마다 로컬 스토리지에 저장
store.subscribe(() => {
  saveState(store.getState());
});
