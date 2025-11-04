// src/stores/index.js
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import inventorySlice from './slices/inventorySlice';
import branchSlice from './slices/branchSlice';
import customerAuthReducer from './slices/customerAuthSlice';
import employeeSlice from './slices/employeeSlice';
import salesReportSlice from './slices/salesReportSlice';
import royaltySlice from './slices/royaltySlice';
import chatbotSlice from './slices/chatbotSlice';
import alertsSlice from './slices/alertsSlice';
import staffSlice from './slices/staffSlice';
import attendanceSlice from './slices/attendanceSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,               // 직원용
    customerAuth: customerAuthReducer, // 고객용
    inventory: inventorySlice,
    branch: branchSlice,
    employee: employeeSlice,
    salesReport: salesReportSlice,
    royalty: royaltySlice,
    chatbot: chatbotSlice,
    alerts: alertsSlice,
    staff: staffSlice,
    attendance: attendanceSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
