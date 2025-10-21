import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { branchService } from '../../service/branchService';

export const fetchBranchList = createAsyncThunk(
  'branch/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const data = await branchService.fetchBranches(params || {});
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '지점 목록 조회 실패';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  list: [],
  pagination: {
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
    first: true,
    last: false,
  },
  loading: false,
  error: null,
  params: { page: 0, size: 10, sort: 'createdAt,desc' },
};

const branchSlice = createSlice({
  name: 'branch',
  initialState,
  reducers: {
    setParams: (state, action) => {
      state.params = { ...state.params, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranchList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranchList.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        state.list = payload.data || [];
        state.pagination = {
          currentPage: payload.currentPage ?? 0,
          totalPages: payload.totalPages ?? 0,
          totalElements: payload.totalElements ?? 0,
          size: payload.size ?? state.params.size,
          first: payload.first ?? true,
          last: payload.last ?? false,
        };
      })
      .addCase(fetchBranchList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setParams } = branchSlice.actions;
export default branchSlice.reducer;


