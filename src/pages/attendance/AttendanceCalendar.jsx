import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiCalendarToday,
  mdiPlus,
  mdiUpload,
} from '@mdi/js';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { useToast } from '../../components/common/Toast';
import { moveMonth, setFilters, setRange, loadCalendarEvents, loadHolidays } from '../../stores/slices/attendanceSlice';
import { fetchEmployeeOptions } from '../../service/scheduleService';
import { fetchBranchOptions } from '../../service/staffService';
import excelIcon from '../../assets/icons/excel_icon.svg';

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
  border: none; border-right: 1px solid #e5e7eb; font-size: 13px; cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  &:last-child { border-right: 0; }
`;
const Toolbar = styled.div`display: flex; align-items: center; gap: 8px; flex-wrap: wrap;`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0,1fr));
  gap: 8px;
  margin: 14px 0;
`;
const Select = styled.select`
  height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
`;
const Input = styled.input`
  height: 36px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px;
`;

const CalendarWrap = styled.div`border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background: #fff;`;
const Head = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); background: #fafafa; border-bottom: 1px solid #e5e7eb;`;
const HeadCell = styled.div`
  padding: 10px 12px; font-size: 12px; font-weight: 700; text-align: left;
  color: ${(p) => (p.$sun ? '#ef4444' : p.$sat ? '#2563eb' : '#6b7280')};
`;

const Grid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr);`;
const Cell = styled.div`
  min-height: 120px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 8px 8px 10px;
  background: ${(p) => (p.$other ? '#fafafa' : '#fff')};
  &:nth-child(7n) { border-right: 0; }
`;

/* 날짜 라벨: 주말/휴일 색을 prop으로 주입 */
const DateBadge = styled.div`
  font-size: 12px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;
  color: ${(p) => p.$color || '#374151'};
`;

/* 휴일 동그라미 배지: "휴" */
const BadgeHolidayCircle = styled.span`
  width: 18px; height: 18px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: #ef4444; color: #fff; border: 1px solid #dc2626;
`;

/* 휴일 명칭 */
const HolidayName = styled.div`
  font-size: 11px; color: #b91c1c; margin-bottom: 6px;
`;

/* 이벤트 카드 */
const Event = styled.div`
  padding: 6px 8px; border-radius: 8px; margin-bottom: 6px; border: 1px solid;
  background: ${(p) => (p.$leave ? '#f5f3ff' : '#eef2ff')};      /* 휴가=연보라, 기본=연한 파랑 */
  border-color: ${(p) => (p.$leave ? '#ddd6fe' : '#dbeafe')};
  color: ${(p) => (p.$leave ? '#6b21a8' : '#1e3a8a')};
`;
const EventTitle = styled.div`
  font-size: 12px; line-height: 1.28; font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;
const EventSub = styled.div`
  font-size: 11px; line-height: 1.2; color: #4b5563;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const Legend = styled.div`display: flex; gap: 12px; align-items: center; font-size: 12px; color: #6b7280;`;

/* ===== 로컬 날짜 유틸 ===== */
const toYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
};

/* ===== 시간 포맷: 24시간제 HH:mm ===== */
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

/* 카드 표기: 1줄(이름 | 시간), 2줄(지점) */
const labelParts = (ev) => {
  const name = ev?.employeeName || ev?.title || '스케줄';
  const range = fmtRange(ev?.startAt, ev?.endAt, ev?.allDay);
  const branch = ev?.branchName || '';
  return { title: range ? `${name} | ${range}` : name, subtitle: branch };
};

