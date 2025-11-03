// src/components/attendance/ScheduleDetailModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { useToast } from '../common/Toast';
import { getScheduleDetail, updateSchedule, upsertAttendanceEvent } from '../../service/scheduleService';

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
const toMs = (iso) => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
};

/* ===== 팔레트 ===== */
const tone = {
  violet: { bg:'#ede9fe', fg:'#4c1d95' }, // 휴가
  green:  { bg:'#dcfce7', fg:'#166534' }, // 근무중/휴게/완료
  red:    { bg:'#fee2e2', fg:'#991b1b' }, // 누락/결근
  amber:  { bg:'#fef3c7', fg:'#92400e' }, // 지각/조퇴/초과
  gray:   { bg:'#f3f4f6', fg:'#374151' }, // 보조 배지(유형)
  blue:   { bg:'#dbeafe', fg:'#1e40af' }, // 예정
};

/* 상태 → 색상/라벨 */
const STATUS_COLORS = {
  PLANNED:         tone.blue,
  LATE:            tone.amber,
  CLOCKED_IN:      tone.green,
  ON_BREAK:        tone.green,
  EARLY_LEAVE:     tone.amber,
  CLOCKED_OUT:     tone.green,
  OVERTIME:        tone.amber,
  MISSED_CHECKOUT: tone.red,
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

/* ===== 서버 필드 우선 선택 ===== */
const pickStatus = (d) => String(d?.status ?? d?.attendanceStatus ?? '').toUpperCase();
const pickCategory = (d) => String(d?.category ?? d?.scheduleType ?? '').toUpperCase();

/* ===== 단일 뱃지(상태 + (커스텀명)) ===== */
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
  if (cat === 'LEAVE' || st === 'LEAVE') typeName = detail?.leaveTypeName || '휴가';
  else if (detail?.workTypeName) typeName = detail.workTypeName;

  if (typeName && !label.includes(typeName)) {
    label = `${label} (${typeName})`;
  }

  return { text: label, bg: color.bg, fg: color.fg };
}

