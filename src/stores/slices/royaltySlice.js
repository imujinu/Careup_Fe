import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { royaltyService } from "../../service/royaltyService";

// 전체 로열티 조회
export const fetchAllRoyalties = createAsyncThunk(
  "royalty/fetchAllRoyalties",
  async () => {
    const data = await royaltyService.getAllRoyalties();
    return data;
  }
);

// 로열티 상세 조회
export const fetchRoyaltyDetail = createAsyncThunk(
  "royalty/fetchRoyaltyDetail",
  async (royaltyId) => {
    const data = await royaltyService.getRoyaltyDetail(royaltyId);
    return data;
  }
);

// 선택한 가맹점의 정산 내역 조회
export const fetchSettlementHistory = createAsyncThunk(
  "royalty/fetchSettlementHistory",
  async ({ branchId, status = null }) => {
    const data = status
      ? await royaltyService.getSettlementHistoryByStatus(branchId, status)
      : await royaltyService.getSettlementHistory(branchId);
    return data;
  }
);

const initialState = {
  allRoyalties: [],
  royaltyDetail: null,
  settlementHistory: [],
  selectedRoyaltyId: null,
  selectedBranchId: null,
  filterStatus: null,
  loading: false,
  error: null,
};

const royaltySlice = createSlice({
  name: "royalty",
  initialState,
  reducers: {
    setSelectedRoyaltyId: (state, action) => {
      state.selectedRoyaltyId = action.payload;
    },
    setSelectedBranchId: (state, action) => {
      state.selectedBranchId = action.payload;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearRoyaltyDetail: (state) => {
      state.royaltyDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 전체 로열티 조회
      .addCase(fetchAllRoyalties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllRoyalties.fulfilled, (state, action) => {
        state.loading = false;
        state.allRoyalties = action.payload;
      })
      .addCase(fetchAllRoyalties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 로열티 상세 조회
      .addCase(fetchRoyaltyDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoyaltyDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.royaltyDetail = action.payload;
      })
      .addCase(fetchRoyaltyDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 정산 내역 조회
      .addCase(fetchSettlementHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettlementHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.settlementHistory = action.payload;
      })
      .addCase(fetchSettlementHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setSelectedRoyaltyId,
  setSelectedBranchId,
  setFilterStatus,
  clearError,
  clearRoyaltyDetail,
} = royaltySlice.actions;

export default royaltySlice.reducer;