export default function AttendanceCalendar() {
  const dispatch = useAppDispatch();
  const { addToast } = useToast();

  const { view, filters, events, holidays, loading, error } = useAppSelector((s) => s.attendance);
  const rawRole = useAppSelector((s) => s.auth.role);
  const role = String(rawRole || '').replace(/^ROLE_/, '').toUpperCase();
  const isHQ = role === 'HQ_ADMIN';

  const [branchOpts, setBranchOpts] = useState([]);
  const [empOpts, setEmpOpts] = useState([]);
  const [empKeyword, setEmpKeyword] = useState('');
  const [localFrom, setLocalFrom] = useState(filters.rangeFrom);
  const [localTo, setLocalTo] = useState(filters.rangeTo);
  const [viewMode, setViewMode] = useState('month');

  // 중복 호출 방지 키
  const lastEvtKeyRef = useRef('');
  const lastHolidayKeyRef = useRef('');
  const lastErrorRef = useRef('');

  // 월 라벨
  const monthLabel = useMemo(() => {
    const { y, m } = parseYMDParts(view.viewFrom);
    return `${y}년 ${String(m + 1).padStart(2, '0')}월`;
  }, [view.viewFrom]);

  // 옵션 로딩
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const branches = await fetchBranchOptions('');
        if (mounted) setBranchOpts(branches || []);
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
  }, []); // 초기 1회만

  // 직원 옵션 로딩(지점/기간/키워드 연동)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchEmployeeOptions({
          branchIds: filters.branchId ? [filters.branchId] : undefined,
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
  }, [filters.branchId, filters.rangeFrom, filters.rangeTo, empKeyword, isHQ, addToast]);

  // 일정 데이터 로딩(중복 요청 방지)
  useEffect(() => {
    const key = `${filters.branchId || ''}|${filters.employeeId || ''}|${filters.rangeFrom}|${filters.rangeTo}`;
    if (key !== lastEvtKeyRef.current) {
      lastEvtKeyRef.current = key;
      dispatch(loadCalendarEvents());
    }
  }, [dispatch, filters.rangeFrom, filters.rangeTo, filters.branchId, filters.employeeId]);

  // 공휴일 로딩(중복 요청 방지)
  useEffect(() => {
    const key = `${view.viewFrom}~${view.viewTo}`;
    if (key !== lastHolidayKeyRef.current) {
      lastHolidayKeyRef.current = key;
      dispatch(loadHolidays({ viewFrom: view.viewFrom, viewTo: view.viewTo }));
    }
  }, [dispatch, view.viewFrom, view.viewTo]);

  // 에러 토스트(같은 문자열은 1번만)
  useEffect(() => {
    const msg = String(error || '');
    if (msg && msg !== lastErrorRef.current) {
      lastErrorRef.current = msg;
      addToast(msg, { color: 'error' });
    }
  }, [error, addToast]);

  // 지점/직원 선택
  const onChangeBranch = (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    dispatch(setFilters({ branchId: v, employeeId: null }));
  };
  const onChangeEmployee = (e) => {
    const v = e.target.value ? Number(e.target.value) : null;
    dispatch(setFilters({ employeeId: v }));
  };

  const goPrev = () => dispatch(moveMonth(-1));
  const goNext = () => dispatch(moveMonth(1));
  const goThis = () => dispatch(moveMonth(0));

  const onSearch = useCallback(() => {
    dispatch(setRange({ rangeFrom: localFrom, rangeTo: localTo }));
    dispatch(loadCalendarEvents());
  }, [dispatch, localFrom, localTo]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') onSearch();
  };

  const cells = useMemo(() => daysMatrix(view.viewFrom), [view.viewFrom]);

  // 날짜 → 이벤트 맵
  const mapByDate = useMemo(() => {
    const map = {};
    (events || []).forEach((ev) => {
      const key = (ev?.date || '').slice(0, 10);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  // 버튼(후속 구현 지점)
  const onAdd = () => addToast('스케줄 생성은 다음 단계에서 연결합니다.', { color: 'info' });
  const onExport = () => addToast('엑셀 내보내기는 다음 단계에서 연결합니다.', { color: 'info' });
  const onUpload = () => addToast('업로드는 다음 단계에서 연결합니다.', { color: 'info' });

  const baseMonth = useMemo(() => parseYMDParts(view.viewFrom).m, [view.viewFrom]);

  // 공휴일 이름(문자열 맵: { ymd: "휴일명" })
  const holidayNameOf = useCallback((ymd) => {
    const name = holidays?.[ymd];
    return typeof name === 'string' && name ? name : '';
  }, [holidays]);

  return (
    <Page>
      {/* 상단 타이틀 & 우측 액션 */}
      <Row style={{ marginBottom: 12 }}>
        <TitleBox>
          <Title>근무일정</Title>
          <Primary onClick={onAdd}>
            <Icon path={mdiPlus} size={0.9} />
            근무일정 추가하기
          </Primary>
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
            <Seg $disabled onClick={() => setViewMode('day')} $active={viewMode === 'day'}>일</Seg>
            <Seg $disabled onClick={() => setViewMode('week')} $active={viewMode === 'week'}>주</Seg>
            <Seg onClick={() => setViewMode('month')} $active={viewMode === 'month'}>월</Seg>
          </SegWrap>
        </Toolbar>
      </Row>

      {/* 월 네비게이션 */}
      <Row style={{ marginBottom: 8 }}>
        <Toolbar>
          <Ghost onClick={goPrev}><Icon path={mdiChevronLeft} size={0.9} /></Ghost>
          <Ghost onClick={goThis}><Icon path={mdiCalendarToday} size={0.9} /> 오늘</Ghost>
          <Ghost onClick={goNext}><Icon path={mdiChevronRight} size={0.9} /></Ghost>
          <div style={{ marginLeft: 8, fontWeight: 700, fontSize: 16 }}>{monthLabel}</div>
        </Toolbar>

        <Legend>
          {loading && <span>로딩 중…</span>}
        </Legend>
      </Row>

      {/* 필터 바 (지점/직원 + 기간 + 검색) */}
      <Filters>
        <div style={{ gridColumn: 'span 3' }}>
          <Select value={filters.branchId || ''} onChange={onChangeBranch} style={{ width: '100%' }}>
            <option value="">지점 전체</option>
            {branchOpts.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>

        <div style={{ gridColumn: 'span 3' }}>
          <Select value={filters.employeeId || ''} onChange={onChangeEmployee} style={{ width: '100%' }}>
            <option value="">직원 전체</option>
            {empOpts.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}{e.employeeNumber ? ` (${e.employeeNumber})` : ''}
              </option>
            ))}
          </Select>
        </div>

        <div style={{ gridColumn: 'span 2' }}>
          <Input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ width: '100%' }}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <Input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            onKeyDown={onKeyDown}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start' }}>
          <Primary onClick={onSearch}>기간 검색</Primary>
        </div>
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
            const other = d.getMonth() !== baseMonth;
            const dw = d.getDay();
            const isSun = dw === 0;
            const isSat = dw === 6;
            const holidayName = holidayNameOf(ymd);
            const isHoliday = !!holidayName;

            // 날짜 색상 규칙: 휴일/일요일=빨강, 토요일=파랑, 평일=기본
            const dateColor = isHoliday || isSun ? '#ef4444' : (isSat ? '#2563eb' : '#374151');

            return (
              <Cell key={`${ymd}-${idx}`} $other={other}>
                <DateBadge $color={dateColor}>
                  {ymd}
                  {isHoliday && (
                    <BadgeHolidayCircle title={holidayName}>휴</BadgeHolidayCircle>
                  )}
                </DateBadge>

                {isHoliday && (
                  <HolidayName title={holidayName}>{holidayName}</HolidayName>
                )}

                {evs.map((ev) => {
                  const { title, subtitle } = labelParts(ev);
                  const isLeave = String(ev?.category || '').toUpperCase() === 'LEAVE';
                  const tooltip = subtitle ? `${title}\n${subtitle}` : title;
                  return (
                    <Event key={ev.id} $leave={isLeave} title={tooltip}>
                      <EventTitle>{title}</EventTitle>
                      {subtitle && <EventSub>{subtitle}</EventSub>}
                    </Event>
                  );
                })}
              </Cell>
            );
          })}
        </Grid>
      </CalendarWrap>
    </Page>
  );
}
