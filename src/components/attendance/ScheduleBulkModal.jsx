// src/components/attendance/ScheduleBulkModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiChevronLeft, mdiChevronRight, mdiChevronDown, mdiClose } from '@mdi/js';
import { useToast } from '../common/Toast';
import { fetchBranchOptions } from '../../service/staffService';
import {
  fetchEmployeeOptions,
  fetchWorkTypeOptions,
  fetchLeaveTypeOptions,
  massCreateSchedules,
} from '../../service/scheduleService';

/* ===== 스타일 ===== */
const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1100;
  display: flex; align-items: center; justify-content: center;
  background: rgba(17,24,39,0.5);
`;
const Shell = styled.div`
  width: min(1160px, 96vw);
  height: min(820px, 94vh);
  background: #fff; border-radius: 16px;
  display: grid; grid-template-rows: auto 1fr;
  box-shadow: 0 12px 36px rgba(0,0,0,0.25);
  overflow: hidden;
`;
const Header = styled.div`
  padding: 18px 20px; font-weight: 700; font-size: 18px; border-bottom: 1px solid #e5e7eb;
`;
const Body = styled.div`
  display: grid; grid-template-columns: 430px 1fr; gap: 0;
`;
const Left = styled.div`
  padding: 18px; border-right: 1px solid #e5e7eb; overflow: auto;
`;
const Right = styled.div`
  padding: 18px; overflow: hidden; display: flex; flex-direction: column;
`;

const Field = styled.div`
  display: grid; grid-template-columns: 90px 1fr; gap: 12px; align-items: center; margin-bottom: 14px;
`;
const Label = styled.div`font-size: 13px; color: #6b7280;`;

/* 입력 박스: 내부에 드롭다운 아이콘 포함 */
const InputLike = styled.button`
  height: 44px; padding: 0 12px; width: 100%;
  border: 1px solid #e5e7eb; background: #fff; border-radius: 8px;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 14px; color: #374151; text-align: left; cursor: pointer;
  &:hover { background: #fafafa; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;
const Placeholder = styled.span`color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;`;
const ValueText = styled.span`overflow:hidden; text-overflow:ellipsis; white-space:nowrap;`;
const Caret = styled.span`display:inline-flex; align-items:center; opacity:.75;`;

/* 공용 버튼(달 이동) */
const IconBtn = styled.button`
  width: 40px; height: 40px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: #f9fafb; }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

/* 시간 입력 */
const TimeRow = styled.div`
  display: grid; grid-template-columns: 64px 16px 64px 80px;
  gap: 8px; align-items: center;
`;
const TimeBox = styled.input`
  height: 40px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 10px; font-size: 14px; text-align: center;
  background: ${(p)=>p.disabled ? '#f9fafb' : '#fff'};
  color: ${(p)=>p.disabled ? '#9ca3af' : '#111827'};
`;
const AmPm = styled.select`
  height: 40px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 10px; font-size: 14px;
  background: ${(p)=>p.disabled ? '#f9fafb' : '#fff'};
  color: ${(p)=>p.disabled ? '#9ca3af' : '#111827'};
`;

const Footer = styled.div`
  padding: 16px 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 10px;
`;
const Button = styled.button`
  height: 40px; padding: 0 16px; border-radius: 10px; font-size: 14px; cursor: pointer; border: 1px solid transparent;
`;
const Cancel = styled(Button)`
  background: #efefef; color: #6b7280; border-color: #e5e7eb;
`;
const Confirm = styled(Button)`
  background: #7c3aed; color: #fff;
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

/* 우측 캘린더 */
const CalendarCard = styled.div`border: 1px solid #e5e7eb; border-radius: 12px; display: grid; grid-template-rows: auto auto 1fr; overflow: hidden;`;
const CalHead = styled.div`display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; background:#f3f4f6; padding: 10px; border-bottom: 1px solid #e5e7eb;`;
const CalTitle = styled.div`text-align: center; font-weight: 700;`;
const DowRow = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); background: #fafafa; border-bottom: 1px solid #e5e7eb;`;
const Dow = styled.div`padding: 10px; font-size: 12px; font-weight: 700; color: #6b7280;`;
const CalGrid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); overflow: auto;`;
const Day = styled.div`
  min-height: 92px; padding: 10px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; cursor: pointer;
  background: ${(p)=> p.$other ? '#fafafa' : p.$active ? 'rgba(124,58,237,0.16)' : '#fff'};
  &:nth-child(7n){ border-right: 0; }
