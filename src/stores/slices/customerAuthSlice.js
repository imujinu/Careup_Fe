// src/stores/slices/customerAuthSlice.js
// 고객용

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { customerAuthService } from '../../service/customerAuthService';

export const customerLogin = createAsyncThunk(
  'customerAuth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // credentials: { id, password, rememberMe }
      return await customerAuthService.login(credentials);
    } catch (e) {
      return rejectWithValue(e?.response?.data?.status_message || '고객 로그인 실패');
    }
  }
);

export const customerLogout = createAsyncThunk('customerAuth/logout', async () => {
  await customerAuthService.logout();
  return null;
});

export const customerCheckAuth = createAsyncThunk('customerAuth/check', async () => {
  return customerAuthService.isAuthenticated() ? customerAuthService.getCurrentUser() : null;
});

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const customerAuthSlice = createSlice({
  name: 'customerAuth',
  initialState,
  reducers: {
    clearCustomerError: (s) => { s.error = null; },
  },
  extraReducers: (b) => {
    b.addCase(customerLogin.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(customerLogin.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.userInfo;
        s.isAuthenticated = true;
     })
     .addCase(customerLogin.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
     })
     .addCase(customerLogout.fulfilled, (s) => {
        s.user = null;
        s.isAuthenticated = false;
        s.error = null;
     })
     .addCase(customerCheckAuth.fulfilled, (s, a) => {
        if (a.payload) { s.user = a.payload; s.isAuthenticated = true; }
        else { s.user = null; s.isAuthenticated = false; }
     });
  }
});

export const { clearCustomerError } = customerAuthSlice.actions;
export default customerAuthSlice.reducer;
