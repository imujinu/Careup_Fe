import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../service/inventoryService';

export const fetchInventoryData = createAsyncThunk(
  'inventory/fetchData',
  async (branchId, { rejectWithValue }) => {
    try {
      const data = await inventoryService.getInventoryData(branchId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '재고 데이터 조회에 실패했습니다.');
    }
  }
);

export const fetchInventoryFlowData = createAsyncThunk(
  'inventory/fetchFlowData',
  async (branchId, { rejectWithValue }) => {
    try {
      const data = await inventoryService.getInventoryFlowData(branchId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '입출고 데이터 조회에 실패했습니다.');
    }
  }
);

export const addInventoryFlow = createAsyncThunk(
  'inventory/addFlow',
  async (flowData, { rejectWithValue }) => {
    try {
      await inventoryService.addInventoryFlow(flowData);
      return flowData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '입출고 기록 등록에 실패했습니다.');
    }
  }
);

export const updateInventoryFlow = createAsyncThunk(
  'inventory/updateFlow',
  async ({ flowId, flowData }, { rejectWithValue }) => {
    try {
      await inventoryService.updateInventoryFlow(flowId, flowData);
      return { flowId, flowData };
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '입출고 기록 수정에 실패했습니다.');
    }
  }
);

export const deleteInventoryFlow = createAsyncThunk(
  'inventory/deleteFlow',
  async (flowId, { rejectWithValue }) => {
    try {
      await inventoryService.deleteInventoryFlow(flowId);
      return flowId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '입출고 기록 삭제에 실패했습니다.');
    }
  }
);

export const updateInventoryInfo = createAsyncThunk(
  'inventory/updateInfo',
  async ({ branchProductId, safetyStock, unitPrice }, { rejectWithValue }) => {
    try {
      await inventoryService.updateInventoryInfo(branchProductId, safetyStock, unitPrice);
      return { branchProductId, safetyStock, unitPrice };
    } catch (error) {
      return rejectWithValue(error.response?.data?.status_message || '재고 정보 수정에 실패했습니다.');
    }
  }
);

const initialState = {
  // 재고 현황 데이터
  inventoryData: [],
  inventoryLoading: false,
  inventoryError: null,
  
  // 입출고 기록 데이터
  flowData: [],
  flowLoading: false,
  flowError: null,
  
  // 페이지네이션
  inventoryCurrentPage: 1,
  inventoryPageSize: 10,
  flowCurrentPage: 1,
  flowPageSize: 10,
  
  // 모달 상태
  isEditModalOpen: false,
  isDetailModalOpen: false,
  isFlowEditModalOpen: false,
  isFlowAddModalOpen: false,
  selectedItem: null,
  selectedFlowItem: null,
  
  // 검색/필터
  searchTerm: '',
  selectedCategory: '',
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    // 페이지네이션
    setInventoryPage: (state, action) => {
      state.inventoryCurrentPage = action.payload;
    },
    setInventoryPageSize: (state, action) => {
      state.inventoryPageSize = action.payload;
      state.inventoryCurrentPage = 1;
    },
    setFlowPage: (state, action) => {
      state.flowCurrentPage = action.payload;
    },
    setFlowPageSize: (state, action) => {
      state.flowPageSize = action.payload;
      state.flowCurrentPage = 1;
    },
    
    // 모달 관리
    openEditModal: (state, action) => {
      state.isEditModalOpen = true;
      state.selectedItem = action.payload;
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
      state.selectedItem = null;
    },
    openDetailModal: (state, action) => {
      state.isDetailModalOpen = true;
      state.selectedItem = action.payload;
    },
    closeDetailModal: (state) => {
      state.isDetailModalOpen = false;
      state.selectedItem = null;
    },
    openFlowEditModal: (state, action) => {
      state.isFlowEditModalOpen = true;
      state.selectedFlowItem = action.payload;
    },
    closeFlowEditModal: (state) => {
      state.isFlowEditModalOpen = false;
      state.selectedFlowItem = null;
    },
    openFlowAddModal: (state) => {
      state.isFlowAddModalOpen = true;
    },
    closeFlowAddModal: (state) => {
      state.isFlowAddModalOpen = false;
    },
    
    // 검색/필터
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.inventoryCurrentPage = 1;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.inventoryCurrentPage = 1;
    },
    
    // 에러 클리어
    clearInventoryError: (state) => {
      state.inventoryError = null;
    },
    clearFlowError: (state) => {
      state.flowError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Inventory Data
      .addCase(fetchInventoryData.pending, (state) => {
        state.inventoryLoading = true;
        state.inventoryError = null;
      })
      .addCase(fetchInventoryData.fulfilled, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryData = action.payload || [];
        state.inventoryError = null;
      })
      .addCase(fetchInventoryData.rejected, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryError = action.payload;
      })
      
      // Fetch Flow Data
      .addCase(fetchInventoryFlowData.pending, (state) => {
        state.flowLoading = true;
        state.flowError = null;
      })
      .addCase(fetchInventoryFlowData.fulfilled, (state, action) => {
        state.flowLoading = false;
        state.flowData = action.payload || [];
        state.flowError = null;
      })
      .addCase(fetchInventoryFlowData.rejected, (state, action) => {
        state.flowLoading = false;
        state.flowError = action.payload;
      })
      
      // Add Flow
      .addCase(addInventoryFlow.fulfilled, (state, action) => {
        state.flowData.unshift(action.payload);
        state.isFlowAddModalOpen = false;
      })
      
      // Update Flow
      .addCase(updateInventoryFlow.fulfilled, (state, action) => {
        const { flowId, flowData } = action.payload;
        const index = state.flowData.findIndex(item => (item.flowId || item.id) === flowId);
        if (index !== -1) {
          state.flowData[index] = { ...state.flowData[index], ...flowData };
        }
        state.isFlowEditModalOpen = false;
        state.selectedFlowItem = null;
      })
      
      // Delete Flow
      .addCase(deleteInventoryFlow.fulfilled, (state, action) => {
        const flowId = action.payload;
        state.flowData = state.flowData.filter(item => (item.flowId || item.id) !== flowId);
        
        // 마지막 페이지의 마지막 항목을 삭제한 경우 페이지 조정
        const totalPages = Math.ceil(state.flowData.length / state.flowPageSize);
        if (state.flowCurrentPage > totalPages && totalPages > 0) {
          state.flowCurrentPage = totalPages;
        }
      })
      
      // Update Inventory Info
      .addCase(updateInventoryInfo.fulfilled, (state, action) => {
        const { branchProductId, safetyStock, unitPrice } = action.payload;
        const index = state.inventoryData.findIndex(item => item.branchProductId === branchProductId);
        if (index !== -1) {
          if (safetyStock !== null) {
            state.inventoryData[index].safetyStock = safetyStock;
          }
          if (unitPrice !== null) {
            state.inventoryData[index].unitPrice = unitPrice;
          }
        }
        state.isEditModalOpen = false;
        state.selectedItem = null;
      });
  },
});

export const {
  setInventoryPage,
  setInventoryPageSize,
  setFlowPage,
  setFlowPageSize,
  openEditModal,
  closeEditModal,
  openDetailModal,
  closeDetailModal,
  openFlowEditModal,
  closeFlowEditModal,
  openFlowAddModal,
  closeFlowAddModal,
  setSearchTerm,
  setSelectedCategory,
  clearInventoryError,
  clearFlowError,
} = inventorySlice.actions;

export default inventorySlice.reducer;
