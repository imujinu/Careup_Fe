/// src/stores/slices/authSlice.js
/// 직원용
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, tokenStorage } from '../../service/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      return result; // { accessToken, refreshToken, userInfo }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data || {};
      return rejectWithValue({
        status,
        code: data.error_code,
        message: data.status_message || err.message || '로그인에 실패했습니다.',
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    await authService.logout();
    return null;
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async () => {
    if (authService.isAuthenticated()) {
      return authService.getCurrentUser();
    }
    return null;
  }
);

const bootUser = tokenStorage.getUserInfo();
const bootAuthed = authService.isAuthenticated();

const initialState = {
  user: bootUser,
  isAuthenticated: bootAuthed,
  loading: false,
  error: '',        // 전역 에러 메시지
  errorCode: '',    // 전역 에러 코드
  userType: bootUser?.userType || 'franchise',
  branchId: bootUser?.branchId ?? 2, // 1: 본사, 2+: 가맹점
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = '';
      state.errorCode = '';
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    setBranchId: (state, action) => {
      state.branchId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.errorCode = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.userInfo;
        state.isAuthenticated = true;
        state.userType = action.payload.userInfo?.userType || 'franchise';
        state.branchId = action.payload.userInfo?.branchId ?? 2;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || '로그인에 실패했습니다.';
        state.errorCode = action.payload?.code || '';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = '';
        state.errorCode = '';
        state.userType = 'franchise';
        state.branchId = 2;
      })
      // Check Auth Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.userType = action.payload.userType || 'franchise';
          state.branchId = action.payload.branchId ?? 2;
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.userType = 'franchise';
          state.branchId = 2;
        }
      });
  },
});

export const { clearError, setUserType, setBranchId } = authSlice.actions;
export default authSlice.reducer;
