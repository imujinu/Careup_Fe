// src/stores/slices/staffSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchStaffList,
  fetchStaffListByBranch,
  getStaffDetail,
  createStaff,
  updateStaff,
  deactivateStaff,
  rehireStaff,
  fetchJobGrades,
} from '../../service/staffService';

export const fetchStaffListAction = createAsyncThunk(
  'staff/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchStaffList(params || {});
      return data;
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직원 목록 조회 실패';
      return rejectWithValue(m);
    }
  }
);

export const fetchStaffListByBranchAction = createAsyncThunk(
  'staff/fetchListByBranch',
  async ({ branchId, params }, { rejectWithValue }) => {
    try {
      const data = await fetchStaffListByBranch(branchId, params || {});
      return data;
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '지점별 직원 목록 조회 실패';
      return rejectWithValue(m);
    }
  }
);

export const fetchStaffDetailAction = createAsyncThunk(
  'staff/fetchDetail',
  async (staffId, { rejectWithValue }) => {
    try {
      const data = await getStaffDetail(staffId);
      return data;
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직원 상세 조회 실패';
      return rejectWithValue(m);
    }
  }
);

export const createStaffAction = createAsyncThunk(
  'staff/create',
  async ({ payload, profileImage }, { rejectWithValue }) => {
    try {
      const data = await createStaff(payload, profileImage);
      return data;
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직원 등록 실패';
      return rejectWithValue(m);
    }
  }
);

export const updateStaffAction = createAsyncThunk(
  'staff/update',
  async ({ staffId, payload, profileImage }, { rejectWithValue }) => {
    try {
      const data = await updateStaff(staffId, payload, profileImage);
      return data;
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직원 수정 실패';
      return rejectWithValue(m);
    }
  }
);

export const deactivateStaffAction = createAsyncThunk(
  'staff/deactivate',
  async (staffId, { rejectWithValue }) => {
    try {
      const data = await deactivateStaff(staffId);
      return { staffId, data };
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직원 비활성화 실패';
      return rejectWithValue(m);
    }
  }
);

export const rehireStaffAction = createAsyncThunk(
  'staff/rehire',
  async (staffId, { rejectWithValue }) => {
    try {
      const data = await rehireStaff(staffId);
      return data;
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직원 재입사 실패';
      return rejectWithValue(m);
    }
  }
);

export const fetchJobGradesAction = createAsyncThunk(
  'staff/fetchJobGrades',
  async (_, { rejectWithValue }) => {
    try {
      const data = await fetchJobGrades();
      return Array.isArray(data) ? data : (data?.content || []);
    } catch (e) {
      const m = e?.response?.data?.status_message || e.message || '직급 목록 조회 실패';
      return rejectWithValue(m);
    }
  }
);

