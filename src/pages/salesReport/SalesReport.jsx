import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Icon } from "@mdi/react";
import { mdiCash, mdiPackageVariant, mdiHandCoin, mdiStore } from "@mdi/js";
import excelIcon from "../../assets/icons/microsoft_excel-logo.wine.svg";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  fetchAllBranchesSales,
  fetchBranchSalesDetail,
  fetchBranchComparison,
} from "../../stores/slices/salesReportSlice";
import { branchService } from "../../service/branchService";
import { salesReportService } from "../../service/salesReportService";
import { useToast } from "../../components/common/Toast";
import BranchDetail from "./BranchDetail";
import BranchComparison from "./BranchComparison";
import SalesForecast from "./SalesForecast";
import Royalty from "./Royalty";

const Container = styled.div`
  padding: 32px;
  background: #f9fafb;
  min-height: calc(100vh - 64px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
`;

const DateSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DateButton = styled.button`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s;

  &:hover {
    border-color: #6b46c1;
    color: #6b46c1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DateInput = styled.input`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const DateRangeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #6b7280;
`;

const DateRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const PeriodTabs = styled.div`
  display: flex;
  gap: 8px;
  background: white;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const PeriodTab = styled.button`
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: ${(props) => (props.$active ? "#6b46c1" : "transparent")};
  color: ${(props) => (props.$active ? "white" : "#6b7280")};
  font-size: 14px;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#6b46c1" : "#f3f4f6")};
  }
`;

const KPI = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const KPICard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const KPIIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(props) => props.$color || "#f3f4f6"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const KPIInfo = styled.div`
  flex: 1;
`;

const KPILabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const KPIValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const KPIChange = styled.div`
  font-size: 12px;
  color: ${(props) => (props.$positive ? "#059669" : "#dc2626")};
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border-radius: 8px 8px 0 0;
  border: none;
  background: ${(props) => (props.$active ? "white" : "#f3f4f6")};
  color: ${(props) => (props.$active ? "#6b46c1" : "#6b7280")};
  font-size: 15px;
  font-weight: ${(props) => (props.$active ? 600 : 400)};
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#6b46c1" : "transparent")};

  &:hover {
    background: ${(props) => (props.$active ? "white" : "#f9fafb")};
  }
`;

const ContentWrapper = styled.div`
  background: #f9fafb;
  padding: 24px;
  border-radius: 8px;
`;

const SkeletonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const SkeletonLine = styled.div`
  height: ${(props) => props.$height || "20px"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: loading 1.5s infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const ExcelButton = styled.button`
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #059669;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  box-sizing: border-box;

  &:hover {
    background: #dcfce7;
    border-color: #047857;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f3f4f6;
    border-color: #e5e7eb;
    color: #9ca3af;
  }

  img {
    width: 20px;
    height: 20px;
  }
