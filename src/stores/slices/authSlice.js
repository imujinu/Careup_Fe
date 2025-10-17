import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../service/authService';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      return result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '로그인에 실패했습니다.');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      if (authService.isAuthenticated()) {
        const userInfo = authService.getCurrentUser();
        return userInfo;
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  userType: 'franchise', // 'headquarters' or 'franchise'
  branchId: 2, // 1: 본사, 2+: 가맹점
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
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
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.userInfo;
        state.isAuthenticated = true;
        state.userType = action.payload.userInfo?.userType || 'franchise';
        state.branchId = action.payload.userInfo?.branchId || 2;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.userType = 'franchise';
        state.branchId = 2;
      })
      // Check Auth Status
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.userType = action.payload.userType || 'franchise';
          state.branchId = action.payload.branchId || 2;
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
