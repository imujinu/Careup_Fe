// src/stores/slices/branchSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { branchService, deleteBranch } from '../../service/branchService';

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

export const deleteBranchAction = createAsyncThunk(
  'branch/delete',
  async (branchId, { rejectWithValue }) => {
    try {
      await deleteBranch(branchId);
      return branchId;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '지점 삭제 실패';
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
  deleteLoading: false,
  deleteError: null,
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
      })
      .addCase(deleteBranchAction.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteBranchAction.fulfilled, (state, action) => {
        state.deleteLoading = false;
        // 삭제된 지점을 목록에서 제거
        state.list = state.list.filter(branch => branch.id !== action.payload);
        // 총 요소 수 감소
        state.pagination.totalElements = Math.max(0, state.pagination.totalElements - 1);
      })
      .addCase(deleteBranchAction.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  },
});

export const { setParams } = branchSlice.actions;
export default branchSlice.reducer;


