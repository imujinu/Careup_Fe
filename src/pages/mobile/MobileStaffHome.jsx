import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import careUpLogo from '../../assets/logos/care-up_logo.svg';
import Icon from '@mdi/react';
import {
  mdiClockOutline,
  mdiLogoutVariant,
  mdiCalendarWeek,
  mdiChevronRight,
  mdiChevronLeft,
  mdiMapMarker,
  mdiCrosshairsGps,
  mdiAlertCircle,
  mdiCoffee,
  mdiCoffeeOff,
} from '@mdi/js';
import {
  fetchTodayStatus,
  fetchWeekMetrics,
  clockIn,
  clockOut,
  breakStart,
  breakEnd,
  allowBreakStartClient,
  allowBreakEndClient,
} from '../../service/attendanceMobileService';
import { getScheduleDetail } from '../../service/scheduleService';
import { useToast } from '../../components/common/Toast';
import { useAppSelector } from '../../stores/hooks';
import { tokenStorage, authService } from '../../service/authService';
import { MobileScheduleDetailModal } from '../../components/mobile/MobileScheduleDetailModal';

// 지오펜스는 전용 서비스 사용
import { fetchMyBranchGeofence } from '../../service/branchGeolocationService';

import { useGeofence } from '../../hooks/useGeofence';
import { formatMeters } from '../../utils/geo';

const LATE_THRESHOLD_MIN = 1;
const GEOFENCE_SLACK = Number(import.meta.env.VITE_GEOFENCE_SLACK_METERS ?? 0);

const Screen = styled.div`
  min-height: 100vh;
  min-height: 100svh;
  background: #eef2f7;
`;
const TopBar = styled.header`
  padding: max(14px, env(safe-area-inset-top)) 16px 14px;
  background: linear-gradient(135deg, #29a6ff 0%, #8b5cf6 100%);
  color: #fff;
`;
const Container = styled.div`
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
`;

const TopRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 8px;
`;
const BrandRow = styled.div`
  display: inline-flex; align-items: center; gap: 10px; user-select: none;
`;
const Logo = styled.img`width: clamp(26px, 5.5vw, 30px); height: clamp(26px, 5.5vw, 30px);`;
const Brand = styled.span`font-weight: 800; letter-spacing: .2px; font-size: clamp(16px, 4.2vw, 18px);`;
const LogoutBtn = styled.button`
  height: 32px; padding: 0 10px;
  border-radius: 8px; border: 1px solid rgba(255,255,255,.45);
  background: rgba(255,255,255,.18); color: #fff; font-weight: 700; font-size: 12px;
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
  backdrop-filter: blur(4px);
  &:hover { background: rgba(255,255,255,.26); }
`;

const UserRow = styled.div`
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; padding: 8px 0 12px;
`;
const AvatarImg = styled.img`
  width: clamp(40px, 8.5vw, 48px); height: clamp(40px, 8.5vw, 48px); border-radius: 999px;
  object-fit: cover; border: 2px solid rgba(255,255,255,.6); background: #fff;
`;
const AvatarFallback = styled.div`
  width: clamp(40px, 8.5vw, 48px); height: clamp(40px, 8.5vw, 48px); border-radius: 999px;
  border: 2px solid rgba(255,255,255,.6); display: grid; place-items: center;
  background: rgba(255,255,255,.25); color: #fff; font-weight: 800; font-size: clamp(14px, 3.2vw, 16px);
