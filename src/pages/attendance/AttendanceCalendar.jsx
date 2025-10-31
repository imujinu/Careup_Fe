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
} from '@mdi/js';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { useToast } from '../../components/common/Toast';
import { moveMonth, setFilters, setRange, loadCalendarEvents, loadHolidays } from '../../stores/slices/attendanceSlice';
import { fetchEmployeeOptions } from '../../service/scheduleService';
import { fetchBranchOptions } from '../../service/staffService';
import excelIcon from '../../assets/icons/excel_icon.svg';
import { decodeToken } from '../../utils/jwt';

// ✅ 분리한 모달
import { ScheduleBulkModal } from '../../components/attendance/ScheduleBulkModal';

const MAX_VISIBLE_MONTH = 3; // 월간: 날짜칸 내 최대 3건
const MAX_VISIBLE_WEEK = 10; // 주간: 날짜칸 내 최대 10건

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

/* 🔽 선택 / 입력 공통 */
const SelectWrap = styled.div`
  position: relative; width: 100%;
  & > svg {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    pointer-events: none; opacity: 0.8;
  }
`;
const Select = styled.select`
  height: 36px; padding: 0 34px 0 10px; /* 오른쪽 여백 확대로 화살표가 테두리와 붙지 않게 */
  border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
  outline: 0; width: 100%;
  appearance: none; /* 기본 화살표 숨기고 커스텀 아이콘 오버레이 */
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

/* 이벤트 */
const Event = styled.div`
  padding: 6px 8px; border-radius: 8px; margin-bottom: 6px; border: 1px solid;
  background: ${(p) => (p.$leave ? '#f5f3ff' : '#eef2ff')};
  border-color: ${(p) => (p.$leave ? '#ddd6fe' : '#dbeafe')};
  color: ${(p) => (p.$leave ? '#6b21a8' : '#1e3a8a')};
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
const ModalFooter = styled.div`padding: 12px 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 8px;`;
const HelperError = styled.div`margin-top: 10px; font-size: 12px; color: #dc2626;`;

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
  const dow = d.getDay(); // 일(0) 시작
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
  const st = String(ev?.status || '').toUpperCase();
  const ts = String(ev?.timeSource || '').toUpperCase();
  return st === 'LEAVE' || (ev?.allDay && ts === 'ALL_DAY');
};
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
const labelParts = (ev) => {
  const name = ev?.employeeName || ev?.title || '스케줄';
  const leave = isLeaveEvent(ev);
  const timeRange = fmtRange(ev?.startAt, ev?.endAt, ev?.allDay);
  const primary = [name, timeRange].filter(Boolean).join(' | ');
  const subtitle = ev?.branchName || '';
  const leaveLabel = pickLeaveLabel(ev, leave);
  return { primary, subtitle, leave, leaveLabel };
};
const fmtKDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  const DOW = ['일','월','화','수','목','금','토'];
  return `${y}.${String(m).padStart(2,'0')}.${String(d).padStart(2,'0')} (${DOW[dt.getDay()]})`;
};
const daysBetween = (from, to) => {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
};
const toYearMonth = (ymd) => {
  const { y, m } = parseYMDParts(ymd);
  return `${y}-${String(m + 1).padStart(2, '0')}`;
};

