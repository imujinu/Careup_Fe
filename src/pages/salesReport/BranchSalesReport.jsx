import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import excelIcon from "../../assets/icons/microsoft_excel-logo.wine.svg";
import { useToast } from "../../components/common/Toast";
import BranchSalesStatistics from "./BranchSalesStatistics";
import BranchProductSales from "./BranchProductSales";
import BranchNeighborhoodComparison from "./BranchNeighborhoodComparison";
import BranchSalesForecastTab from "./BranchSalesForecastTab";

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

function BranchSalesReport() {
  const { branchId } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.salesReport);
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

  const [activeTab, setActiveTab] = useState("statistics");
  const [startDate, setStartDate] = useState(getDefaultDates().startDate);
  const [endDate, setEndDate] = useState(getDefaultDates().endDate);
  const [periodType, setPeriodType] = useState("DAY");

  const statisticsExportRef = useRef(null);
  const productSalesExportRef = useRef(null);
  const comparisonExportRef = useRef(null);
  const forecastExportRef = useRef(null);

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
      // activeTab에 따라 다른 엑셀 다운로드 함수 호출
      switch (activeTab) {
        case "statistics":
          if (statisticsExportRef.current) {
            await statisticsExportRef.current.exportExcel();
          }
          break;
        case "products":
          if (productSalesExportRef.current) {
            await productSalesExportRef.current.exportExcel();
          }
          break;
        case "comparison":
          if (comparisonExportRef.current) {
            await comparisonExportRef.current.exportExcel();
          }
          break;
        case "forecast":
          if (forecastExportRef.current) {
            await forecastExportRef.current.exportExcel();
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

  const formatDateForInput = (date) => {
    return format(date, "yyyy-MM-dd");
  };

  const renderTabContent = () => {
    if (!branchId) {
      return (
        <div style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
          지점 정보를 불러올 수 없습니다.
        </div>
      );
    }

    switch (activeTab) {
      case "statistics":
        return (
          <BranchSalesStatistics
            ref={statisticsExportRef}
            branchId={branchId}
            startDate={startDate}
            endDate={endDate}
            periodType={periodType}
          />
        );
      case "products":
        return (
          <BranchProductSales
            ref={productSalesExportRef}
            branchId={branchId}
            startDate={startDate}
            endDate={endDate}
          />
        );
      case "comparison":
        return (
          <BranchNeighborhoodComparison
            ref={comparisonExportRef}
            branchId={branchId}
            startDate={startDate}
            endDate={endDate}
          />
        );
      case "forecast":
        return (
          <BranchSalesForecastTab ref={forecastExportRef} branchId={branchId} />
        );
      default:
        return (
          <BranchSalesStatistics
            ref={statisticsExportRef}
            branchId={branchId}
            startDate={startDate}
            endDate={endDate}
            periodType={periodType}
          />
        );
    }
  };

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
        <Tab
          $active={activeTab === "statistics"}
          onClick={() => setActiveTab("statistics")}
        >
          매출 통계
        </Tab>
        <Tab
          $active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
        >
          상품별 매출
        </Tab>
        <Tab
          $active={activeTab === "comparison"}
          onClick={() => setActiveTab("comparison")}
        >
          인근 지역 비교
        </Tab>
        <Tab
          $active={activeTab === "forecast"}
          onClick={() => setActiveTab("forecast")}
        >
          예상 매출액
        </Tab>
      </TabContainer>

      {activeTab !== "forecast" && (
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

export default BranchSalesReport;
