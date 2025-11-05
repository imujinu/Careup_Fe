// src/components/mobile/MobileScheduleDetailModal.jsx
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import Icon from '@mdi/react';
import { mdiClose } from '@mdi/js';
import { useToast } from '../common/Toast';
import { getScheduleDetail } from '../../service/scheduleService'; // 상세 API가 없으면 day 데이터만 사용

/* ===== 애니메이션 ===== */
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const slideUp = keyframes`
  from { transform: translateY(24px); opacity: .98; }
  to   { transform: translateY(0);    opacity: 1; }
`;

/* ===== 스타일 ===== */
const Overlay = styled.div`
  position: fixed; inset: 0; z-index: 1200;
  display: ${(p)=>p.$open ? 'flex' : 'none'};
  align-items: flex-end; justify-content: center;
  background: rgba(17,24,39,0.45);
  animation: ${fadeIn} 140ms ease;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const Sheet = styled.div`
  width: 100%;
  max-width: 560px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  background: #fff;
  box-shadow: 0 -8px 24px rgba(0,0,0,0.18);
  overflow: hidden;
  animation: ${slideUp} 220ms cubic-bezier(.22,1,.36,1);
  will-change: transform;
  @media (prefers-reduced-motion: reduce) { animation: none; }
`;
const Handle = styled.div`
  height: 24px; display:grid; place-items:center;
  &::before {
    content:''; width: 44px; height: 4px; border-radius: 999px;
    background: #e5e7eb; display:block;
  }
`;
const Header = styled.div`
  padding: 12px 16px; border-bottom: 1px solid #edf0f4;
  display:flex; align-items:center; justify-content:space-between; gap: 8px;
`;
const Title = styled.div`font-weight: 900; font-size: 16px; color:#111827;`;
const Sub = styled.div`font-size: 12px; color:#6b7280; margin-top: 2px;`;
const CloseBtn = styled.button`
  width: 34px; height: 34px; border-radius: 10px;
  border: 1px solid #e5e7eb; background: #fff; display: grid; place-items: center; cursor: pointer;
`;

const Body = styled.div`padding: 12px 16px 16px;`;
const Section = styled.section`padding: 10px 0; &:not(:last-child){ border-bottom: 1px solid #f1f5f9; }`;
const SecTitle = styled.div`font-weight: 800; font-size: 13px; color:#4c1d95; margin-bottom: 8px;`;
const Row = styled.div`display:grid; grid-template-columns: 84px 1fr; gap: 8px; align-items:center; margin: 6px 0;`;
const Label = styled.div`font-size: 12px; color:#6b7280;`;
const Value = styled.div`font-size: 12px; color:#111827; font-variant-numeric: tabular-nums;`;

/* 상태 뱃지 */
const Badge = styled.span`
  display:inline-flex; align-items:center; height: 22px; padding: 0 10px;
  border-radius: 999px; font-size: 12px; font-weight: 800;
  background: ${(p)=>p.$bg}; color: ${(p)=>p.$fg};
`;

/* 팔레트/상태 */
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
const STATUS_LABEL = {
  PLANNED: '예정', LATE:'지각', CLOCKED_IN:'근무중', ON_BREAK:'휴게중',
  EARLY_LEAVE:'조퇴', CLOCKED_OUT:'근무완료', OVERTIME:'초과근무',
  MISSED_CHECKOUT:'퇴근누락', LEAVE:'휴가', ABSENT:'결근',
};

/* ===== 유틸 ===== */
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
const isTimeOnly = (v) => typeof v === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(v);

// "YYYY-MM-DD HH:mm" → "YYYY-MM-DDTHH:mm" 로만 정규화, 순수 날짜는 합성 안 함
const normalizeIsoLike = (s) => {
  if (typeof s !== 'string') return s;
  let t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(:\d{2})?$/.test(t)) {
    t = t.replace(/\s+/, 'T');
  }
  return t;
};

