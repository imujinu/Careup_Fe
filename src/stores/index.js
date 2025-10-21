import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import inventorySlice from './slices/inventorySlice';
import branchSlice from './slices/branchSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    inventory: inventorySlice,
    branch: branchSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// JavaScript에서는 타입 정의 제거
