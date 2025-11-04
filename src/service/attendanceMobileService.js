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

const DOW_KR = ['일','월','화','수','목','금','토'];
const LATE_THRESHOLD_MIN = 1;

/* ===== 공통 유틸 ===== */
const toYMD = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const startOfWeek = (d) => {
  const dt = new Date(d);
  const dow = dt.getDay();
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() - dow);
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayStart = (ymd) => {
  const [Y,M,D] = ymd.split('-').map(Number);
  return new Date(Y, M - 1, D, 0, 0, 0, 0);
};
const dayNextStart = (ymd) => {
  const [Y,M,D] = ymd.split('-').map(Number);
  return new Date(Y, M - 1, D + 1, 0, 0, 0, 0);
};
const toTime = (v) => (v instanceof Date ? v.getTime() : (v ? new Date(v).getTime() : NaN));
const fmtHM = (isoLike) => {
  if (!isoLike) return '';
  const t = isoLike instanceof Date ? isoLike : new Date(isoLike);
  if (Number.isNaN(t.getTime())) return '';
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
const fmtAMPM = (isoLike) => {
  if (!isoLike) return '';
  const t = isoLike instanceof Date ? isoLike : new Date(isoLike);
  if (Number.isNaN(t.getTime())) return '';
  let h = t.getHours();
  const m = String(t.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m}${ampm}`;
};

/* ===== 이벤트별 시각 추출 ===== */
const pickTimesForPiece = (ev) => {
  const s = ev.actualClockIn || ev.clockInAt || ev.actualStartAt || ev.registeredClockIn || ev.registeredStartAt || ev.startAt || null;
  const e = ev.actualClockOut || ev.clockOutAt || ev.actualEndAt || ev.registeredClockOut || ev.registeredEndAt || ev.endAt || null;
  return { s, e };
};
const pickActualTimes = (ev) => {
  const as = ev.actualClockIn || ev.clockInAt || ev.actualStartAt || null;
  const ae = ev.actualClockOut || ev.clockOutAt || ev.actualEndAt || null;
  return { as, ae };
};
const pickPlanTimes = (ev) => {
  const ps = ev.registeredClockIn || ev.registeredStartAt || ev.startAt || null;
  const pe = ev.registeredClockOut || ev.registeredEndAt || ev.endAt || null;
  return { ps, pe };
};

const isLeavePiece = (p) => {
  const st = String(p?.status || p?.attendanceStatus || '').toUpperCase();
  const cat = String(p?.category || p?.scheduleType || '').toUpperCase();
  return st === 'LEAVE' || cat === 'LEAVE' || !!p?.leaveTypeId || !!p?.leaveTypeName;
};
const pickScheduleId = (p) => p?.id ?? p?.scheduleId ?? p?.scheduleSeq ?? p?.seq ?? null;
const hasIn = (o) => !!(o?.clockInAt || o?.actualClockIn || o?.actualStartAt);
const hasOut = (o) => !!(o?.clockOutAt || o?.actualClockOut || o?.actualEndAt);

/** 일자별 겹침 분(min) 계산 */
const minutesOverlapOnDay = (as, ae, ymd) => {
  if (!as || !ae) return 0;
  const s = toTime(as);
  const e = toTime(ae);
  if (!(s && e) || e <= s) return 0;
  const ds = dayStart(ymd).getTime();
  const de = dayNextStart(ymd).getTime();
  const overlap = Math.min(e, de) - Math.max(s, ds);
  return Math.max(0, Math.round(overlap / 60000));
};

/** 표시/상태 요약(조각 기준) */
const summarizeWeekFromEvents = (events, anchorDate) => {
  const todayYMD = toYMD(new Date());
  const s = startOfWeek(anchorDate);

  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(s, i);
    const ymd = toYMD(day);
    const now = new Date();

    const pieces = (events || [])
      .flatMap(splitForCalendar)
      .filter((p) => {
        const keySource =
          p.cellDate ||
          p.date ||
          p.startAt ||
          p.registeredClockIn ||
          p.actualClockIn ||
          p.clockInAt ||
          p.registeredStartAt ||
          p.actualStartAt ||
          p.endAt ||
          p.clockOutAt ||
          p.actualClockOut ||
          p.registeredClockOut ||
          p.registeredEndAt ||
          p.actualEndAt;
        return keySource && toYMD(keySource) === ymd;
      });

    // 표시 텍스트
    let dispMinS = null, dispMaxE = null;
    let planStart = null, planEnd = null;

    let anyIn = false, anyOut = false, anyOvernightHead = false, anyOvernightTail = false;
    let leaveTypeName = '';

    // 대표 스케줄
    let primaryPiece = null;
    let primaryStartTs = NaN;

    // (표시용) minutes 기본 0 — 실제 합산은 추후 보강
    let minutes = 0;

    for (const ev of pieces) {
      const { s: s0, e: e0 } = pickTimesForPiece(ev);
      if (s0 && (!dispMinS || toTime(s0) < toTime(dispMinS))) dispMinS = s0;
      if (e0 && (!dispMaxE || toTime(e0) > toTime(dispMaxE))) dispMaxE = e0;

      const { ps, pe } = pickPlanTimes(ev);
      if (ps && (!planStart || toTime(ps) < toTime(planStart))) planStart = ps;
      if (pe && (!planEnd || toTime(pe) > toTime(planEnd))) planEnd = pe;

      const { as, ae } = pickActualTimes(ev);
      if (as) anyIn = true;
      if (ae) anyOut = true;
      if (isLeavePiece(ev) && !leaveTypeName) leaveTypeName = ev.leaveTypeName || '';
      if (ev.isOvernight && ev.part === 'HEAD') anyOvernightHead = true;
      if (ev.isOvernight && ev.part === 'TAIL') anyOvernightTail = true;

      // 경계 표시 보정
      if (ev.isOvernight && ev.part === 'HEAD' && !e0) {
        const nextMid = dayNextStart(ymd);
        if (!dispMaxE || toTime(nextMid) > toTime(dispMaxE)) dispMaxE = nextMid;
      }
      if (ev.isOvernight && ev.part === 'TAIL' && !s0) {
        const thisMid = dayStart(ymd);
        if (!dispMinS || toTime(thisMid) < toTime(dispMinS)) dispMinS = thisMid;
      }

      // 대표 스케줄 선정
      const candidateStart = as || s0 || ps || null;
      const cts = toTime(candidateStart);
      if (candidateStart && (Number.isNaN(primaryStartTs) || cts < primaryStartTs)) {
        primaryStartTs = cts;
        primaryPiece = ev;
      }
    }

    const isToday = ymd === todayYMD;
    const isFuture = ymd > todayYMD;
    const isPast = ymd < todayYMD;

    // 상태 추론
    let status = '';
    let category = '';
    if (pieces.some(isLeavePiece)) {
      status = 'LEAVE';
      category = 'LEAVE';
    } else if (pieces.length > 0) {
      if (isFuture) {
        status = 'PLANNED';
      } else if (isToday) {
        if (anyIn && !anyOut) {
          status = 'CLOCKED_IN';
        } else if (!anyIn) {
          if (planEnd && now.getTime() > toTime(planEnd)) {
            status = 'ABSENT';
          } else {
            const pStart =
              planStart ||
              (pieces.map(p => p.registeredClockIn || p.registeredStartAt || p.startAt).filter(Boolean).sort()[0] || null);
            if (pStart && now.getTime() > toTime(pStart) + LATE_THRESHOLD_MIN * 60 * 1000) status = 'LATE';
            else status = 'PLANNED';
          }
        } else if (anyOut) {
          status = 'CLOCKED_OUT';
        }
      } else if (isPast) {
        if (anyIn && !anyOut) {
          status = anyOvernightHead ? 'CLOCKED_OUT' : 'MISSED_CHECKOUT';
        } else if (anyOut) {
          status = 'CLOCKED_OUT';
        } else if (planEnd) {
          status = 'ABSENT';
        } else {
          status = 'PLANNED';
        }
      }
    }

    return {
      ymd,
      name: i === 0 ? '일' : DOW_KR[i],
      in: dispMinS ? fmtHM(dispMinS) : '',
      out: dispMaxE ? fmtHM(dispMaxE) : '',
      today: isToday,
      off: pieces.length === 0,
      minutes, // ✅ 실제 합산은 아래 fetchWeekSummary에서 디테일 기반으로 보강
      status,
      attendanceStatus: status,
      category,
      leaveTypeName,
      scheduleId: primaryPiece ? pickScheduleId(primaryPiece) : null,
      employeeName: primaryPiece?.employeeName ?? undefined,
      branchName: primaryPiece?.branchName ?? undefined,
    };
  });

  const totalMinutes = days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  return { days, totalMinutes };
};

/** 주간 요약 + 실제 기록(상세) 기반 분배로 합산 보강 */
export const fetchWeekSummary = async (baseDate = new Date()) => {
  const user = tokenStorage.getUserInfo() || {};
  const employeeId = user.employeeId ?? null;
  if (!employeeId) return { days: [], totalMinutes: 0 };

  const s = startOfWeek(baseDate);
  const from = toYMD(s);
  const to = toYMD(addDays(s, 6));

  // 원본 이벤트
  const list = await fetchScheduleCalendar({ from, to, employeeId });
  const events = Array.isArray(list) ? list : [];

  // 1) 표시/상태 요약
  const summary = summarizeWeekFromEvents(events, baseDate);
  let days = summary.days;

  // 2) 실제 합산(상세 기반) — 주차 내 모든 스케줄 ID 대상으로 분배
  const pieces = events.flatMap(splitForCalendar);
  const sidSet = new Set(pieces.map(pickScheduleId).filter(Boolean));
  if (sidSet.size > 0) {
    const detailEntries = await Promise.all(
      Array.from(sidSet).map(async (sid) => {
        try {
          const det = await getScheduleDetail(sid);
          return [sid, det];
        } catch {
          return [sid, null];
        }
      })
    );
    const detailMap = new Map(detailEntries);

    // 날짜별 분(min) 누적 버킷
    const bucket = new Map(days.map(d => [d.ymd, 0]));

    // 각 상세의 실제 근무시간을 주간 7일에 분배(겹침만)
    for (const [sid, det] of detailMap.entries()) {
      if (!det) continue;
      const as = det.actualClockIn || det.clockInAt || det.actualStartAt || null;
      const ae = det.actualClockOut || det.clockOutAt || det.actualEndAt || null;
      if (!as || !ae) continue;

      for (const d of days) {
        const add = minutesOverlapOnDay(as, ae, d.ymd);
        if (add > 0) bucket.set(d.ymd, (bucket.get(d.ymd) || 0) + add);
      }
    }

    // 기존 minutes(표시용)보다 상세 기반이 크면 교체
    days = days.map(d => ({ ...d, minutes: Math.max(d.minutes || 0, bucket.get(d.ymd) || 0) }));
  }

  const totalMinutes = days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  return { days, totalMinutes };
};

/** 👉 “주간 지표”를 한 번에 계산해 반환 */
export const fetchWeekMetrics = async (baseDate = new Date()) => {
  const summary = await fetchWeekSummary(baseDate);
  const totalMinutes = Number(summary?.totalMinutes || 0);

  // 주간 총합
  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemainMinutes = totalMinutes % 60;

  // 일 평균(분)
  const avgPerDayMinutes = totalMinutes / 7;
  const avgPerDayHours = Math.floor(avgPerDayMinutes / 60);
  const avgPerDayRemainMinutes = Math.round(avgPerDayMinutes % 60);

  // 게이지 기준
  const targets = {
    weekTargetHours: 52,
    weekMarkerHours: 40,
    dailyAvgMaxHours: 12,
    dailyAvgMarkerHours: 8,
  };

  return {
    days: summary?.days || [],
    totalMinutes,
    totalHours,
    totalRemainMinutes,
    avgPerDayMinutes,
    avgPerDayHours,
    avgPerDayRemainMinutes,
    targets,
  };
};

/** 버튼 활성화 기준 */
const allowClockIn = (obj) => {
  if (!obj) return false;
  const st = String(obj.status || obj.attendanceStatus || '').toUpperCase();
  const leave = String(obj.category || obj.scheduleType || '').toUpperCase() === 'LEAVE' || st === 'LEAVE';
  if (leave || obj.off) return false;
  if (obj.canClockIn != null) return !!obj.canClockIn;
  const anyIn = hasIn(obj);
  if (!anyIn && (st === 'PLANNED' || st === 'LATE' || !st)) return true;
  return false;
};
const allowClockOut = (obj) => {
  if (!obj) return false;
  const st = String(obj.status || obj.attendanceStatus || '').toUpperCase();
  const leave = String(obj.category || obj.scheduleType || '').toUpperCase() === 'LEAVE' || st === 'LEAVE';
  if (leave || obj.off) return false;
  if (obj.canClockOut != null) return !!obj.canClockOut;
  const anyIn = hasIn(obj);
  const anyOut = hasOut(obj);
  if (st === 'CLOCKED_IN' || st === 'ON_BREAK') return true;
  if (anyIn && !anyOut) return true;
  if (st === 'MISSED_CHECKOUT') return true;
  return false;
};

/** 오늘 카드 데이터 */
export const fetchTodayStatus = async () => {
  const user = tokenStorage.getUserInfo() || {};
  const employeeId = user.employeeId ?? null;
  if (!employeeId) return null;

  const today = new Date();
  const ymd = toYMD(today);

  const list = await fetchScheduleCalendar({ from: ymd, to: ymd, employeeId });
  const pieces = (Array.isArray(list) ? list : []).flatMap(splitForCalendar).filter((p) => {
    const keySource =
      p.cellDate ||
      p.date ||
      p.startAt ||
      p.registeredClockIn ||
      p.actualClockIn ||
      p.clockInAt ||
      p.registeredStartAt ||
      p.actualStartAt ||
      p.endAt ||
      p.clockOutAt ||
      p.actualClockOut ||
      p.registeredClockOut ||
      p.registeredEndAt ||
      p.actualEndAt;
    return keySource && toYMD(keySource) === ymd;
  });

  let primary = null;
  if (pieces.length > 0) {
    primary =
      pieces
        .slice()
        .sort((a, b) => {
          const aS = a.actualClockIn || a.clockInAt || a.actualStartAt || a.registeredClockIn || a.registeredStartAt || a.startAt || '';
          const bS = b.actualClockIn || b.clockInAt || b.actualStartAt || b.registeredClockIn || b.registeredStartAt || b.startAt || '';
          return (toTime(aS) || 0) - (toTime(bS) || 0);
        })[0] || pieces[0];
  }

  let status = '';
  let category = '';
  let leaveTypeName = '';
  let missedCheckout = false;

  const timesFor = (obj) => {
    const s = obj?.actualClockIn || obj?.clockInAt || obj?.actualStartAt || obj?.registeredClockIn || obj?.registeredStartAt || obj?.startAt || null;
    const e = obj?.actualClockOut || obj?.clockOutAt || obj?.actualEndAt || obj?.registeredClockOut || obj?.registeredEndAt || obj?.endAt || null;
    return { inText: s ? fmtAMPM(s) : '', outText: e ? fmtAMPM(e) : '' };
  };
  let inText = '';
  let outText = '';

  if (primary) {
    ({ inText, outText } = timesFor(primary));

    const sid = pickScheduleId(primary);
    if (sid) {
      try {
        const detail = await getScheduleDetail(sid);

        const plannedStart =
          detail?.registeredClockIn || detail?.registeredStartAt || detail?.startAt ||
          primary.registeredClockIn || primary.registeredStartAt || primary.startAt || null;
        const plannedEnd =
          detail?.registeredClockOut || detail?.registeredEndAt || detail?.endAt ||
          primary.registeredClockOut || primary.registeredEndAt || primary.endAt || null;

        const aIn  = detail?.actualClockIn || detail?.clockInAt || detail?.actualStartAt || null;
        const aOut = detail?.actualClockOut || detail?.clockOutAt || detail?.actualEndAt || null;

        if (aIn) inText = fmtAMPM(aIn);
        if (aOut) outText = fmtAMPM(aOut);

        let st = String(detail?.attendanceStatus || detail?.status || '').toUpperCase();
        category = String(detail?.category || detail?.scheduleType || '').toUpperCase();
        leaveTypeName = detail?.leaveTypeName || primary?.leaveTypeName || '';

        let ruleStatus = '';
        if (category === 'LEAVE') {
          ruleStatus = 'LEAVE';
        } else if (aIn && !aOut) {
          ruleStatus = 'CLOCKED_IN';
        } else if (!aIn) {
          if (plannedEnd && today.getTime() > toTime(plannedEnd)) {
            ruleStatus = 'ABSENT';
          } else {
            const pStart = plannedStart || null;
            if (pStart && today.getTime() > toTime(pStart) + LATE_THRESHOLD_MIN * 60 * 1000) {
              ruleStatus = 'LATE';
            } else {
              ruleStatus = 'PLANNED';
            }
          }
        } else if (aOut) {
          ruleStatus = 'CLOCKED_OUT';
        }

        if (!st || st === 'PLANNED') st = ruleStatus;
        status = st || ruleStatus || status;

        missedCheckout = detail?.missedCheckout === true;
      } catch {
        const plannedStart = primary.registeredClockIn || primary.registeredStartAt || primary.startAt || null;
        const plannedEnd   = primary.registeredClockOut || primary.registeredEndAt   || primary.endAt   || null;
        const aIn = primary.actualClockIn || primary.clockInAt || primary.actualStartAt || null;
        const aOut= primary.actualClockOut || primary.clockOutAt || primary.actualEndAt || null;

        if (isLeavePiece(primary)) {
          status = 'LEAVE';
          category = 'LEAVE';
          leaveTypeName = primary?.leaveTypeName || '';
        } else if (aIn && !aOut) {
          status = 'CLOCKED_IN';
        } else if (!aIn) {
          if (plannedEnd && today.getTime() > toTime(plannedEnd)) {
            status = 'ABSENT';
          } else if (plannedStart && today.getTime() > toTime(plannedStart) + LATE_THRESHOLD_MIN * 60 * 1000) {
            status = 'LATE';
          } else {
            status = 'PLANNED';
          }
        } else if (aOut) {
          status = 'CLOCKED_OUT';
        }
      }
    } else {
      const plannedStart = primary.registeredClockIn || primary.registeredStartAt || primary.startAt || null;
      const plannedEnd   = primary.registeredClockOut || primary.registeredEndAt   || primary.endAt   || null;
      const aIn = primary.actualClockIn || primary.clockInAt || primary.actualStartAt || null;
      const aOut= primary.actualClockOut || primary.clockOutAt || primary.actualEndAt || null;

      if (isLeavePiece(primary)) {
        status = 'LEAVE';
        category = 'LEAVE';
        leaveTypeName = primary?.leaveTypeName || '';
      } else if (aIn && !aOut) {
        status = 'CLOCKED_IN';
      } else if (!aIn) {
        if (plannedEnd && today.getTime() > toTime(plannedEnd)) {
          status = 'ABSENT';
        } else if (plannedStart && today.getTime() > toTime(plannedStart) + LATE_THRESHOLD_MIN * 60 * 1000) {
          status = 'LATE';
        } else {
          status = 'PLANNED';
        }
      } else if (aOut) {
        status = 'CLOCKED_OUT';
      }
    }
  }

  const todayObj = {
    dateText: `${ymd} (${DOW_KR[today.getDay()]})`,
    in: inText,
    out: outText,
    off: !primary,
    status,
    attendanceStatus: status,
    category,
    leaveTypeName,
    missedCheckout,
  };

  todayObj.canClockIn = allowClockIn(todayObj);
  todayObj.canClockOut = allowClockOut(todayObj);

  return todayObj;
};

/** (호환) 평균 주간 시간 추출 */
export const fetchAvgWeekHours = async () => {
  const metrics = await fetchWeekMetrics(new Date());
  return {
    hours: metrics.totalHours,
    minutes: metrics.totalRemainMinutes,
    targetHours: metrics?.targets?.weekTargetHours ?? 52,
  };
};

export const clockIn = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/attendance/clock-in`, {});
    return res?.data;
  } catch {
    const now = new Date();
    return upsertAttendanceEvent('me', {
      eventDate: toYMD(now),
      clockInAt: now.toISOString(),
    });
  }
};

export const clockOut = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/attendance/clock-out`, {});
    return res?.data;
  } catch {
    const now = new Date();
    return upsertAttendanceEvent('me', {
      eventDate: toYMD(now),
      clockOutAt: now.toISOString(),
      clearMissedCheckout: true,
    });
  }
};
