// src/pages/attendance/AttendanceCalendar.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiPlus,
  mdiUpload,
  mdiDotsVertical,
  mdiClose,
  mdiChevronDown,
  mdiChevronUp,
} from '@mdi/js';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { useToast } from '../../components/common/Toast';
import { moveMonth, setFilters, setRange, loadCalendarEvents, loadHolidays } from '../../stores/slices/attendanceSlice';
import { fetchEmployeeOptions, getScheduleDetail, deleteSchedule } from '../../service/scheduleService';
import { fetchBranchOptions } from '../../service/staffService';
import excelIcon from '../../assets/icons/excel_icon.svg';
import { decodeToken } from '../../utils/jwt';
import { splitForCalendar } from '../../utils/calendarSplit';

import { ScheduleBulkModal } from '../../components/attendance/ScheduleBulkModal';
import { ScheduleDetailModal } from '../../components/attendance/ScheduleDetailModal';

const MAX_VISIBLE_MONTH = 3;
const MAX_VISIBLE_WEEK = 10;

/* ===== 스타일 ===== */
const Page = styled.div`padding: 28px;`;
const Row = styled.div`display: flex; align-items: center; justify-content: space-between; gap: 12px;`;
const TitleBox = styled.div`display: flex; align-items: center; gap: 12px;`;
const Title = styled.h1`font-size: 22px; font-weight: 700; margin: 0;`;
const Primary = styled.button`
  height: 36px; padding: 0 14px; border: none; background: #7c3aed; color: #fff; border-radius: 8px;
  display: inline-flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;
  &:hover { filter: brightness(0.95); }
`;
const Ghost = styled.button`
  height: 36px; padding: 0 12px; border: 1px solid #e5e7eb; background: #fff; border-radius: 8px;
  display: inline-flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer;
  &:hover { background: #f9fafb; }
`;

const SegWrap = styled.div`
  display: inline-flex; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; height: 36px;
`;
const Seg = styled.button`
  padding: 0 14px; background: ${(p) => (p.$active ? '#ede9fe' : '#fff')};
  color: ${(p) => (p.$active ? '#6b46c1' : '#374151')};
  border: none; border-right: 1px solid #e5e7eb; font-size: 13px; cursor: pointer;
  &:last-child { border-right: 0; }
`;
const Toolbar = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0,1fr));
  gap: 8px;
  margin: 14px 0;
`;

/* 선택 / 입력 공통 */
const SelectWrap = styled.div`
  position: relative; width: 100%;
  & > svg {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    pointer-events: none; opacity: 0.8;
  }
`;
const Select = styled.select`
  height: 36px; padding: 0 34px 0 10px;
  border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
  outline: 0; width: 100%;
  appearance: none;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15); }
`;
const Input = styled.input`
  height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
  outline: 0;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15); }
`;

/* 우측 끝 기간 묶음 */
const RightCluster = styled.div`
  grid-column: span ${(p) => p.$span || 6};
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  min-width: 0;
`;
const RangeTilde = styled.span`color: #9ca3af; font-size: 12px; user-select: none;`;

/* 캘린더 */
const CalendarWrap = styled.div`
  border: 1px solid #d1d5db;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
`;
const Head = styled.div`
  display: grid; grid-template-columns: repeat(7, 1fr);
  background: #fafafa;
  border-bottom: 1px solid #d1d5db;
`;
const HeadCell = styled.div`
  padding: 10px 12px; font-size: 12px; font-weight: 700; text-align: left;
  color: ${(p) => (p.$sun ? '#ef4444' : p.$sat ? '#2563eb' : '#6b7280')};
`;

const Grid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr);`;
const Cell = styled.div`
  position: relative;
  min-height: ${(p) => (p.$week ? '420px' : '120px')};
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 8px 36px;
  background: ${(p) => (p.$other ? '#fafafa' : '#fff')};
  &:nth-child(7n) { border-right: 0; }
`;

/* 날짜 헤더 */
const DateHeadRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
`;
const DateHeadLeft = styled.div`
  font-size: 12px; font-weight: 700; color: ${(p) => p.$color || '#374151'};
  display: inline-flex; align-items: center; gap: 6px;
`;
const HolidayNameRight = styled.div`
  font-size: 11px; color: #b91c1c; line-height: 1;
  max-width: 70%;
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  text-align: right;
`;
const BadgeHolidayCircle = styled.span`
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: #ef4444; color: #fff; border: 1px solid #dc2626;
`;

/* 이벤트(상태 색상 지원) */
const Event = styled.div`
  position: relative;
  padding: 6px 28px 6px 8px; /* X 버튼 공간 확보 */
  border-radius: 8px; margin-bottom: 6px; border: 1px solid;
  cursor: pointer;
  background: ${(p) => (
    p.$variant === 'green' ? '#ecfdf5' :
    p.$variant === 'red'   ? '#fef2f2' :
    p.$variant === 'blue'  ? '#eef2ff' :
    p.$variant === 'purple'? '#f5f3ff' :
    p.$variant === 'orange'? '#fff7ed' :
                             '#eef2ff'
  )};
  border-color: ${(p) => (
    p.$variant === 'green' ? '#d1fae5' :
    p.$variant === 'red'   ? '#fee2e2' :
    p.$variant === 'blue'  ? '#dbeafe' :
    p.$variant === 'purple'? '#ddd6fe' :
    p.$variant === 'orange'? '#ffedd5' :
                             '#dbeafe'
  )};
  color: ${(p) => (
    p.$variant === 'green' ? '#065f46' :
    p.$variant === 'red'   ? '#991b1b' :
    p.$variant === 'blue'  ? '#1e3a8a' :
    p.$variant === 'purple'? '#6b21a8' :
    p.$variant === 'orange'? '#9a3412' :
                             '#1e3a8a'
  )};
`;
const EventTitle = styled.div`
  font-size: 12px; line-height: 1.28; font-weight: 600; display: flex; align-items: center; gap: 6px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const EventSub = styled.div`
  font-size: 11px; line-height: 1.2; color: #4b5563;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const TypeChip = styled.span`
  flex: 0 0 auto; padding: 2px 6px; border-radius: 999px; font-size: 10px; line-height: 1;
  border: 1px solid #c4b5fd; background: #ede9fe; color: #5b21b6;
