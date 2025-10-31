import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import branchDashboardService, {
  formatCurrencyKRW,
} from "../../service/branchDashboardService";

function BranchDashboard({ branchId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState("MONTHLY");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await branchDashboardService.getDashboard(branchId, period);
        if (!alive) return;
        
        console.log("[대시보드 컴포넌트] 응답:", res);
        
        // 응답 구조 처리:
        // 1. { result: {...}, status_code: 200 } 형태
        // 2. 직접 데이터 객체 형태
        // 3. { status_code: 200, result: {...} } 형태
        if (res?.status_code === 200) {
          setDashboard(res.result || res);
        } else if (res?.status_code && res.status_code !== 200) {
          // status_code가 있지만 200이 아닌 경우
          throw new Error(res?.status_message || `대시보드 조회 실패 (코드: ${res.status_code})`);
        } else if (res && typeof res === 'object') {
          // status_code가 없지만 데이터가 있는 경우 (직접 데이터 객체)
          setDashboard(res);
        } else {
          throw new Error("대시보드 데이터 형식이 올바르지 않습니다.");
        }
      } catch (e) {
        console.error("[대시보드 컴포넌트] 에러:", e);
        console.error("[대시보드 컴포넌트] 에러 상세:", {
          message: e.message,
          status: e.status,
          response: e.response,
          data: e.data
        });
        
        // 에러 메시지 추출
        const errorMessage = 
          e.data?.status_message ||
          e.response?.data?.status_message ||
          e.message ||
          "대시보드 조회 실패";
        
        setError(errorMessage);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [branchId, period]);

  const last7DaysChart = useMemo(() => {
    return (dashboard?.salesSummary?.last7DaysSales || []).map((d) => ({
      date: d.date,
      sales: d.sales,
    }));
  }, [dashboard]);

  const orderStatusData = useMemo(() => {
    const dist = dashboard?.orderSummary?.orderStatusDistribution || {};
    return Object.keys(dist).map((k) => ({ name: k, value: dist[k] }));
  }, [dashboard]);

  const salesTrendData = useMemo(() => {
    return (dashboard?.salesTrend?.salesData || []).map((s) => ({
      label: s.periodLabel,
      sales: s.sales,
    }));
  }, [dashboard]);

  const categorySalesData = useMemo(() => {
    const dist = dashboard?.categorySales?.categorySalesDistribution || {};
    return Object.keys(dist).map((k) => ({ name: k, value: dist[k] }));
  }, [dashboard]);

  const weeklyAttendanceData = useMemo(() => {
    const weekly = dashboard?.attendanceSummary?.weeklyAttendance || {};
    return Object.keys(weekly).map((d) => ({
      date: d,
      present: weekly[d].presentCount,
      total: weekly[d].totalCount,
    }));
  }, [dashboard]);

  if (loading) {
    return <Centered>로딩 중...</Centered>;
  }

  if (error) {
    return (
      <Centered>
        <ErrorText>{error}</ErrorText>
      </Centered>
    );
  }

  if (!dashboard) return null;

  return (
    <Wrapper>
      {/* Top banner-like header (compact to fit inside BranchDetail page) */}
      <Hero>
        <HeroLeft>
          <HeroTitle>대시보드</HeroTitle>
          <HeroSub>카드를 드래그하여 레이아웃을 조정할 수 있습니다</HeroSub>
        </HeroLeft>
        <HeroRight>
          <HeroActions>
            <SmallBtn onClick={() => setPeriod("WEEKLY")}>주간</SmallBtn>
            <SmallBtn onClick={() => setPeriod("MONTHLY")} $primary>
              월간
            </SmallBtn>
            <SmallBtn onClick={() => setPeriod("YEARLY")}>연간</SmallBtn>
          </HeroActions>
        </HeroRight>
      </Hero>

      {/* 1st row: Sales, Inventory, Employees */}
      <ThreeCol>
        <Card>
          <CardHeader>
            <CardTitle>매출 현황</CardTitle>
          </CardHeader>
          <KPIBlock>
            <KPIValue>{formatCurrencyKRW(dashboard.salesSummary?.totalSales || 0)}</KPIValue>
            <KPIHint>총 매출</KPIHint>
          </KPIBlock>
          <MiniChart>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={last7DaysChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip formatter={(v) => formatCurrencyKRW(v)} />
                <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </MiniChart>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>재고 현황</CardTitle>
          </CardHeader>
          <StatsColumn>
            <StatRow>
              <StatLabel>총 재고 품목</StatLabel>
              <StatValue>{dashboard.inventorySummary?.totalProducts ?? 0}개</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>재고 부족</StatLabel>
              <StatValue $warn>{dashboard.inventorySummary?.lowStockProducts ?? 0}개</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>재고 충족률</StatLabel>
              <StatValue>{(dashboard.inventorySummary?.stockFulfillmentRate ?? 0).toFixed(1)}%</StatValue>
            </StatRow>
          </StatsColumn>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>직원 현황</CardTitle>
          </CardHeader>
          <StatsColumn>
            <StatRow>
              <StatLabel>총 직원 수</StatLabel>
              <StatValue>{dashboard.employeeSummary?.totalEmployees ?? 0}명</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>출근 인원</StatLabel>
              <StatValue>{dashboard.employeeSummary?.presentEmployees ?? 0}명</StatValue>
            </StatRow>
            <StatRow>
              <StatLabel>오늘 출근률</StatLabel>
              <StatValue>{(dashboard.employeeSummary?.todayAttendanceRate ?? 0).toFixed(1)}%</StatValue>
            </StatRow>
          </StatsColumn>
        </Card>
      </ThreeCol>

      {/* 2nd row: Orders + Sales Trend */}
      <TwoCol>
        <Card>
          <CardHeader>
            <CardTitle>주문 현황</CardTitle>
          </CardHeader>
          <StatsColumn>
            <StatRow>
              <StatLabel>총 주문 수</StatLabel>
              <StatValue>{dashboard.orderSummary?.totalOrders ?? 0}건</StatValue>
            </StatRow>
            <MiniDonut>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    {orderStatusData.map((_, i) => (
                      <Cell key={i} fill={["#10b981", "#f59e0b", "#ef4444", "#6366f1"][i % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </MiniDonut>
          </StatsColumn>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>매출 추이</CardTitle>
            <Subtle>{dashboard.salesTrend?.period || period}</Subtle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${Math.round(v / 10000)}만`} />
              <Tooltip formatter={(v) => formatCurrencyKRW(v)} />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#7c3aed" strokeWidth={2} dot={false} name="매출" />
            </LineChart>
          </ResponsiveContainer>
          <InlineStats>
            <InlineItem>
              <InlineLabel>총 매출</InlineLabel>
              <InlineValue>{formatCurrencyKRW(dashboard.salesTrend?.totalSales || 0)}</InlineValue>
            </InlineItem>
            <InlineItem>
              <InlineLabel>전년 대비</InlineLabel>
              <InlineValue $positive>{(dashboard.salesTrend?.yearOverYearGrowth ?? 0).toFixed(1)}%</InlineValue>
            </InlineItem>
            <InlineItem>
              <InlineLabel>목표 달성률</InlineLabel>
              <InlineValue>{(dashboard.salesTrend?.goalAchievementRate ?? 0).toFixed(1)}%</InlineValue>
            </InlineItem>
          </InlineStats>
        </Card>
      </TwoCol>

      {/* 3rd row: Category donut + Attendance bar */}
      <TwoCol>
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 매출 비중</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categorySalesData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100}>
                {categorySalesData.map((_, i) => (
                  <Cell key={i} fill={["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6"][i % 6]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrencyKRW(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <FooterStat>
            <span>최고 카테고리</span>
            <strong>{dashboard.categorySales?.topCategory || "-"}</strong>
          </FooterStat>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>주간 출근 현황</CardTitle>
            <Subtle>이전 주</Subtle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="present" name="출근 수" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
          <InlineStats>
            <InlineItem>
              <InlineLabel>평균 출근률</InlineLabel>
              <InlineValue>{(dashboard.attendanceSummary?.averageAttendanceRate ?? 0).toFixed(1)}%</InlineValue>
            </InlineItem>
            <InlineItem>
              <InlineLabel>총 근무일</InlineLabel>
              <InlineValue>{dashboard.attendanceSummary?.totalWorkDays ?? 0}일</InlineValue>
            </InlineItem>
            <InlineItem>
              <InlineLabel>지각</InlineLabel>
              <InlineValue $warn>{dashboard.attendanceSummary?.lateCount ?? 0}회</InlineValue>
            </InlineItem>
          </InlineStats>
        </Card>
      </TwoCol>
    </Wrapper>
  );
}

export default BranchDashboard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 360px;
  color: #6b7280;
`;

const ErrorText = styled.div`
  color: #ef4444;
`;

const Hero = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  background: linear-gradient(90deg, #8b5cf6, #60a5fa);
  color: white;
`;

const HeroLeft = styled.div``;
const HeroRight = styled.div``;
const HeroTitle = styled.h2`
  margin: 0 0 6px 0;
  font-size: 22px;
`;
const HeroSub = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;
const HeroActions = styled.div`
  display: flex;
  gap: 8px;
`;
const SmallBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== "$primary" })`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  background: ${(p) => (p.$primary ? "#22c55e" : "transparent")};
  color: white;
  cursor: pointer;
`;

const ThreeCol = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  @media (max-width: 1200px) { grid-template-columns: 1fr; }
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 1200px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;
const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #111827;
`;
const Subtle = styled.div`
  color: #6b7280;
  font-size: 12px;
`;

const KPIBlock = styled.div`
  margin: 8px 0 4px;
`;
const KPIValue = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
`;
const KPIHint = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const MiniChart = styled.div`
  margin-top: 8px;
`;

const StatsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
`;
const StatLabel = styled.span`
  color: #6b7280;
`;
const StatValue = styled.span.withConfig({ shouldForwardProp: (p) => p !== "$warn" })`
  color: ${(p) => (p.$warn ? "#ef4444" : "#111827")};
  font-weight: 600;
`;

const MiniDonut = styled.div`
  margin-top: 8px;
`;

const InlineStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
`;
const InlineItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
const InlineLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
`;
const InlineValue = styled.span.withConfig({ shouldForwardProp: (p) => p !== "$positive" && p !== "$warn" })`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$positive ? "#10b981" : p.$warn ? "#ef4444" : "#111827")};
`;

const FooterStat = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: #374151;
`;


