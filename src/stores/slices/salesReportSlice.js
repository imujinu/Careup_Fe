import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { salesReportService } from '../../service/salesReportService';

// 전체 지점 매출 조회
export const fetchAllBranchesSales = createAsyncThunk(
  'salesReport/fetchAllBranchesSales',
  async ({ startDate, endDate, periodType }) => {
    const data = await salesReportService.getAllBranchesSales(startDate, endDate, periodType);
    return data;
  }
);

// 특정 지점 매출 조회
export const fetchBranchSalesDetail = createAsyncThunk(
  'salesReport/fetchBranchSalesDetail',
  async ({ branchId, startDate, endDate, periodType }) => {
    const data = await salesReportService.getBranchSalesDetail(branchId, startDate, endDate, periodType);
    return data;
  }
);

// 지점 간 비교
export const fetchBranchComparison = createAsyncThunk(
  'salesReport/fetchBranchComparison',
  async ({ branchIds, startDate, endDate, periodType }) => {
    const data = await salesReportService.compareBranchesSales(branchIds, startDate, endDate, periodType);
    return data;
  }
);

// 예상 매출액 조회
export const fetchSalesForecast = createAsyncThunk(
  'salesReport/fetchSalesForecast',
  async (branchId) => {
    const data = await salesReportService.getBranchSalesForecast(branchId);
    return data;
  }
);

// 예상 매출액 계산
export const calculateSalesForecast = createAsyncThunk(
  'salesReport/calculateSalesForecast',
  async ({ branchId, forecastDays }) => {
    const data = await salesReportService.calculateSalesForecast(branchId, forecastDays);
    return data;
  }
);

// 예상 매출액 전송 (단일)
export const saveSalesForecast = createAsyncThunk(
  'salesReport/saveSalesForecast',
  async (request) => {
    const data = await salesReportService.saveSalesForecast(request);
    return data;
  }
);

// 예상 매출액 일괄 전송
export const saveBulkSalesForecasts = createAsyncThunk(
  'salesReport/saveBulkSalesForecasts',
  async (request) => {
    const data = await salesReportService.saveBulkSalesForecasts(request);
    return data;
  }
);

// 모든 지점 예상 매출액 자동 계산 및 전송
export const calculateAndSaveAllBranchForecasts = createAsyncThunk(
  'salesReport/calculateAndSaveAllBranchForecasts',
  async (forecastDays) => {
    const data = await salesReportService.calculateAndSaveAllBranchForecasts(forecastDays);
    return data;
  }
);

const initialState = {
  allBranchesSales: null,
  branchSalesDetail: null,
  branchComparison: null,
  salesForecast: null,
  forecastCalculation: null,
  loading: false,
  error: null,
  currentPeriodType: 'DAY',
  selectedBranchId: null,
  selectedBranchIds: [],
};

const salesReportSlice = createSlice({
  name: 'salesReport',
  initialState,
  reducers: {
    setCurrentPeriodType: (state, action) => {
      state.currentPeriodType = action.payload;
    },
    setSelectedBranchId: (state, action) => {
      state.selectedBranchId = action.payload;
    },
    setSelectedBranchIds: (state, action) => {
      state.selectedBranchIds = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 전체 지점 매출 조회
      .addCase(fetchAllBranchesSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBranchesSales.fulfilled, (state, action) => {
        state.loading = false;
        state.allBranchesSales = action.payload;
      })
      .addCase(fetchAllBranchesSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 특정 지점 매출 조회
      .addCase(fetchBranchSalesDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranchSalesDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.branchSalesDetail = action.payload;
      })
      .addCase(fetchBranchSalesDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 지점 간 비교
      .addCase(fetchBranchComparison.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranchComparison.fulfilled, (state, action) => {
        state.loading = false;
        state.branchComparison = action.payload;
      })
      .addCase(fetchBranchComparison.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 예상 매출액 조회
      .addCase(fetchSalesForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.salesForecast = action.payload;
      })
      .addCase(fetchSalesForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 예상 매출액 계산
      .addCase(calculateSalesForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateSalesForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.forecastCalculation = action.payload;
      })
      .addCase(calculateSalesForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 예상 매출액 전송 (단일)
      .addCase(saveSalesForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSalesForecast.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(saveSalesForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 예상 매출액 일괄 전송
      .addCase(saveBulkSalesForecasts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveBulkSalesForecasts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(saveBulkSalesForecasts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 모든 지점 예상 매출액 자동 계산 및 전송
      .addCase(calculateAndSaveAllBranchForecasts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateAndSaveAllBranchForecasts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(calculateAndSaveAllBranchForecasts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const {
  setCurrentPeriodType,
  setSelectedBranchId,
  setSelectedBranchIds,
  clearError,
} = salesReportSlice.actions;

export default salesReportSlice.reducer;

