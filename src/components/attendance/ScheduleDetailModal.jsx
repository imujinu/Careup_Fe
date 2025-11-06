// src/components/attendance/ScheduleDetailModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { useToast } from '../common/Toast';
import { getScheduleDetail, updateSchedule, upsertAttendanceEvent, deleteAttendanceEvent } from '../../service/scheduleService';

/* ===== 공용 스타일 ===== */
const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1200;
  display: flex; align-items: center; justify-content: center;
  background: rgba(17,24,39,0.5);
`;
const Shell = styled.div`
  width: min(920px, 96vw);
  max-height: min(820px, 94vh);
  background: #fff; border-radius: 16px;
  display: grid; grid-template-rows: auto 1fr auto;
  box-shadow: 0 12px 36px rgba(0,0,0,0.25);
  overflow: hidden;
`;
const Header = styled.div`
  padding: 18px 20px; border-bottom: 1px solid #e5e7eb;
  display:flex; align-items:center; justify-content:space-between; gap: 12px;
`;
const TitleWrap = styled.div`display:flex; flex-direction:column; gap: 8px; min-width:0;`;
const TitleRow = styled.div`display:flex; align-items:center; gap:10px; flex-wrap: wrap;`;
const Title = styled.div`font-weight:700; font-size:18px; color:#111827;`;
const SubInfo = styled.div`font-size:12px; color:#6b7280; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;`;
const CloseBtn = styled.button`
  width:34px;height:34px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;
  display:inline-grid;place-items:center;cursor:pointer;
`;

const Body = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 0; min-height: 0;`;
const Col = styled.div`padding: 16px; overflow: auto; border-right: ${(p)=>p.$split ? '1px solid #e5e7eb' : 'none'};`;
const Footer = styled.div`
  padding: 16px 20px;
  display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #e5e7eb;
`;
const Button = styled.button`
  height: 40px; padding: 0 16px; border-radius: 10px; font-size: 14px; cursor: pointer; border: 1px solid transparent;
`;
const Cancel = styled(Button)`background: #efefef; color: #6b7280; border-color: #e5e7eb;`;
const Confirm = styled(Button)`background: #7c3aed; color: #fff; &:disabled { opacity:.6; cursor:not-allowed; }`;
const Ghost = styled(Button)`background:#fff; color:#374151; border-color:#e5e7eb;`;

/* 섹션/필드 */
const SectionTitle = styled.div`
  font-weight:800; font-size:14px; color:#5b21b6; letter-spacing:.02em; text-transform:uppercase; margin:8px 0 12px;
`;
const Field = styled.div`display:grid; grid-template-columns: 120px 1fr; gap: 12px; align-items:center; margin-bottom:12px;`;
const Label = styled.div`font-size: 12px; color:#6b7280;`;
const Read = styled.div`font-size:14px; color:#111827;`;

/* 입력형 */
const InputLike = styled.input`
  height: 40px; padding: 0 12px; width: 100%;
  border: 1px solid #e5e7eb; background: #fff; border-radius: 8px;
  font-size: 14px; color: #374151;
  &:disabled { background:#f9fafb; color:#9ca3af; }
  &:focus { border-color:#6d28d9; box-shadow:0 0 0 3px rgba(109,40,217,0.15); outline:none; }
`;

/* 시간 입력(12h) */
const TimeRow = styled.div`display:grid; grid-template-columns: 64px 16px 64px 96px; gap:8px; align-items:center;`;
const TimeBox = styled.input`
  height: 40px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 10px; font-size: 14px; text-align: center;
  background: ${(p)=>p.disabled ? '#f9fafb' : '#fff'};
  color: ${(p)=>p.disabled ? '#9ca3af' : '#111827'};
  &:not([disabled]):focus { border-color:#6d28d9; box-shadow:0 0 0 3px rgba(109,40,217,0.15); outline:none; }
`;
const AmPm = styled.select`
  height: 40px; border:1px solid #e5e7eb; border-radius:8px; padding:0 26px 0 12px; font-size:14px; appearance:none;
  background-image:url("data:image/svg+xml;utf8,<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M6 9l6 6 6-6' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>");
  background-repeat:no-repeat; background-position:right 10px center; background-size:16px;
  &:not([disabled]):focus { border-color:#6d28d9; box-shadow:0 0 0 3px rgba(109,40,217,0.15); outline:none; }
`;