`;
const DayNum = styled.div`font-size: 13px; font-weight: 700; color: ${(p)=>p.$other?'#9ca3af':'#374151'};`;

/* 간단 모달(옵션 픽커) */
const SmallOverlay = styled(Overlay)`z-index: 1200; background: rgba(17,24,39,0.35);`;
const SmallCard = styled.div`
  width: min(640px, 94vw); max-height: 80vh;
  background: #fff; border-radius: 14px; overflow: hidden; display: grid; grid-template-rows: auto auto 1fr auto;
  box-shadow: 0 12px 30px rgba(0,0,0,0.2);
`;
const SmallHead = styled.div`padding: 14px 16px; font-weight: 700; border-bottom: 1px solid #e5e7eb;`;
const SmallTopBar = styled.div`
  padding: 10px 12px; border-bottom: 1px solid #f1f5f9; background: #f9fafb;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: space-between;
`;
const Chips = styled.div`
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 32px;
`;
const Chip = styled.span`
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px; border-radius: 9999px;
  background: #ede9fe; color: #4c1d95; font-weight: 700; font-size: 12px;
`;
const ChipClose = styled.button`
  width: 20px; height: 20px; border-radius: 9999px; border: 0; cursor: pointer;
  display: inline-grid; place-items: center; background: #a78bfa; color: #fff;
  &:hover { filter: brightness(.95); }
`;
const Others = styled.span`color: #6b7280; font-size: 12px;`;

const SmallBody = styled.div`padding: 0; overflow: auto;`;
const SmallFoot = styled.div`padding: 12px 14px; border-top: 1px solid #e5e7eb; display: flex; justify-content: flex-end; gap: 8px;`;

/* 섹션 헤더(시각적 구분 강화 + 스크롤 시 상단 고정) */
const SectionHeader = styled.div`
  position: sticky; top: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; background: #fafafa; z-index: 1;
  border-top: 1px solid #ede9fe; border-bottom: 1px solid #ede9fe;
  font-size: 12px; font-weight: 800; letter-spacing: .02em; color: #5b21b6; text-transform: uppercase;
  &::before {
    content: ''; width: 6px; height: 14px; border-radius: 3px; background: #7c3aed;
  }
`;
const SectionSpacer = styled.div`height: 8px;`;

/* 항목 라인 */
const ListRow = styled.div`
  display: grid; grid-template-columns: 1fr auto; align-items: center;
  gap: 10px; padding: 12px 14px; border-bottom: 1px solid #f3f4f6; cursor: pointer;
  background: ${(p)=> p.$active ? 'rgba(124,58,237,0.08)' : 'transparent'};
  &:last-child { border-bottom: none; }
  span.name { font-size: 14px; color: ${p => p.$active ? '#7c3aed' : '#374151'}; font-weight: ${p => p.$active ? 700 : 400}; }
`;
const PurpleCheck = styled.input.attrs({ type: 'checkbox' })`
  width: 18px; height: 18px; margin: 0; accent-color: #7c3aed; cursor: pointer;
`;

const DOW_KR = ['일','월','화','수','목','금','토'];

const parseYMDParts = (s) => {
  const [y, m, d] = String(s || '').split('-').map(Number);
  return { y, m: (m || 1) - 1, d: d || 1 };
};
const toYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
const monthLabel = (ymd) => {
  const { y, m } = parseYMDParts(ymd);
  return `${y}년 ${String(m + 1).padStart(2,'0')}월`;
};

/** 12시간 → 24시간 숫자 변환 */
const hhTo24 = (hh, ampm) => {
  let h = Number(hh || 0);
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0');
};
/** HH, MM 정합성 */
const isValidHH = (hh) => /^\d{1,2}$/.test(hh) && Number(hh) >= 1 && Number(hh) <= 12;
const isValidMM = (mm) => /^\d{1,2}$/.test(mm) && Number(mm) >= 0 && Number(mm) <= 59;