/* ===== 컴포넌트 ===== */
export function ScheduleDetailModal({ open, scheduleId, onClose, onSaved }) {
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState(false);

  // 상태/휴가 여부(서버 필드 우선)
  const statusCode = useMemo(() => pickStatus(detail), [detail]);
  const isLeave = useMemo(() => {
    const cat = pickCategory(detail);
    return statusCode === 'LEAVE' || cat === 'LEAVE';
  }, [statusCode, detail]);

  // 계획(등록 당시)
  const [dDate, setDDate] = useState('');
  const [dSHH, setDSHH] = useState(''); const [dSMM, setDSMM] = useState(''); const [dSAP, setDSAP] = useState('AM');
  const [dB1HH, setDB1HH] = useState(''); const [dB1MM, setDB1MM] = useState(''); const [dB1AP, setDB1AP] = useState('PM');
  const [dB2HH, setDB2HH] = useState(''); const [dB2MM, setDB2MM] = useState(''); const [dB2AP, setDB2AP] = useState('PM');
  const [dEHH, setDEHH] = useState(''); const [dEMM, setDEMM] = useState(''); const [dEAP, setDEAP] = useState('PM');

  // 실제 기록
  const [aSHH, setASHH] = useState(''); const [aSMM, setASMM] = useState(''); const [aSAP, setASAP] = useState('AM');
  const [aB1HH, setAB1HH] = useState(''); const [aB1MM, setAB1MM] = useState(''); const [aB1AP, setAB1AP] = useState('PM');
  const [aB2HH, setAB2HH] = useState(''); const [aB2MM, setAB2MM] = useState(''); const [aB2AP, setAB2AP] = useState('PM');
  const [aEHH, setAEHH] = useState(''); const [aEMM, setAEMM] = useState(''); const [aEAP, setAEAP] = useState('PM');

  // 상세 로드
  useEffect(() => {
    if (!open || !scheduleId) return;
    (async () => {
      try {
        const d = await getScheduleDetail(scheduleId);
        setDetail(d || null);

        // 날짜
        setDDate(fmtYMD(d?.registeredDate || d?.date || d?.startAt));

        // 계획 → 12h
        const rIn  = to12hParts(d?.registeredClockIn || d?.registeredClockInTime || d?.registeredStartAt || d?.startAt);
        const rB1  = to12hParts(d?.registeredBreakStart || d?.registeredBreakStartTime);
        const rB2  = to12hParts(d?.registeredBreakEnd || d?.registeredBreakEndTime);
        const rOut = to12hParts(d?.registeredClockOut || d?.registeredClockOutTime || d?.registeredEndAt || d?.endAt);
        setDSHH(rIn.hh); setDSMM(rIn.mm); setDSAP(rIn.ap);
        setDB1HH(rB1.hh); setDB1MM(rB1.mm); setDB1AP(rB1.ap);
        setDB2HH(rB2.hh); setDB2MM(rB2.mm); setDB2AP(rB2.ap);
        setDEHH(rOut.hh); setDEMM(rOut.mm); setDEAP(rOut.ap);

        // 실제 → 12h
        const aIn  = d?.actualClockIn  || d?.actualStartAt  ? to12hParts(d.actualClockIn  || d.actualStartAt)  : {hh:'',mm:'',ap:'AM'};
        const aB1  = d?.actualBreakStart || d?.actualBreakStartAt ? to12hParts(d.actualBreakStart || d.actualBreakStartAt) : {hh:'',mm:'',ap:'PM'};
        const aB2  = d?.actualBreakEnd   || d?.actualBreakEndAt   ? to12hParts(d.actualBreakEnd   || d.actualBreakEndAt)   : {hh:'',mm:'',ap:'PM'};
        const aOut = d?.actualClockOut || d?.actualEndAt ? to12hParts(d.actualClockOut || d.actualEndAt) : {hh:'',mm:'',ap:'PM'};
        setASHH(aIn.hh); setASMM(aIn.mm); setASAP(aIn.ap);
        setAB1HH(aB1.hh); setAB1MM(aB1.mm); setAB1AP(aB1.ap);
        setAB2HH(aB2.hh); setAB2MM(aB2.mm); setAB2AP(aB2.ap);
        setAEHH(aOut.hh); setAEMM(aOut.mm); setAEAP(aOut.ap);
      } catch {
        addToast('상세 조회에 실패했습니다.', { color: 'error' });
      }
    })();
  }, [open, scheduleId, addToast]);

  const canSave = useMemo(() => {
    if (!detail) return false;
    if (isLeave) return true;
    const okNum = (v) => /^\d{1,2}$/.test(v);
    const okMin = (v) => /^\d{1,2}$/.test(v);
    return okNum(dSHH) && okMin(dSMM) && okNum(dEHH) && okMin(dEMM);
  }, [detail, isLeave, dSHH, dSMM, dEHH, dEMM]);

  const onSave = async () => {
    if (!detail) return;
    try {
      setSaving(true);

      // 1) 계획(등록) 시간
      const planPayload = {
        branchId: Number(detail?.branchId),
        registeredDate: dDate || detail?.registeredDate,
        workTypeId: !isLeave ? (detail?.workTypeId || undefined) : undefined,
        leaveTypeId: isLeave ? (detail?.leaveTypeId || undefined) : undefined,
        attendanceTemplateId: !isLeave ? (detail?.attendanceTemplateId || undefined) : undefined,
        registeredClockIn:   !isLeave ? toIsoLocal(dDate, dSHH, dSMM, dSAP) : undefined,
        registeredBreakStart:(!isLeave && dB1HH) ? toIsoLocal(dDate, dB1HH, dB1MM, dB1AP) : undefined,
        registeredBreakEnd:  (!isLeave && dB2HH) ? toIsoLocal(dDate, dB2HH, dB2MM, dB2AP) : undefined,
        registeredClockOut:  !isLeave ? toIsoLocal(dDate, dEHH, dEMM, dEAP) : undefined,
      };

      // 2) 실제 기록
      const eventPayload = {
        eventDate: dDate || detail?.registeredDate,
        clockInAt:     aSHH ? toIsoLocal(dDate, aSHH, aSMM, aSAP) : undefined,
        breakStartAt:  aB1HH ? toIsoLocal(dDate, aB1HH, aB1MM, aB1AP) : undefined,
        breakEndAt:    aB2HH ? toIsoLocal(dDate, aB2HH, aB2MM, aB2AP) : undefined,
        clockOutAt:    aEHH ? toIsoLocal(dDate, aEHH, aEMM, aEAP) : undefined,
      };

      const jobs = [];
      jobs.push(updateSchedule(detail.id, planPayload));
      if (eventPayload.clockInAt || eventPayload.breakStartAt || eventPayload.breakEndAt || eventPayload.clockOutAt) {
        jobs.push(upsertAttendanceEvent(detail.id, eventPayload));
      }
      await Promise.all(jobs);

      addToast('스케줄이 저장되었습니다.', { color: 'success' });
      onSaved?.();
      setEdit(false);
    } catch (e) {
      const msg = e?.response?.data?.message || '저장 중 오류가 발생했습니다.';
      addToast(msg, { color: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const badge = buildSingleBadge(detail);

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
          {/* 계획(등록 당시) */}
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

          {/* 실제 기록 */}
          <Col>
            <SectionTitle>실제 기록</SectionTitle>
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