/* 뱃지 */
const BadgeRow = styled.div`display:flex; flex-wrap:wrap; gap:6px;`;
const Badge = styled.span`
  display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 10px; border-radius:9999px;
  font-size:12px; font-weight:700; white-space:nowrap;
  background: ${(p)=>p.$bg || '#eef2ff'}; color: ${(p)=>p.$fg || '#3730a3'};
`;

/* 실제 기록 섹션 액션 */
const SectionHead = styled.div`
  display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 0 12px;
`;
const DangerSm = styled.button`
  height: 30px; padding: 0 12px; border-radius: 8px; font-size: 12px; cursor: pointer;
  background:#fee2e2; color:#991b1b; border:1px solid #fecaca;
  &:disabled { opacity:.6; cursor:not-allowed; }
`;

/* ===== 유틸 ===== */
const fmtYMD = (iso) => (iso ? String(iso).slice(0,10) : '');
const to12hParts = (isoOrHHmm) => {
  if (!isoOrHHmm) return { hh:'', mm:'', ap:'AM' };
  let hh='00', mm='00';
  if (/^\d{2}:\d{2}/.test(isoOrHHmm)) {
    [hh, mm] = isoOrHHmm.split(':');
  } else {
    const d = new Date(isoOrHHmm);
    if (Number.isNaN(d.getTime())) return { hh:'', mm:'', ap:'AM' };
    hh = String(d.getHours()).padStart(2,'0');
    mm = String(d.getMinutes()).padStart(2,'0');
  }
  const h24 = Number(hh);
  const ap = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12; if (h12 === 0) h12 = 12;
  return { hh: String(h12).padStart(2,'0'), mm, ap };
};
const hhTo24 = (hh, ap) => {
  let h = Number(hh || 0);
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return String(h).padStart(2, '0');
};
const toIsoLocal = (date, hh, mm, ap) => {
  if (!date || !hh) return null;
  const H = hhTo24(hh, ap);
  const M = String(mm || '00').padStart(2, '0');
  return `${date}T${H}:${M}:00`;
};
const getNum = (v) => (v == null ? null : Number(v));

/* ===== 팔레트/상태 ===== */
const tone = {
  violet: { bg:'#ede9fe', fg:'#4c1d95' },
  green:  { bg:'#dcfce7', fg:'#166534' },
  red:    { bg:'#fee2e2', fg:'#991b1b' },
  amber:  { bg:'#fef3c7', fg:'#92400e' },
  gray:   { bg:'#f3f4f6', fg:'#374151' },
  blue:   { bg:'#dbeafe', fg:'#1e40af' },
};
const STATUS_COLORS = {
  PLANNED:         tone.blue,
  LATE:            tone.amber,
  CLOCKED_IN:      tone.green,
  ON_BREAK:        tone.green,
  EARLY_LEAVE:     tone.amber,
  CLOCKED_OUT:     tone.green,
  OVERTIME:        tone.amber,
  MISSED_CHECKOUT: tone.amber,
  LEAVE:           tone.violet,
  ABSENT:          tone.red,
};
const STATUS_LABELS_KO = {
  PLANNED:         '예정',
  LATE:            '지각',
  CLOCKED_IN:      '근무중',
  ON_BREAK:        '휴게중',
  EARLY_LEAVE:     '조퇴',
  CLOCKED_OUT:     '근무완료',
  OVERTIME:        '초과근무',
  MISSED_CHECKOUT: '퇴근누락',
  LEAVE:           '휴가',
  ABSENT:          '결근',
};
const pickStatus = (d) => String(d?.status ?? d?.attendanceStatus ?? '').toUpperCase();
const pickCategory = (d) => String(d?.category ?? d?.scheduleType ?? '').toUpperCase();

