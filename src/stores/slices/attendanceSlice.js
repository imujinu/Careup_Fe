// src/stores/slices/attendanceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchScheduleCalendar, fetchKoreanHolidays } from '../../service/scheduleService';

const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const initialToday = todayYMD();
const initialYear = Number(initialToday.slice(0, 4));
const initialMonth = Number(initialToday.slice(5, 7));
const initialViewFrom = `${initialYear}-${String(initialMonth).padStart(2, '0')}-01`;
const initialLast = new Date(initialYear, initialMonth, 0).getDate();
const initialViewTo = `${initialYear}-${String(initialMonth).padStart(2, '0')}-${String(initialLast).padStart(2, '0')}`;

export const loadCalendarEvents = createAsyncThunk(
  'attendance/loadCalendarEvents',
  async (_, { getState, rejectWithValue }) => {
    try {
      const s = getState().attendance;
      const params = {
        from: s.filters.rangeFrom,
        to: s.filters.rangeTo,
        branchId: s.filters.branchId || undefined,
        employeeId: s.filters.employeeId || undefined,
      };
      const list = await fetchScheduleCalendar(params);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || '일정 로딩 실패');
    }
  }
);

export const loadHolidays = createAsyncThunk(
  'attendance/loadHolidays',
  async ({ viewFrom, viewTo }, { rejectWithValue }) => {
    try {
      const list = await fetchKoreanHolidays({ from: viewFrom, to: viewTo });
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || '공휴일 로딩 실패');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    view: { viewFrom: initialViewFrom, viewTo: initialViewTo },
    filters: {
      rangeFrom: initialToday,
      rangeTo: initialToday,
      branchId: null,
      employeeId: null,
    },
    events: [],
    holidays: {}, // ✅ 직렬화 가능한 객체로 유지
    loading: false,
    error: '',
  },
  reducers: {
    moveMonth(state, action) {
      const delta = action.payload || 0;
      if (delta === 0) {
        const t = todayYMD();
        const y = Number(t.slice(0, 4));
        const m = Number(t.slice(5, 7));
        const from = `${y}-${String(m).padStart(2, '0')}-01`;
        const last = new Date(y, m, 0).getDate();
        const to = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
        state.view.viewFrom = from;
        state.view.viewTo = to;
        return;
      }
      const [y, m] = state.view.viewFrom.split('-').map(Number);
      const base = new Date(y, m - 1, 1);
      base.setMonth(base.getMonth() + delta);
      const ny = base.getFullYear();
      const nm = base.getMonth() + 1;
      const from = `${ny}-${String(nm).padStart(2, '0')}-01`;
      const last = new Date(ny, nm, 0).getDate();
      const to = `${ny}-${String(nm).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
      state.view.viewFrom = from;
      state.view.viewTo = to;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    setRange(state, action) {
      const { rangeFrom, rangeTo } = action.payload || {};
      if (rangeFrom) state.filters.rangeFrom = rangeFrom;
      if (rangeTo) state.filters.rangeTo = rangeTo;
    },
  },
  extraReducers: (builder) => {
    builder
      // events
      .addCase(loadCalendarEvents.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(loadCalendarEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload || [];
      })
      .addCase(loadCalendarEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '일정 로딩 실패';
      })
      // holidays
      .addCase(loadHolidays.pending, (state) => {
        state.error = '';
        state.holidays = {}; // ✅ 남아있던 Set 잔재 제거
      })
      .addCase(loadHolidays.fulfilled, (state, action) => {
        const map = {};
        (action.payload || []).forEach((d) => {
          const ymd = String(d).slice(0, 10);
          if (ymd) map[ymd] = true;
        });
        state.holidays = map; // ✅ POJO
      })
      .addCase(loadHolidays.rejected, (state, action) => {
        state.error = action.payload || '공휴일 로딩 실패';
        state.holidays = {}; // ✅ 실패 시도 초기화
      });
  },
});

export const { moveMonth, setFilters, setRange } = attendanceSlice.actions;
export default attendanceSlice.reducer;