const initialState = {
  list: [],
  pagination: { page: 0, size: 20, totalPages: 0, totalElements: 0 },
  summary: { totalEmployees: 0, activeEmployees: 0, recentlyAdded: 0 },
  params: { page: 0, size: 20, sort: 'employmentStatus,asc' },

  detail: null,

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

  jobGrades: [],
  jobGradeLoading: false,
  jobGradeError: null,
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setParams: (s, a) => {
      s.params = { ...s.params, ...a.payload };
    },
    clearDetail: (s) => {
      s.detail = null;
      s.detailError = null;
    },
    clearErrors: (s) => {
      s.error = null;
      s.detailError = null;
      s.createError = null;
      s.updateError = null;
      s.deactivateError = null;
      s.rehireError = null;
      s.jobGradeError = null;
    },
  },
  extraReducers: (b) => {
    // 본사 전체 조회
    b.addCase(fetchStaffListAction.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchStaffListAction.fulfilled, (s, a) => {
      s.loading = false;
      const p = a.payload || {};
      s.list = p.content || [];
      s.pagination = {
        page: p.page ?? 0,
        size: p.size ?? 20,
        totalPages: p.totalPages ?? 0,
        totalElements: p.totalElements ?? 0,
      };
      const arr = p.content || [];
      const active = arr.filter((x) => x.employmentStatus === 'ACTIVE');
      const recent = arr.filter((x) => {
        const d = new Date(x.createdAt);
        const o = new Date();
        o.setDate(o.getDate() - 30);
        return d >= o;
      });
      s.summary = {
        totalEmployees: p.totalElements ?? arr.length ?? 0,
        activeEmployees: active.length,
        recentlyAdded: recent.length,
      };
    });
    b.addCase(fetchStaffListAction.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
    });

    // 지점별 조회
    b.addCase(fetchStaffListByBranchAction.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchStaffListByBranchAction.fulfilled, (s, a) => {
      s.loading = false;
      const p = a.payload || {};
      s.list = p.content || [];
      s.pagination = {
        page: p.page ?? 0,
        size: p.size ?? 20,
        totalPages: p.totalPages ?? 0,
        totalElements: p.totalElements ?? 0,
      };
      const arr = p.content || [];
      const active = arr.filter((x) => x.employmentStatus === 'ACTIVE');
      const recent = arr.filter((x) => {
        const d = new Date(x.createdAt);
        const o = new Date();
        o.setDate(o.getDate() - 30);
        return d >= o;
      });
      s.summary = {
        totalEmployees: p.totalElements ?? arr.length ?? 0,
        activeEmployees: active.length,
        recentlyAdded: recent.length,
      };
    });
    b.addCase(fetchStaffListByBranchAction.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
    });

    // 상세
    b.addCase(fetchStaffDetailAction.pending, (s) => {
      s.detailLoading = true;
      s.detailError = null;
    });
    b.addCase(fetchStaffDetailAction.fulfilled, (s, a) => {
      s.detailLoading = false;
      s.detail = a.payload || null;
    });
    b.addCase(fetchStaffDetailAction.rejected, (s, a) => {
      s.detailLoading = false;
      s.detailError = a.payload;
    });

    // 생성
    b.addCase(createStaffAction.pending, (s) => {
      s.createLoading = true;
      s.createError = null;
    });
    b.addCase(createStaffAction.fulfilled, (s, a) => {
      s.createLoading = false;
      s.list.unshift(a.payload);
      s.pagination.totalElements += 1;
      s.summary.totalEmployees += 1;
      if (a.payload?.employmentStatus === 'ACTIVE') s.summary.activeEmployees += 1;
    });
    b.addCase(createStaffAction.rejected, (s, a) => {
      s.createLoading = false;
      s.createError = a.payload;
    });

    // 수정
    b.addCase(updateStaffAction.pending, (s) => {
      s.updateLoading = true;
      s.updateError = null;
    });
    b.addCase(updateStaffAction.fulfilled, (s, a) => {
      s.updateLoading = false;
      const i = s.list.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.list[i] = a.payload;
      if (s.detail?.id === a.payload.id) s.detail = a.payload;
    });
    b.addCase(updateStaffAction.rejected, (s, a) => {
      s.updateLoading = false;
      s.updateError = a.payload;
    });

    // 비활성화
    b.addCase(deactivateStaffAction.pending, (s) => {
      s.deactivateLoading = true;
      s.deactivateError = null;
    });
    b.addCase(deactivateStaffAction.fulfilled, (s, a) => {
      s.deactivateLoading = false;
      const id = a.payload?.staffId;
      const i = s.list.findIndex((x) => x.id === id);
      if (i !== -1) {
        s.list[i].employmentStatus = 'TERMINATED';
        s.list[i].enabled = false;
      }
      if (s.detail?.id === id) {
        s.detail.employmentStatus = 'TERMINATED';
        s.detail.enabled = false;
      }
      s.summary.activeEmployees = Math.max(0, s.summary.activeEmployees - 1);
    });
    b.addCase(deactivateStaffAction.rejected, (s, a) => {
      s.deactivateLoading = false;
      s.deactivateError = a.payload;
    });

    // 재입사
    b.addCase(rehireStaffAction.pending, (s) => {
      s.rehireLoading = true;
      s.rehireError = null;
    });
    b.addCase(rehireStaffAction.fulfilled, (s, a) => {
      s.rehireLoading = false;
      const i = s.list.findIndex((x) => x.id === a.payload.id);
      if (i !== -1) s.list[i] = a.payload;
      if (s.detail?.id === a.payload.id) s.detail = a.payload;
      if (a.payload?.employmentStatus === 'ACTIVE') s.summary.activeEmployees += 1;
    });
    b.addCase(rehireStaffAction.rejected, (s, a) => {
      s.rehireLoading = false;
      s.rehireError = a.payload;
    });

    // 직급
    b.addCase(fetchJobGradesAction.pending, (s) => {
      s.jobGradeLoading = true;
      s.jobGradeError = null;
    });
    b.addCase(fetchJobGradesAction.fulfilled, (s, a) => {
      s.jobGradeLoading = false;
      s.jobGrades = a.payload || [];
    });
    b.addCase(fetchJobGradesAction.rejected, (s, a) => {
      s.jobGradeLoading = false;
      s.jobGradeError = a.payload;
    });
  },
});

export const { setParams, clearDetail, clearErrors } = staffSlice.actions;
export default staffSlice.reducer;