export function ScheduleBulkModal({ open, onClose, onCompleted, defaultMonth }) {
  const { addToast } = useToast();

  // 좌측 폼 상태
  const [selectedType, setSelectedType] = useState(null);
  const [typeModal, setTypeModal] = useState(false);

  const [branchModal, setBranchModal] = useState(false);
  const [employeeModal, setEmployeeModal] = useState(false);

  const [branches, setBranches] = useState([]);
  const [branchIds, setBranchIds] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeIds, setEmployeeIds] = useState([]);
  const [empKeyword, setEmpKeyword] = useState('');

  // 타입 옵션
  const [workTypes, setWorkTypes] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // 시간(12h UI)
  const [sHH, setSHH] = useState('09');
  const [sMM, setSMM] = useState('00');
  const [sAP, setSAP] = useState('AM');
  const [eHH, setEHH] = useState('06');
  const [eMM, setEMM] = useState('00');
  const [eAP, setEAP] = useState('PM');

  const [bSHH, setBSHH] = useState('12');
  const [bSMM, setBSMM] = useState('30');
  const [bSAP, setBSAP] = useState('PM');
  const [bEHH, setBEHH] = useState('01');
  const [bEMM, setBEMM] = useState('30');
  const [bEAP, setBEAP] = useState('PM');

  // 우측 캘린더 상태
  const [calFrom, setCalFrom] = useState(defaultMonth || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`);
  const [selectedDates, setSelectedDates] = useState(new Set());

  // 옵션 로딩
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [branchList, wt, lt] = await Promise.all([
          fetchBranchOptions(''),
          fetchWorkTypeOptions().catch(() => []),
          fetchLeaveTypeOptions().catch(() => []),
        ]);
        setBranches(branchList || []);
        setWorkTypes(wt || []);
        setLeaveTypes(lt || []);
      } catch {
        addToast('옵션 로딩 실패', { color: 'error' });
      }
    })();
  }, [open, addToast]);

  // 지점 변경/검색 시 직원 옵션 로딩
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (!branchIds.length) {
          setEmployees([]);
          setEmployeeIds([]);
          return;
        }
        const list = await fetchEmployeeOptions({
          branchIds: branchIds.length ? branchIds : undefined,
          keyword: empKeyword || undefined,
          all: false,
        });
        setEmployees(list || []);
        setEmployeeIds(prev => prev.filter(id => (list||[]).some(e => Number(e.id) === Number(id))));
      } catch {
        addToast('직원 옵션 로딩 실패', { color: 'error' });
      }
    })();
  }, [open, branchIds, empKeyword, addToast]);

  // 캘린더 데이터
  const cells = useMemo(() => daysMatrix(calFrom), [calFrom]);
  const baseMonth = useMemo(() => parseYMDParts(calFrom).m, [calFrom]);

  // 액션들
  const prevMonth = () => {
    const { y, m } = parseYMDParts(calFrom);
    const ny = m === 0 ? y - 1 : y;
    const nm = m === 0 ? 12 : m;
    setCalFrom(`${ny}-${String(nm).padStart(2,'0')}-01`);
  };
  const nextMonth = () => {
    const { y, m } = parseYMDParts(calFrom);
    const ny = m === 11 ? y + 1 : y;
    const nm = (m + 2) % 13 || 1;
    setCalFrom(`${ny}-${String(nm).padStart(2,'0')}-01`);
  };
  const toggleDate = (ymd) => {
    setSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(ymd)) next.delete(ymd);
      else next.add(ymd);
      return next;
    });
  };

  const isLeave = selectedType?.kind === 'LEAVE';
  const isWork  = selectedType?.kind === 'WORK';
  const timeDisabled = !isWork;

  const allValid =
    !!selectedType &&
    branchIds.length > 0 &&
    employeeIds.length > 0 &&
    selectedDates.size > 0 &&
    (isLeave || (isValidHH(sHH) && isValidMM(sMM) && isValidHH(eHH) && isValidMM(eMM)));

  const submit = async () => {
    if (!allValid) {
      addToast('종류/지점/직원/날짜를 모두 선택해 주세요.', { color: 'warning' });
      return;
    }

    if (isWork) {
      const startHH = hhTo24(sHH, sAP);
      const endHH   = hhTo24(eHH, eAP);
      if (startHH === endHH && sMM === eMM) {
        addToast('시작/종료 시간이 동일합니다.', { color: 'error' });
        return;
      }
    }

    const startHH = hhTo24(sHH, sAP);
    const endHH   = hhTo24(eHH, eAP);
    const brkSHH  = hhTo24(bSHH, bSAP);
    const brkEHH  = hhTo24(bEHH, bEAP);

    const asHHMM = (hh, mm) => `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;

    const pushIf = (obj, key, val) => { if (val !== undefined && val !== null && val !== '') obj[key] = val; };

    const items = [];
    const dates = Array.from(selectedDates);
    branchIds.forEach(bid => {
      employeeIds.forEach(eid => {
        dates.forEach(ymd => {
          const item = {};
          pushIf(item, 'branchId', Number(bid));
          pushIf(item, 'employeeId', Number(eid));
          pushIf(item, 'date', ymd);
          pushIf(item, 'category', isWork ? 'WORK' : 'LEAVE');

          if (isWork) {
            pushIf(item, 'workTypeId', Number(selectedType.id));
            pushIf(item, 'registeredClockInTime',   asHHMM(startHH, sMM));
            pushIf(item, 'registeredBreakStartTime',asHHMM(brkSHH, bSMM));
            pushIf(item, 'registeredBreakEndTime',  asHHMM(brkEHH, bEMM));
            pushIf(item, 'registeredClockOutTime',  asHHMM(endHH, eMM));
          } else {
            pushIf(item, 'leaveTypeId', Number(selectedType.id));
          }

          items.push(item);
        });
      });
    });

    if (items.length === 0) {
      addToast('등록할 항목이 없습니다.', { color: 'warning' });
      return;
    }

    try {
      await massCreateSchedules({ items });
      addToast(`스케줄 ${items.length}건 등록 완료`, { color: 'success' });
      onCompleted?.();
    } catch (e) {
      console.error('massCreate payload error', e?.response || e);
      const msg = e?.response?.data?.message || '등록 중 오류가 발생했습니다.';
      addToast(msg, { color: 'error' });
    }
  };

  if (!open) return null;

  // 직원 모달: 현재 목록(검색 결과)에 포함된 선택 수
  const employeeIdsOnList = useMemo(
    () => employeeIds.filter(id => employees.some(e => Number(e.id) === Number(id))),
    [employeeIds, employees]
  );
  const allOnListChecked = employees.length > 0 && employeeIdsOnList.length === employees.length;

  /* ===== 토글 핸들러 ===== */
  const toggleTypeWork = (w) => {
    const active = selectedType?.kind==='WORK' && Number(selectedType?.id)===Number(w.id);
    setSelectedType(active ? null : { kind: 'WORK', id: w.id, name: w.name });
  };
  const toggleTypeLeave = (l) => {
    const active = selectedType?.kind==='LEAVE' && Number(selectedType?.id)===Number(l.id);
    setSelectedType(active ? null : { kind: 'LEAVE', id: l.id, name: l.name });
  };
  const toggleBranch = (bId) => {
    setBranchIds(prev => prev.includes(Number(bId))
      ? prev.filter(v => v !== Number(bId))
      : [...prev, Number(bId)]
    );
  };
  const toggleEmployee = (eId) => {
    setEmployeeIds(prev => prev.includes(Number(eId))
      ? prev.filter(v => v !== Number(eId))
      : [...prev, Number(eId)]
    );
  };
  const toggleAllEmployees = () => {
    if (allOnListChecked) {
      setEmployeeIds(prev => prev.filter(id => !employees.some(e => Number(e.id) === Number(id))));
    } else {
      const idsOnList = employees.map(e => Number(e.id));
      setEmployeeIds(prev => Array.from(new Set([...prev, ...idsOnList])));
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Shell onClick={(e)=>e.stopPropagation()}>
        <Header>근무일정 추가하기</Header>

        <Body>
          {/* -------- 왼쪽 폼 -------- */}
          <Left>
            <Field>
              <Label>종류</Label>
              <InputLike onClick={()=>setTypeModal(true)}>
                {selectedType ? (
                  <ValueText>
                    {selectedType.name} <span style={{color:'#9ca3af'}}>({selectedType.kind === 'WORK' ? '근무' : '휴가'})</span>
                  </ValueText>
                ) : (
                  <Placeholder>근무/휴가 종류 선택</Placeholder>
                )}
                <Caret><Icon path={mdiChevronDown} size={0.9}/></Caret>
              </InputLike>
            </Field>

            <Field>
              <Label>지점</Label>
              <InputLike onClick={()=>setBranchModal(true)}>
                {branchIds.length ? <ValueText>{branchIds.length}개 선택</ValueText> : <Placeholder>검색 및 선택</Placeholder>}
                <Caret><Icon path={mdiChevronDown} size={0.9}/></Caret>
              </InputLike>
            </Field>

            <Field>
              <Label>직원</Label>
              <InputLike onClick={()=>setEmployeeModal(true)} disabled={!branchIds.length}>
                {employeeIds.length ? <ValueText>{employeeIds.length}명 선택</ValueText> : <Placeholder>검색 및 선택</Placeholder>}
                <Caret><Icon path={mdiChevronDown} size={0.9}/></Caret>
              </InputLike>
            </Field>

            <Field>
              <Label>시간</Label>
              <div>
                <TimeRow>
                  <TimeBox value={sHH} onChange={(e)=>setSHH(e.target.value)} maxLength={2} disabled={timeDisabled} />
                <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                  <TimeBox value={sMM} onChange={(e)=>setSMM(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <AmPm value={sAP} onChange={(e)=>setSAP(e.target.value)} disabled={timeDisabled}>
                    <option>AM</option><option>PM</option>
                  </AmPm>
                </TimeRow>
                <div style={{ height: 8 }} />
                <div style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0' }}>~</div>
                <div style={{ height: 8 }} />
                <TimeRow>
                  <TimeBox value={eHH} onChange={(e)=>setEHH(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                  <TimeBox value={eMM} onChange={(e)=>setEMM(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <AmPm value={eAP} onChange={(e)=>setEAP(e.target.value)} disabled={timeDisabled}>
                    <option>AM</option><option>PM</option>
                  </AmPm>
                </TimeRow>
              </div>
            </Field>

            <Field>
              <Label>휴게시간</Label>
              <div>
                <TimeRow>
                  <TimeBox value={bSHH} onChange={(e)=>setBSHH(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                  <TimeBox value={bSMM} onChange={(e)=>setBSMM(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <AmPm value={bSAP} onChange={(e)=>setBSAP(e.target.value)} disabled={timeDisabled}>
                    <option>AM</option><option>PM</option>
                  </AmPm>
                </TimeRow>
                <div style={{ height: 8 }} />
                <div style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0' }}>~</div>
                <div style={{ height: 8 }} />
                <TimeRow>
                  <TimeBox value={bEHH} onChange={(e)=>setBEHH(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                  <TimeBox value={bEMM} onChange={(e)=>setBEMM(e.target.value)} maxLength={2} disabled={timeDisabled} />
                  <AmPm value={bEAP} onChange={(e)=>setBEAP(e.target.value)} disabled={timeDisabled}>
                    <option>AM</option><option>PM</option>
                  </AmPm>
                </TimeRow>
              </div>
            </Field>
          </Left>

          {/* -------- 우측 캘린더 -------- */}
          <Right>
            <CalendarCard>
              <CalHead>
                <IconBtn onClick={prevMonth}><Icon path={mdiChevronLeft} size={0.9}/></IconBtn>
                <CalTitle>{monthLabel(calFrom)}</CalTitle>
                <IconBtn onClick={nextMonth}><Icon path={mdiChevronRight} size={0.9}/></IconBtn>
              </CalHead>
              <DowRow>{DOW_KR.map((d) => <Dow key={d}>{d}</Dow>)}</DowRow>
              <CalGrid>
                {cells.map((d, i) => {
                  const ymd = toYMD(d);
                  const other = d.getMonth() !== baseMonth;
                  const active = selectedDates.has(ymd);
                  return (
                    <Day key={`d-${i}`} $other={other} $active={active} onClick={() => toggleDate(ymd)}>
                      <DayNum $other={other}>{d.getDate()}</DayNum>
                    </Day>
                  );
                })}
              </CalGrid>
            </CalendarCard>

            <div style={{ marginTop: 'auto' }} />
            <Footer>
              <Cancel onClick={onClose}>취소</Cancel>
              <Confirm onClick={submit} disabled={!allValid}>확정</Confirm>
            </Footer>
          </Right>
        </Body>
      </Shell>

      {/* ===== 종류 선택 모달 ===== */}
      {typeModal && (
        <SmallOverlay onClick={(e)=>{ e.stopPropagation(); setTypeModal(false); }}>
          <SmallCard onClick={(e)=>e.stopPropagation()}>
            <SmallHead>종류 선택</SmallHead>

            <SmallTopBar>
              <Chips>
                {selectedType ? (
                  <Chip>
                    {selectedType.name}
                    <ChipClose aria-label="선택 해제" onClick={() => setSelectedType(null)}>
                      <Icon path={mdiClose} size={0.62}/>
                    </ChipClose>
                  </Chip>
                ) : <Others>선택된 항목이 없습니다</Others>}
              </Chips>
              <div />
            </SmallTopBar>

            <SmallBody>
              <SectionHeader>근무 종류</SectionHeader>
              {(workTypes || []).map(w => {
                const active = selectedType?.kind==='WORK' && Number(selectedType?.id)===Number(w.id);
                return (
                  <ListRow key={`w-${w.id}`} $active={active} onClick={() => toggleTypeWork(w)}>
                    <span className="name">{w.name}</span>
                    <PurpleCheck
                      checked={!!active}
                      onClick={(e)=>e.stopPropagation()}
                      onChange={() => toggleTypeWork(w)}
                    />
                  </ListRow>
                );
              })}
              {(!workTypes || workTypes.length===0) && (
                <div style={{ padding: 14, color: '#6b7280', fontSize: 13 }}>근무 종류가 없습니다.</div>
              )}

              <SectionSpacer />

              <SectionHeader>휴가 종류</SectionHeader>
              {(leaveTypes || []).map(l => {
                const active = selectedType?.kind==='LEAVE' && Number(selectedType?.id)===Number(l.id);
                return (
                  <ListRow key={`l-${l.id}`} $active={active} onClick={() => toggleTypeLeave(l)}>
                    <span className="name">{l.name}</span>
                    <PurpleCheck
                      checked={!!active}
                      onClick={(e)=>e.stopPropagation()}
                      onChange={() => toggleTypeLeave(l)}
                    />
                  </ListRow>
                );
              })}
              {(!leaveTypes || leaveTypes.length===0) && (
                <div style={{ padding: 14, color: '#6b7280', fontSize: 13 }}>휴가 종류가 없습니다.</div>
              )}
            </SmallBody>

            <SmallFoot>
              <Cancel onClick={()=>setTypeModal(false)}>취소</Cancel>
              <Confirm onClick={()=>setTypeModal(false)}>선택</Confirm>
            </SmallFoot>
          </SmallCard>
        </SmallOverlay>
      )}

      {/* ===== 지점 선택 모달 — 타입 모달과 동일한 레이아웃 적용 ===== */}
      {branchModal && (
        <SmallOverlay onClick={(e)=>{ e.stopPropagation(); setBranchModal(false); }}>
          <SmallCard onClick={(e)=>e.stopPropagation()}>
            <SmallHead>지점 선택</SmallHead>

            <SmallTopBar>
              <Chips>
                {branchIds.length === 0 && <Others>선택된 지점이 없습니다</Others>}
                {branchIds.map(id => {
                  const b = (branches || []).find(x => Number(x.id) === Number(id));
                  const name = b?.name || id;
                  return (
                    <Chip key={`chip-b-${id}`}>
                      {name}
                      <ChipClose aria-label={`${name} 선택 해제`} onClick={() => setBranchIds(prev => prev.filter(v => Number(v) !== Number(id)))}>
                        <Icon path={mdiClose} size={0.62}/>
                      </ChipClose>
                    </Chip>
                  );
                })}
              </Chips>
              <div />
            </SmallTopBar>

            <SmallBody>
              <SectionHeader>지점 목록</SectionHeader>
              {(branches || []).map(b => {
                const checked = branchIds.includes(Number(b.id));
                return (
                  <ListRow key={`b-${b.id}`} $active={checked} onClick={() => toggleBranch(b.id)}>
                    <span className="name">{b.name}</span>
                    <PurpleCheck
                      checked={checked}
                      onClick={(e)=>e.stopPropagation()}
                      onChange={() => toggleBranch(b.id)}
                    />
                  </ListRow>
                );
              })}
              {(!branches || branches.length === 0) && (
                <div style={{ padding: 14, color: '#6b7280', fontSize: 13 }}>지점 옵션이 없습니다.</div>
              )}
            </SmallBody>

            <SmallFoot>
              <Cancel onClick={()=>setBranchModal(false)}>취소</Cancel>
              <Confirm onClick={()=>setBranchModal(false)}>등록</Confirm>
            </SmallFoot>
          </SmallCard>
        </SmallOverlay>
      )}

      {/* ===== 직원 선택 모달 — 타입 모달과 동일한 레이아웃 적용 ===== */}
      {employeeModal && (
        <SmallOverlay onClick={(e)=>{ e.stopPropagation(); setEmployeeModal(false); }}>
          <SmallCard onClick={(e)=>e.stopPropagation()}>
            <SmallHead>직원 선택</SmallHead>

            <SmallTopBar>
              <Chips>
                {employeeIds.length === 0 && <Others>선택된 직원이 없습니다</Others>}
                {employeeIds.slice(0, 4).map(id => {
                  const e = (employees || []).find(x => Number(x.id) === Number(id));
                  const name = e?.name ? (e.branchName ? `${e.name} - ${e.branchName}` : e.name) : id;
                  return (
                    <Chip key={`chip-e-${id}`}>
                      {name}
                      <ChipClose aria-label={`${name} 선택 해제`} onClick={() => setEmployeeIds(prev => prev.filter(v => Number(v) !== Number(id)))}>
                        <Icon path={mdiClose} size={0.62}/>
                      </ChipClose>
                    </Chip>
                  );
                })}
                {employeeIds.length > 4 && <Others>그 외 {employeeIds.length - 4}명</Others>}
              </Chips>
              <div />
            </SmallTopBar>

            <SmallBody>
              <SectionHeader>직원 목록</SectionHeader>

              <div style={{ padding: '10px 14px' }}>
                <input
                  placeholder="검색어"
                  value={empKeyword}
                  onChange={(e)=>setEmpKeyword(e.target.value)}
                  style={{ width:'100%', height:36, border:'1px solid #e5e7eb', borderRadius:8, padding:'0 10px' }}
                />
              </div>

              {employees.length > 0 && (
                <ListRow key="all" $active={allOnListChecked} onClick={toggleAllEmployees}>
                  <span className="name">전체선택</span>
                  <PurpleCheck
                    checked={allOnListChecked}
                    onClick={(e)=>e.stopPropagation()}
                    onChange={toggleAllEmployees}
                  />
                </ListRow>
              )}

              {(employees || []).map(e => {
                const checked = employeeIds.includes(Number(e.id));
                return (
                  <ListRow key={`e-${e.id}`} $active={checked} onClick={() => toggleEmployee(e.id)}>
                    <span className="name">
                      {e.name}{e.branchName ? ` - ${e.branchName}` : ''}{e.employeeNumber ? ` (${e.employeeNumber})` : ''}
                    </span>
                    <PurpleCheck
                      checked={checked}
                      onClick={(e)=>e.stopPropagation()}
                      onChange={() => toggleEmployee(e.id)}
                    />
                  </ListRow>
                );
              })}
              {branchIds.length > 0 && (!employees || employees.length === 0) && (
                <div style={{ padding: 14, color: '#6b7280', fontSize: 13 }}>선택 지점 소속 직원이 없습니다.</div>
              )}
            </SmallBody>

            <SmallFoot>
              <Cancel onClick={()=>setEmployeeModal(false)}>취소</Cancel>
              <Confirm onClick={()=>setEmployeeModal(false)}>등록</Confirm>
            </SmallFoot>
          </SmallCard>
        </SmallOverlay>
      )}
    </Overlay>
  );
}
