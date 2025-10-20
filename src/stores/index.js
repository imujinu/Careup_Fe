import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import inventorySlice from './slices/inventorySlice';
import customerAuthReducer from './slices/customerAuthSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,               // 직원용
    customerAuth: customerAuthReducer, // 고객용
    inventory: inventorySlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// JavaScript에서는 타입 정의 제거