`;
const UserMeta = styled.div`
  min-width: 0; display: grid; gap: 2px; line-height: 1.15;
  strong { font-size: clamp(14px, 3.8vw, 16px); font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  small { font-size: 12px; color: rgba(255,255,255,.9); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const Wrap = styled.div`
  padding: 12px 12px calc(12px + env(safe-area-inset-bottom));
`;
const Card = styled.section`
  background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; box-shadow: 0 8px 20px rgba(17,24,39,0.08); padding: 16px;
`;
const CardTitle = styled.h2`
  font-size: 15px; font-weight: 900; color: #111827; display: flex; align-items: center; gap: 8px; margin: 2px 0 12px;
  svg { opacity: .9; }
`;

const TitleRow = styled.div`
  display: grid; grid-template-columns: 1fr auto; align-items: center;
`;
const WeekViewport = styled.div`
  overflow-x: auto; overflow-y: hidden;
  -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain;
  padding-bottom: 2px; scrollbar-width: none; &::-webkit-scrollbar { display: none; }
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
  mask-image: linear-gradient(to right, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
  margin-top: 12px;
`;
const WeekNav = styled.div`
  display: inline-flex; align-items: center; gap: 2px;
`;
const WeekNavBtn = styled.button`
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; padding: 0;
  border: none; background: transparent; color: #374151; cursor: pointer;
`;

const TodayRow = styled.div`display: grid; gap: 12px;`;
const ScheduleLine = styled.div`
  display: flex; align-items: center; gap: 12px;
  padding-left: 8px;
  border-left: 4px solid ${(p) => p.$bar || '#22c55e'};
  color: #374151;
  small { color: #6b7280; }
`;
const StatusBadge = styled.span`
  margin-left:auto; font-size:12px; padding:4px 8px; border-radius:8px;
  font-weight: 700; border: 1px solid ${(p)=>p.$bd}; color: ${(p)=>p.$fg}; background: ${(p)=>p.$bg};
`;
const SingleBtnRow = styled.div`display:grid; grid-template-columns: 1fr;`;

const ActionBtn = styled.button`
  height: 44px; width: 100%;
  border: 1px solid transparent;
  border-radius: 10px;
  background: ${p => (p.$variant === 'out' ? '#111827' : '#3b82f6')};
  color: #fff; font-weight: 800; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
  transition: transform .03s ease, filter .12s ease, background-color .15s ease, color .15s ease, border-color .15s ease;
  &:hover { filter: brightness(.98); }
  &:active { transform: translateY(1px); }
  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    border-color: #e5e7eb;
    cursor: not-allowed;
    filter: none;
    transform: none;
  }
`;

const BreakBtnRow = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;
`;
const BreakBtn = styled.button`
  height: 38px; width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #374151; font-weight: 800; font-size: 13px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer;
  transition: transform .03s ease, filter .12s ease;
  &:hover { filter: brightness(.98); }
  &:active { transform: translateY(1px); }
  &:disabled {
    background: #f3f4f6;
    color: #9ca3af;
    border-color: #e5e7eb;
    cursor: not-allowed;
  }
`;

const WeekStrip = styled.div`
  display: grid; grid-auto-flow: column; gap: 10px;
  grid-auto-columns: clamp(90px, 24vw, 110px);
  width: max-content;
`;

const DayBox = styled.button`
  border-radius: 12px;
  padding: 12px 12px;
  min-height: 128px;
  text-align: center;
  border:1px solid ${(p)=>p.$bd}; background:${(p)=>p.$bg};
  small { display:block; color: #6b7280; font-size: 11px; }
  .time { display:block; color:#111827; margin-top: 4px; font-size: 11px; font-weight: 500; }
  em { display:block; color:#9ca3af; font-size: 11px; font-style: normal; margin-bottom: 4px; }
  width: 100%;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  transition: none;
  &:active { transform: none; }
  &:focus { outline: none; }
`;

const BarWrap = styled.div`margin-top: 14px;`;
const BarRail = styled.div`
  position: relative; height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden;
`;
const BarFill = styled.div`
  height: 100%;
  width: ${p => Math.min(100, p.$pct || 0)}%;
  background: ${p => p.$color || '#8b5cf6'};
  transition: width .2s ease;
`;
const BarMarker = styled.div`
  position: absolute; top: -6px; bottom: -6px; width: 2px;
  background: #6b7280; opacity: .6;
  left: ${p => Math.min(100, Math.max(0, p.$leftPct))}%;
  transform: translateX(-1px);
`;
const MarkerLabel = styled.div`
  position: absolute; top: 100%;
  font-size: 10px; color: #6b7280; white-space: nowrap;
  left: ${p => Math.min(100, Math.max(0, p.$leftPct))}%;
  transform: translate(-50%, 4px);
`;
const BarMeta = styled.div`display:flex; justify-content: space-between; font-size: 12px; color:#374151; margin-top: 18px;`;

const GeoRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
`;
const GeoPill = styled.div`
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 10px; font-size: 12px; font-weight: 700;
  border: 1px solid ${(p)=>p.$ok ? '#a7f3d0' : '#fed7aa'};
  color:  ${(p)=>p.$ok ? '#065f46' : '#9a3412'};
  background: ${(p)=>p.$ok ? '#ecfdf5' : '#fff7ed'};
`;

const stylesByVariant = {
  green:  { bg:'#ecfdf5', bd:'#a7f3d0', fg:'#065f46' },
  blue:   { bg:'#eef2ff', bd:'#c7d2fe', fg:'#1e3a8a' },
  orange: { bg:'#fff7ed', bd:'#fed7aa', fg:'#9a3412' },
  red:    { bg:'#fef2f2', bd:'#fecaca', fg:'#991b1b' },
  purple: { bg:'#f5f3ff', bd:'#ddd6fe', fg:'#6d28d9' },
  gray:   { bg:'#f3f4f6', bd:'#e5e7eb', fg:'#374151' },
};

const STATUS_LABEL = {
  PLANNED: '근무예정',
  CLOCKED_IN: '근무중',
  ON_BREAK: '휴게',
  CLOCKED_OUT: '퇴근완료',
  LATE: '지각',
  EARLY_LEAVE: '조퇴',
  OVERTIME: '연장근무',
  MISSED_CHECKOUT: '퇴근누락',
  ABSENT: '결근',
  LEAVE: '휴가',
};

const norm = (v) => (v === 0 || v) ? v : undefined;
const pick = (o, keys) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};
const fmtDateSmall = (ymd) => {
  if (!ymd) return '';
  const d = new Date(ymd);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
};
const fmtHMlocal = (isoLike) => {
  if (!isoLike) return '';
  const t = isoLike instanceof Date ? isoLike : new Date(isoLike);
  if (Number.isNaN(t.getTime())) return '';
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
const toTimeMs = (v) => (v instanceof Date ? v.getTime() : (v ? new Date(v).getTime() : NaN));
const toYMDlocal = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const pctOf = (minutes, maxHours) => {
  const m = Number(minutes || 0);
  const max = Number(maxHours || 1) * 60;
  return Math.max(0, Math.min(100, (m / max) * 100));
};
const pickStatusText = (o) => String(o?.attendanceStatus || o?.status || '').toUpperCase();

function stableVariantFromStatus(status, obj) {
  switch (status) {
    case 'LEAVE':           return 'purple';
    case 'ABSENT':          return 'red';
    case 'MISSED_CHECKOUT':
    case 'LATE':
    case 'EARLY_LEAVE':
    case 'OVERTIME':        return 'orange';
    case 'CLOCKED_IN':
    case 'ON_BREAK':
    case 'CLOCKED_OUT':     return 'green';
    case 'PLANNED':
    default:
      if (obj?.off === true) return 'gray';
      return 'blue';
  }
}

const plannedStartOf = (o) => pick(o, ['registeredClockIn','registeredStartAt','startAt']);
const plannedEndOf   = (o) => pick(o, ['registeredClockOut','registeredEndAt','endAt']);
const actualInOf     = (o) => pick(o, ['clockInAt','actualClockIn','actualStartAt']);
const actualOutOf    = (o) => pick(o, ['clockOutAt','actualClockOut','actualEndAt']);
const isLeave = (o) => {
  const st  = String(o?.attendanceStatus || o?.status || '').toUpperCase();
  const cat = String(o?.category || o?.scheduleType || '').toUpperCase();
  return st === 'LEAVE' || cat === 'LEAVE' || !!o?.leaveTypeId || !!o?.leaveTypeName;
};
function heuristicVariant(o, now = new Date()) {
  if (!o) return 'blue';
  if (o.off === true) return 'gray';
  if (isLeave(o)) return 'purple';

  const pStart = plannedStartOf(o) ? new Date(plannedStartOf(o)).getTime() : null;
  const pEnd   = plannedEndOf(o)   ? new Date(plannedEndOf(o)).getTime()   : null;
  const aIn    = actualInOf(o)     ? new Date(actualInOf(o)).getTime()     : null;
  const aOut   = actualOutOf(o)    ? new Date(actualOutOf(o)).getTime()    : null;
  const nowMs  = now.getTime();

  if (pEnd != null && aIn == null && nowMs > pEnd) return 'red';
  const lateFromAct = (aIn != null && pStart != null && aIn >= pStart + 1*60*1000);
  const lateNoClock = (aIn == null && pStart != null && nowMs >= pStart + 1*60*1000 && !aOut);
  if (lateFromAct || lateNoClock) return 'orange';
  if (aIn && !aOut) return pEnd && nowMs > pEnd ? 'orange' : 'green';
  if (aOut) return 'green';
  return 'blue';
}

function colorVariant(obj, now = new Date()) {
  const st = pickStatusText(obj);
  if (st) return stableVariantFromStatus(st, obj);
  return heuristicVariant(obj, now);
}

const statusText = (o) => {
  if (!o) return '근무예정';
  if (o.off === true) return '일정 없음';
  const st = pickStatusText(o);
  if (st === 'LEAVE') return o?.leaveTypeName || '휴가';
  return STATUS_LABEL[st] || (st ? st : '근무예정');
};

const getInText = (o) => norm(pick(o, [
  'in',
  'clockInAt','actualClockIn','actualStartAt',
  'start','plannedIn','scheduledIn','expectedIn','startAt','workStartAt',
  'registeredClockIn','registeredStartAt',
])) || '-';
const getOutText = (o) => norm(pick(o, [
  'out',
  'clockOutAt','actualClockOut','actualEndAt',
  'end','plannedOut','scheduledOut','expectedOut','endAt','workEndAt',
  'registeredClockOut','registeredEndAt',
])) || '-';

const pickStatus = (o) => pickStatusText(o);
const hasIn = (o) => !!actualInOf(o);
const hasOut = (o) => !!actualOutOf(o);
const isOff = (o) => o?.off === true;

function allowClockInLocal(today) {
  if (!today || isOff(today) || isLeave(today)) return false;
  if (today.canClockIn != null) return !!today.canClockIn;
  const st = pickStatus(today);
  if (!hasIn(today) && (st === 'PLANNED' || st === 'LATE' || !st)) return true;
  return false;
}
function allowClockOutLocal(today) {
  if (!today || isOff(today) || isLeave(today)) return false;
  if (today.canClockOut != null) return !!today.canClockOut;
  const st = pickStatus(today);
  const brStart = pick(today, ['breakStartAt', 'registeredBreakStart']);
  const brEnd   = pick(today, ['breakEndAt', 'registeredBreakEnd']);
  if (st === 'ON_BREAK' || (brStart && !brEnd)) return false;
  if (st === 'CLOCKED_IN') return true;
  if (hasIn(today) && !hasOut(today)) return true;
  if (st === 'MISSED_CHECKOUT') return true;
  return false;
}
function allowBreakStartLocal(today) { return allowBreakStartClient(today); }
function allowBreakEndLocal(today)   { return allowBreakEndClient(today); }

function decideAction(today, loading) {
  const st = pickStatus(today);
  const inNow = hasIn(today) && !hasOut(today);
  const preferOut = st === 'CLOCKED_IN' || st === 'ON_BREAK' || st === 'MISSED_CHECKOUT' || inNow;
  const canIn = allowClockInLocal(today);
  const canOut = allowClockOutLocal(today);

  if (preferOut) {
    return { label: '퇴근하기', icon: mdiLogoutVariant, variant: 'out', onClickName: 'out', disabled: loading || !canOut };
  }
  return { label: '출근하기', icon: mdiChevronRight, onClickName: 'in', disabled: loading || !canIn };
}

function isDayEmptyForModal(o) {
  if (!o) return true;
  if (isOff(o)) return true;
  const st = pickStatus(o);
  if (st) return false;
  const hasAnyTime = (getInText(o) !== '-') || (getOutText(o) !== '-');
  return !hasAnyTime;
}

function minutesToPct(mins, targetHours) { return pctOf(Number(mins || 0), Number(targetHours || 1)); }
function weeklyGaugeColor(totalMinutes)   { const h = Number(totalMinutes || 0)/60; return (h < 30 || h > 40) ? '#f59e0b' : '#10b981'; }
function avgGaugeColor(avgMinutesPerDay)  { const h = Number(avgMinutesPerDay || 0)/60; return (h >= 7 && h <= 8) ? '#10b981' : '#f59e0b'; }

function initials(name = '') {
  const s = String(name).trim();
  const parts = s ? s.split(/\s+/) : [];
  const first = parts[0]?.[0] ?? '';
  const last = parts[1]?.[0] ?? '';
  return (first + last || first || 'ME').toUpperCase();
}

export default function MobileStaffHome() {
  const { addToast } = useToast();
  const authUser = useAppSelector((s) => s?.auth?.user ?? s?.customerAuth?.user ?? null);

  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState(null);

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [weekDays, setWeekDays] = useState([]);
  const [metrics, setMetrics] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [branchGeoApi, setBranchGeoApi] = useState(null);

  const hydrateWeekDaysWithServer = useCallback(async (days) => {
    const arr = Array.isArray(days) ? days.filter(Boolean) : [];
    const sidList = Array.from(new Set(arr.map(d => d?.scheduleId).filter(Boolean)));
    if (sidList.length === 0) return arr;

    const entries = await Promise.all(
      sidList.map(async (sid) => {
        try { const detail = await getScheduleDetail(sid); return [sid, detail]; }
        catch { return [sid, null]; }
      })
    );
    const byId = new Map(entries);
    const todayYMD = toYMDlocal(new Date());

    return arr.map((d) => {
      const det = d?.scheduleId ? byId.get(d.scheduleId) : null;
      if (!det) return d;

      const st = String(det?.attendanceStatus || det?.status || '').toUpperCase();
      const cat = String(det?.category || det?.scheduleType || '').toUpperCase();
      const leaveName = det?.leaveTypeName || d?.leaveTypeName || '';

      const aIn  = det?.clockInAt || det?.actualClockIn || det?.actualStartAt || null;
      const aOut = det?.clockOutAt || det?.actualClockOut || det?.actualEndAt || null;
      const pIn  = det?.registeredClockIn || det?.registeredStartAt || det?.startAt || null;
      const pOut = det?.registeredClockOut || det?.registeredEndAt || det?.endAt || null;

      let inText  = aIn  ? fmtHMlocal(aIn)  : (pIn  ? fmtHMlocal(pIn)  : d.in  || '');
      let outText = aOut ? fmtHMlocal(aOut) : (pOut ? fmtHMlocal(pOut) : d.out || '');

      let rule = st;
      if (!rule || rule === 'PLANNED') {
        if (cat === 'LEAVE') {
          rule = 'LEAVE';
        } else if (aIn && !aOut) {
          rule = 'CLOCKED_IN';
        } else if (!aIn) {
          if (pOut && d.ymd < todayYMD) {
            rule = 'ABSENT';
          } else if (pIn && d.ymd === todayYMD && Date.now() > toTimeMs(pIn) + LATE_THRESHOLD_MIN * 60000) {
            rule = 'LATE';
          } else {
            rule = 'PLANNED';
          }
        } else if (aOut) {
          rule = 'CLOCKED_OUT';
        }
      }

      return {
        ...d,
        in: inText || d.in,
        out: outText || d.out,
        attendanceStatus: st || rule,
        status: st || rule,
        category: cat || d.category,
        leaveTypeName: leaveName,
      };
    });
  }, []);

  const loadAll = useCallback(async (anchorDate) => {
    setLoading(true);
    try {
      const [t, met, geo] = await Promise.all([
        fetchTodayStatus(),
        fetchWeekMetrics(anchorDate),
        fetchMyBranchGeofence().catch(() => null),
      ]);

      const hydratedDays = await hydrateWeekDaysWithServer(met?.days || []);

      setToday(t || null);
      setWeekDays(hydratedDays);
      setMetrics(met || null);
      setBranchGeoApi(geo || null);
    } catch {
      addToast('근무 데이터를 불러오지 못했습니다.', { color: 'error' });
      setToday(null);
      setWeekDays([]);
      setMetrics(null);
      setBranchGeoApi(null);
    } finally {
      setLoading(false);
    }
  }, [addToast, hydrateWeekDaysWithServer]);

  useEffect(() => { loadAll(weekAnchor); }, [loadAll, weekAnchor]);

  const authUserSafe = authUser || {};
  const name = authUserSafe?.name || '직원';
  const title = authUserSafe?.title || '';
  const branch = authUserSafe?.branchName || '';
  const photo = authUserSafe?.profileImageUrl || '';

  const safeToday = today || {};
  const todayVariant = colorVariant(safeToday, new Date());
  const todayStyle = stylesByVariant[todayVariant] || stylesByVariant.blue;
  const todayIn = getInText(safeToday);
  const todayOut = getOutText(safeToday);

  const branchGeo = useMemo(() => {
    const apiLat = Number(branchGeoApi?.lat);
    const apiLng = Number(branchGeoApi?.lng);
    const apiRad = Number(branchGeoApi?.radius ?? branchGeoApi?.radiusMeters);

    const tLat = Number(pick(safeToday, ['branchLat', 'branchLatitude', 'latitude']));
    const tLng = Number(pick(safeToday, ['branchLng', 'branchLong', 'branchLongitude', 'longitude', 'lon']));
    const tRad = Number(pick(safeToday, ['geofenceRadius', 'geofenceRadiusMeters', 'branchRadiusMeters']));

    const uLat = Number(pick(authUserSafe, ['branchLat', 'branchLatitude', 'latitude']));
    const uLng = Number(pick(authUserSafe, ['branchLng', 'branchLong', 'branchLongitude', 'longitude', 'lon']));
    const uRad = Number(pick(authUserSafe, ['geofenceRadius', 'geofenceRadiusMeters', 'branchRadiusMeters']));

    const lat = Number.isFinite(apiLat) ? apiLat : (Number.isFinite(tLat) ? tLat : (Number.isFinite(uLat) ? uLat : null));
    const lng = Number.isFinite(apiLng) ? apiLng : (Number.isFinite(tLng) ? tLng : (Number.isFinite(uLng) ? uLng : null));
    const radius = Number.isFinite(apiRad) ? apiRad : (Number.isFinite(tRad) ? tRad : (Number.isFinite(uRad) ? uRad : null));

    return { lat, lng, radius };
  }, [branchGeoApi, safeToday, authUserSafe]);

  const { permission, coords, distance, inside, loading: geoLoading, refresh, timedOut } =
    useGeofence(branchGeo, { autoStart: true, inflateByAccuracy: true, timeoutMs: 15000, acceptStaleMs: 180000 });

  const branchReady = !!(Number.isFinite(branchGeo?.lat) && Number.isFinite(branchGeo?.lng) && Number.isFinite(branchGeo?.radius) && branchGeo.radius > 0);
  const geoReady = !!(coords?.lat && coords?.lng);
  const geoBlocked = permission === 'denied';
  const geoTimedOut = !!timedOut && !geoBlocked;

  const requireGeo = safeToday?.geofenceRequired === true;

  const geoDisabled = requireGeo
    ? (!branchReady || geoBlocked || (!geoTimedOut && (!geoReady || !inside)))
    : false;

  const next = decideAction(safeToday, loading);
  const finalDisabled = next.disabled || geoDisabled;

  const canBreakStart = allowBreakStartLocal(safeToday) && !geoDisabled && !loading;
  const canBreakEnd   = allowBreakEndLocal(safeToday)   && !geoDisabled && !loading;

  const hasOpenBreak = useMemo(() => {
    const st = pickStatus(safeToday);
    const brStart = pick(safeToday, ['breakStartAt','registeredBreakStart']);
    const brEnd   = pick(safeToday, ['breakEndAt','registeredBreakEnd']);
    return st === 'ON_BREAK' || (!!brStart && !brEnd);
  }, [safeToday]);

  const doClockOut = async () => {
    const sid = safeToday?.scheduleId;
    if (!sid) { addToast('오늘 스케줄이 없습니다.', { color:'error' }); return; }
    setLoading(true);
    try {
      await clockOut(sid, coords, { slackMeters: GEOFENCE_SLACK, fallbackFence: branchReady ? branchGeo : null });
      addToast('퇴근 처리되었습니다.', { color:'success' });
      await loadAll(weekAnchor);
    } catch (e) {
      const msg = e?.response?.data?.message || '퇴근 처리에 실패했습니다.';
      addToast(msg, { color:'error' });
      if (String(msg).includes('시각을 직접 지정')) {
        setSelectedDay({ ...(safeToday || {}), ymd: toYMDlocal(new Date()) });
        setOpenDetail(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const doClockIn = async () => {
    const sid = safeToday?.scheduleId;
    if (!sid) { addToast('오늘 스케줄이 없습니다.', { color:'error' }); return; }
    if (safeToday?.geofenceRequired && !(Number.isFinite(coords?.lat) || Number.isFinite(coords?.latitude))) {
      addToast('현재 위치를 확인 중입니다. 잠시 후 다시 시도해주세요.', { color:'warning' });
      return;
    }
    setLoading(true);
    try {
      await clockIn(sid, coords, { slackMeters: GEOFENCE_SLACK, fallbackFence: branchReady ? branchGeo : null });
      addToast('출근 처리되었습니다.', { color:'success' });
      await loadAll(weekAnchor);
    } catch (e) {
      addToast(e?.response?.data?.message || '출근 처리에 실패했습니다.', { color:'error' });
    } finally {
      setLoading(false);
    }
  };
  const doBreakStart = async () => {
    const sid = safeToday?.scheduleId;
    if (!sid) { addToast('오늘 스케줄이 없습니다.', { color:'error' }); return; }
    if (safeToday?.geofenceRequired && !(Number.isFinite(coords?.lat) || Number.isFinite(coords?.latitude))) {
      addToast('현재 위치를 확인 중입니다. 잠시 후 다시 시도해주세요.', { color:'warning' });
      return;
    }
    setLoading(true);
    try {
      await breakStart(sid, coords, { slackMeters: GEOFENCE_SLACK, fallbackFence: branchReady ? branchGeo : null });
      addToast('휴게 시작되었습니다.', { color:'success' });
      await loadAll(weekAnchor);
    } catch (e) {
      const msg = e?.response?.data?.message || '휴게 시작 처리에 실패했습니다.';
      addToast(msg, { color:'error' });
      if (String(msg).includes('시각을 직접 지정')) {
        setSelectedDay({ ...(safeToday || {}), ymd: toYMDlocal(new Date()) });
        setOpenDetail(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const doBreakEnd = async () => {
    const sid = safeToday?.scheduleId;
    if (!sid) { addToast('오늘 스케줄이 없습니다.', { color:'error' }); return; }
    if (safeToday?.geofenceRequired && !(Number.isFinite(coords?.lat) || Number.isFinite(coords?.latitude))) {
      addToast('현재 위치를 확인 중입니다. 잠시 후 다시 시도해주세요.', { color:'warning' });
      return;
    }
    setLoading(true);
    try {
      await breakEnd(sid, coords, { slackMeters: GEOFENCE_SLACK, fallbackFence: branchReady ? branchGeo : null });
      addToast('휴게 종료되었습니다.', { color:'success' });
      await loadAll(weekAnchor);
    } catch (e) {
      const msg = e?.response?.data?.message || '휴게 종료 처리에 실패했습니다.';
      addToast(msg, { color:'error' });
      if (String(msg).includes('시각을 직접 지정')) {
        setSelectedDay({ ...(safeToday || {}), ymd: toYMDlocal(new Date()) });
        setOpenDetail(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const actionOnClick = next.onClickName === 'out'
    ? async () => {
        if (hasOpenBreak) {
          addToast('휴게를 종료하신 후 퇴근할 수 있습니다.', { color: 'warning' });
          return;
        }
        await doClockOut();
      }
    : doClockIn;

  const totalMinutes = Number(metrics?.totalMinutes || 0);
  const weekTargetHours = Number(metrics?.targets?.weekTargetHours ?? 52);
  const weekMarkerHours = Number(metrics?.targets?.weekMarkerHours ?? 40);
  const weekPct = minutesToPct(totalMinutes, weekTargetHours);
  const weekColor = weeklyGaugeColor(totalMinutes);
  const weekMarkerPct = (weekMarkerHours / weekTargetHours) * 100;

  const avgPerDayMinutes = Number(metrics?.avgPerDayMinutes ?? totalMinutes / 7);
  const dailyAvgMaxHours = Number(metrics?.targets?.dailyAvgMaxHours ?? 12);
  const dailyAvgMarkerHours = Number(metrics?.targets?.dailyAvgMarkerHours ?? 8);
  const avgPct = minutesToPct(avgPerDayMinutes, dailyAvgMaxHours);
  const avgColor = avgGaugeColor(avgPerDayMinutes);
  const avgMarkerPct = (dailyAvgMarkerHours / dailyAvgMaxHours) * 100;

  const totalHoursText = `${Math.floor(totalMinutes / 60)}시간 ${totalMinutes % 60}분`;
  const avgHoursText = `${Math.floor(avgPerDayMinutes / 60)}시간 ${String(Math.round(avgPerDayMinutes % 60)).padStart(2,'0')}분`;

  const days = Array.isArray(weekDays) ? weekDays.filter(Boolean) : [];

  const onLogout = async () => {
    try { await authService?.logout?.(); } catch {}
    try { tokenStorage?.clear?.(); } catch {}
    try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } catch {}
    window.location.assign('/m/login');
  };

  const moveWeek = (deltaWeeks) => {
    const base = new Date(weekAnchor);
    const moved = new Date(base.getFullYear(), base.getMonth(), base.getDate() + deltaWeeks * 7);
    setWeekAnchor(moved);
  };

  const geoMsg = useMemo(() => {
    if (safeToday?.geofenceRequired !== true) return '위치 인증이 필요하지 않습니다';
    if (!branchReady) return '지점 위치 정보 없음';
    if (geoBlocked) return '위치 권한이 거부되었습니다';
    if (geoTimedOut) return '위치 확인이 지연됩니다(타임아웃) · 새로고침 또는 위치 서비스 확인';
    if (!geoReady) return '현재 위치 확인중…';
    return inside
      ? `현재 지점까지 ${formatMeters(distance)} / 허용 ${formatMeters(branchGeo.radius)}`
      : `반경 밖입니다: ${formatMeters(distance)} / 허용 ${formatMeters(branchGeo.radius)}`;
  }, [safeToday?.geofenceRequired, branchReady, geoBlocked, geoTimedOut, geoReady, inside, distance, branchGeo]);

  const geoOk = safeToday?.geofenceRequired === true
    ? (branchReady ? ((geoReady && inside && !geoBlocked) || geoTimedOut) : false)
    : true;

  return (
    <Screen>
      <TopBar>
        <Container>
          <TopRow>
            <BrandRow aria-label="Care-up">
              <Logo src={careUpLogo} alt="Care-up 로고" />
              <Brand>Care-up</Brand>
            </BrandRow>
            <LogoutBtn onClick={onLogout}>
              <Icon path={mdiLogoutVariant} size={0.75} />
              로그아웃
            </LogoutBtn>
          </TopRow>

          <UserRow>
            {photo ? (
              <AvatarImg src={photo} alt={`${name} 프로필`} />
            ) : (
              <AvatarFallback aria-hidden>{initials(name)}</AvatarFallback>
            )}
            <UserMeta>
              <strong>{name}</strong>
              <small>
                {title ? `${title}` : '직원'}{branch ? ` · ${branch}` : ''}
              </small>
            </UserMeta>
            <div style={{ width: 8 }} />
          </UserRow>
        </Container>
      </TopBar>

      <Wrap>
        <Container>
          <Card>
            <CardTitle>
              <Icon path={mdiClockOutline} size={0.9} />
              오늘 근무
            </CardTitle>

            <TodayRow>
              <ScheduleLine $bar={todayStyle.fg}>
                <div style={{display:'grid'}}>
                  <strong style={{fontSize:14}}>
                    {safeToday.dateText || ''}
                  </strong>
                  <small>{todayIn || '-'} — {todayOut || '-'}</small>
                </div>

                <StatusBadge $bg={todayStyle.bg} $bd={todayStyle.bd} $fg={todayStyle.fg}>
                  {statusText(safeToday)}
                </StatusBadge>
              </ScheduleLine>

              <GeoRow>
                <GeoPill $ok={geoOk}>
                  <Icon path={geoOk ? mdiMapMarker : mdiAlertCircle} size={0.82} />
                  {geoMsg}
                </GeoPill>
                <button
                  onClick={refresh}
                  disabled={geoLoading}
                  style={{
                    height: 36, padding: '0 10px', borderRadius: 10, border: '1px solid #e5e7eb',
                    background: '#f9fafb', color: '#374151', fontWeight: 800, fontSize: 12, display: 'inline-flex',
                    alignItems: 'center', gap: 6, cursor: geoLoading ? 'default' : 'pointer'
                  }}
                  aria-label="위치 새로고침"
                  title="위치 새로고침"
                >
                  <Icon path={mdiCrosshairsGps} size={0.82} />
                  {geoLoading ? '갱신중…' : '새로고침'}
                </button>
              </GeoRow>

              <SingleBtnRow>
                <ActionBtn
                  $variant={next.variant}
                  onClick={actionOnClick}
                  disabled={finalDisabled}
                  aria-disabled={finalDisabled}
                >
                  {next.label} <Icon path={next.icon} size={0.8} />
                </ActionBtn>
              </SingleBtnRow>

              {hasOpenBreak && (
                <small style={{ display:'block', marginTop: 4, color:'#9ca3af' }}>
                  휴게 종료 후 퇴근할 수 있습니다.
                </small>
              )}

              <BreakBtnRow>
                <BreakBtn onClick={doBreakStart} disabled={!canBreakStart} aria-disabled={!canBreakStart}>
                  <Icon path={mdiCoffee} size={0.8} />
                  휴게 시작
                </BreakBtn>
                <BreakBtn onClick={doBreakEnd} disabled={!canBreakEnd} aria-disabled={!canBreakEnd}>
                  <Icon path={mdiCoffeeOff} size={0.8} />
                  휴게 종료
                </BreakBtn>
              </BreakBtnRow>
            </TodayRow>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <TitleRow>
              <CardTitle style={{ margin: 0 }}>
                <Icon path={mdiCalendarWeek} size={0.9} />
                이번 주 근무
              </CardTitle>
              <WeekNav aria-label="주간 이동">
                <WeekNavBtn onClick={() => moveWeek(-1)} aria-label="이전 주">
                  <Icon path={mdiChevronLeft} size={0.9} />
                </WeekNavBtn>
                <WeekNavBtn onClick={() => moveWeek(1)} aria-label="다음 주">
                  <Icon path={mdiChevronRight} size={0.9} />
                </WeekNavBtn>
              </WeekNav>
            </TitleRow>

            <WeekViewport role="region" aria-label="이번 주 근무 날짜 목록">
              <WeekStrip>
                {days.map((d, i) => {
                  const variant = colorVariant(d, new Date());
                  const style = stylesByVariant[variant] || stylesByVariant.blue;

                  const inTxt = getInText(d);
                  const outTxt = getOutText(d);

                  const handleOpen = () => {
                    if (isDayEmptyForModal(d)) return;
                    setSelectedDay(d);
                    setOpenDetail(true);
                  };

                  return (
                    <DayBox
                      key={i}
                      $bg={style.bg}
                      $bd={style.bd}
                      onClick={handleOpen}
                      aria-label={`${fmtDateSmall(d?.ymd)} ${d?.name || ''} 상세 보기`}
                    >
                      <em>{fmtDateSmall(d?.ymd)}</em>
                      <small>{d?.name || ''}</small>

                      <span className="time">{inTxt}</span>
                      <span className="time">{outTxt}</span>

                      <small style={{marginTop:4, color:style.fg}}>{statusText(d)}</small>
                    </DayBox>
                  );
                })}
              </WeekStrip>
            </WeekViewport>

            <BarWrap>
              <BarRail>
                <BarFill $pct={weekPct} $color={weekColor} />
                <BarMarker $leftPct={weekMarkerPct} />
                <MarkerLabel $leftPct={weekMarkerPct}>{String(weekMarkerHours)}</MarkerLabel>
              </BarRail>
              <BarMeta>
                <span>{totalHoursText}</span>
                <span>{weekTargetHours}</span>
              </BarMeta>
            </BarWrap>
          </Card>

          <Card style={{ marginTop: 12, marginBottom: 4 }}>
            <CardTitle>1일 평균 근로시간</CardTitle>
            <BarWrap>
              <BarRail>
                <BarFill $pct={avgPct} $color={avgColor} />
                <BarMarker $leftPct={avgMarkerPct} />
                <MarkerLabel $leftPct={avgMarkerPct}>{String(dailyAvgMarkerHours)}</MarkerLabel>
              </BarRail>
              <BarMeta>
                <span>{avgHoursText}</span>
                <span>{dailyAvgMaxHours}</span>
              </BarMeta>
            </BarWrap>
          </Card>
        </Container>
      </Wrap>

      <MobileScheduleDetailModal
        open={openDetail}
        day={selectedDay}
        onClose={() => setOpenDetail(false)}
      />
    </Screen>
  );
}
