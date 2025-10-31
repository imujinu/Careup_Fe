// src/pages/attendance/AttendanceCalendar.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiCalendarToday,
  mdiPlus,
  mdiUpload,
  mdiDotsVertical,
  mdiClose,
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

const MAX_VISIBLE = 3;

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

/* 🔽 선택 컴포넌트: 기본 화살표 사용(커스텀 아이콘 제거) */
const Select = styled.select`
  height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
  outline: 0; width: 100%;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15); }
`;

/* 🔤 Input 공통: 포커스 보라 글로우 */
const Input = styled.input`
  height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
  outline: 0;
  transition: box-shadow .15s ease, border-color .15s ease;
  &:focus { border-color: #6d28d9; box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.15); }
`;

/* 우측 끝 ‘기간 from ~ to + 버튼’ 묶음 — span 동적 적용 */
const RightCluster = styled.div`
  grid-column: span ${(p) => p.$span || 6};
  display: flex; align-items: center; justify-content: flex-end; gap: 8px;
  min-width: 0;
`;
const RangeTilde = styled.span`
  color: #9ca3af; font-size: 12px; user-select: none;
`;

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

/* 🔧 날짜/공휴일 라인 — 왼쪽: 날짜+휴 아이콘, 오른쪽: 공휴일명(우측 정렬) */
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

/* 휴 아이콘 */
const BadgeHolidayCircle = styled.span`
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: #ef4444; color: #fff; border: 1px solid #dc2626;
`;

/* 이벤트 카드 */
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

/* 휴가 칩 */
const TypeChip = styled.span`
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1;
  border: 1px solid #c4b5fd;
  background: #ede9fe;
  color: #5b21b6;
`;

/* ‘더보기’ 버튼 */
const MoreBtn = styled.button`
  position: absolute; left: 50%; bottom: 6px; transform: translateX(-50%);
  width: 28px; height: 28px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; background: transparent; cursor: pointer;
  &:hover { background: #f3f4f6; }
  &:focus { outline: none; box-shadow: none; }
  &:active { outline: none; box-shadow: none; }
`;

/* 공용 모달(더보기) */
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

  // 직원 검색 Enter → 입력 비었으면 "직원 전체"로 초기화, 아니면 가장 먼저 일치하는 직원 적용
  const applyEmployeeSearch = useCallback(() => {
    const kw = (empKeyword || '').trim();

    // 🔹 빈 입력 → 전체 초기화
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
  const goThis = () => {
    if (viewMode === 'week') {
      setWeekAnchor(toYMD(new Date()));
    } else {
      dispatch(moveMonth(0));
    }
  };

  const onSearch = useCallback(() => {
    dispatch(setRange({ rangeFrom: localFrom, rangeTo: localTo }));
    dispatch(loadCalendarEvents());
  }, [dispatch, localFrom, localTo]);

  const onKeyDown = (e) => { if (e.key === 'Enter') onSearch(); };

  // 셀 목록: 월/주 모드 별도 생성
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
          <SegWrap>
            <Seg onClick={() => setViewMode('week')} $active={viewMode === 'week'}>주</Seg>
            <Seg onClick={() => setViewMode('month')} $active={viewMode === 'month'}>월</Seg>
          </SegWrap>
        </Toolbar>
      </Row>

      {/* 월/주 네비게이션 */}
      <Row style={{ marginBottom: 8 }}>
        <Toolbar>
          <Ghost onClick={goPrev}><Icon path={mdiChevronLeft} size={0.9} /></Ghost>
          <Ghost onClick={goThis}><Icon path={mdiCalendarToday} size={0.9} /> 오늘</Ghost>
          <Ghost onClick={goNext}><Icon path={mdiChevronRight} size={0.9} /></Ghost>
          <div style={{ marginLeft: 8, fontWeight: 700, fontSize: 16 }}>
            {viewMode === 'week' ? weekLabel : monthLabel}
          </div>
        </Toolbar>

        <div style={{ display:'flex', alignItems:'center', gap:12, fontSize:12, color:'#6b7280' }}>
          {loading && <span>로딩 중…</span>}
        </div>
      </Row>

      {/* 필터 바 */}
      <Filters>
        {/* 지점: HQ는 '지점 전체', 비-HQ는 배치 지점 2곳 이상이면 '내 지점 전체' 노출 */}
        <div style={{ gridColumn: 'span 2' }}>
          <Select value={filters.branchId || ''} onChange={onChangeBranch}>
            {isHQ
              ? <option value="">지점 전체</option>
              : (branchOpts.length > 1 && <option value="">내 지점 전체</option>)
            }
            {branchOpts.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        {/* 직원: 일반 직원(STAFF)은 미노출, 관리자/HQ만 표시 — 너비 축소(span 4) */}
        {!isStaff && (
          <div style={{ gridColumn: 'span 4', display: 'flex', gap: 8, minWidth: 0 }}>
            <Select value={filters.employeeId || ''} onChange={onChangeEmployee} style={{ minWidth: 0, flex: 1 }}>
              <option value="">직원 전체</option>
              {empOpts.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}{e.employeeNumber ? ` (${e.employeeNumber})` : ''}
                </option>
              ))}
            </Select>
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
        <RightCluster $span={rightSpan}>
          <Input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ width: 130 }}
          />
          <RangeTilde>~</RangeTilde>
          <Input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ width: 130 }}
          />
          <Primary onClick={onSearch}>기간 검색</Primary>
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
            const visible = evs.slice(0, MAX_VISIBLE);
            const hiddenCount = evs.length - visible.length;

            const other = (viewMode === 'month') && (d.getMonth() !== parseYMDParts(view.viewFrom).m);
            const dw = d.getDay();
            const isSun = dw === 0, isSat = dw === 6;
            const holidayName = holidayNameOf(ymd);
            const isHoliday = !!holidayName;
            const dateColor = isHoliday || isSun ? '#ef4444' : (isSat ? '#2563eb' : '#374151');

            return (
              <Cell key={`${ymd}-${idx}`} $other={other} $week={viewMode === 'week'}>
                {/* 🔧 상단 라인: 왼쪽(날짜 + 휴), 오른쪽(공휴일명 우측 정렬) */}
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
