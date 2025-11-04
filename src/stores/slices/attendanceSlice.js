import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchScheduleCalendar } from '../../service/scheduleService';
import { fetchKoreanHolidays } from '../../service/holidayService';

/** YYYY-MM-DD (today) */
const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** 초기 월 범위 (해당 달의 1일 ~ 말일) */
const initialToday = todayYMD();
const initialYear = Number(initialToday.slice(0, 4));
const initialMonth = Number(initialToday.slice(5, 7));
const initialViewFrom = `${initialYear}-${String(initialMonth).padStart(2, '0')}-01`;
const initialLast = new Date(initialYear, initialMonth, 0).getDate();
const initialViewTo = `${initialYear}-${String(initialMonth).padStart(2, '0')}-${String(initialLast).padStart(2, '0')}`;

/** 일정 로딩 */
export const loadCalendarEvents = createAsyncThunk(
  'attendance/loadCalendarEvents',
  async (_, { getState, rejectWithValue }) => {
    try {
      const s = getState().attendance;
      const params = {
        from: s.filters.rangeFrom,
        to: s.filters.rangeTo,
        branchId: s.filters.branchId ?? undefined,
        employeeId: s.filters.employeeId ?? undefined,
      };
      const list = await fetchScheduleCalendar(params);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return rejectWithValue(e?.response?.data?.message || '일정 로딩 실패');
    }
  }
);

/**
 * 공휴일 로딩
 * 응답 형태 무관하게 { ymd: name }으로 통합
 */
export const loadHolidays = createAsyncThunk(
  'attendance/loadHolidays',
  async ({ viewFrom, viewTo }, { rejectWithValue }) => {
    try {
      const data = await fetchKoreanHolidays({ from: viewFrom, to: viewTo });
      const map = {};
      if (Array.isArray(data)) {
        data.forEach((h) => {
          if (typeof h === 'string') {
            map[h] = '공휴일';
          } else if (h && typeof h === 'object') {
            const ymd = h.ymd || h.date || h.day || '';
            const name = h.name || h.title || '공휴일';
            if (ymd) map[ymd] = name;
          }
        });
      } else if (data && typeof data === 'object') {
        Object.entries(data).forEach(([k, v]) => {
          map[k] = v || '공휴일';
        });
      }
      return map;
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
      rangeFrom: initialViewFrom,
      rangeTo: initialViewTo,
      branchId: null,
      employeeId: null,
    },
    events: [],
    holidays: {},
    loading: false,
    error: '',
  },
  reducers: {
    /** 월 이동 */
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

      const [yStr, mStr] = state.view.viewFrom.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
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

    /** 필터 병합 업데이트 */
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },

    /** 검색 기간 설정 */
    setRange(state, action) {
      const { rangeFrom, rangeTo } = action.payload || {};
      if (rangeFrom) state.filters.rangeFrom = rangeFrom;
      if (rangeTo) state.filters.rangeTo = rangeTo;
    },
  },
  extraReducers: (builder) => {
    builder
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
      .addCase(loadHolidays.pending, (state) => {
        state.error = '';
      })
      .addCase(loadHolidays.fulfilled, (state, action) => {
        const incoming = action.payload || {};
        state.holidays = { ...state.holidays, ...incoming };
      })
      .addCase(loadHolidays.rejected, (state, action) => {
        state.error = action.payload || '공휴일 로딩 실패';
      });
  },
});

export const { moveMonth, setFilters, setRange } = attendanceSlice.actions;
export default attendanceSlice.reducer;
