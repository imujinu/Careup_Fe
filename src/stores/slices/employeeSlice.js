import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  fetchEmployeeList, 
  fetchEmployeeListByBranch,
  getEmployeeDetail, 
  createEmployee, 
  updateEmployee, 
  deactivateEmployee, 
  rehireEmployee 
} from '../../service/employeeService';

// 직원 목록 조회
export const fetchEmployeeListAction = createAsyncThunk(
  'employee/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchEmployeeList(params || {});
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '직원 목록 조회 실패';
      return rejectWithValue(message);
    }
  }
);

// 지점별 직원 목록 조회
export const fetchEmployeeListByBranchAction = createAsyncThunk(
  'employee/fetchListByBranch',
  async ({ branchId, params }, { rejectWithValue }) => {
    try {
      const data = await fetchEmployeeListByBranch(branchId, params || {});
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '지점별 직원 목록 조회 실패';
      return rejectWithValue(message);
    }
  }
);

// 직원 상세 조회
export const fetchEmployeeDetailAction = createAsyncThunk(
  'employee/fetchDetail',
  async (employeeId, { rejectWithValue }) => {
    try {
      const data = await getEmployeeDetail(employeeId);
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '직원 상세 조회 실패';
      return rejectWithValue(message);
    }
  }
);

// 직원 등록
export const createEmployeeAction = createAsyncThunk(
  'employee/create',
  async ({ employeeData, profileImage }, { rejectWithValue }) => {
    try {
      const data = await createEmployee(employeeData, profileImage);
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '직원 등록 실패';
      return rejectWithValue(message);
    }
  }
);

// 직원 수정
export const updateEmployeeAction = createAsyncThunk(
  'employee/update',
  async ({ employeeId, employeeData, profileImage }, { rejectWithValue }) => {
    try {
      const data = await updateEmployee(employeeId, employeeData, profileImage);
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '직원 수정 실패';
      return rejectWithValue(message);
    }
  }
);

// 직원 비활성화(퇴사) 처리
export const deactivateEmployeeAction = createAsyncThunk(
  'employee/deactivate',
  async (employeeId, { rejectWithValue }) => {
    try {
      await deactivateEmployee(employeeId);
      return employeeId;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '직원 비활성화 실패';
      return rejectWithValue(message);
    }
  }
);