/* ===== 지각 보조 표기 ===== */
const LATE_THRESHOLD_MIN = 1;
const toMs = (iso) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
};
const wasLate = (d) => {
  if (!d) return false;
  const st = pickStatus(d);
  const cat = pickCategory(d);
  if (st === 'LEAVE' || cat === 'LEAVE') return false;

  const regIn = d?.registeredClockIn || d?.registeredStartAt || d?.startAt;
  const actIn = d?.actualClockIn || d?.clockInAt || d?.actualStartAt;

  const a = toMs(regIn);
  const b = toMs(actIn);
  if (a == null || b == null) return false;

  return b >= a + LATE_THRESHOLD_MIN * 60 * 1000;
};

function buildSingleBadge(detail) {
  const st = pickStatus(detail);
  const cat = pickCategory(detail);

  let color = STATUS_COLORS.PLANNED;
  let label = STATUS_LABELS_KO.PLANNED;

  if (st && STATUS_COLORS[st]) {
    color = STATUS_COLORS[st];
    label = STATUS_LABELS_KO[st] || st;
  } else if (cat === 'LEAVE') {
    color = STATUS_COLORS.LEAVE;
    label = STATUS_LABELS_KO.LEAVE;
  }

  let typeName = null;
  if (st === 'LEAVE' || cat === 'LEAVE') typeName = detail?.leaveTypeName || '휴가';
  else if (detail?.workTypeName) typeName = detail.workTypeName;
  if (typeName && !label.includes(typeName)) label = `${label} (${typeName})`;

  if (wasLate(detail) && st !== 'LATE' && st !== 'LEAVE' && st !== 'ABSENT') {
    label = `${label} - 지각`;
  }

  return { text: label, bg: color.bg, fg: color.fg };
}

/* ===== 오버나이트 보정 유틸 ===== */
const addDaysISO = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + Number(days || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
};
const ensurePairOrder = (fromIso, toIso) => {
  if (!fromIso || !toIso) return { from: fromIso, to: toIso };
  const a = new Date(fromIso).getTime();
  const b = new Date(toIso).getTime();
  if (isNaN(a) || isNaN(b)) return { from: fromIso, to: toIso };
  if (b < a) return { from: fromIso, to: addDaysISO(toIso, 1) };
  return { from: fromIso, to: toIso };
};
const ensureOvernightByPart = (part, inIso, outIso) => {
  if (!inIso || !outIso) return { inIso, outIso };
  const A = new Date(inIso).getTime();
  const B = new Date(outIso).getTime();
  if (isNaN(A) || isNaN(B)) return { inIso, outIso };
  if (part === 'TAIL') {
    if (A > B) return { inIso: addDaysISO(inIso, -1), outIso };
    return { inIso, outIso };
  }
  if (B < A) return { inIso, outIso: addDaysISO(outIso, 1) };
  return { inIso, outIso };
};
const normalizeId = (val) => {
  const s = String(val ?? '');
  return s.includes(':') ? s.split(':')[0] : s;
};

/* ===== 캘린더 즉시 동기화용 패치 생성 ===== */
const buildOverridePatchFromDetail = (d) => {
  if (!d) return {};
  const status = pickStatus(d) || undefined;
  return {
    attendanceStatus: status,
    status,
    missedCheckout: d?.missedCheckout === true,
    actualStartAt: d?.actualStartAt || d?.actualClockIn || d?.clockInAt || null,
    actualClockIn: d?.actualClockIn || d?.actualStartAt || d?.clockInAt || null,
    actualBreakStart: d?.actualBreakStart || d?.breakStartAt || null,
    actualBreakEnd: d?.actualBreakEnd || d?.breakEndAt || null,
    actualEndAt: d?.actualEndAt || d?.actualClockOut || d?.clockOutAt || null,
    actualClockOut: d?.actualClockOut || d?.actualEndAt || d?.clockOutAt || null,
  };
};

