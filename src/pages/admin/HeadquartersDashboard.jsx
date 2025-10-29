import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Icon } from "@mdi/react";
import {
  mdiOfficeBuilding,
  mdiAccountGroup,
  mdiCash,
  mdiTrendingUp,
  mdiGift,
  mdiTrophy,
  mdiCrown,
  mdiAlertCircle,
} from "@mdi/js";
import dashboardService from "../../service/dashboardService";

const DashboardContainer = styled.div`
  width: 100%;
  padding: 24px;
  background: #f9fafb;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const EditButton = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;

  &:hover {
    background: #2563eb;
  }
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
`;

const KPICard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const KPIIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background: ${(props) => props.$bgColor || "#f3f4f6"};
  border-radius: 12px;
  margin-bottom: 16px;
`;

const KPILabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const KPIValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const KPIChange = styled.div`
  font-size: 14px;
  color: ${(props) => (props.$positive ? "#10b981" : "#ef4444")};
`;

const HighlightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
`;

const HighlightCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  ${(props) => props.$warning && "background: #fef2f2;"}
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ChartSubtitle = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const MoreLink = styled.a`
  font-size: 14px;
  color: #3b82f6;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  padding: 8px 16px;
  background: ${(props) => (props.$active ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  border: 1px solid ${(props) => (props.$active ? "#3b82f6" : "#e5e7eb")};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    ${(props) => !props.$active && "background: #f9fafb;"}
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.$color || "#1f2937"};
`;

const InventoryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 32px;
`;

const NotificationsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: ${(props) => (props.$danger ? "#ef4444" : "#3b82f6")};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;

  &:hover {
    background: ${(props) => (props.$danger ? "#dc2626" : "#2563eb")};
  }
`;

const WeeklyData = [
  { day: "월", actual: 4.5, target: 3.0 },
  { day: "화", actual: 5.2, target: 3.0 },
  { day: "수", actual: 4.8, target: 3.0 },
  { day: "목", actual: 5.5, target: 3.0 },
  { day: "금", actual: 6.2, target: 3.0 },
  { day: "토", actual: 7.1, target: 3.0 },
  { day: "일", actual: 6.8, target: 3.0 },
];

const CategoryData = [
  { name: "정식 시리즈", value: 22.8, color: "#3b82f6" },
  { name: "덮밥", value: 18.5, color: "#f97316" },
  { name: "프리미엄 시리즈", value: 15.2, color: "#eab308" },
  { name: "고기고기 시리즈", value: 12.3, color: "#10b981" },
  { name: "마요마요 시리즈", value: 10.8, color: "#8b5cf6" },
  { name: "모둠 시리즈", value: 8.2, color: "#06b6d4" },
  { name: "비빔밥 시리즈", value: 7.5, color: "#ef4444" },
  { name: "볶음밥 시리즈", value: 4.7, color: "#059669" },
];

const InventoryData = [
  { branch: "천호점", item: "브라질산 닭고기", shortage: 240 },
  { branch: "사당점", item: "브라질산 닭고기", shortage: 210 },
  { branch: "신촌점", item: "브라질산 닭고기", shortage: 190 },
  { branch: "잠실점", item: "브라질산 닭고기", shortage: 185 },
  { branch: "판교점", item: "브라질산 닭고기", shortage: 170 },
  { branch: "강남점", item: "국내산 소고기", shortage: 160 },
  { branch: "분당정자점", item: "국내산 소고기", shortage: 145 },
  { branch: "부산서면점", item: "국내산 소고기", shortage: 135 },
  { branch: "역삼점", item: "스팸", shortage: 100 },
  { branch: "수원인계점", item: "계란", shortage: 85 },
];

const NotificationsData = [
  {
    id: 3,
    title: "위생점검 강화 지침 (식약청 점검 예정)",
    author: "[부장] 최재혁",
    createdAt: "2025-09-22 오후 04시 21분",
    modifiedAt: "2025-09-22 오후 05시 31분",
  },
  {
    id: 2,
    title: "신제품 출시/프로모션 운영 지침",
    author: "[차장] 이우영",
    createdAt: "2025-09-21 오후 01시 10분",
    modifiedAt: "-",
  },
  {
    id: 1,
    title: "안녕하세요, 대표이사 이승지입니다.",
    author: "[대표] 이승지",
    createdAt: "2025-09-20 오전 10시 00분",
    modifiedAt: "-",
  },
];