`;

const KPISkeleton = () => (
  <KPICard>
    <SkeletonLine height="48px" width="48px" style={{ flexShrink: 0 }} />
    <div style={{ flex: 1 }}>
      <SkeletonLine height="16px" width="60px" />
      <SkeletonLine height="32px" width="120px" />
      <SkeletonLine height="14px" width="80px" />
    </div>
  </KPICard>
);

const formatCurrency = (value) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
  }).format(value);
};

function SalesReport() {
  const dispatch = useDispatch();
  const { allBranchesSales, loading, error } = useSelector(
    (state) => state.salesReport
  );
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // 기본값: 7일 전 ~ 오늘
  const getDefaultDates = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    return {
      startDate: sevenDaysAgo,
      endDate: today,
    };
  };

  const [activeTab, setActiveTab] = useState("all");
  const [startDate, setStartDate] = useState(getDefaultDates().startDate);
  const [endDate, setEndDate] = useState(getDefaultDates().endDate);
  const [periodType, setPeriodType] = useState("DAY");
  const branchDetailExportRef = useRef(null);
  const branchComparisonExportRef = useRef(null);
  const salesForecastExportRef = useRef(null);
  const royaltyExportRef = useRef(null);

  useEffect(() => {
    const startDateStr = format(startDate, "yyyy-MM-dd");
    const endDateStr = format(endDate, "yyyy-MM-dd");
    dispatch(
      fetchAllBranchesSales({
        startDate: startDateStr,
        endDate: endDateStr,
        periodType,
      })
    );
  }, [dispatch, startDate, endDate, periodType]);

  const handleStartDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (newDate <= endDate) {
      setStartDate(newDate);
    }
  };

  const handleEndDateChange = (e) => {
    const newDate = new Date(e.target.value);
    if (newDate >= startDate) {
      setEndDate(newDate);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const startDateStr = format(startDate, "yyyy-MM-dd");
      const endDateStr = format(endDate, "yyyy-MM-dd");

      // activeTab에 따라 다른 엑셀 다운로드 함수 호출
      switch (activeTab) {
        case "all":
          await salesReportService.exportAllBranchesSales(
            startDateStr,
            endDateStr,
            periodType
          );
          toast.addToast({
            type: "success",
            title: "다운로드 완료",
            message: "엑셀 파일이 다운로드되었습니다.",
          });
          break;
        case "branch":
          if (branchDetailExportRef.current) {
            await branchDetailExportRef.current.exportExcel();
          }
          break;
        case "comparison":
          if (branchComparisonExportRef.current) {
            await branchComparisonExportRef.current.exportExcel();
          }
          break;
        case "forecast":
          if (salesForecastExportRef.current) {
            await salesForecastExportRef.current.exportExcel();
          }
          break;
        case "royalty":
          if (royaltyExportRef.current) {
            await royaltyExportRef.current.exportExcel();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      toast.addToast({
        type: "error",
        title: "다운로드 실패",
        message: error.message || "엑셀 파일 다운로드에 실패했습니다.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviousWeek = () => {
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() - 1);
    const newStartDate = new Date(newEndDate);
    newStartDate.setDate(newStartDate.getDate() - daysDiff);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handleNextWeek = () => {
    const today = new Date();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const newStartDate = new Date(endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);

    if (newStartDate > today) return; // 미래로는 이동 불가

    const newEndDate = new Date(newStartDate);
    newEndDate.setDate(newEndDate.getDate() + daysDiff);

    if (newEndDate > today) {
      newEndDate.setTime(today.getTime());
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const handlePeriodTypeChange = (type) => {
    setPeriodType(type);

    const today = new Date();
    let newStartDate, newEndDate;

    switch (type) {
      case "DAY":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        break;
      case "WEEK":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        newStartDate.setDate(newStartDate.getDate() - 7);
        break;
      case "MONTH":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        newStartDate.setMonth(newStartDate.getMonth() - 1);
        break;
      case "YEAR":
        newEndDate = new Date(today);
        newStartDate = new Date(today);
        newStartDate.setFullYear(newStartDate.getFullYear() - 1);
        break;
      default:
        return;
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const formatDate = (date) => {
    return format(date, "yyyy.MM.dd(E)", { locale: ko });
  };

  const formatDateForInput = (date) => {
    return format(date, "yyyy-MM-dd");
  };

  const prepareChartData = () => {
    if (!allBranchesSales?.salesData) return [];
    return allBranchesSales.salesData.map((item) => ({
      date: item.date,
      총매출: item.totalSales || 0,
    }));
  };

  const chartData = prepareChartData();

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return renderAllSalesView();
      case "branch":
        return (
          <BranchDetail
            ref={branchDetailExportRef}
            startDate={startDate}
            endDate={endDate}
            periodType={periodType}
          />
        );
      case "comparison":
        return (
          <BranchComparison
            ref={branchComparisonExportRef}
            startDate={startDate}
            endDate={endDate}
            periodType={periodType}
          />
        );
      case "forecast":
        return <SalesForecast ref={salesForecastExportRef} />;
      case "royalty":
        return <Royalty ref={royaltyExportRef} />;
      default:
        return renderAllSalesView();
    }
  };

  const renderAllSalesView = () => (
    <>
      {loading ? (
        <>
          <KPI>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </KPI>
          <ChartCard>
            <SkeletonLine height="28px" width="200px" />
            <SkeletonLine height="300px" />
          </ChartCard>
        </>
      ) : error ? (
        <div>에러가 발생했습니다: {error}</div>
      ) : allBranchesSales ? (
        <>
          <KPI>
            <KPICard>
              <KPIIcon $color="#ede9fe">
                <Icon path={mdiCash} size={1.5} color="#6b46c1" />
              </KPIIcon>
              <KPIInfo>
                <KPILabel>총 매출</KPILabel>
                <KPIValue>
                  {formatCurrency(allBranchesSales.totalSales || 0)}
                </KPIValue>
                <KPIChange $positive>
                  평균:{" "}
                  {formatCurrency(allBranchesSales.averageSalesPerBranch || 0)}
                </KPIChange>
              </KPIInfo>
            </KPICard>
            <KPICard>
              <KPIIcon $color="#dbeafe">
                <Icon path={mdiPackageVariant} size={1.5} color="#3b82f6" />
              </KPIIcon>
              <KPIInfo>
                <KPILabel>총 주문</KPILabel>
                <KPIValue>{allBranchesSales.totalOrders || 0}건</KPIValue>
                <KPIChange $positive>
                  지점 수: {allBranchesSales.totalBranchCount || 0}
                </KPIChange>
              </KPIInfo>
            </KPICard>
            <KPICard>
              <KPIIcon $color="#d1fae5">
                <Icon path={mdiHandCoin} size={1.5} color="#10b981" />
              </KPIIcon>
              <KPIInfo>
                <KPILabel>평균 주문액</KPILabel>
                <KPIValue>
                  {allBranchesSales.totalSales && allBranchesSales.totalOrders
                    ? formatCurrency(
                        Math.floor(
                          allBranchesSales.totalSales /
                            allBranchesSales.totalOrders
                        )
                      )
                    : "0원"}
                </KPIValue>
                <KPIChange $positive>주문당 금액</KPIChange>
              </KPIInfo>
            </KPICard>
            <KPICard>
              <KPIIcon $color="#fef3c7">
                <Icon path={mdiStore} size={1.5} color="#f59e0b" />
              </KPIIcon>
              <KPIInfo>
                <KPILabel>주문 활성 지점</KPILabel>
                <KPIValue>
                  {allBranchesSales.salesData?.[0]?.activeBranchCount || 0}개
                  지점
                </KPIValue>
                <KPIChange $positive>판매 활동 중</KPIChange>
              </KPIInfo>
            </KPICard>
          </KPI>

          <ChartCard>
            <ChartTitle>일별 매출 추이 (천원단위)</ChartTitle>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="총매출" fill="#6b46c1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      ) : null}
    </>
  );

  return (
    <Container>
      <Header>
        <Title>매출 리포트</Title>
        <ExcelButton
          onClick={handleExportExcel}
          disabled={isExporting || loading}
        >
          <img src={excelIcon} alt="Excel" />
          엑셀 다운로드
        </ExcelButton>
      </Header>

      <TabContainer>
        <Tab $active={activeTab === "all"} onClick={() => setActiveTab("all")}>
          전체 매출
        </Tab>
        <Tab
          $active={activeTab === "branch"}
          onClick={() => setActiveTab("branch")}
        >
          지점 상세
        </Tab>
        <Tab
          $active={activeTab === "comparison"}
          onClick={() => setActiveTab("comparison")}
        >
          지점 비교
        </Tab>
        <Tab
          $active={activeTab === "forecast"}
          onClick={() => setActiveTab("forecast")}
        >
          예상 매출액
        </Tab>
        <Tab
          $active={activeTab === "royalty"}
          onClick={() => setActiveTab("royalty")}
        >
          로열티
        </Tab>
      </TabContainer>

      {activeTab !== "forecast" && activeTab !== "royalty" && (
        <ControlsRow>
          <DateRangeContainer>
            <DateSelector>
              <DateButton onClick={handlePreviousWeek}>◀</DateButton>
              <DateInput
                type="date"
                value={formatDateForInput(startDate)}
                onChange={handleStartDateChange}
                max={formatDateForInput(endDate)}
              />
              <DateRangeDisplay>~</DateRangeDisplay>
              <DateInput
                type="date"
                value={formatDateForInput(endDate)}
                onChange={handleEndDateChange}
                min={formatDateForInput(startDate)}
                max={formatDateForInput(new Date())}
              />
              <DateButton onClick={handleNextWeek}>▶</DateButton>
            </DateSelector>

            <PeriodTabs>
              <PeriodTab
                $active={periodType === "DAY"}
                onClick={() => handlePeriodTypeChange("DAY")}
              >
                일간
              </PeriodTab>
              <PeriodTab
                $active={periodType === "WEEK"}
                onClick={() => handlePeriodTypeChange("WEEK")}
              >
                주간
              </PeriodTab>
              <PeriodTab
                $active={periodType === "MONTH"}
                onClick={() => handlePeriodTypeChange("MONTH")}
              >
                월간
              </PeriodTab>
              <PeriodTab
                $active={periodType === "YEAR"}
                onClick={() => handlePeriodTypeChange("YEAR")}
              >
                연간
              </PeriodTab>
            </PeriodTabs>
          </DateRangeContainer>
        </ControlsRow>
      )}

      <ContentWrapper>{renderTabContent()}</ContentWrapper>
    </Container>
  );
}

export default SalesReport;
