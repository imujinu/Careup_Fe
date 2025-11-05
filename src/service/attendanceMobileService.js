// src/service/attendanceMobileService.js
import axios from '../utils/axiosConfig';
import { fetchScheduleCalendar, getScheduleDetail } from './scheduleService';
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

/** LocalDateTime 안전 전송용(오프셋/밀리초 제거) */
const localIsoNoZ = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 19); // yyyy-MM-ddTHH:mm:ss
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

    let dispMinS = null, dispMaxE = null;
    let planStart = null, planEnd = null;

    let anyIn = false, anyOut = false, anyOvernightHead = false, anyOvernightTail = false;
    let leaveTypeName = '';

    let primaryPiece = null;
    let primaryStartTs = NaN;

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

      if (ev.isOvernight && ev.part === 'HEAD' && !e0) {
        const nextMid = dayNextStart(ymd);
        if (!dispMaxE || toTime(nextMid) > toTime(dispMaxE)) dispMaxE = nextMid;
      }
      if (ev.isOvernight && ev.part === 'TAIL' && !s0) {
        const thisMid = dayStart(ymd);
        if (!dispMinS || toTime(thisMid) < toTime(dispMinS)) dispMinS = thisMid;
      }

      const candidateStart = (ev.actualClockIn || ev.clockInAt || ev.actualStartAt || ev.registeredClockIn || ev.registeredStartAt || ev.startAt || null);
      const cts = toTime(candidateStart);
      if (candidateStart && (Number.isNaN(primaryStartTs) || cts < primaryStartTs)) {
        primaryStartTs = cts;
        primaryPiece = ev;
      }
    }

    const isToday = ymd === todayYMD;
    const isFuture = ymd > todayYMD;
    const isPast = ymd < todayYMD;

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
      name: DOW_KR[i],
      in: dispMinS ? fmtHM(dispMinS) : '',
      out: dispMaxE ? fmtHM(dispMaxE) : '',
      today: isToday,
      off: pieces.length === 0,
      minutes,
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

  const list = await fetchScheduleCalendar({ from, to, employeeId });
  const events = Array.isArray(list) ? list : [];

  const summary = summarizeWeekFromEvents(events, baseDate);
  let days = summary.days;

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

    const bucket = new Map(days.map(d => [d.ymd, 0]));
    const now = new Date();

    for (const [, det] of detailMap.entries()) {
      if (!det) continue;

      const as = det.actualClockIn || det.clockInAt || det.actualStartAt || null;
      const ae0 = det.actualClockOut || det.clockOutAt || det.actualEndAt || null;
      const ps = det.registeredClockIn || det.registeredStartAt || det.startAt || null;
      const pe = det.registeredClockOut || det.registeredEndAt || det.endAt || null;

      let ae = ae0;
      if (!ae && as) {
        const asDay = toYMD(as);
        if (asDay < toYMD(now)) {
          ae = pe || null;
        } else if (asDay === toYMD(now)) {
          ae = pe ? new Date(Math.min(toTime(pe), now.getTime())) : now;
        }
      }

      if (!as || !ae) continue;

      for (const d of days) {
        const add = minutesOverlapOnDay(as, ae, d.ymd);
        if (add > 0) bucket.set(d.ymd, (bucket.get(d.ymd) || 0) + add);
      }
    }

    days = days.map(d => ({ ...d, minutes: Math.max(d.minutes || 0, bucket.get(d.ymd) || 0) }));
  }

  const totalMinutes = days.reduce((acc, d) => acc + (d.minutes || 0), 0);
  return { days, totalMinutes };
};