export default function AttendanceCalendar() {
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

  // 토큰에서 내 branchId/branchIds & employeeId 추출
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

  // 보기 모드: 'week' | 'month'
  const [viewMode, setViewMode] = useState('month');
  const [weekAnchor, setWeekAnchor] = useState(toYMD(new Date())); // 주 보기 기준 날짜

  // 모달 상태
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreDate, setMoreDate] = useState('');
  const [moreEvents, setMoreEvents] = useState([]);

  const [bulkOpen, setBulkOpen] = useState(false);

  // ▶ 월간 라벨 전용 모달
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [monthInput, setMonthInput] = useState(toYearMonth(new Date().toISOString().slice(0, 10)));

  // ▶ 주간 라벨 전용 모달(하단 오류 안내 포함)
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [weekFromInput, setWeekFromInput] = useState('');
  const [weekToInput, setWeekToInput] = useState('');
  const [weekError, setWeekError] = useState('');

  // 중복 호출 방지 키
  const lastEvtKeyRef = useRef('');
  const lastHolidayKeyRef = useRef('');
  const lastErrorRef = useRef('');

  // 초기 기간 기본값(당해 1/1 ~ 12/31)
  useEffect(() => {
    const y = new Date().getFullYear();
    const yFrom = `${y}-01-01`;
    const yTo = `${y}-12-31`;
    if (!filters.rangeFrom || !filters.rangeTo) {
      setLocalFrom(yFrom);
      setLocalTo(yTo);
      dispatch(setRange({ rangeFrom: yFrom, rangeTo: yTo }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 월/주 라벨
  const monthLabel = useMemo(() => {
    const { y, m } = parseYMDParts(view.viewFrom);
    return `${y}년 ${String(m + 1).padStart(2, '0')}월`;
  }, [view.viewFrom]);
  const weekStart = useMemo(() => startOfWeek(new Date(weekAnchor)), [weekAnchor]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekLabel = useMemo(() => `${fmtKDate(toYMD(weekStart))} ~ ${fmtKDate(toYMD(weekEnd))}`, [weekStart, weekEnd]);

  // 지점 옵션 로딩 (+권한별 제한: HQ=전체, 그 외=내 지점만)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = (await fetchBranchOptions('')) || [];
        const scoped = isHQ
          ? all
          : (myBranchIds.length ? all.filter((b) => myBranchIds.includes(Number(b.id))) : all);

        if (mounted) setBranchOpts(scoped);

        // 기본 선택값: 비-HQ이고 지점이 1개만이면 자동 선택
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHQ, myBranchIds.join('|')]);

  // 직원 옵션(관리 권한에만 노출/로딩)
  useEffect(() => {
    if (isStaff) {
      setEmpOpts([]); // 일반 직원은 드롭다운 사용 안 함
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
  }, [isStaff, isHQ, myBranchIds.join('|'), filters.branchId, filters.rangeFrom, filters.rangeTo, empKeyword, addToast]);

  // 일반 직원은 본인 스케줄만: employeeId 자동 세팅(있을 때만)
  useEffect(() => {
    if (!isStaff) return;
    if (myEmployeeId == null) return;
    if (Number(filters.employeeId) !== Number(myEmployeeId)) {
      dispatch(setFilters({ employeeId: Number(myEmployeeId) }));
    }
  }, [isStaff, myEmployeeId, filters.employeeId, dispatch]);

  // 일정 데이터 로딩(중복 요청 방지)
  useEffect(() => {
    const key = `${filters.branchId || ''}|${filters.employeeId || ''}|${filters.rangeFrom}|${filters.rangeTo}`;
    if (key !== lastEvtKeyRef.current) {
      lastEvtKeyRef.current = key;
      dispatch(loadCalendarEvents());
    }
  }, [dispatch, filters.rangeFrom, filters.rangeTo, filters.branchId, filters.employeeId]);

  // 공휴일 로딩(월/주 모드 별도 키 관리)
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

  // 에러 토스트(같은 문자열은 1번만)
  useEffect(() => {
    const msg = String(error || '');
    if (msg && msg !== lastErrorRef.current) {
      lastErrorRef.current = msg;
      addToast(msg, { color: 'error' });
    }
  }, [error, addToast]);

  // 메인 필터(지점/직원) 선택
  const onChangeBranch = (e) => {
    const v = e.target.value ? Number(e.target.value) : null; // 빈값(null) = '내 지점 전체'
    dispatch(setFilters({ branchId: v, employeeId: null }));
  };
  const onChangeEmployee = (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    dispatch(setFilters({ employeeId: v }));
  };

  // 직원 검색 Enter
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

  // 네비게이션(주/월 모드 분기)
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

  // 퀵 점프
  const jumpToday = () => {
    if (viewMode === 'week') {
      setWeekAnchor(toYMD(new Date()));
    } else {
      dispatch(moveMonth(0));
    }
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
      const prevYearSameMonth = new Date(base.getFullYear() - 1, base.getMonth(), 1);
      setWeekAnchor(toYMD(startOfWeek(prevYearSameMonth)));
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
      const nextYearSameMonth = new Date(base.getFullYear() + 1, base.getMonth(), 1);
      setWeekAnchor(toYMD(startOfWeek(nextYearSameMonth)));
    } else {
      dispatch(moveMonth(12));
    }
  };

  // 셀 목록: 월/주 모드
  const cells = useMemo(() => (
    viewMode === 'week' ? weekCells(weekAnchor) : daysMatrix(view.viewFrom)
  ), [viewMode, weekAnchor, view.viewFrom]);

  // 추가 필터링
  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    if (filters.employeeId) return list.filter(ev => Number(ev?.employeeId) === Number(filters.employeeId));
    if (filters.branchId) return list.filter(ev => Number(ev?.branchId) === Number(filters.branchId));
    return list;
  }, [events, filters.employeeId, filters.branchId]);

  // 날짜 → 이벤트 맵
  const mapByDate = useMemo(() => {
    const map = {};
    (filteredEvents || []).forEach((ev) => {
      const key = (ev?.date || '').slice(0, 10);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // 상단 버튼
  const onAdd = () => setBulkOpen(true);
  const onExport = () => addToast('엑셀 내보내기는 다음 단계에서 연결합니다.', { color: 'info' });
  const onUpload = () => addToast('업로드는 다음 단계에서 연결합니다.', { color: 'info' });

  // 공휴일 이름
  const holidayNameOf = useCallback((ymd) => {
    const name = holidays?.[ymd];
    return typeof name === 'string' && name ? name : '';
  }, [holidays]);

  // 더보기 모달
  const openMore = useCallback((ymd) => {
    const list = (mapByDate[ymd] || []).slice().sort((a, b) => {
      const as = a?.startAt ? new Date(a.startAt).getTime() : 0;
      const bs = b?.startAt ? new Date(b.startAt).getTime() : 0;
      return as - bs;
    });
    setMoreDate(ymd);
    setMoreEvents(list);
    setMoreOpen(true);
  }, [mapByDate]);
  const closeMore = useCallback(() => setMoreOpen(false), []);

  // RightCluster span 동적 계산 (지점 2 + 직원 4 + 오른쪽 ? = 12)
  const rightSpan = !isStaff ? (12 - 2 - 4) : (12 - 2);

  // 모드별 최대 표시 개수
  const maxVisiblePerCell = viewMode === 'week' ? MAX_VISIBLE_WEEK : MAX_VISIBLE_MONTH;

  /* ===== 월 → 주 전환 우선 로직(상위) ===== */
  // 현재 월(view.viewFrom)의 '첫째 날'이 포함된 주의 시작(일요일)로 weekAnchor 계산
  const firstWeekOfMonthAnchor = useCallback(() => {
    const { y, m } = parseYMDParts(view.viewFrom);
    const first = new Date(y, m, 1);
    return toYMD(startOfWeek(first));
  }, [view.viewFrom]);

  // ‘주’ 버튼 클릭 시: 월간에서 주간으로 전환될 때 먼저 첫째 주로 맞춘 후 주간 보기로 전환
  const onViewWeek = useCallback(() => {
    if (viewMode !== 'week') {
      setWeekAnchor(firstWeekOfMonthAnchor());
    }
    setViewMode('week');
  }, [viewMode, firstWeekOfMonthAnchor]);

  /* ===== 월간/주간 라벨 전용 모달 로직 ===== */
  const openMonthLabelModal = useCallback(() => {
    if (viewMode !== 'month') return;
    setMonthInput(toYearMonth(view.viewFrom));
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

  // 주간 기간 검색(하위): 사용자가 ‘적용’할 때에만 weekAnchor를 명시적으로 덮어씀
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
    const diff = daysBetween(f, t); // 일수 차이
    if (diff !== 6) {
      setWeekError('기간은 정확히 1주(7일) 단위로만 입력할 수 있습니다. 예: 2025-11-02 ~ 2025-11-08');
      return;
    }
    const anchor = toYMD(startOfWeek(from));
    setWeekAnchor(anchor);  // ← 하위에서 명시적 덮어쓰기
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

  return (
    <Page>
      {/* 상단 타이틀 & 우측 액션 */}
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

          {/* 🔹 퀵 점프: 작년 / 지난 달 / 오늘 / 다음 달 / 내년 */}
          <SegWrap>
            <Seg onClick={jumpLastYear}>작년</Seg>
            <Seg onClick={jumpLastMonth}>지난 달</Seg>
            <Seg onClick={jumpToday}>오늘</Seg>
            <Seg onClick={jumpNextMonth}>다음 달</Seg>
            <Seg onClick={jumpNextYear}>내년</Seg>
          </SegWrap>

          {/* 🔹 보기 모드: 주 / 월 */}
          <SegWrap>
            <Seg onClick={onViewWeek} $active={viewMode === 'week'}>주</Seg>
            <Seg onClick={() => setViewMode('month')} $active={viewMode === 'month'}>월</Seg>
          </SegWrap>
        </Toolbar>
      </Row>

      {/* 월/주 네비게이션 (← →, 라벨 클릭 시 모달) */}
      <Row style={{ marginBottom: 8 }}>
        <Toolbar>
          <Ghost onClick={goPrev}><Icon path={mdiChevronLeft} size={0.9} /></Ghost>
          <Ghost onClick={goNext}><Icon path={mdiChevronRight} size={0.9} /></Ghost>

          {/* ▶ 라벨(월간/주간 각각 별도 모달) */}
          <LabelBox>
            {viewMode === 'week' ? (
              <LabelButton onClick={openWeekLabelModal} title="클릭하여 기간(7일)을 직접 입력">
                {weekLabel}
              </LabelButton>
            ) : (
              <LabelButton onClick={openMonthLabelModal} title="클릭하여 연/월을 직접 입력">
                {monthLabel}
              </LabelButton>
            )}
          </LabelBox>
        </Toolbar>

        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'#6b7280' }}>
          {loading && <span>로딩 중…</span>}
        </div>
      </Row>

      {/* 필터 바 */}
      <Filters>
        {/* 지점 */}
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

        {/* 직원(관리권한 전용) */}
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

        {/* 👉 오른쪽 끝: 기간 from ~ to + 검색 버튼 */}
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

      {/* 캘린더 */}
      <CalendarWrap>
        <Head>
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <HeadCell key={d} $sun={i===0} $sat={i===6}>{d}</HeadCell>
          ))}
        </Head>
        <Grid>
          {cells.map((d, idx) => {
            const ymd = toYMD(d);
            const evs = mapByDate[ymd] || [];
            const visible = evs.slice(0, maxVisiblePerCell);
            const hiddenCount = evs.length - visible.length;

            const other = (viewMode === 'month') && (d.getMonth() !== parseYMDParts(view.viewFrom).m);
            const dw = d.getDay();
            const isSun = dw === 0, isSat = dw === 6;
            const holidayName = holidayNameOf(ymd);
            const isHoliday = !!holidayName;
            const dateColor = isHoliday || isSun ? '#ef4444' : (isSat ? '#2563eb' : '#374151');

            return (
              <Cell key={`${ymd}-${idx}`} $other={other} $week={viewMode === 'week'}>
                {/* 상단 날짜/공휴일 */}
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
                  const { primary, subtitle, leave, leaveLabel } = labelParts(ev);
                  const tooltip = [primary, leave && leaveLabel ? leaveLabel : '', subtitle].filter(Boolean).join('\n');
                  return (
                    <Event key={ev.id} $leave={leave} title={tooltip}>
                      <EventTitle>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</span>
                        {leave && !!leaveLabel && <TypeChip>{leaveLabel}</TypeChip>}
                      </EventTitle>
                      {subtitle && <EventSub>{subtitle}</EventSub>}
                    </Event>
                  );
                })}

                {hiddenCount > 0 && (
                  <MoreBtn title={`외 ${hiddenCount}건 더보기`} onClick={() => openMore(ymd)} aria-label={`더보기 (${hiddenCount}건)`}>
                    <Icon path={mdiDotsVertical} size={0.78} />
                  </MoreBtn>
                )}
              </Cell>
            );
          })}
        </Grid>
      </CalendarWrap>

      {/* 전체 스케줄 모달(더보기) */}
      {moreOpen && (
        <ModalOverlay onClick={closeMore}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>{fmtKDate(moreDate)}</ModalTitle>
                {holidays?.[moreDate] && <ModalSub>공휴일: {holidays[moreDate]}</ModalSub>}
              </div>
              <CloseBtn onClick={closeMore} aria-label="닫기"><Icon path={mdiClose} size={0.9} /></CloseBtn>
            </ModalHeader>
            <ModalBody>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, marginBottom: 8 }}>
                전체 스케줄 ({moreEvents.length}건)
              </div>
              {moreEvents.length === 0 && <div style={{ fontSize: 13, color: '#6b7280' }}>표시할 스케줄이 없습니다.</div>}
              {moreEvents.map((ev) => {
                const { primary, subtitle, leave, leaveLabel } = labelParts(ev);
                const tooltip = [primary, leave && leaveLabel ? leaveLabel : '', subtitle].filter(Boolean).join('\n');
                return (
                  <Event key={`modal-${ev.id}`} $leave={leave} title={tooltip} style={{ marginBottom: 10 }}>
                    <EventTitle>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{primary}</span>
                      {leave && !!leaveLabel && <TypeChip>{leaveLabel}</TypeChip>}
                    </EventTitle>
                    {subtitle && <EventSub>{subtitle}</EventSub>}
                  </Event>
                );
              })}
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ✅ 월간 라벨 모달: 연/월 입력 */}
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
                <Primary onClick={applyMonthJump}>적용</Primary>
              </div>
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ✅ 주간 라벨 모달: 기간(7일) → 주간 보기, 하단에 오류 안내 */}
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
                <Primary onClick={applyRangeToWeek}>적용</Primary>
              </div>
              {weekError && <HelperError>{weekError}</HelperError>}
            </ModalBody>
          </ModalCard>
        </ModalOverlay>
      )}

      {/* ✅ ‘근무일정 추가하기’ 모달 */}
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
    </Page>
  );
}