const HeadquartersDashboard = () => {
  const [salesPeriod, setSalesPeriod] = useState("WEEK");
  const [categoryPeriod, setCategoryPeriod] = useState("WEEK");
  const [kpiData, setKpiData] = useState({
    totalBranches: 324,
    totalEmployees: 1247,
    avgMonthlySales: 240,
    branchGrowthRate: 12.5,
    employeeGrowthRate: 8.2,
    salesGrowthRate: 23.1,
    annualGrowthRate: 18.2,
  });
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 실제 API를 호출하여 데이터 가져오기
      const kpi = await dashboardService.getDashboardKPI();
      console.log("Dashboard KPI Data:", kpi);
      setKpiData(kpi);

      // 매출 데이터 가져오기
      const sales = await dashboardService.getSalesStatistics(salesPeriod);
      console.log("Sales Data:", sales);
      setSalesData(sales);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salesPeriod) {
      const loadSalesData = async () => {
        try {
          const sales = await dashboardService.getSalesStatistics(salesPeriod);
          setSalesData(sales);
        } catch (error) {
          console.error("Failed to load sales data:", error);
        }
      };
      loadSalesData();
    }
  }, [salesPeriod]);

  const formatCurrency = (value) => {
    if (value >= 10000) {
      return `₩${value / 10000}만`;
    }
    return `₩${value}`;
  };

  const formatLargeNumber = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value;
  };

  // 매출 데이터를 차트 형식으로 변환
  const getChartData = () => {
    if (!salesData || !salesData.statistics) {
      return WeeklyData;
    }

    return salesData.statistics.map((item) => {
      const date = item.period || item.date;
      const day = date ? new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }).replace('.', '') : '';
      return {
        day: day || date,
        actual: item.totalSales ? item.totalSales / 1000 : 0,
        target: 3.0, // 목표 매출은 하드코딩
      };
    });
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
      </DashboardContainer>
    );
  }

  const chartData = getChartData();

  return (
    <DashboardContainer>
      <DashboardHeader>
        <Title>한솥도시락 대시보드에 오신 것을 환영합니다.</Title>
        <EditButton>편집</EditButton>
      </DashboardHeader>

      {/* KPI Cards */}
      <KPIGrid>
        <KPICard>
          <KPIIcon $bgColor="#ede9fe">
            <Icon path={mdiOfficeBuilding} size={1.5} color="#6b46c1" />
          </KPIIcon>
          <KPILabel>총 지점 수</KPILabel>
          <KPIValue>{kpiData.totalBranches}</KPIValue>
          <KPIChange $positive>
            +{kpiData.branchGrowthRate}% 전월 대비
          </KPIChange>
        </KPICard>

        <KPICard>
          <KPIIcon $bgColor="#dbeafe">
            <Icon path={mdiAccountGroup} size={1.5} color="#3b82f6" />
          </KPIIcon>
          <KPILabel>총 직원 수</KPILabel>
          <KPIValue>{kpiData.totalEmployees.toLocaleString()}</KPIValue>
          <KPIChange $positive>+{kpiData.employeeGrowthRate}% 전월 대비</KPIChange>
        </KPICard>

        <KPICard>
          <KPIIcon $bgColor="#d1fae5">
            <Icon path={mdiCash} size={1.5} color="#10b981" />
          </KPIIcon>
          <KPILabel>평균 월간 매출</KPILabel>
          <KPIValue>₩ {kpiData.avgMonthlySales}억</KPIValue>
          <KPIChange $positive>+{kpiData.salesGrowthRate}% 전월 대비</KPIChange>
        </KPICard>

        <KPICard>
          <KPIIcon $bgColor="#fef3c7">
            <Icon path={mdiTrendingUp} size={1.5} color="#f59e0b" />
          </KPIIcon>
          <KPILabel>연간 성장률</KPILabel>
          <KPIValue>{kpiData.annualGrowthRate}%</KPIValue>
          <KPIChange $positive>전년 동월 대비 +4.3% 전월 대비</KPIChange>
        </KPICard>
      </KPIGrid>

      {/* Highlights */}
      <HighlightsGrid>
        <HighlightCard>
          <KPIIcon $bgColor="#ede9fe">
            <Icon path={mdiGift} size={1.5} color="#6b46c1" />
          </KPIIcon>
          <KPILabel>월간 인기 상품</KPILabel>
          <KPIValue style={{ fontSize: "20px" }}>빅치킨마요</KPIValue>
          <KPILabel style={{ fontSize: "12px", marginTop: "8px" }}>
            전국 지점
          </KPILabel>
        </HighlightCard>

        <HighlightCard>
          <KPIIcon $bgColor="#fef3c7">
            <Icon path={mdiTrophy} size={1.5} color="#f59e0b" />
          </KPIIcon>
          <KPILabel>이달의 우수 지점</KPILabel>
          <KPIValue style={{ fontSize: "20px" }}>동작 1점</KPIValue>
          <KPILabel style={{ fontSize: "12px", marginTop: "8px" }}>
            김상환
          </KPILabel>
        </HighlightCard>

        <HighlightCard>
          <KPIIcon $bgColor="#fce7f3">
            <Icon path={mdiCrown} size={1.5} color="#ec4899" />
          </KPIIcon>
          <KPILabel>이달의 판매왕</KPILabel>
          <KPIValue style={{ fontSize: "20px" }}>김상환</KPIValue>
          <KPILabel style={{ fontSize: "12px", marginTop: "8px" }}>
            동작 1점
          </KPILabel>
        </HighlightCard>

        <HighlightCard $warning>
          <KPIIcon $bgColor="#fee2e2">
            <Icon path={mdiAlertCircle} size={1.5} color="#ef4444" />
          </KPIIcon>
          <KPILabel>매출 저조 지점</KPILabel>
          <KPIValue style={{ fontSize: "20px" }}>고양삼송점</KPIValue>
          <KPILabel style={{ fontSize: "12px", marginTop: "8px" }}>
            임성후
          </KPILabel>
        </HighlightCard>
      </HighlightsGrid>

      {/* Sales Charts */}
      <ChartGrid>
        <ChartCard>
          <ChartHeader>
            <div>
              <ChartTitle>매출 현황</ChartTitle>
              <ChartSubtitle>전국 지점</ChartSubtitle>
            </div>
            <MoreLink>더보기</MoreLink>
          </ChartHeader>

          <TabContainer>
            <Tab $active={salesPeriod === "WEEK"} onClick={() => setSalesPeriod("WEEK")}>
              주간
            </Tab>
            <Tab
              $active={salesPeriod === "MONTH"}
              onClick={() => setSalesPeriod("MONTH")}
            >
              월간
            </Tab>
            <Tab $active={salesPeriod === "YEAR"} onClick={() => setSalesPeriod("YEAR")}>
              연간
            </Tab>
          </TabContainer>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                name="실제 매출"
                unit="k"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#3b82f6"
                strokeWidth={2}
                name="목표 매출"
                unit="k"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <div>
              <ChartTitle>카테고리별 매출 비중</ChartTitle>
              <ChartSubtitle>전국 지점</ChartSubtitle>
            </div>
            <MoreLink>더보기</MoreLink>
          </ChartHeader>

          <TabContainer>
            <Tab
              $active={categoryPeriod === "WEEK"}
              onClick={() => setCategoryPeriod("WEEK")}
            >
              주간
            </Tab>
            <Tab
              $active={categoryPeriod === "MONTH"}
              onClick={() => setCategoryPeriod("MONTH")}
            >
              월간
            </Tab>
            <Tab
              $active={categoryPeriod === "YEAR"}
              onClick={() => setCategoryPeriod("YEAR")}
            >
              연간
            </Tab>
          </TabContainer>

          <div style={{ marginBottom: "10px", fontSize: "12px", color: "#6b7280" }}>
            2025.09.22 ~ 2025.09.22
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={CategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${value}%`}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
              >
                {CategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartGrid>

      {/* Inventory Status */}
      <InventoryCard>
        <ChartHeader>
          <div>
            <ChartTitle>재고 부족 현황</ChartTitle>
            <ChartSubtitle>전국 지점</ChartSubtitle>
          </div>
          <MoreLink>더보기</MoreLink>
        </ChartHeader>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={InventoryData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="branch" type="category" width={80} />
            <Tooltip />
            <Bar dataKey="shortage" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </InventoryCard>

      {/* Notifications */}
      <NotificationsCard>
        <ChartHeader>
          <div>
            <ChartTitle>공지사항</ChartTitle>
            <ChartSubtitle>전국 지점</ChartSubtitle>
          </div>
          <MoreLink>더보기</MoreLink>
        </ChartHeader>

        <Table>
          <thead>
            <tr>
              <TableHeader>ID</TableHeader>
              <TableHeader>제목</TableHeader>
              <TableHeader>작성자</TableHeader>
              <TableHeader>작성일시</TableHeader>
              <TableHeader>수정일시</TableHeader>
              <TableHeader>조치</TableHeader>
            </tr>
          </thead>
          <tbody>
            {NotificationsData.map((notification) => (
              <tr key={notification.id}>
                <TableCell>{notification.id}</TableCell>
                <TableCell>{notification.title}</TableCell>
                <TableCell>{notification.author}</TableCell>
                <TableCell>{notification.createdAt}</TableCell>
                <TableCell>{notification.modifiedAt}</TableCell>
                <TableCell>
                  <ActionButton>수정</ActionButton>
                  <ActionButton $danger>삭제</ActionButton>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </Table>
      </NotificationsCard>
    </DashboardContainer>
  );
};

export default HeadquartersDashboard;

