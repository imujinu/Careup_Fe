// src/service/attendanceMobileService.js
import axios from '../utils/axiosConfig';
import {
  fetchScheduleCalendar,
  upsertAttendanceEvent,
  getScheduleDetail,
} from './scheduleService';
import { tokenStorage } from './authService';
import { splitForCalendar } from '../utils/calendarSplit';

const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${api}/branch-service`;
})();

const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const startOfWeek = (d) => {
  const dt = new Date(d);
  const dow = dt.getDay(); // 0=일
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - dow);
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmtHM = (iso) => {
  if (!iso) return '';
  const t = new Date(iso);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
const fmtAMPM = (iso) => {
  if (!iso) return '';
  const t = new Date(iso);
  let h = t.getHours();
  const m = String(t.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m}${ampm}`;
};
const DOW_KR = ['일','월','화','수','목','금','토'];

const pickTimesForPiece = (ev) => {
  const s = ev.actualClockIn || ev.actualStartAt || ev.registeredClockIn || ev.registeredStartAt || ev.startAt || null;
  const e = ev.actualClockOut || ev.actualEndAt || ev.registeredClockOut || ev.registeredEndAt || ev.endAt || null;
  return { s, e };
};

const summarizeWeekFromEvents = (events, anchorDate) => {
  const s = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(s, i);
    const ymd = toYMD(day);
    const pieces = (events || []).flatMap(splitForCalendar).filter(p => {
      // 각 조각의 cellDate가 해당 날짜
      const key = p.cellDate ||
        (p.date && toYMD(p.date)) ||
        (p.startAt && toYMD(p.startAt)) ||
        (p.registeredClockIn && toYMD(p.registeredClockIn)) ||
        (p.actualClockIn && toYMD(p.actualClockIn));
      return key === ymd;
    });

    let minS = null;
    let maxE = null;
    for (const ev of pieces) {
      const { s, e } = pickTimesForPiece(ev);
      if (s && (!minS || new Date(s) < new Date(minS))) minS = s;
      if (e && (!maxE || new Date(e) > new Date(maxE))) maxE = e;
      // 야간 분할 처리(HEAD/TAIL)
      if (ev.isOvernight && ev.part === 'HEAD' && !e) {
        const tailStart = `${ymd}T00:00:00`;
        if (!maxE || new Date(tailStart) > new Date(maxE)) maxE = tailStart;
      }
      if (ev.isOvernight && ev.part === 'TAIL' && !s) {
        const tailStart = `${ymd}T00:00:00`;
        if (!minS || new Date(tailStart) < new Date(minS)) minS = tailStart;
      }
    }

    const minutes = minS && maxE ? Math.max(0, Math.round((new Date(maxE) - new Date(minS)) / 60000)) : 0;

    return {
      ymd,
      name: i === 0 ? '일' : DOW_KR[i],
      in: minS ? fmtHM(minS) : '',
      out: maxE ? fmtHM(maxE) : '',
      today: toYMD(new Date()) === ymd,
      off: pieces.length === 0,
      minutes,
    };
  });

  const totalMinutes = days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  return { days, totalMinutes };
};

export const fetchWeekSummary = async (baseDate = new Date()) => {
  const user = tokenStorage.getUserInfo() || {};
  const employeeId = user.employeeId ?? null;
  if (!employeeId) return { days: [], totalMinutes: 0 };

  const s = startOfWeek(baseDate);
  const from = toYMD(s);
  const to = toYMD(addDays(s, 6));

  const list = await fetchScheduleCalendar({ from, to, employeeId });
  return summarizeWeekFromEvents(Array.isArray(list) ? list : [], baseDate);
};

export const fetchTodayStatus = async () => {
  const user = tokenStorage.getUserInfo() || {};
  const employeeId = user.employeeId ?? null;
  if (!employeeId) return null;

  const today = new Date();
  const { days } = await fetchWeekSummary(today);
  const one = days.find(d => d.ymd === toYMD(today));

  let canClockIn = false;
  let canClockOut = false;
  let statusBadge = '일정 없음';

  if (one && (!one.off)) {
    // 상세로 실제 기록 여부 확인 (가장 가까운 스케줄 하나 조회)
    // 일정 ID를 알 수 없으므로 상태 추정: in/out 표시 기준으로 판정
    if (!one.in) {
      canClockIn = true;
      statusBadge = '출근 가능';
    } else if (one.in && !one.out) {
      canClockOut = true;
      statusBadge = '퇴근 가능';
    } else {
      statusBadge = '완료';
    }
  }

  return {
    dateText: `${toYMD(today)} (${DOW_KR[today.getDay()]})`,
    in: one?.in ? (one.today ? fmtAMPM(`${one.ymd}T${one.in}:00`) : `${one.in}`) : '',
    out: one?.out ? (one.today ? fmtAMPM(`${one.ymd}T${one.out}:00`) : `${one.out}`) : '',
    canClockIn,
    canClockOut,
    statusBadge,
  };
};

export const fetchAvgWeekHours = async () => {
  // 간단히 "이번 주 총합"을 평균으로 제공 (추가 주차 평균은 필요 시 확장)
  const { totalMinutes } = await fetchWeekSummary(new Date());
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes, targetHours: 40 };
};

export const clockIn = async () => {
  // 우선 표준 엔드포인트 시도
  try {
    const res = await axios.post(`${BASE_URL}/attendance/clock-in`, {});
    return res?.data;
  } catch (e) {
    // 폴백: 오늘 스케줄에 업서트(없을 경우 서버에서 바인딩)
    const now = new Date();
    return upsertAttendanceEvent('me', { // 서버에서 "me" 또는 null을 허용하도록(없다면 백엔드 조정)
      eventDate: toYMD(now),
      clockInAt: now.toISOString(),
    });
  }
};

export const clockOut = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/attendance/clock-out`, {});
    return res?.data;
  } catch (e) {
    const now = new Date();
    return upsertAttendanceEvent('me', {
      eventDate: toYMD(now),
      clockOutAt: now.toISOString(),
      clearMissedCheckout: true,
    });
  }
};
