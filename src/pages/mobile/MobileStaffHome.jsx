// src/pages/mobile/MobileStaffHome.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import careUpLogo from '../../assets/logos/care-up_logo.svg';
import Icon from '@mdi/react';
import { mdiClockOutline, mdiLogoutVariant, mdiCalendarWeek, mdiChevronRight } from '@mdi/js';
import {
  fetchTodayStatus,
  fetchWeekSummary,
  fetchAvgWeekHours,
  clockIn,
  clockOut,
} from '../../service/attendanceMobileService';
import { useToast } from '../../components/common/Toast';
import { useAppSelector } from '../../stores/hooks';
import { tokenStorage, authService } from '../../service/authService';

const Screen = styled.div`
  /* 화면을 억지로 늘리지 않음: 콘텐츠 높이만큼만, 배경은 뷰포트 최소 보장 */
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

const TodayRow = styled.div`display: grid; gap: 12px;`;
const ScheduleLine = styled.div`
  display: flex; align-items: center; gap: 12px; padding-left: 8px; border-left: 4px solid #22c55e; color: #374151;
  small { color: #6b7280; }
`;

const ActionBtn = styled.button`
  height: 44px; border: none; border-radius: 10px; width: 100%;
  background: ${p => (p.$variant === 'out' ? '#111827' : '#3b82f6')};
  color: #fff; font-weight: 800; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: transform .03s ease, filter .12s ease;
  &:hover { filter: brightness(.98); } &:active { transform: translateY(1px); } &:disabled { opacity: .6; cursor: not-allowed; }
`;

/* --- 주간 스트립: 날짜 영역만 좌우 슬라이드, 가장자리 클리핑 --- */
const WeekViewport = styled.div`
  overflow-x: auto; overflow-y: hidden;
  -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain;
  padding-bottom: 2px;
  scrollbar-width: none; &::-webkit-scrollbar { display: none; }
  /* 가장자리 자연스러운 클리핑(선택): 필요 없으면 주석 처리 */
  mask-image: linear-gradient(to right, transparent 0, #000 8px, #000 calc(100% - 8px), transparent 100%);
`;
const WeekStrip = styled.div`
  display: grid; grid-auto-flow: column; gap: 10px;
  /* 각 칸은 반응형 고정폭, 스트립 자체는 내용만큼의 폭만 가짐 → 뷰포트 안에서만 스크롤 */
  grid-auto-columns: clamp(80px, 22vw, 96px);
  width: max-content;
`;
const DayBox = styled.div`
  background: ${p => (p.$today ? 'rgba(139,92,246,.08)' : '#f9fafb')};
  border: 1px solid ${p => (p.$today ? 'rgba(139,92,246,.35)' : '#eceff3')};
  border-radius: 12px; padding: 12px 10px; text-align: center;
  small { display:block; color: #6b7280; font-size: 12px; }
  strong { display:block; color:#111827; margin-top: 6px; font-size: 14px; }
`;

const BarWrap = styled.div`margin-top: 14px;`;
const BarRail = styled.div`height: 10px; background: #e5e7eb; border-radius: 999px; overflow: hidden; position: relative;`;
const BarFill = styled.div`height: 100%; width: ${p => Math.min(100, p.$pct || 0)}%; background: ${p => p.$color || '#8b5cf6'};`;
const BarMeta = styled.div`display:flex; justify-content: space-between; font-size: 12px; color:#374151; margin-top: 6px;`;

function initials(name = '') {
  const s = String(name).trim();
  if (!s) return 'ME';
  const parts = s.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts[1]?.[0] ?? '';
  return (first + last || first).toUpperCase();
}

export default function MobileStaffHome() {
  const { addToast } = useToast();
  const authUser = useAppSelector((s) => s.auth.user);

  const [loading, setLoading] = useState(false);
  const [today, setToday] = useState(null);
  const [week, setWeek] = useState({ days: [], totalMinutes: 0 });
  const [avg, setAvg] = useState({ hours: 0, minutes: 0, targetHours: 40 });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, w, a] = await Promise.all([
        fetchTodayStatus(),
        fetchWeekSummary(new Date()),
        fetchAvgWeekHours(),
      ]);
      setToday(t);
      setWeek(w);
      setAvg(a);
    } catch (e) {
      addToast('근무 데이터를 불러오지 못했습니다.', { color: 'error' });
      setToday(null);
      setWeek({ days: [], totalMinutes: 0 });
      setAvg({ hours: 0, minutes: 0, targetHours: 40 });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const totalThisWeek = useMemo(() => week.totalMinutes || 0, [week]);
  const pctAvg = useMemo(() => {
    const cur = (avg.hours * 60) + (avg.minutes || 0);
    const target = (avg.targetHours || 40) * 60;
    return target > 0 ? (cur / target) * 100 : 0;
  }, [avg]);

  const onClockIn = async () => {
    try {
      await clockIn();
      addToast('출근 처리되었습니다.', { color:'success' });
      loadAll();
    } catch {
      addToast('출근 처리에 실패했습니다.', { color:'error' });
    }
  };
  const onClockOut = async () => {
    try {
      await clockOut();
      addToast('퇴근 처리되었습니다.', { color:'success' });
      loadAll();
    } catch {
      addToast('퇴근 처리에 실패했습니다.', { color:'error' });
    }
  };

  const onLogout = async () => {
    try { await authService?.logout?.(); } catch { /* no-op */ }
    try { tokenStorage?.clear?.(); } catch { /* no-op */ }
    try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } catch { /* no-op */ }
    window.location.replace('/login');
  };

  const name = authUser?.name || '직원';
  const title = authUser?.title || '';
  const branch = authUser?.branchName || '';
  const photo = authUser?.profileImageUrl || '';

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
          {/* 오늘 근무 */}
          <Card>
            <CardTitle>
              <Icon path={mdiClockOutline} size={0.9} />
              오늘 근무
            </CardTitle>

            <TodayRow>
              <ScheduleLine>
                <div style={{display:'grid'}}>
                  <strong style={{fontSize:14}}>
                    {today?.dateText || ''}
                  </strong>
                  <small>{today?.in} — {today?.out}</small>
                </div>
                {today?.statusBadge && (
                  <span style={{
                    marginLeft:'auto', fontSize:12, color:'#10b981',
                    border:'1px solid #a7f3d0', background:'rgba(16,185,129,.06)',
                    padding:'4px 8px', borderRadius:8
                  }}>
                    {today.statusBadge}
                  </span>
                )}
              </ScheduleLine>

              {today?.canClockIn && (
                <ActionBtn onClick={onClockIn} disabled={loading}>
                  출근하기 <Icon path={mdiChevronRight} size={0.8} />
                </ActionBtn>
              )}
              {today?.canClockOut && (
                <ActionBtn $variant="out" onClick={onClockOut} disabled={loading}>
                  퇴근하기 <Icon path={mdiLogoutVariant} size={0.8} />
                </ActionBtn>
              )}
            </TodayRow>
          </Card>

          {/* 이번 주 근무: 날짜 영역만 가로 스크롤, 가장자리 클리핑 */}
          <Card style={{ marginTop: 12 }}>
            <CardTitle>
              <Icon path={mdiCalendarWeek} size={0.9} />
              이번 주 근무
            </CardTitle>

            <WeekViewport role="region" aria-label="이번 주 근무 날짜 목록">
              <WeekStrip>
                {(week.days || []).map((d, i) => (
                  <DayBox key={i} $today={!!d.today}>
                    <small>{d.name}</small>
                    {d.off ? (
                      <strong>일정 없음</strong>
                    ) : (
                      <>
                        <small>{d.in}</small>
                        <strong>{d.out}</strong>
                      </>
                    )}
                  </DayBox>
                ))}
              </WeekStrip>
            </WeekViewport>

            <BarWrap>
              <BarRail>
                <BarFill $pct={(totalThisWeek / (avg.targetHours * 60)) * 100} $color="#8b5cf6" />
              </BarRail>
              <BarMeta>
                <span>{Math.floor(totalThisWeek / 60)}시간 {totalThisWeek % 60}분</span>
                <span>{avg.targetHours}</span>
              </BarMeta>
            </BarWrap>
          </Card>

          {/* 1주 평균 근로시간 */}
          <Card style={{ marginTop: 12, marginBottom: 4 }}>
            <CardTitle>1주 평균 근로시간</CardTitle>
            <BarWrap>
              <BarRail>
                <BarFill $pct={pctAvg} $color="#f59e0b" />
              </BarRail>
              <BarMeta>
                <span>{avg.hours}시간 {String(avg.minutes ?? 0).padStart(2,'0')}분</span>
                <span>{avg.targetHours}</span>
              </BarMeta>
            </BarWrap>
          </Card>
        </Container>
      </Wrap>
    </Screen>
  );
}