export function ScheduleDetailModal({ open, scheduleId, baseDate, part, onClose, onSaved, onDeleted, onPatched }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState(false);

  const scheduleNumId = useMemo(() => normalizeId(scheduleId), [scheduleId]);

  const statusCode = useMemo(() => pickStatus(detail), [detail]);
  const isLeave = useMemo(() => {
    const cat = pickCategory(detail);
    return statusCode === 'LEAVE' || cat === 'LEAVE' || !!detail?.leaveTypeId;
  }, [statusCode, detail]);

  const hasActualEvent = useMemo(() => {
    const d = detail || {};
    return Boolean(
      d.clockInAt || d.breakStartAt || d.breakEndAt || d.clockOutAt ||
      d.actualClockIn || d.actualBreakStart || d.actualBreakEnd || d.actualClockOut ||
      d.totalWorkMinutes || d.totalBreakMinutes || d.missedCheckout === true
    );
  }, [detail]);

  const [dDate, setDDate] = useState('');
  const [dSHH, setDSHH] = useState(''); const [dSMM, setDSMM] = useState(''); const [dSAP, setDSAP] = useState('AM');
  const [dB1HH, setDB1HH] = useState(''); const [dB1MM, setDB1MM] = useState(''); const [dB1AP, setDB1AP] = useState('PM');
  const [dB2HH, setDB2HH] = useState(''); const [dB2MM, setDB2MM] = useState(''); const [dB2AP, setDB2AP] = useState('PM');
  const [dEHH, setDEHH] = useState(''); const [dEMM, setDEMM] = useState(''); const [dEAP, setDEAP] = useState('PM');

  const [aSHH, setASHH] = useState(''); const [aSMM, setASMM] = useState(''); const [aSAP, setASAP] = useState('AM');
  const [aB1HH, setAB1HH] = useState(''); const [aB1MM, setAB1MM] = useState(''); const [aB1AP, setAB1AP] = useState('PM');
  const [aB2HH, setAB2HH] = useState(''); const [aB2MM, setAB2MM] = useState(''); const [aB2AP, setAB2AP] = useState('PM');
  const [aEHH, setAEHH] = useState(''); const [aEMM, setAEMM] = useState(''); const [aEAP, setAEAP] = useState('PM');

  useEffect(() => {
    if (!open || !scheduleNumId) return;
    (async () => {
      try {
        const d = await getScheduleDetail(scheduleNumId);
        setDetail(d || null);

        const base = fmtYMD(d?.registeredDate || d?.date || d?.startAt);
        setDDate(base);

        const rIn  = to12hParts(d?.registeredClockIn || d?.registeredClockInTime || d?.registeredStartAt || d?.startAt);
        const rB1  = to12hParts(d?.registeredBreakStart || d?.registeredBreakStartTime);
        const rB2  = to12hParts(d?.registeredBreakEnd || d?.registeredBreakEndTime);
        const rOut = to12hParts(d?.registeredClockOut || d?.registeredClockOutTime || d?.registeredEndAt || d?.endAt);
        setDSHH(rIn.hh); setDSMM(rIn.mm); setDSAP(rIn.ap);
        setDB1HH(rB1.hh); setDB1MM(rB1.mm); setDB1AP(rB1.ap);
        setDB2HH(rB2.hh); setDB2MM(rB2.mm); setDB2AP(rB2.ap);
        setDEHH(rOut.hh); setDEMM(rOut.mm); setDEAP(rOut.ap);

        const aIn  = d?.actualClockIn  || d?.actualStartAt  ? to12hParts(d.actualClockIn  || d.actualStartAt)  : {hh:'',mm:'',ap:'AM'};
        const aB1  = d?.actualBreakStart || d?.actualBreakStartAt ? to12hParts(d.actualBreakStart || d.actualBreakStartAt) : {hh:'',mm:'',ap:'PM'};
        const aB2  = d?.actualBreakEnd   || d?.actualBreakEndAt   ? to12hParts(d.actualBreakEnd   || d.actualBreakEndAt)   : {hh:'',mm:'',ap:'PM'};
        const aOut = d?.actualClockOut || d?.actualEndAt ? to12hParts(d.actualClockOut || d.actualEndAt) : {hh:'',mm:'',ap:'PM'};
        setASHH(aIn.hh); setASMM(aIn.mm); setASAP(aIn.ap);
        setAB1HH(aB1.hh); setAB1MM(aB1.mm); setAB1AP(aB1.ap);
        setAB2HH(aB2.hh); setAB2MM(aB2.mm); setAB2AP(aB2.ap);
        setAEHH(aOut.hh); setAEMM(aOut.mm); setAEAP(aOut.ap);
      } catch {
        setDetail(null);
      }
    })();
  }, [open, scheduleNumId]);

  const canSave = useMemo(() => !!detail && !!edit, [detail, edit]);

  const buildPlanPayload = () => {
    const d = detail || {};
    const date = fmtYMD(d.registeredDate || d.date || d.startAt);
    const branchId = getNum(d.branchId ?? d.branch?.id);

    const keep = (iso) => (iso ? String(iso) : undefined);
    const clockInOld   = d.registeredClockIn  || d.registeredStartAt || d.startAt || null;
    const breakStartOld= d.registeredBreakStart || null;
    const breakEndOld  = d.registeredBreakEnd   || null;
    const clockOutOld  = d.registeredClockOut || d.registeredEndAt || d.endAt || null;

    const makeOrKeep = (hh, mm, ap, oldIso) => {
      if (/^\d{1,2}$/.test(String(hh ?? '')) && /^\d{1,2}$/.test(String(mm ?? ''))) {
        return toIsoLocal(date, hh, mm, ap);
      }
      return keep(oldIso);
    };

    const payload = {
      branchId,
      registeredDate: date,
      attendanceTemplateId: getNum(d.attendanceTemplateId) ?? undefined,
    };

    const isLeaveLocal = (pickCategory(d) === 'LEAVE') || !!d?.leaveTypeId;

    if (isLeaveLocal) {
      payload.leaveTypeId = getNum(d.leaveTypeId);
      payload.workTypeId = undefined;
      payload.registeredClockIn = undefined;
      payload.registeredBreakStart = undefined;
      payload.registeredBreakEnd = undefined;
      payload.registeredClockOut = undefined;
    } else {
      payload.workTypeId = getNum(d.workTypeId);
      payload.leaveTypeId = undefined;

      payload.registeredClockIn    = makeOrKeep(dSHH, dSMM, dSAP, clockInOld);
      payload.registeredBreakStart = makeOrKeep(dB1HH, dB1MM, dB1AP, breakStartOld);
      payload.registeredBreakEnd   = makeOrKeep(dB2HH, dB2MM, dB2AP, breakEndOld);
      payload.registeredClockOut   = makeOrKeep(dEHH, dEMM, dEAP, clockOutOld);

      if (!payload.registeredClockIn || !payload.registeredClockOut) {
        return { error: '근무 스케줄은 출근·퇴근 시간이 모두 필요합니다. 값을 입력하거나 기존 값 유지 상태로 저장해 주세요.' };
      }
    }

    if (!payload.branchId || !payload.registeredDate) return { error: '지점 또는 날짜 정보가 없습니다.' };

    const hasWork = !!payload.workTypeId;
    const hasLeave = !!payload.leaveTypeId;
    if (hasWork && hasLeave) return { error: 'workTypeId와 leaveTypeId는 동시에 보낼 수 없습니다.' };
    if (!hasWork && !hasLeave) return { error: '근무 또는 휴가 유형이 존재하지 않습니다.' };

    return { payload };
  };

  const buildEventPayload = () => {
    const eventBase = (baseDate && /^\d{4}-\d{2}-\d{2}$/.test(baseDate))
      ? baseDate
      : (fmtYMD(detail?.registeredDate || detail?.date || detail?.startAt));

    const out = { eventDate: eventBase, part: part || undefined };

    const curIn  = detail?.clockInAt    || detail?.actualClockIn    || null;
    const curBS  = detail?.breakStartAt || detail?.actualBreakStart || null;
    const curBE  = detail?.breakEndAt   || detail?.actualBreakEnd   || null;
    const curOut = detail?.clockOutAt   || detail?.actualClockOut   || null;

    const inEdited  = /^\d{1,2}$/.test(String(aSHH ?? '')) && /^\d{1,2}$/.test(String(aSMM ?? ''));
    const bsEdited  = /^\d{1,2}$/.test(String(aB1HH ?? '')) && /^\d{1,2}$/.test(String(aB1MM ?? ''));
    const beEdited  = /^\d{1,2}$/.test(String(aB2HH ?? '')) && /^\d{1,2}$/.test(String(aB2MM ?? ''));
    const outEdited = /^\d{1,2}$/.test(String(aEHH ?? '')) && /^\d{1,2}$/.test(String(aEMM ?? ''));

    const vIn  = inEdited  ? toIsoLocal(eventBase, aSHH, aSMM, aSAP)    : null;
    const vBS  = bsEdited  ? toIsoLocal(eventBase, aB1HH, aB1MM, aB1AP) : null;
    const vBE  = beEdited  ? toIsoLocal(eventBase, aB2HH, aB2MM, aB2AP) : null;
    const vOut = outEdited ? toIsoLocal(eventBase, aEHH, aEMM, aEAP)    : null;

    let touched = false;
    let error = null;

    let nextIn   = inEdited  ? vIn  : curIn;
    let nextOut0 = outEdited ? vOut : curOut;

    if (inEdited && outEdited) {
      const adj = ensureOvernightByPart(part, vIn, vOut);
      const ord = ensurePairOrder(adj.inIso, adj.outIso);
      out.clockInAt  = ord.from;
      out.clockOutAt = ord.to;
      touched = true;
    } else if (inEdited && nextOut0) {
      const adj = ensureOvernightByPart(part, vIn, nextOut0);
      const ord = ensurePairOrder(adj.inIso, adj.outIso);
      out.clockInAt  = ord.from;
      out.clockOutAt = ord.to;
      touched = true;
    } else if (outEdited && nextIn) {
      const adj = ensureOvernightByPart(part, nextIn, vOut);
      const ord = ensurePairOrder(adj.from, adj.to);
      out.clockInAt  = ord.from;
      out.clockOutAt = ord.to;
      touched = true;
    } else {
      if (inEdited && !nextOut0) {
        out.clockInAt = vIn;
        touched = true;
      }
      if (outEdited && !nextIn) {
        out.clockOutAt = vOut;
        touched = true;
      }
    }

    if (!error && (bsEdited || beEdited)) {
      let bsVal = vBS ?? curBS;
      let beVal = vBE ?? curBE;

      if (bsVal && beVal) {
        const inRef = out.clockInAt || nextIn || null;
        if (inRef && part !== 'TAIL') {
          const inMs = new Date(inRef).getTime();
          if (new Date(bsVal).getTime() < inMs) bsVal = addDaysISO(bsVal, 1);
          if (new Date(beVal).getTime() < inMs) beVal = addDaysISO(beVal, 1);
        }
        const brOrd = ensurePairOrder(bsVal, beVal);
        out.breakStartAt = brOrd.from;
        out.breakEndAt   = brOrd.to;
        touched = true;
      } else {
        error = '휴게 시작/종료는 쌍으로 입력(또는 기존값 유지)해야 합니다.';
      }
    }

    const canClearMissed =
      Boolean(out.clockInAt || nextIn) && Boolean(out.clockOutAt || nextOut0);
    if (!error && detail?.missedCheckout === true && canClearMissed) {
      out.clearMissedCheckout = true;
      touched = true;
    }

    return { touched, payload: out, error };
  };

  const closeAfterBadge = (cb) => {
    setTimeout(() => {
      if (typeof cb === 'function') cb();
    }, 120);
  };

  const onSave = async () => {
    if (!detail) return;
    if (!edit) { addToast('수정 버튼을 먼저 눌러주세요.', { color: 'warning' }); return; }

    const { payload: planPayload, error: planErr } = buildPlanPayload();
    const { touched, payload: eventPayload, error: eventErr } = buildEventPayload();

    if (eventErr) { addToast(eventErr, { color: 'error' }); return; }

    try {
      setSaving(true);

      if (touched) {
        await upsertAttendanceEvent(scheduleNumId, eventPayload);
      }

      if (!planErr) {
        try {
          await updateSchedule(scheduleNumId, planPayload);
        } catch (e) {
          console.warn('updateSchedule 실패(무시):', e?.response?.data || e);
          addToast('계획 시간 저장은 건너뛰었습니다.', { color: 'info' });
        }
      } else {
        addToast('계획 값 검증을 통과하지 않아 계획 저장은 생략했습니다.', { color: 'info' });
      }

      const latest = await getScheduleDetail(scheduleNumId);
      setDetail(latest || detail);

      if (onPatched && latest) {
        onPatched(scheduleNumId, buildOverridePatchFromDetail(latest));
      }

      addToast('스케줄이 저장되었습니다.', { color: 'success' });
      setEdit(false);

      closeAfterBadge(() => {
        if (onSaved) onSaved();
      });
    } catch (e) {
      const msg = e?.response?.data?.message || '저장 중 오류가 발생했습니다.';
      addToast(msg, { color: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const onDeleteEvent = async () => {
    if (!scheduleNumId) return;
    const ok = window.confirm('해당 일자의 근무 기록(출근·휴게·퇴근)을 모두 삭제하시겠습니까?\n계획 스케줄은 유지됩니다.');
    if (!ok) return;
    try {
      setDeleting(true);
      await deleteAttendanceEvent(scheduleNumId);
      addToast('근무 기록을 삭제했습니다.', { color: 'success' });

      const d = await getScheduleDetail(scheduleNumId);
      setDetail(d || null);

      setASHH(''); setASMM(''); setASAP('AM');
      setAB1HH(''); setAB1MM(''); setAB1AP('PM');
      setAB2HH(''); setAB2MM(''); setAB2AP('PM');
      setAEHH(''); setAEMM(''); setAEAP('PM');

      if (onPatched) {
        onPatched(scheduleNumId, {
          attendanceStatus: 'PLANNED',
          status: 'PLANNED',
          missedCheckout: false,
          actualStartAt: null,
          actualClockIn: null,
          actualBreakStart: null,
          actualBreakEnd: null,
          actualEndAt: null,
          actualClockOut: null,
        });
      }

      closeAfterBadge(() => {
        if (onDeleted) onDeleted();
        else if (onSaved) onSaved();
      });
    } catch (e) {
      const msg = e?.response?.data?.message || '근무 기록 삭제 중 오류가 발생했습니다.';
      addToast(msg, { color: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  const badge = buildSingleBadge(detail || {});

  return (
    <Overlay onClick={onClose}>
      <Shell onClick={(e)=>e.stopPropagation()}>
        <Header>
          <TitleWrap>
            <TitleRow>
              <Title>근무일정 상세</Title>
              <BadgeRow>
                <Badge $bg={badge.bg} $fg={badge.fg}>{badge.text}</Badge>
              </BadgeRow>
            </TitleRow>
            <SubInfo>
              {(detail?.employeeName || '-')}{detail?.branchName ? ` · ${detail.branchName}` : ''}{fmtYMD(detail?.registeredDate || detail?.date || detail?.startAt) ? ` · ${fmtYMD(detail?.registeredDate || detail?.date || detail?.startAt)}` : ''}
            </SubInfo>
          </TitleWrap>
          <CloseBtn onClick={onClose} aria-label="닫기">
            <Icon path={mdiClose} size={0.9}/>
          </CloseBtn>
        </Header>

        <Body>
          <Col $split>
            <SectionTitle>계획(등록 당시)</SectionTitle>

            <Field>
              <Label>종류</Label>
              <Read>
                {isLeave ? (detail?.leaveTypeName || '휴가') : (detail?.workTypeName || '근무')}
              </Read>
            </Field>

            <Field>
              <Label>날짜</Label>
              <InputLike type="date" value={fmtYMD(detail?.registeredDate || detail?.date || detail?.startAt)} disabled />
            </Field>

            {!isLeave && (
              <>
                <Field>
                  <Label>출근</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={dSHH} onChange={(e)=>setDSHH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={dSMM} onChange={(e)=>setDSMM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={dSAP} onChange={(e)=>setDSAP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>

                <Field>
                  <Label>휴게 시작</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={dB1HH} onChange={(e)=>setDB1HH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={dB1MM} onChange={(e)=>setDB1MM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={dB1AP} onChange={(e)=>setDB1AP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>

                <Field>
                  <Label>휴게 종료</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={dB2HH} onChange={(e)=>setDB2HH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={dB2MM} onChange={(e)=>setDB2MM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={dB2AP} onChange={(e)=>setDB2AP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>

                <Field>
                  <Label>퇴근</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={dEHH} onChange={(e)=>setDEHH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={dEMM} onChange={(e)=>setDEMM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={dEAP} onChange={(e)=>setDEAP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>
              </>
            )}

            {isLeave && (
              <>
                <Field>
                  <Label>휴가</Label>
                  <Read>{detail?.leaveTypeName || '휴가'}</Read>
                </Field>
              </>
            )}
          </Col>

          <Col>
            <SectionHead>
              <SectionTitle>실제 기록</SectionTitle>
              {!isLeave && (
                <DangerSm onClick={onDeleteEvent} disabled={deleting || !scheduleNumId || !hasActualEvent}>
                  {deleting ? '삭제 중...' : '근무 기록 삭제'}
                </DangerSm>
              )}
            </SectionHead>

            {!isLeave ? (
              <>
                <Field>
                  <Label>출근</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={aSHH} onChange={(e)=>setASHH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={aSMM} onChange={(e)=>setASMM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={aSAP} onChange={(e)=>setASAP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>

                <Field>
                  <Label>휴게 시작</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={aB1HH} onChange={(e)=>setAB1HH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={aB1MM} onChange={(e)=>setAB1MM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={aB1AP} onChange={(e)=>setAB1AP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>

                <Field>
                  <Label>휴게 종료</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={aB2HH} onChange={(e)=>setAB2HH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={aB2MM} onChange={(e)=>setAB2MM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={aB2AP} onChange={(e)=>setAB2AP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>

                <Field>
                  <Label>퇴근</Label>
                  <div>
                    <TimeRow>
                      <TimeBox value={aEHH} onChange={(e)=>setAEHH(e.target.value)} maxLength={2} disabled={!edit} />
                      <div style={{ textAlign:'center', color:'#9ca3af' }}>:</div>
                      <TimeBox value={aEMM} onChange={(e)=>setAEMM(e.target.value)} maxLength={2} disabled={!edit} />
                      <AmPm value={aEAP} onChange={(e)=>setAEAP(e.target.value)} disabled={!edit}>
                        <option>AM</option><option>PM</option>
                      </AmPm>
                    </TimeRow>
                  </div>
                </Field>
              </>
            ) : (
              <>
                <Field>
                  <Label>휴가 종류</Label>
                  <Read>{detail?.leaveTypeName || '-'}</Read>
                </Field>
                <Field>
                  <Label>비고</Label>
                  <Read>{detail?.memo || '-'}</Read>
                </Field>
              </>
            )}
          </Col>
        </Body>

        <Footer>
          {!edit ? (
            <>
              <Ghost onClick={()=>setEdit(true)}>수정</Ghost>
              <Cancel onClick={onClose}>닫기</Cancel>
            </>
          ) : (
            <>
              <Cancel onClick={()=>setEdit(false)}>취소</Cancel>
              <Confirm onClick={onSave} disabled={saving || !canSave}>저장</Confirm>
            </>
          )}
        </Footer>
      </Shell>
    </Overlay>
  );
}