// 직원 재입사 처리
export const rehireEmployeeAction = createAsyncThunk(
  'employee/rehire',
  async (employeeId, { rejectWithValue }) => {
    try {
      const data = await rehireEmployee(employeeId);
      return data;
    } catch (error) {
      const message = error.response?.data?.status_message || error.message || '직원 재입사 실패';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  list: [],
  detail: null,
  pagination: {
    page: 0,
    size: 20,
    totalPages: 0,
    totalElements: 0,
  },
  loading: false,
  detailLoading: false,
  createLoading: false,
  updateLoading: false,
  deactivateLoading: false,
  rehireLoading: false,
  error: null,
  detailError: null,
  createError: null,
  updateError: null,
  deactivateError: null,
  rehireError: null,
  params: { page: 0, size: 20, sort: 'id' },
  summary: {
    totalEmployees: 0,
    activeEmployees: 0,
    recentlyAdded: 0,
  },
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setParams: (state, action) => {
      state.params = { ...state.params, ...action.payload };
    },
    clearDetail: (state) => {
      state.detail = null;
      state.detailError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.detailError = null;
      state.createError = null;
      state.updateError = null;
      state.deactivateError = null;
      state.rehireError = null;
    },
    updateSummary: (state, action) => {
      state.summary = { ...state.summary, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // 직원 목록 조회
      .addCase(fetchEmployeeListAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeListAction.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        state.list = payload.content || [];
        state.pagination = {
          page: payload.page ?? 0,
          size: payload.size ?? 20,
          totalPages: payload.totalPages ?? 0,
          totalElements: payload.totalElements ?? 0,
        };
        
        // 요약 정보 업데이트
        const employees = payload.content || [];
        const activeEmployees = employees.filter(emp => emp.employmentStatus === 'ACTIVE');
        const recentlyAdded = employees.filter(emp => {
          const createdDate = new Date(emp.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        });
        
        state.summary = {
          totalEmployees: payload.totalElements ?? 0,
          activeEmployees: activeEmployees.length,
          recentlyAdded: recentlyAdded.length,
        };
      })
      .addCase(fetchEmployeeListAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 지점별 직원 목록 조회
      .addCase(fetchEmployeeListByBranchAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeListByBranchAction.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload || {};
        state.list = payload.content || [];
        state.pagination = {
          page: payload.page ?? 0,
          size: payload.size ?? 20,
          totalPages: payload.totalPages ?? 0,
          totalElements: payload.totalElements ?? 0,
        };
        
        // 요약 정보 업데이트
        const employees = payload.content || [];
        const activeEmployees = employees.filter(emp => emp.employmentStatus === 'ACTIVE');
        const recentlyAdded = employees.filter(emp => {
          const createdDate = new Date(emp.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        });
        
        state.summary = {
          totalEmployees: payload.totalElements ?? 0,
          activeEmployees: activeEmployees.length,
          recentlyAdded: recentlyAdded.length,
        };
      })
      .addCase(fetchEmployeeListByBranchAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // 직원 상세 조회
      .addCase(fetchEmployeeDetailAction.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchEmployeeDetailAction.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchEmployeeDetailAction.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      })
      
      // 직원 등록
      .addCase(createEmployeeAction.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createEmployeeAction.fulfilled, (state, action) => {
        state.createLoading = false;
        // 목록에 새 직원 추가
        state.list.unshift(action.payload);
        state.pagination.totalElements += 1;
        state.summary.totalEmployees += 1;
        if (action.payload.employmentStatus === 'ACTIVE') {
          state.summary.activeEmployees += 1;
        }
      })
      .addCase(createEmployeeAction.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      
      // 직원 수정
      .addCase(updateEmployeeAction.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateEmployeeAction.fulfilled, (state, action) => {
        state.updateLoading = false;
        // 목록에서 해당 직원 업데이트
        const index = state.list.findIndex(emp => emp.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        // 상세 정보도 업데이트
        if (state.detail && state.detail.id === action.payload.id) {
          state.detail = action.payload;
        }
      })
      .addCase(updateEmployeeAction.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // 직원 비활성화
      .addCase(deactivateEmployeeAction.pending, (state) => {
        state.deactivateLoading = true;
        state.deactivateError = null;
      })
      .addCase(deactivateEmployeeAction.fulfilled, (state, action) => {
        state.deactivateLoading = false;
        // 목록에서 해당 직원의 상태 업데이트
        const index = state.list.findIndex(emp => emp.id === action.payload);
        if (index !== -1) {
          state.list[index].employmentStatus = 'TERMINATED';
          state.list[index].enabled = false;
        }
        // 상세 정보도 업데이트
        if (state.detail && state.detail.id === action.payload) {
          state.detail.employmentStatus = 'TERMINATED';
          state.detail.enabled = false;
        }
        // 활성 직원 수 감소
        state.summary.activeEmployees = Math.max(0, state.summary.activeEmployees - 1);
      })
      .addCase(deactivateEmployeeAction.rejected, (state, action) => {
        state.deactivateLoading = false;
        state.deactivateError = action.payload;
      })
      
      // 직원 재입사
      .addCase(rehireEmployeeAction.pending, (state) => {
        state.rehireLoading = true;
        state.rehireError = null;
      })
      .addCase(rehireEmployeeAction.fulfilled, (state, action) => {
        state.rehireLoading = false;
        // 목록에서 해당 직원의 상태 업데이트
        const index = state.list.findIndex(emp => emp.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        // 상세 정보도 업데이트
        if (state.detail && state.detail.id === action.payload.id) {
          state.detail = action.payload;
        }
        // 활성 직원 수 증가
        if (action.payload.employmentStatus === 'ACTIVE') {
          state.summary.activeEmployees += 1;
        }
      })
      .addCase(rehireEmployeeAction.rejected, (state, action) => {
        state.rehireLoading = false;
        state.rehireError = action.payload;
      });
  },
});

export const { setParams, clearDetail, clearErrors, updateSummary } = employeeSlice.actions;
export default employeeSlice.reducer;