/** 👉 “주간 지표”를 한 번에 계산해 반환 */
export const fetchWeekMetrics = async (baseDate = new Date()) => {
  const summary = await fetchWeekSummary(baseDate);
  const totalMinutes = Number(summary?.totalMinutes || 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const totalRemainMinutes = totalMinutes % 60;

  const avgPerDayMinutes = totalMinutes / 7;
  const avgPerDayHours = Math.floor(avgPerDayMinutes / 60);
  const avgPerDayRemainMinutes = Math.round(avgPerDayMinutes % 60);

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
  let scheduleId = null;

  if (primary) {
    ({ inText, outText } = timesFor(primary));
    scheduleId = pickScheduleId(primary) || null;

    const sid = scheduleId;
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
    scheduleId,
  };

  todayObj.canClockIn = allowClockIn(todayObj);
  todayObj.canClockOut = allowClockOut(todayObj);

  return todayObj;
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

/* ===== 출근/퇴근: 표준 페이로드 + 폴백 경로 ===== */
const idemp = () => `idm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const postJson = (url, data = {}) =>
  axios.post(url, data, {
    headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idemp() },
  }).then(r => r?.data);

// 콜론 등 접미사가 딸려온 scheduleId를 경로에서는 숫자부만 사용
const normalizeId = (v) => String(v ?? '').split(':')[0];

// 레거시 폴백 시도 여부
const shouldTryNext = (status) => [400, 404, 405, 415].includes(Number(status));

/** ✅ 서버 DTO(AttendanceActionRequest)에 맞춘 페이로드 */
const buildActionPayload = (_scheduleId, geo) => {
  const lat = Number.isFinite(geo?.lat) ? geo.lat : undefined;
  const lng = Number.isFinite(geo?.lng) ? geo.lng
           : Number.isFinite(geo?.lon) ? geo.lon : undefined; // lon이 들어와도 lng로 맞춰 전송
  const at  = (typeof geo?.at === 'string' && geo.at) ? geo.at : undefined;
  const accuracyMeters = Number.isFinite(geo?.accuracyMeters) ? geo.accuracyMeters : undefined;

  const payload = { lat, lng, at, accuracyMeters };
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
};

/** ✅ 출근 (신규 경로 우선, 레거시 폴백 지원) */
export const clockIn = async (scheduleId, geo) => {
  const id0 = scheduleId ?? (await fetchTodayStatus())?.scheduleId;
  if (!id0) throw new Error('오늘 등록된 스케줄이 없습니다.');
  const id = normalizeId(id0);
  const body = buildActionPayload(id, geo ?? { at: localIsoNoZ() });

  const candidates = [
    `${BASE_URL}/attendance/event/${encodeURIComponent(id)}/clock-in`,       // 신규
    `${BASE_URL}/attendance/clock-in?scheduleId=${encodeURIComponent(id)}`, // 레거시(qs)
    `${BASE_URL}/attendance/clock-in`,                                      // 레거시(body)
  ];

  let lastErr;
  for (const url of candidates) {
    try { return await postJson(url, body); }
    catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      if (!shouldTryNext(st)) break;
    }
  }
  throw lastErr || new Error('출근 처리 실패');
};

/** ✅ 퇴근 (신규 경로 우선, 레거시 폴백 지원) */
export const clockOut = async (scheduleId, geo) => {
  const id0 = scheduleId ?? (await fetchTodayStatus())?.scheduleId;
  if (!id0) throw new Error('오늘 등록된 스케줄이 없습니다.');
  const id = normalizeId(id0);
  const body = buildActionPayload(id, geo ?? { at: localIsoNoZ() });

  const candidates = [
    `${BASE_URL}/attendance/event/${encodeURIComponent(id)}/clock-out`,      // 신규
    `${BASE_URL}/attendance/clock-out?scheduleId=${encodeURIComponent(id)}`, // 레거시(qs)
    `${BASE_URL}/attendance/clock-out`,                                     // 레거시(body)
  ];

  let lastErr;
  for (const url of candidates) {
    try { return await postJson(url, body); }
    catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      if (!shouldTryNext(st)) break;
    }
  }
  throw lastErr || new Error('퇴근 처리 실패');
};