// ✅ 값 없으면 null, HH:mm은 baseYmd 있을 때만 합성, 순수 날짜만 들어와도 시간 합성 금지
const toDate = (v, baseYmd) => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string') {
    if (isTimeOnly(v)) {
      const [hh, mm, ss] = v.split(':');
      const ymd = baseYmd || '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
      return new Date(`${ymd}T${pad2(+hh)}:${pad2(+mm)}:${pad2(+(ss || 0))}`);
    }
    const n = normalizeIsoLike(v);
    const d = new Date(n);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const ymd = (d) => {
  if (!d) return '';
  const Y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  return `${Y}-${M}-${D}`;
};

// ✅ 모든 시간 표기를 통일: "YYYY년 MM월 DD일  -  hh:mmAM/PM"
//    값이 없으면 단일 대시("-")
const fmtKoYmdDashAmPm = (d) => {
  if (!d) return '-';
  const Y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const am = h < 12 ? 'AM' : 'PM';
  h = h % 12; if (h === 0) h = 12;
  return `${Y}년 ${M}월 ${D}일  -  ${pad2(h)}:${m}${am}`;
};

const safePick = (o, keys) => {
  for (const k of keys) {
    const v = o?.[k];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};
const pickStatus   = (d) => String(d?.status ?? d?.attendanceStatus ?? '').toUpperCase();
const pickCategory = (d) => String(d?.category ?? d?.scheduleType ?? '').toUpperCase();

// 뱃지 계산
function badgeOf(d) {
  const st = pickStatus(d);
  const cat = pickCategory(d);
  let color = STATUS_COLORS.PLANNED;
  let text = STATUS_LABEL.PLANNED;
  if (st && STATUS_COLORS[st]) { color = STATUS_COLORS[st]; text = STATUS_LABEL[st] || st; }
  else if (cat === 'LEAVE') { color = STATUS_COLORS.LEAVE; text = STATUS_LABEL.LEAVE; }
  return { ...color, text };
}

/**
 * ===== 핵심 변경점 요약 =====
 * - 모든 시간 표기 형식을 fmtKoYmdDashAmPm로 통일
 * - 라벨의 '(계획)' 제거
 * - 실제 기록: actual/clock 계열만 사용(요약 in/out 금지), 없으면 '-'
 */
export function MobileScheduleDetailModal({ open, day, onClose }) {
  const { addToast } = useToast();
  const [detail, setDetail] = useState(day || null);

  // scheduleId가 있으면 상세 조회(있을 때만 시도)
  useEffect(() => {
    setDetail(day || null);
    const id = day?.scheduleId || day?.primaryScheduleId || day?.id;
    if (!open || !id) return;
    (async () => {
      try {
        const d = await getScheduleDetail(id);
        if (d) setDetail({ ...day, ...d });
      } catch {
        addToast('상세 정보를 불러오지 못했습니다. 요약 정보만 표시합니다.', { color: 'warning' });
      }
    })();
  }, [open, day, addToast]);

  if (!open) return null;

  const b = badgeOf(detail || {});

  // 계획 IN/OUT 원본값 추출(계획 계열 우선)
  const rawPlanIn  = safePick(detail, [
    'scheduledIn','plannedIn','registeredStartAt','registeredClockIn','startAt','start','scheduledStartAt'
  ]);
  const rawPlanOut = safePick(detail, [
    'scheduledOut','plannedOut','registeredEndAt','registeredClockOut','endAt','end','scheduledEndAt'
  ]);

  // 날짜 기준(계획 IN이 가장 신뢰도 높음 → 없으면 detail.date → startAt)
  const baseYmdForPlan =
    ymd(toDate(rawPlanIn)) ||
    (typeof detail?.date === 'string' ? detail.date.slice(0,10) : '') ||
    ymd(toDate(detail?.startAt));

  // ✅ 실제 IN/OUT/휴게(오직 실제 필드만, 요약 텍스트 in/out 사용 금지)
  const rawActIn  = safePick(detail, ['actualClockIn','clockInAt','actualStartAt']);
  const rawActOut = safePick(detail, ['actualClockOut','clockOutAt','actualEndAt']);
  const rawActBS  = safePick(detail, ['actualBreakStart','breakStartAt']);
  const rawActBE  = safePick(detail, ['actualBreakEnd','breakEndAt']);

  // Date 변환 (시간만 온 경우에만 baseYmd 결합, 아니면 실패시 null)
  const planInDt  = toDate(rawPlanIn,  baseYmdForPlan);
  const planOutDt = toDate(rawPlanOut, baseYmdForPlan);

  const actInDt = toDate(rawActIn, baseYmdForPlan);
  const actOutDt = toDate(rawActOut, baseYmdForPlan);
  const actBSDt = toDate(rawActBS, baseYmdForPlan);
  const actBEDt = toDate(rawActBE, baseYmdForPlan);

  const regDateYmd = ymd(toDate(detail?.registeredDate)) ||
                     ymd(toDate(detail?.date)) ||
                     ymd(toDate(detail?.startAt)) ||
                     (planInDt ? ymd(planInDt) : '');

  const isLeave = pickCategory(detail) === 'LEAVE' || pickStatus(detail) === 'LEAVE' || !!detail?.leaveTypeId;

  return (
    <Overlay $open={open} onClick={onClose} role="dialog" aria-modal aria-label="근무 일정 상세">
      <Sheet onClick={(e)=>e.stopPropagation()}>
        <Handle />
        <Header>
          <div>
            <Title>근무일정 상세</Title>
            <Sub>
              {detail?.employeeName || '-'}
              {detail?.branchName ? ` · ${detail.branchName}` : ''}
              {regDateYmd ? ` · ${regDateYmd}` : ''}
            </Sub>
          </div>
          <CloseBtn onClick={onClose} aria-label="닫기">
            <Icon path={mdiClose} size={0.9}/>
          </CloseBtn>
        </Header>

        <Body>
          <Section>
            <SecTitle>상태</SecTitle>
            <Badge $bg={b.bg} $fg={b.fg}>{b.text}</Badge>
          </Section>

          <Section>
            <SecTitle>계획 시간</SecTitle>
            {!isLeave ? (
              <>
                <Row><Label>출근</Label><Value>{fmtKoYmdDashAmPm(planInDt)}</Value></Row>
                <Row><Label>퇴근</Label><Value>{fmtKoYmdDashAmPm(planOutDt)}</Value></Row>
                <Row><Label>휴게 시작</Label><Value>{fmtKoYmdDashAmPm(toDate(safePick(detail, ['registeredBreakStart','plannedBreakStart','breakPlannedFrom']), baseYmdForPlan))}</Value></Row>
                <Row><Label>휴게 종료</Label><Value>{fmtKoYmdDashAmPm(toDate(safePick(detail, ['registeredBreakEnd','plannedBreakEnd','breakPlannedTo']), baseYmdForPlan))}</Value></Row>
              </>
            ) : (
              <>
                <Row><Label>휴가 종류</Label><Value>{detail?.leaveTypeName || '휴가'}</Value></Row>
              </>
            )}
          </Section>

          <Section>
            <SecTitle>실제 기록</SecTitle>
            {!isLeave ? (
              <>
                <Row><Label>출근</Label><Value>{fmtKoYmdDashAmPm(actInDt)}</Value></Row>
                <Row><Label>퇴근</Label><Value>{fmtKoYmdDashAmPm(actOutDt)}</Value></Row>
                <Row><Label>휴게 시작</Label><Value>{fmtKoYmdDashAmPm(actBSDt)}</Value></Row>
                <Row><Label>휴게 종료</Label><Value>{fmtKoYmdDashAmPm(actBEDt)}</Value></Row>
              </>
            ) : (
              <>
                <Row><Label>비고</Label><Value>{detail?.memo || '-'}</Value></Row>
              </>
            )}
          </Section>
        </Body>
      </Sheet>
    </Overlay>
  );
}
