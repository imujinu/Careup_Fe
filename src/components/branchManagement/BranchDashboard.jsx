import React, { useEffect, useMemo, useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import GridLayout from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
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

// 초기 레이아웃 정의 (12열 그리드 기준)
const getDefaultLayout = () => [
  { i: "sales", x: 0, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "inventory", x: 4, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "employee", x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
  { i: "order", x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
  { i: "salesTrend", x: 6, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
  { i: "categorySales", x: 0, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
  { i: "attendance", x: 6, y: 8, w: 6, h: 5, minW: 4, minH: 4 },
];

function BranchDashboard({ branchId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [period, setPeriod] = useState("MONTHLY");
  
  // 레이아웃 상태 관리 (12열 기준으로 저장)
  const defaultLayout = useMemo(() => getDefaultLayout(), []);
  const [savedLayout12Col, setSavedLayout12Col] = useState(() => {
    // 로컬 스토리지에서 레이아웃 불러오기 (항상 12열 기준)
    const saved = localStorage.getItem(`dashboard-layout-${branchId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultLayout;
      }
    }
    return defaultLayout;
  });
  
  // 현재 그리드 열 수에 맞게 스케일링된 레이아웃 (초기에는 12열 기준)
  const [layout, setLayout] = useState(savedLayout12Col);

  // 컨테이너 너비 및 그리드 열 수 상태 관리
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [gridCols, setGridCols] = useState(12);
  
  useEffect(() => {
    let resizeTimeout;
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(600, rect.width - 48); // padding 고려, 최소 너비 600px
        
        // 디바운싱으로 resize 이벤트 최적화
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          setContainerWidth(width);
          
          // 화면 크기에 따라 그리드 열 수를 더 점진적으로 조정
          // 카드 최소 너비를 약 280-300px로 유지하도록 계산
          let newCols;
          if (width < 600) {
            newCols = 4; // 매우 작은 화면: 4열
          } else if (width < 900) {
            newCols = 6; // 모바일: 6열
          } else if (width < 1200) {
            newCols = 8; // 태블릿: 8열
          } else if (width < 1600) {
            newCols = 10; // 작은 데스크톱: 10열
          } else if (width < 1920) {
            newCols = 11; // 중간 데스크톱: 11열
          } else {
            newCols = 12; // 큰 화면: 12열
          }
          
          setGridCols(newCols);
        }, 150); // 150ms 디바운스
      }
    };
    
    // 초기 너비 설정
    updateWidth();
    
    // ResizeObserver로 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // 창 크기 변경도 감지
    window.addEventListener('resize', updateWidth);
    
    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

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

  // 주문 상태를 한국어로 변환하는 함수
  const translateOrderStatus = (status) => {
    if (!status) return status;
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PENDING':
        return '대기중';
      case 'CONFIRMED':
        return '승인됨';
      case 'CANCELLED':
      case 'CANCELED':
        return '취소됨';
      case 'REJECTED':
        return '거부됨';
      case 'COMPLETED':
        return '완료';
      default:
        return status;
    }
  };

  const orderStatusData = useMemo(() => {
    const dist = dashboard?.orderSummary?.orderStatusDistribution || {};
    return Object.keys(dist).map((k) => ({ name: translateOrderStatus(k), value: dist[k] }));
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

  // 레이아웃 변경 핸들러
  const handleLayoutChange = (newLayout) => {
    // 레이아웃을 현재 그리드 열 수에 맞게 정규화
    const normalizedLayout = newLayout.map((item) => {
      // 최소 너비 보장 (그리드의 1/4 또는 최소 2-3열)
      const minW = Math.min(3, Math.max(2, Math.floor(gridCols / 4)));
      const minH = item.minH || 2;
      
      // 너비와 위치 정규화
      let w = Math.max(minW, Math.min(item.w, gridCols));
      let x = Math.max(0, Math.min(item.x, gridCols - w));
      
      // 높이도 최소값 보장
      const h = Math.max(minH, item.h || 2);
      
      return {
        ...item,
        x,
        w,
        h,
        minW: minW, // 동적으로 계산된 최소 너비
        minH: minH,
      };
    });
    
    setLayout(normalizedLayout);
    
    // 12열 기준으로 정규화하여 저장
    const savedLayout12Col = normalizedLayout.map((item) => {
      const scaleFactor = 12 / gridCols;
      return {
        ...item,
        x: Math.max(0, Math.round(item.x * scaleFactor)),
        w: Math.max(3, Math.round(item.w * scaleFactor)), // 12열 기준 최소 3열
        minW: 3, // 12열 기준 최소 너비
        minH: item.minH || 2,
      };
    });
    
    setSavedLayout12Col(savedLayout12Col);
    localStorage.setItem(`dashboard-layout-${branchId}`, JSON.stringify(savedLayout12Col));
  };
  
  // 그리드 열 수가 변경될 때 레이아웃 스케일링
  const prevGridColsRef = useRef(gridCols);
  useEffect(() => {
    // gridCols가 변경되었을 때만 스케일링
    if (savedLayout12Col.length > 0 && gridCols > 0 && prevGridColsRef.current !== gridCols) {
      const scaledLayout = savedLayout12Col.map((item) => {
        // 비율 기반 스케일링
        const scaleFactor = gridCols / 12;
        let newW = Math.round(item.w * scaleFactor);
        let newX = Math.round(item.x * scaleFactor);
        
        // 카드 최소 너비 보장 (그리드의 1/4 또는 최소 2-3열)
        const minW = Math.min(3, Math.max(2, Math.floor(gridCols / 4)));
        const maxW = gridCols; // 최대는 그리드 전체
        const minH = item.minH || 2;
        
        newW = Math.max(minW, Math.min(newW, maxW));
        
        // 위치 조정: 그리드 범위를 벗어나지 않도록
        newX = Math.max(0, Math.min(newX, gridCols - newW));
        
        return {
          ...item,
          x: newX,
          w: newW,
          minW: minW, // 동적으로 계산된 최소 너비
          minH: minH,
        };
      });
      
      setLayout(scaledLayout);
      prevGridColsRef.current = gridCols;
    }
  }, [gridCols, savedLayout12Col]);

  // 초기 레이아웃으로 되돌리기
  const resetLayout = () => {
    const initialLayout = getDefaultLayout();
    setSavedLayout12Col(initialLayout);
    // 현재 그리드 열 수에 맞게 스케일링
    const scaleFactor = gridCols / 12;
    const minW = Math.min(3, Math.max(2, Math.floor(gridCols / 4)));
    const scaledLayout = initialLayout.map((item) => {
      let newW = Math.round(item.w * scaleFactor);
      let newX = Math.round(item.x * scaleFactor);
      const minH = item.minH || 2;
      
      newW = Math.max(minW, Math.min(newW, gridCols));
      newX = Math.max(0, Math.min(newX, gridCols - newW));
      
      return {
        ...item,
        x: newX,
        w: newW,
        minW: minW,
        minH: minH,
      };
    });
    setLayout(scaledLayout);
    localStorage.removeItem(`dashboard-layout-${branchId}`);
  };

  if (loading) {
    return (
      <Wrapper>
        <Hero>
          <HeroLeft>
            <HeroTitle>대시보드</HeroTitle>
            <HeroSub>카드를 드래그하여 레이아웃을 조정할 수 있습니다</HeroSub>
          </HeroLeft>
          <HeroRight>
            <HeroActions>
              <SmallBtn $primary={false}>
                주간
              </SmallBtn>
              <SmallBtn $primary={true}>
                월간
              </SmallBtn>
              <SmallBtn $primary={false}>
                연간
              </SmallBtn>
            </HeroActions>
          </HeroRight>
        </Hero>
        <GridLayoutContainer>
          <DashboardSkeletonGrid>
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <DashboardSkeletonCard key={i}>
                <SkeletonHeader>
                  <SkeletonText width="120px" height="20px" />
                </SkeletonHeader>
                <SkeletonBody>
                  <SkeletonText width="80px" height="28px" />
                  <SkeletonText width="60px" height="14px" />
                  <SkeletonChart height="120px" />
                </SkeletonBody>
              </DashboardSkeletonCard>
            ))}
          </DashboardSkeletonGrid>
        </GridLayoutContainer>
      </Wrapper>
    );
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
            <SmallBtn onClick={() => setPeriod("WEEKLY")} $primary={period === "WEEKLY"}>주간</SmallBtn>
            <SmallBtn onClick={() => setPeriod("MONTHLY")} $primary={period === "MONTHLY"}>
              월간
            </SmallBtn>
            <SmallBtn onClick={() => setPeriod("YEARLY")} $primary={period === "YEARLY"}>연간</SmallBtn>
            <ResetBtn onClick={resetLayout} title="레이아웃 초기화">
              <ResetIcon>↺</ResetIcon>
              초기화
            </ResetBtn>
          </HeroActions>
        </HeroRight>
      </Hero>

      {/* Grid Layout Container */}
      <GridLayoutContainer ref={containerRef}>
        <GridLayout
          className="layout"
          layout={layout}
          cols={gridCols}
          rowHeight={60}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".drag-handle"
          margin={[24, 24]}
          compactType="vertical"
          preventCollision={false}
          verticalCompact={true}
          allowOverlap={false}
        >
          {/* 매출 현황 */}
          <Card key="sales">
            <CardHeader>
              <CardTitle>매출 현황</CardTitle>
              <DragHandle className="drag-handle" title="드래그하여 이동">
                ⋮⋮
              </DragHandle>
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

          {/* 재고 현황 */}
          <Card key="inventory">
            <CardHeader>
              <CardTitle>재고 현황</CardTitle>
              <DragHandle className="drag-handle" title="드래그하여 이동">
                ⋮⋮
              </DragHandle>
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

          {/* 직원 현황 */}
          <Card key="employee">
            <CardHeader>
              <CardTitle>직원 현황</CardTitle>
              <DragHandle className="drag-handle" title="드래그하여 이동">
                ⋮⋮
              </DragHandle>
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

          {/* 주문 현황 */}
          <Card key="order">
            <CardHeader>
              <CardTitle>주문 현황</CardTitle>
              <DragHandle className="drag-handle" title="드래그하여 이동">
                ⋮⋮
              </DragHandle>
            </CardHeader>
            <StatsColumn>
              <StatRow>
                <StatLabel>총 주문 수</StatLabel>
                <StatValue>{dashboard.orderSummary?.totalOrders ?? 0}건</StatValue>
              </StatRow>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={orderStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="주문 수">
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#10b981", "#f59e0b", "#ef4444", "#6366f1"][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </StatsColumn>
          </Card>

          {/* 매출 추이 */}
          <Card key="salesTrend">
            <CardHeader>
              <CardTitle>매출 추이</CardTitle>
              <HeaderRight>
                <Subtle>{dashboard.salesTrend?.period || period}</Subtle>
                <DragHandle className="drag-handle" title="드래그하여 이동">
                  ⋮⋮
                </DragHandle>
              </HeaderRight>
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

          {/* 카테고리별 매출 비중 */}
          <Card key="categorySales">
            <CardHeader>
              <CardTitle>카테고리별 매출 비중</CardTitle>
              <DragHandle className="drag-handle" title="드래그하여 이동">
                ⋮⋮
              </DragHandle>
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
              <span>주요 카테고리</span>
              <strong>{dashboard.categorySales?.topCategory || "-"}</strong>
            </FooterStat>
          </Card>

          {/* 주간 출근 현황 */}
          <Card key="attendance">
            <CardHeader>
              <CardTitle>주간 출근 현황</CardTitle>
              <HeaderRight>
                <Subtle>이전 주</Subtle>
                <DragHandle className="drag-handle" title="드래그하여 이동">
                  ⋮⋮
                </DragHandle>
              </HeaderRight>
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
        </GridLayout>
      </GridLayoutContainer>
    </Wrapper>
  );
}

export default BranchDashboard;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
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
  transition: background 0.2s;

  &:hover {
    background: ${(p) => (p.$primary ? "#16a34a" : "rgba(255,255,255,0.1)")};
  }
`;

const ResetBtn = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.5);
  background: rgba(239, 68, 68, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
  margin-left: 8px;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

const ResetIcon = styled.span`
  font-size: 14px;
  display: inline-block;
`;

const GridLayoutContainer = styled.div`
  width: 100%;
  max-width: 100%;
  position: relative;
  overflow-x: hidden;
  overflow-y: visible;

  .react-grid-layout {
    position: relative;
    min-height: 800px;
    width: 100% !important;
  }

  .react-grid-item {
    transition: all 200ms ease;
    transition-property: left, top, width, height;
    box-sizing: border-box;
  }

  .react-grid-item.cssTransforms {
    transition-property: transform, width, height;
  }

  .react-grid-item.resizing {
    transition: none;
    z-index: 1;
    will-change: width, height;
  }

  .react-grid-item.react-draggable-dragging {
    transition: none;
    z-index: 3;
    will-change: transform;
  }

  .react-grid-item.react-grid-placeholder {
    background: rgba(139, 92, 246, 0.1);
    opacity: 0.2;
    transition-duration: 100ms;
    z-index: 2;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    -o-user-select: none;
    user-select: none;
    border-radius: 12px;
    border: 2px dashed #8b5cf6;
  }

  .react-grid-item > .react-resizable-handle {
    position: absolute;
    width: 20px;
    height: 20px;
    bottom: 0;
    right: 0;
    cursor: se-resize;
  }

  .react-grid-item > .react-resizable-handle::after {
    content: "";
    position: absolute;
    right: 3px;
    bottom: 3px;
    width: 5px;
    height: 5px;
    border-right: 2px solid rgba(0, 0, 0, 0.3);
    border-bottom: 2px solid rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 1200px) {
    .react-grid-layout {
      width: 100% !important;
    }
  }

  @media (max-width: 768px) {
    .react-grid-layout {
      width: 100% !important;
    }
  }
`;

const DragHandle = styled.div`
  cursor: grab;
  color: #9ca3af;
  font-size: 16px;
  line-height: 1;
  padding: 4px 8px;
  user-select: none;
  transition: color 0.2s;

  &:hover {
    color: #6366f1;
  }

  &:active {
    cursor: grabbing;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 280px; /* 카드 최소 너비 보장 */
  box-sizing: border-box;
  
  &:hover {
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: box-shadow 0.2s;
  }
  
  @media (max-width: 768px) {
    min-width: 250px;
    padding: 16px;
  }
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

const DashboardSkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  padding: 24px;
`;

const DashboardSkeletonCard = styled.div`
  grid-column: span 4;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e5e7eb;
`;

const SkeletonHeader = styled.div`
  margin-bottom: 12px;
`;

const SkeletonBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const SkeletonText = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'width' && prop !== 'height',
})`
  background: #e5e7eb;
  background-image: linear-gradient(
    to right,
    #e5e7eb 0%,
    #f3f4f6 20%,
    #e5e7eb 40%,
    #e5e7eb 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  height: ${props => props.height || '16px'};
  width: ${props => props.width || '100%'};
`;

const SkeletonChart = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'height',
})`
  background: #e5e7eb;
  background-image: linear-gradient(
    to right,
    #e5e7eb 0%,
    #f3f4f6 20%,
    #e5e7eb 40%,
    #e5e7eb 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
  height: ${props => props.height || '120px'};
  width: 100%;
  margin-top: 8px;
`;