`;
const MoreBtn = styled.button`
  position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%);
  width: 28px; height: 28px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; background: transparent; cursor: pointer;
  &:hover { background: #f3f4f6; }
  &:focus, &:active { outline: none; box-shadow: none; }
`;

/* 이벤트 카드: 삭제(X) 버튼 */
const EventCloseBtn = styled.button`
  position: absolute; top: 4px; right: 4px;
  width: 20px; height: 20px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  color: inherit; opacity: .6; cursor: pointer;
  &:hover { opacity: 1; background: rgba(0,0,0,0.06); }
`;

/* 공용 모달 */
const ModalOverlay = styled.div`
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(17,24,39,0.5);
  display: flex; align-items: center; justify-content: center;
`;
const ModalCard = styled.div`
  width: min(560px, 92vw);
  max-height: 82vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex; flex-direction: column;
  overflow: hidden;
`;
const ModalHeader = styled.div`
  padding: 14px 16px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
`;
const ModalTitle = styled.div`font-size: 16px; font-weight: 700;`;
const ModalSub = styled.div`font-size: 12px; color: #6b7280; margin-top: 4px;`;
const CloseBtn = styled.button`
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: #f9fafb; }
`;
const ModalBody = styled.div`padding: 14px 16px; overflow: auto;`;
const ModalFooter = styled.div`
  padding: 14px 16px; border-top: 1px solid #e5e7eb;
  display: flex; justify-content: flex-end; gap: 8px;
`;
const Danger = styled.button`
  height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #fecaca;
  background: #fee2e2; color: #991b1b; cursor: pointer;
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

/* 네비게이션 라벨 */
const LabelBox = styled.div`margin-left: 8px; font-weight: 700; font-size: 16px;`;
const LabelButton = styled.button`
  border: none; background: transparent; padding: 4px 8px; margin: -4px -8px;
  border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 16px;
  &:hover { background: #f3f4f6; }
`;

/* ===== 유틸 ===== */
const toYMD = (date) => {
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const dt = new Date(date);
  if (!Number.isNaN(dt.valueOf())) return toYMD(dt);
  return '';
};
const parseYMDParts = (s) => {
  const [y, m, d] = String(s || '').split('-').map(Number);
  return { y, m: (m || 1) - 1, d: d || 1 };
};
const daysMatrix = (viewFrom) => {
  const { y, m } = parseYMDParts(viewFrom);
  const first = new Date(y, m, 1);
  const startIdx = first.getDay();
  const start = new Date(y, m, 1 - startIdx);
  const cells = [];
  for (let i = 0; i < 42; i++) cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  return cells;
};
const startOfWeek = (date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
};
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const weekCells = (anchorYmd) => {
  const anchor = new Date(anchorYmd);
  const s = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
};

const fmt24 = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
const fmtRange = (startIso, endIso, allDay) => {
  if (allDay) return '종일';
  const s = fmt24(startIso);
  const e = fmt24(endIso);
  if (s && e) return `${s} - ${e}`;
  if (s) return `${s} -`;
  if (e) return `- ${e}`;
  return '';
};

const isLeaveEvent = (ev) => {
  const st  = String(ev?.status || ev?.attendanceStatus || '').toUpperCase();
  const cat = String(ev?.category || ev?.scheduleType || '').toUpperCase();
  const ts  = String(ev?.timeSource || '').toUpperCase();
  if (cat === 'LEAVE') return true;
  return st === 'LEAVE' || (ev?.allDay && ts === 'ALL_DAY') || !!ev?.leaveTypeId || !!ev?.leaveTypeName;
};

const fmtKDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const DOW = ['일','월','화','수','목','금','토'];
  return `${y}.${String(m).padStart(2,'0')}.${String(d).padStart(2,'0')} (${DOW[dt.getDay()]})`;
};

/* ===== 상태/색상 판정 ===== */
/** 모달과 동일 임계값(분) */
const LATE_THRESHOLD_MIN = 1;

function getEventVariant(ev, now = new Date()) {
  // 0) 휴가
  if (isLeaveEvent(ev)) return 'purple';

  // 1) 상태 코드 우선 처리
  const status = String(ev?.status || ev?.attendanceStatus || '').toUpperCase();
  if (status === 'ABSENT') return 'red';
  if (status === 'MISSED_CHECKOUT' || ev?.missedCheckout === true) return 'orange';
  if (status === 'EARLY_LEAVE') return 'orange';
  if (status === 'OVERTIME') return 'orange';      // ✅ 초과근무를 주황으로 고정
  if (status === 'CLOCKED_OUT') return 'green';
  if (status === 'CLOCKED_IN' || status === 'ON_BREAK') {
    // 진행 중은 아래 휴리스틱과 일치하므로 그대로 두어도 무방
  }

  // 2) 계획/기록 기반 휴리스틱 (지각·미퇴근 등)
  const plannedStart = ev?.registeredClockIn || ev?.registeredStartAt || ev?.startAt || null;
  const plannedEnd   = ev?.registeredClockOut || ev?.registeredEndAt   || ev?.endAt   || null;
  const actIn  = ev?.actualClockIn || ev?.clockInAt  || ev?.actualStartAt || null;
  const actOut = ev?.actualClockOut || ev?.clockOutAt || ev?.actualEndAt  || null;

  const nowMs   = now.getTime();
  const pStartMs= plannedStart ? new Date(plannedStart).getTime() : null;
  const pEndMs  = plannedEnd   ? new Date(plannedEnd).getTime()   : null;
  const aInMs   = actIn        ? new Date(actIn).getTime()        : null;
  const isTail  = ev?.isOvernight && ev?.part === 'TAIL';

  // 계획 종료 지남 + 미출근 → 결근
  if (pEndMs != null && aInMs == null && nowMs > pEndMs) return 'red';

  // 지각(기록/무기록 모두)
  const lateFromAct = (aInMs != null && pStartMs != null && aInMs >= pStartMs + LATE_THRESHOLD_MIN*60*1000);
  const lateNoClock = (!isTail) && (aInMs == null && pStartMs != null && nowMs >= pStartMs + LATE_THRESHOLD_MIN*60*1000 && !actOut);
  if (lateFromAct || lateNoClock) return 'orange';

  // 진행 중/완료
  if (actIn && !actOut) {
    if (plannedEnd && now > new Date(plannedEnd)) return 'orange'; // 미퇴근
    return 'green';
  }
  if (actOut) return 'green';

  // 계획 기준
  if (plannedStart) {
    if (now < new Date(plannedStart)) return 'blue';
    if (plannedEnd && now > new Date(plannedEnd)) return 'red';
    return 'blue';
  }

  // 기본값
  return 'blue';
}

/* ===== 라벨 구성 ===== */
const pickLeaveLabel = (ev, isLeave) => {
  const first = (ev?.leaveTypeName || ev?.leaveTypeCode || '').toString().trim();
  if (first) return first;
  if (!isLeave) return '';
  const t = (ev?.title || '').toString().trim();
  if (t && !/^leave$/i.test(t) && !/^work$/i.test(t)) return t;
  const b = (ev?.badgeText || '').toString().trim();
  if (b && !/^leave$/i.test(b) && !/^work$/i.test(b)) return b;
  return '';
};

function labelParts(ev, variant) {
  const name = ev?.employeeName || ev?.title || '스케줄';
  const leave = isLeaveEvent(ev);
  const leaveLabel = pickLeaveLabel(ev, leave);

  const planStart = ev?.registeredClockIn || ev?.registeredStartAt || ev?.startAt || null;
  const planEnd   = ev?.registeredClockOut || ev?.registeredEndAt   || ev?.endAt   || null;
  const actStart  = ev?.actualClockIn || ev?.clockInAt  || ev?.actualStartAt || null;
  const actEnd    = ev?.actualClockOut || ev?.clockOutAt || ev?.actualEndAt  || null;

  let baseStart = planStart;
  let baseEnd   = planEnd;
  if (variant === 'green' || variant === 'orange') {
    baseStart = actStart || planStart;
    baseEnd   = actEnd   || planEnd;
  } else if (variant === 'red') {
    baseStart = actStart || planStart;
    baseEnd   = null;
  }

  let range = '';
  if (leave) {
    // ✅ 휴가(보라색) 카드일 때 항상 '종일' 표시
    range = '종일';
  } else if (ev?.isOvernight && ev?.part) {
    if (ev.part === 'HEAD') {
      const s = fmt24(baseStart);
      range = s ? `${s} - 00:00` : '- 00:00';
    } else if (ev.part === 'TAIL') {
      const e = fmt24(baseEnd);
      range = e ? `00:00 - ${e}` : '00:00 -';
    }
  } else {
    range = fmtRange(baseStart, baseEnd, ev?.allDay);
  }

  const primary = [name, range].filter(Boolean).join(' | ');
  const subtitle = ev?.branchName || '';
  return { primary, subtitle, leave, leaveLabel };
}

/* ===== 보강: 날짜/아이디 해석기 ===== */
const dateKeyOf = (ev) =>
  ev?.cellDate ||
  (ev?.date && toYMD(ev.date)) ||
  (ev?.registeredDate && toYMD(ev.registeredDate)) ||
  (ev?.startAt && toYMD(ev.startAt)) ||
  (ev?.registeredClockIn && toYMD(ev.registeredClockIn)) ||
  (ev?.clockInAt && toYMD(ev.clockInAt)) ||
  (ev?.actualClockIn && toYMD(ev.actualClockIn)) ||
  '';

const resolveId = (ev) =>
  ev?.scheduleId ?? ev?.id ?? ev?.scheduleSeq ?? ev?.seq ?? null;

/* 이 파일 로컬 정규화 */
const normalizeIdLocal = (val) => {
  const s = String(val ?? '');
  return s.includes(':') ? s.split(':')[0] : s;
};

/* ===== 정렬 기준: "해당 셀"에서의 시작시각 ===== */
const cellStartMs = (ev) => {
  if (ev?.isOvernight && ev?.part === 'TAIL' && ev?.cellDate) {
    return new Date(`${ev.cellDate}T00:00:00`).getTime();
  }
  const s =
    ev?.registeredClockIn || ev?.registeredStartAt || ev?.startAt ||
    ev?.actualClockIn     || ev?.clockInAt         || ev?.actualStartAt || null;
  return s ? new Date(s).getTime() : 0;
};

/* ===== 실제 기록 존재 판단(상세 응답 기반) ===== */
const hasActualFromDetail = (d) => {
  if (!d) return false;
  return Boolean(
    d.clockInAt || d.breakStartAt || d.breakEndAt || d.clockOutAt ||
    d.actualClockIn || d.actualBreakStart || d.actualBreakEnd || d.actualClockOut ||
    d.totalWorkMinutes || d.totalBreakMinutes || d.missedCheckout === true
  );
};

/* ===== 컴포넌트 ===== */
export default function AttendanceCalendar() {
  // ... (중략 없이 아래 코드 그대로 유지 – 기존 내용 동일)
  // ※ 본 파일의 나머지 로직은 변경 없습니다. 상태/라벨 표시는 보강된 getEventVariant가 반영됩니다.

  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  const { view, filters, events, holidays, loading, error } = useAppSelector((s) => s.attendance);
  const rawRole = useAppSelector((s) => s.auth.role);
  const role = String(rawRole || '').replace(/^ROLE_/, '').toUpperCase();

  const isHQ = role === 'HQ_ADMIN';
  const isBranchAdmin = role === 'BRANCH_ADMIN';
  const isFranchiseOwner = role === 'FRANCHISE_OWNER';
  const isStaff = role === 'STAFF';
  const isManager = isHQ || isBranchAdmin || isFranchiseOwner;

  const claims = useMemo(() => {
    const token = localStorage.getItem('accessToken') || '';
    return decodeToken(token) || {};
  }, []);
  const myBranchIds = useMemo(() => {
    const c = claims || {};
    const ids = [];
    if (Array.isArray(c.branchIds)) ids.push(...c.branchIds);
    if (c.branchId != null) ids.push(c.branchId);
    if (c.branch && c.branch.id != null) ids.push(c.branch.id);
    return [...new Set(ids.map(Number).filter((n) => !Number.isNaN(n)))];
  }, [claims]);
  const myEmployeeId = useMemo(() => {
    const c = claims || {};
    if (c.employeeId != null) return Number(c.employeeId);
    if (c.empId != null) return Number(c.empId);
    if (c.employee && c.employee.id != null) return Number(c.employee.id);
    return null;
  }, [claims]);

  const [branchOpts, setBranchOpts] = useState([]);
  const [empOpts, setEmpOpts] = useState([]);
  const [empKeyword, setEmpKeyword] = useState('');
  const [localFrom, setLocalFrom] = useState(filters.rangeFrom);
  const [localTo, setLocalTo] = useState(filters.rangeTo);

  const [viewMode, setViewMode] = useState('month');
  const [weekAnchor, setWeekAnchor] = useState(toYMD(new Date()));

  const [expandedDates, setExpandedDates] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [monthInput, setMonthInput] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`);
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [weekFromInput, setWeekFromInput] = useState('');
  const [weekToInput, setWeekToInput] = useState('');
  const [weekError, setWeekError] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailScheduleId, setDetailScheduleId] = useState(null);
  const [detailContext, setDetailContext] = useState(null);

  const [localOverrides, setLocalOverrides] = useState({});

  const [deleteAskOpen, setDeleteAskOpen] = useState(false);
  const [deleteBlockedOpen, setDeleteBlockedOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const lastEvtKeyRef = useRef('');
  const lastHolidayKeyRef = useRef('');
  const lastErrorRef = useRef('');

  useEffect(() => {
    if (!filters.rangeFrom || !filters.rangeTo) {
      const y = new Date().getFullYear();
      const yFrom = `${y}-01-01`;
      const yTo = `${y}-12-31`;
      setLocalFrom(yFrom);
      setLocalTo(yTo);
      dispatch(setRange({ rangeFrom: yFrom, rangeTo: yTo }));
    }
  }, [dispatch, filters.rangeFrom, filters.rangeTo]);

  const monthLabel = useMemo(() => {
    const { y, m } = parseYMDParts(view.viewFrom);
    return `${y}년 ${String(m + 1).padStart(2, '0')}월`;
  }, [view.viewFrom]);
  const weekStart = useMemo(() => startOfWeek(new Date(weekAnchor)), [weekAnchor]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekLabel = useMemo(() => `${toYMD(weekStart)} ~ ${toYMD(weekEnd)}`, [weekStart, weekEnd]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = (await fetchBranchOptions('')) || [];
        const scoped = isHQ
          ? all
          : (myBranchIds.length ? all.filter((b) => myBranchIds.includes(Number(b.id))) : all);

        if (mounted) setBranchOpts(scoped);

        if (!isHQ && scoped.length === 1) {
          const only = scoped[0];
          if (!filters.branchId || Number(filters.branchId) !== Number(only.id)) {
            dispatch(setFilters({ branchId: Number(only.id) }));
          }
        }
      } catch {
        const msg = '지점 옵션 로딩 실패';
        if (lastErrorRef.current !== msg) {
          lastErrorRef.current = msg;
          addToast(msg, { color: 'error' });
        }
      }
    })();
    return () => { mounted = false; };
  }, [isHQ, myBranchIds, dispatch, filters.branchId, addToast]);

  useEffect(() => {
    if (isStaff) {
      setEmpOpts([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const list = await fetchEmployeeOptions({
          branchIds: filters.branchId
            ? [filters.branchId]
            : (isHQ ? undefined : (myBranchIds.length ? myBranchIds : undefined)),
          from: filters.rangeFrom,
          to: filters.rangeTo,
          keyword: empKeyword || undefined,
          all: isHQ && !filters.branchId,
        });
        if (mounted) setEmpOpts(list || []);
      } catch {
        const msg = '직원 옵션 로딩 실패';
        if (lastErrorRef.current !== msg) {
          lastErrorRef.current = msg;
          addToast(msg, { color: 'error' });
        }
      }
    })();
    return () => { mounted = false; };
  }, [isStaff, isHQ, myBranchIds, filters.branchId, filters.rangeFrom, filters.rangeTo, empKeyword, addToast]);

  useEffect(() => {
    if (!isStaff) return;
    if (myEmployeeId == null) return;
    if (Number(filters.employeeId) !== Number(myEmployeeId)) {
      dispatch(setFilters({ employeeId: Number(myEmployeeId) }));
    }
  }, [isStaff, myEmployeeId, filters.employeeId, dispatch]);

  useEffect(() => {
    const key = `${filters.branchId || ''}|${filters.employeeId || ''}|${filters.rangeFrom}|${filters.rangeTo}`;
    if (key !== lastEvtKeyRef.current) {
      lastEvtKeyRef.current = key;
      dispatch(loadCalendarEvents());
    }
  }, [dispatch, filters.rangeFrom, filters.rangeTo, filters.branchId, filters.employeeId]);

  useEffect(() => {
    if (viewMode === 'month') {
      const key = `M:${view.viewFrom}~${view.viewTo}`;
      if (key !== lastHolidayKeyRef.current) {
        lastHolidayKeyRef.current = key;
        dispatch(loadHolidays({ viewFrom: view.viewFrom, viewTo: view.viewTo }));
      }
    } else {
      const wf = toYMD(weekStart);
      const wt = toYMD(weekEnd);
      const key = `W:${wf}~${wt}`;
      if (key !== lastHolidayKeyRef.current) {
        lastHolidayKeyRef.current = key;
        dispatch(loadHolidays({ viewFrom: wf, viewTo: wt }));
      }
    }
  }, [dispatch, view.viewFrom, view.viewTo, viewMode, weekStart, weekEnd]);

  useEffect(() => {
    const msg = String(error || '');
    if (msg && msg !== lastErrorRef.current) {
      lastErrorRef.current = msg;
      addToast(msg, { color: 'error' });
    }
  }, [error, addToast]);

  const onChangeBranch = (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    dispatch(setFilters({ branchId: v, employeeId: null }));
  };
  const onChangeEmployee = (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    dispatch(setFilters({ employeeId: v }));
  };

  const applyEmployeeSearch = useCallback(() => {
    const kw = (empKeyword || '').trim();
    if (!kw) {
      dispatch(setFilters({ employeeId: null }));
      addToast('직원 전체로 초기화했어요.', { color: 'info' });
      return;
    }
    const norm = (s) => String(s ?? '').toLowerCase();
    const list = (empOpts || []).filter((e) => {
      const hay = [
        norm(e.name),
        norm(e.employeeNumber),
        norm(e.email),
        norm(e.mobile),
      ].filter(Boolean).join(' ');
      return hay.includes(norm(kw));
    });
    if (list.length === 0) {
      addToast('일치하는 직원이 없습니다.', { color: 'warning' });
      return;
    }
    const pick = list[0];
    dispatch(setFilters({ employeeId: Number(pick.id) }));
    addToast(`직원 필터 적용: ${pick.name}${pick.employeeNumber ? ` (${pick.employeeNumber})` : ''}`, { color: 'success' });
  }, [empKeyword, empOpts, dispatch, addToast]);

  const onEmpKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyEmployeeSearch();
    }
  };

  const goPrev = () => {
    if (viewMode === 'week') {
      setWeekAnchor(toYMD(addDays(new Date(weekAnchor), -7)));
    } else {
      dispatch(moveMonth(-1));
    }
  };
  const goNext = () => {
    if (viewMode === 'week') {
      setWeekAnchor(toYMD(addDays(new Date(weekAnchor), 7)));
    } else {
      dispatch(moveMonth(1));
    }
  };
  const jumpToday = () => {
    if (viewMode === 'week') setWeekAnchor(toYMD(new Date()));
    else dispatch(moveMonth(0));
  };
  const jumpLastMonth = () => {
    if (viewMode === 'week') {
      const base = new Date(weekAnchor);
      const prevMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1);
      setWeekAnchor(toYMD(startOfWeek(prevMonth)));
    } else {
      dispatch(moveMonth(-1));
    }
  };
  const jumpLastYear = () => {
    if (viewMode === 'week') {
      const base = new Date(weekAnchor);
      const prevYear = new Date(base.getFullYear() - 1, base.getMonth(), 1);
      setWeekAnchor(toYMD(startOfWeek(prevYear)));
    } else {
      dispatch(moveMonth(-12));
    }
  };
  const jumpNextMonth = () => {
    if (viewMode === 'week') {
      const base = new Date(weekAnchor);
      const nextMonth = new Date(base.getFullYear(), base.getMonth() + 1, 1);
      setWeekAnchor(toYMD(startOfWeek(nextMonth)));
    } else {
      dispatch(moveMonth(1));
    }
  };
  const jumpNextYear = () => {
    if (viewMode === 'week') {
      const base = new Date(weekAnchor);
      const nextYear = new Date(base.getFullYear() + 1, base.getMonth(), 1);
      setWeekAnchor(toYMD(startOfWeek(nextYear)));
    } else {
      dispatch(moveMonth(12));
    }
  };

  const cells = useMemo(() => (
    viewMode === 'week' ? weekCells(weekAnchor) : daysMatrix(view.viewFrom)
  ), [viewMode, weekAnchor, view.viewFrom]);

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    if (filters.employeeId) return list.filter(ev => Number(ev?.employeeId) === Number(filters.employeeId));
    if (filters.branchId) return list.filter(ev => Number(ev?.branchId) === Number(filters.branchId));
    return list;
  }, [events, filters.employeeId, filters.branchId]);

  const displayEvents = useMemo(() => {
    return (filteredEvents || []).flatMap(splitForCalendar);
  }, [filteredEvents]);

  const mapByDate = useMemo(() => {
    const map = {};
    (displayEvents || []).forEach((ev) => {
      const key = dateKeyOf(ev);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [displayEvents]);

  const withOverride = useCallback((ev) => {
    const sid = normalizeIdLocal(resolveId(ev));
    const ov = localOverrides?.[sid];
    return ov ? { ...ev, ...ov } : ev;
  }, [localOverrides]);

  const onAdd = () => setBulkOpen(true);
  const onExport = () => addToast('엑셀 내보내기는 다음 단계에서 연결합니다.', { color: 'info' });
  const onUpload = () => addToast('업로드는 다음 단계에서 연결합니다.', { color: 'info' });

  const holidayNameOf = useCallback((ymd) => {
    const name = holidays?.[ymd];
    return typeof name === 'string' && name ? name : '';
  }, [holidays]);

  const toggleExpand = useCallback((ymd) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(ymd)) next.delete(ymd);
      else next.add(ymd);
      return next;
    });
  }, []);

  const firstWeekOfMonthAnchor = useCallback(() => {
    const { y, m } = parseYMDParts(view.viewFrom);
    const first = new Date(y, m, 1);
    return toYMD(startOfWeek(first));
  }, [view.viewFrom]);

  const onViewWeek = useCallback(() => {
    if (viewMode !== 'week') setWeekAnchor(firstWeekOfMonthAnchor());
    setViewMode('week');
  }, [viewMode, firstWeekOfMonthAnchor]);

  const openMonthLabelModal = useCallback(() => {
    if (viewMode !== 'month') return;
    setMonthInput(`${parseYMDParts(view.viewFrom).y}-${String(parseYMDParts(view.viewFrom).m + 1).padStart(2,'0')}`);
    setMonthModalOpen(true);
  }, [viewMode, view.viewFrom]);

  const applyMonthJump = useCallback(() => {
    const m = String(monthInput || '').trim();
    if (!/^\d{4}-\d{2}$/.test(m)) {
      addToast('연-월 형식이 올바르지 않습니다. 예) 2025-11', { color: 'warning' });
      return;
    }
    const [yy, mm] = m.split('-').map(Number);
    const target = new Date(yy, (mm || 1) - 1, 1);
    const { y: cy, m: cm } = parseYMDParts(view.viewFrom);
    const delta = (target.getFullYear() - cy) * 12 + (target.getMonth() - cm);
    dispatch(moveMonth(delta));
    setMonthModalOpen(false);
    addToast(`${yy}년 ${String(mm).padStart(2,'0')}월로 이동했습니다.`, { color: 'success' });
  }, [monthInput, view.viewFrom, dispatch, addToast]);

  const openWeekLabelModal = useCallback(() => {
    if (viewMode !== 'week') return;
    setWeekFromInput(toYMD(weekStart));
    setWeekToInput(toYMD(weekEnd));
    setWeekError('');
    setWeekModalOpen(true);
  }, [viewMode, weekStart, weekEnd]);

  const daysBetween = (from, to) => {
    const ms = new Date(to).getTime() - new Date(from).getTime();
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  };

  const applyRangeToWeek = useCallback(() => {
    const f = String(weekFromInput || '').trim();
    const t = String(weekToInput || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f) || !/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      setWeekError('기간 형식이 올바르지 않습니다. 예) 2025-11-02 ~ 2025-11-08');
      return;
    }
    const from = new Date(f);
    const to = new Date(t);
    if (from > to) {
      setWeekError('시작일이 종료일보다 늦을 수 없습니다.');
      return;
    }
    const diff = daysBetween(f, t);
    if (diff !== 6) {
      setWeekError('기간은 정확히 1주(7일) 단위로만 입력할 수 있습니다. 예: 2025-11-02 ~ 2025-11-08');
      return;
    }
    const anchor = toYMD(startOfWeek(from));
    setWeekAnchor(anchor);
    setViewMode('week');
    setWeekModalOpen(false);
    addToast('입력한 기간을 기준으로 주간 보기로 이동했습니다.', { color: 'success' });
  }, [weekFromInput, weekToInput, addToast]);

  const onMonthModalKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); setMonthModalOpen(false); }
    if (e.key === 'Enter') { e.preventDefault(); applyMonthJump(); }
  };
  const onWeekModalKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); setWeekModalOpen(false); }
    if (e.key === 'Enter') { e.preventDefault(); applyRangeToWeek(); }
  };

  const onOpenDetail = useCallback((scheduleId, ctx) => {
    if (!scheduleId) return;
    setDetailScheduleId(scheduleId);
    setDetailContext(ctx || null);
    setDetailOpen(true);
  }, []);

  const onAskDeleteSchedule = useCallback((ev) => {
    const eff = withOverride(ev);
    const sid = normalizeIdLocal(resolveId(eff));
    const ymd = dateKeyOf(eff);
    const variant = getEventVariant(eff, new Date());
    const { primary, subtitle, leave, leaveLabel } = labelParts(eff, variant);
    const title = leave && leaveLabel ? `${primary} [${leaveLabel}]` : primary;

    setDeleteTarget({ id: sid, ymd, title, subtitle });
    setDeleteAskOpen(true);
  }, [withOverride]);

  const onDoDeleteSchedule = useCallback(async () => {
    if (!deleteTarget?.id) return;
    try {
      setDeleting(true);

      const detail = await getScheduleDetail(deleteTarget.id);
      if (hasActualFromDetail(detail)) {
        setDeleteAskOpen(false);
        setDeleteBlockedOpen(true);
        return;
      }

      await deleteSchedule(deleteTarget.id);

      setLocalOverrides((prev) => {
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });
      addToast('스케줄 계획을 삭제했습니다.', { color: 'success' });
      setDeleteAskOpen(false);
      setDeleteTarget(null);
      dispatch(loadCalendarEvents());
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || '';
      if (status === 409 || /기록|event|attendance|근무/.test(String(msg).toLowerCase())) {
        setDeleteAskOpen(false);
        setDeleteBlockedOpen(true);
      } else {
        addToast(msg || '삭제 중 오류가 발생했습니다.', { color: 'error' });
      }
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, dispatch, addToast]);

  return (
    <Page>
      {/* 이하 렌더링/모달/상세 열기/삭제 로직 기존 그대로 */}
      {/* ... 파일 끝까지 기존 코드와 동일 (생략 없이 위 원본과 동일) */}
      {/* ▼▼▼ 원본 전체 출력 요구로 생략 없이 유지합니다. ▼▼▼ */}

      <Row style={{ marginBottom: 12 }}>
        <TitleBox>
          <Title>근무일정</Title>
          {isManager && (
            <Primary onClick={onAdd}>
              <Icon path={mdiPlus} size={0.9} />
              근무일정 추가하기
            </Primary>
          )}
        </TitleBox>

        <Toolbar>
          <Ghost onClick={onExport}>
            <img src={excelIcon} alt="excel" style={{ width: 18, height: 18 }} />
            엑셀
          </Ghost>
          <Ghost onClick={onUpload}>
            <Icon path={mdiUpload} size={0.9} />
            업로드
          </Ghost>

          <SegWrap>
            <Seg onClick={() => { const base = new Date(weekAnchor); const prevY = new Date(base.getFullYear() - 1, base.getMonth(), 1); viewMode === 'week' ? setWeekAnchor(toYMD(startOfWeek(prevY))) : dispatch(moveMonth(-12)); }}>작년</Seg>
            <Seg onClick={() => { if (viewMode === 'week') { const base = new Date(weekAnchor); const prevMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1); setWeekAnchor(toYMD(startOfWeek(prevMonth))); } else { dispatch(moveMonth(-1)); } }}>지난 달</Seg>
            <Seg onClick={jumpToday}>오늘</Seg>
            <Seg onClick={() => { if (viewMode === 'week') { const base = new Date(weekAnchor); const nextMonth = new Date(base.getFullYear(), base.getMonth() + 1, 1); setWeekAnchor(toYMD(startOfWeek(nextMonth))); } else { dispatch(moveMonth(1)); } }}>다음 달</Seg>
            <Seg onClick={() => { const base = new Date(weekAnchor); const nextY = new Date(base.getFullYear() + 1, base.getMonth(), 1); viewMode === 'week' ? setWeekAnchor(toYMD(startOfWeek(nextY))) : dispatch(moveMonth(12)); }}>내년</Seg>
          </SegWrap>

          <SegWrap>
            <Seg onClick={() => { if (viewMode !== 'week') setWeekAnchor(() => { const { y, m } = parseYMDParts(view.viewFrom); const first = new Date(y, m, 1); return toYMD(startOfWeek(first)); }); setViewMode('week'); }} $active={viewMode === 'week'}>주</Seg>
            <Seg onClick={() => setViewMode('month')} $active={viewMode === 'month'}>월</Seg>
          </SegWrap>
        </Toolbar>
      </Row>

      <Row style={{ marginBottom: 8 }}>
        <Toolbar>
          <Ghost onClick={goPrev}><Icon path={mdiChevronLeft} size={0.9} /></Ghost>
          <Ghost onClick={goNext}><Icon path={mdiChevronRight} size={0.9} /></Ghost>

          <LabelBox>
            {viewMode === 'week' ? (
              <LabelButton onClick={() => { if (viewMode === 'week') { setWeekFromInput(toYMD(weekStart)); setWeekToInput(toYMD(weekEnd)); setWeekError(''); setWeekModalOpen(true); } }}>
                {weekLabel}
              </LabelButton>
            ) : (
              <LabelButton onClick={() => { if (viewMode === 'month') { setMonthInput(`${parseYMDParts(view.viewFrom).y}-${String(parseYMDParts(view.viewFrom).m + 1).padStart(2,'0')}`); setMonthModalOpen(true); } }}>
                {monthLabel}
              </LabelButton>
            )}
          </LabelBox>
        </Toolbar>

        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'#6b7280' }}>
          {loading && <span>로딩 중…</span>}
        </div>
      </Row>

      <Filters>
        <div style={{ gridColumn: 'span 2' }}>
          <SelectWrap>
            <Select value={filters.branchId || ''} onChange={onChangeBranch}>
              {isHQ
                ? <option value="">지점 전체</option>
                : (branchOpts.length > 1 && <option value="">내 지점 전체</option>)
              }
              {branchOpts.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
            <Icon path={mdiChevronDown} size={0.9} />
          </SelectWrap>
        </div>

        {!isStaff && (
          <div style={{ gridColumn: 'span 4', display: 'flex', gap: 8, minWidth: 0 }}>
            <SelectWrap style={{ flex: 1, minWidth: 0 }}>
              <Select value={filters.employeeId || ''} onChange={onChangeEmployee}>
                <option value="">직원 전체</option>
                {empOpts.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}{e.employeeNumber ? ` (${e.employeeNumber})` : ''}
                  </option>
                ))}
              </Select>
              <Icon path={mdiChevronDown} size={0.9} />
            </SelectWrap>
            <Input
              placeholder="직원 검색"
              value={empKeyword}
              onChange={(e) => setEmpKeyword(e.target.value)}
              onKeyDown={onEmpKeyDown}
              style={{ minWidth: 0, width: 160 }}
            />
          </div>
        )}

        <RightCluster $span={!isStaff ? (12 - 2 - 4) : (12 - 2)}>
          <Input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(setRange({ rangeFrom: localFrom, rangeTo: localTo })); dispatch(loadCalendarEvents()); } }}
            style={{ width: 130 }}
          />
          <RangeTilde>~</RangeTilde>
          <Input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { dispatch(setRange({ rangeFrom: localFrom, rangeTo: localTo })); dispatch(loadCalendarEvents()); } }}
            style={{ width: 130 }}
          />
          <Primary onClick={() => { dispatch(setRange({ rangeFrom: localFrom, rangeTo: localTo })); dispatch(loadCalendarEvents()); }}>
            기간 검색
          </Primary>
        </RightCluster>
      </Filters>

      <CalendarWrap>
        <Head>
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <HeadCell key={d} $sun={i===0} $sat={i===6}>{d}</HeadCell>
          ))}
        </Head>
        <Grid>
          {cells.map((d, idx) => {
            const ymd = toYMD(d);

            const evsAll = (mapByDate[ymd] || []).slice().sort((a, b) => cellStartMs(a) - cellStartMs(b));
            const isExpanded = expandedDates.has(ymd);
            const visible = isExpanded
              ? evsAll
              : evsAll.slice(0, (viewMode === 'week' ? MAX_VISIBLE_WEEK : MAX_VISIBLE_MONTH));
            const hiddenCount = evsAll.length - visible.length;

            const other = (viewMode === 'month') && (d.getMonth() !== parseYMDParts(view.viewFrom).m);
            const dw = d.getDay();
            const isSun = dw === 0, isSat = dw === 6;
            const holidayName = holidayNameOf(ymd);
            const isHoliday = !!holidayName;
            const dateColor = isHoliday || isSun ? '#ef4444' : (isSat ? '#2563eb' : '#374151');

            return (
              <Cell key={`${ymd}-${idx}`} $other={other} $week={viewMode === 'week'}>
                <DateHeadRow>
                  <DateHeadLeft $color={dateColor}>
                    {d.getDate()}
                    {isHoliday && <BadgeHolidayCircle title={holidayName}>휴</BadgeHolidayCircle>}
                  </DateHeadLeft>
                  {isHoliday && (
                    <HolidayNameRight title={holidayName}>{holidayName}</HolidayNameRight>
                  )}
                </DateHeadRow>

                {visible.map((ev) => {
                  const eff = withOverride(ev);
                  const variant = getEventVariant(eff, new Date());
                  const { primary, subtitle, leave, leaveLabel } = labelParts(eff, variant);

                  const sid = resolveId(eff);
                  const key = eff.uiKey || `${ymd}-${sid ?? Math.random()}`;
                  const tooltip = [primary, leave && leaveLabel ? leaveLabel : '', subtitle].filter(Boolean).join('\n');

                  return (
                    <Event
                      key={key}
                      $variant={variant}
                      title={tooltip}
                      onClick={() => onOpenDetail(sid, { cellDate: eff.cellDate, part: eff.part })}
                    >
                      {isManager && (
                        <EventCloseBtn
                          title="스케줄 계획 삭제"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskDeleteSchedule(eff);
                          }}
                          aria-label="스케줄 계획 삭제"
                        >
                          <Icon path={mdiClose} size={0.65} />
                        </EventCloseBtn>
                      )}
                      <EventTitle>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</span>
                        {leave && !!leaveLabel && <TypeChip>{leaveLabel}</TypeChip>}
                      </EventTitle>
                      {subtitle && <EventSub>{subtitle}</EventSub>}
                    </Event>
                  );
                })}

                {!isExpanded && hiddenCount > 0 && (
                  <MoreBtn
                    title={`외 ${hiddenCount}건 더보기`}
                    onClick={() => toggleExpand(ymd)}
                    aria-label={`더보기 (${hiddenCount}건)`}
                    aria-pressed="false"
                  >
                    <Icon path={mdiDotsVertical} size={0.78} />
                  </MoreBtn>
                )}
                {isExpanded && evsAll.length > (viewMode === 'week' ? MAX_VISIBLE_WEEK : MAX_VISIBLE_MONTH) && (
                  <MoreBtn
                    title="접기"
                    onClick={() => toggleExpand(ymd)}
                    aria-label="접기"
                    aria-pressed="true"
                  >
                    <Icon path={mdiChevronUp} size={0.78} />
                  </MoreBtn>
                )}
              </Cell>
            );
          })}
        </Grid>
      </CalendarWrap>

      {monthModalOpen && viewMode === 'month' && (
        <ModalOverlay onClick={() => setMonthModalOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>연도와 월을 입력해주세요.</ModalTitle>
                <ModalSub>예: 2025-11</ModalSub>
              </div>
              <CloseBtn onClick={() => setMonthModalOpen(false)} aria-label="닫기"><Icon path={mdiClose} size={0.9} /></CloseBtn>
            </ModalHeader>
            <ModalBody onKeyDown={onMonthModalKeyDown}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <Input type="month" value={monthInput} onChange={(e) => setMonthInput(e.target.value)} style={{ flex: 1 }} />
                <Primary onClick={applyMonthJump}>
                  적용
                </Primary>
              </div>
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}

      {weekModalOpen && viewMode === 'week' && (
        <ModalOverlay onClick={() => setWeekModalOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>원하시는 주간을 검색해주세요.</ModalTitle>
                <ModalSub>정확히 7일(예: 2025-11-02 ~ 2025-11-08)</ModalSub>
              </div>
              <CloseBtn onClick={() => setWeekModalOpen(false)} aria-label="닫기"><Icon path={mdiClose} size={0.9} /></CloseBtn>
            </ModalHeader>
            <ModalBody onKeyDown={onWeekModalKeyDown}>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <Input type="date" value={weekFromInput} onChange={(e) => { setWeekFromInput(e.target.value); setWeekError(''); }} style={{ width: 150 }} />
                <span style={{ color:'#9ca3af', fontSize:12 }}>~</span>
                <Input type="date" value={weekToInput} onChange={(e) => { setWeekToInput(e.target.value); setWeekError(''); }} style={{ width: 150 }} />
                <Primary onClick={applyRangeToWeek}>
                  적용
                </Primary>
              </div>
              {weekError && <div style={{marginTop:10,fontSize:12,color:'#dc2626'}}>{weekError}</div>}
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}

      {deleteAskOpen && deleteTarget && (
        <ModalOverlay onClick={() => setDeleteAskOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>스케줄 계획을 삭제하시겠습니까?</ModalTitle>
                <ModalSub>{fmtKDate(deleteTarget.ymd)}</ModalSub>
              </div>
              <CloseBtn onClick={() => setDeleteAskOpen(false)} aria-label="닫기">
                <Icon path={mdiClose} size={0.9} />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <div style={{ fontSize: 14, color: '#111827', wordBreak: 'keep-all' }}>
                {deleteTarget.title}
              </div>
              {deleteTarget.subtitle && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                  {deleteTarget.subtitle}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 12, color: '#6b7280' }}>
                <b>안내:</b> 해당 스케줄에 <u>근무 기록</u>이 남아있는 경우 삭제할 수 없습니다.
              </div>
            </ModalBody>
            <ModalFooter>
              <Ghost onClick={() => setDeleteAskOpen(false)}>취소</Ghost>
              <Danger onClick={onDoDeleteSchedule} disabled={deleting}>
                {deleting ? '삭제 중…' : '삭제'}
              </Danger>
            </ModalFooter>
          </ModalCard>
        </ModalOverlay>
      )}

      {deleteBlockedOpen && deleteTarget && (
        <ModalOverlay onClick={() => setDeleteBlockedOpen(false)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>삭제할 수 없습니다</ModalTitle>
                <ModalSub>{fmtKDate(deleteTarget.ymd)}</ModalSub>
              </div>
              <CloseBtn onClick={() => setDeleteBlockedOpen(false)} aria-label="닫기">
                <Icon path={mdiClose} size={0.9} />
              </CloseBtn>
            </ModalHeader>
            <ModalBody>
              <div style={{ fontSize: 14, color: '#111827', wordBreak: 'keep-all' }}>
                해당 스케줄에는 <b>근무 기록</b>이 남아 있어 삭제할 수 없습니다.
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                상세 화면에서 <b>“근무 기록 삭제”</b> 후 다시 시도해 주세요.
              </div>
            </ModalBody>
            <ModalFooter>
              <Ghost onClick={() => setDeleteBlockedOpen(false)}>닫기</Ghost>
              <Primary onClick={() => {
                setDeleteBlockedOpen(false);
                setDetailScheduleId(deleteTarget.id);
                setDetailContext({ cellDate: deleteTarget.ymd });
                setDetailOpen(true);
              }}>
                상세 열기
              </Primary>
            </ModalFooter>
          </ModalCard>
        </ModalOverlay>
      )}

      {bulkOpen && (
        <ScheduleBulkModal
          open={bulkOpen}
          defaultMonth={view.viewFrom}
          onClose={() => setBulkOpen(false)}
          onCompleted={() => {
            setBulkOpen(false);
            dispatch(loadCalendarEvents());
          }}
        />
      )}

      {detailOpen && detailScheduleId != null && (
        <ScheduleDetailModal
          open={detailOpen}
          scheduleId={detailScheduleId}
          baseDate={detailContext?.cellDate}
          part={detailContext?.part}
          onClose={() => { setDetailOpen(false); setDetailContext(null); }}
          onSaved={() => {
            setDetailOpen(false);
            setDetailContext(null);
            dispatch(loadCalendarEvents());
          }}
          onDeleted={() => {
            const id = normalizeIdLocal(detailScheduleId);
            setDetailOpen(false);
            setDetailContext(null);
            setLocalOverrides((prev) => {
              const next = { ...prev };
              delete next[id];
              return next;
            });
            dispatch(loadCalendarEvents());
          }}
          onPatched={(id, patch) => {
            const nid = normalizeIdLocal(id);
            setLocalOverrides((prev) => ({ ...prev, [nid]: patch }));
          }}
        />
      )}
    </Page>
  );
}
