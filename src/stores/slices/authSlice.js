import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, tokenStorage } from '../../service/authService';

const pickRole = (user) => {
  const cand =
    user?.role ||
    user?.roleCode ||
    user?.authority ||
    (Array.isArray(user?.authorities) ? user.authorities[0] : undefined) ||
    (Array.isArray(user?.roles) ? user.roles[0] : undefined) ||
    '';
  const s = String(cand);
  const m = s.match(/HQ_ADMIN|BRANCH_ADMIN|FRANCHISE_OWNER|ADMIN|STAFF/i);
  const core = m ? m[0].toUpperCase() : '';
  if (!core) return '';
  return core.startsWith('ROLE_') ? core : `ROLE_${core}`;
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await authService.login(credentials);
      return result;
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

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
  return null;
});

export const checkAuthStatus = createAsyncThunk('auth/checkStatus', async () => {
  if (authService.isAuthenticated()) {
    return authService.getCurrentUser();
  }
  return null;
});

const bootUser = tokenStorage.getUserInfo();
const bootAuthed = authService.isAuthenticated();

const initialState = {
  user: bootUser || null,
  isAuthenticated: bootAuthed,
  loading: false,
  error: '',
  errorCode: '',
  userType: bootUser?.userType || 'franchise',
  branchId: bootUser?.branchId ?? null,
  branchName: bootUser?.branchName ?? null,
  role: pickRole(bootUser),
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
    setBranchName: (state, action) => {
      state.branchName = action.payload;
    },
    setRole: (state, action) => {
      state.role = action.payload || '';
    },
    // ★ 본인 정보 일부 갱신(헤더 실시간 반영)
    mergeUser: (state, action) => {
      const patch = action.payload || {};
      const next = { ...(state.user || {}), ...patch };
      state.user = next;
      try { tokenStorage.setUserInfo(next); } catch {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = '';
        state.errorCode = '';
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const userInfo = action.payload?.userInfo || null;
        state.user = userInfo;
        state.isAuthenticated = true;
        state.userType = userInfo?.userType || 'franchise';
        state.branchId = userInfo?.branchId ?? null;
        state.branchName = userInfo?.branchName ?? null;
        state.role = pickRole(userInfo);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.error = action.payload?.message || '로그인에 실패했습니다.';
        state.errorCode = action.payload?.code || '';
        state.user = null;
        state.userType = 'franchise';
        state.branchId = null;
        state.branchName = null;
        state.role = '';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = '';
        state.errorCode = '';
        state.userType = 'franchise';
        state.branchId = null;
        state.branchName = null;
        state.role = '';
      })
      .addCase(checkAuthStatus.fulfilled, (state, action) => {
        if (action.payload) {
          const userInfo = action.payload;
          state.user = userInfo;
          state.isAuthenticated = true;
          state.userType = userInfo.userType || 'franchise';
          state.branchId = userInfo.branchId ?? null;
          state.branchName = userInfo.branchName ?? null;
          state.role = pickRole(userInfo);
        } else {
          state.user = null;
          state.isAuthenticated = false;
          state.userType = 'franchise';
          state.branchId = null;
          state.branchName = null;
          state.role = '';
        }
      });
  },
});

export const { clearError, setUserType, setBranchId, setBranchName, setRole, mergeUser } = authSlice.actions;
export default authSlice.reducer;
