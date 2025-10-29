import React, { useEffect, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
import { Icon } from "@mdi/react";
import { mdiCash, mdiPackageVariant, mdiHandCoin } from "@mdi/js";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchBranchSalesStatistics } from "../../stores/slices/salesReportSlice";
import { useToast } from "../../components/common/Toast";

const KPI = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

const BranchSalesStatistics = React.forwardRef(
  ({ branchId, startDate, endDate, periodType }, ref) => {
    const dispatch = useDispatch();
    const { branchSalesStatistics, loading, error } = useSelector(
      (state) => state.salesReport
    );
    const toast = useToast();

    useEffect(() => {
      if (branchId) {
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        dispatch(
          fetchBranchSalesStatistics({
            branchId,
            startDate: startDateStr,
            endDate: endDateStr,
            periodType,
          })
        );
      }
    }, [dispatch, branchId, startDate, endDate, periodType]);

    useImperativeHandle(ref, () => ({
      exportExcel: async () => {
        toast.addToast({
          type: "info",
          title: "준비중",
          message: "엑셀 다운로드 기능은 준비중입니다.",
        });
      },
    }));

    const prepareChartData = () => {
      if (!branchSalesStatistics?.statistics) return [];

      return branchSalesStatistics.statistics.map((item) => {
        const chartItem = {
          period:
            item.period ||
            item.date ||
            (item.hour !== null && item.hour !== undefined
              ? `${item.hour}시`
              : ""),
          매출: item.totalSales || 0,
          주문수: item.totalOrders || 0,
          평균주문액: item.averageOrderAmount || 0,
        };

        // 요일별 데이터가 있는 경우
        if (item.dayOfWeek) {
          chartItem.period = item.dayOfWeek;
        }

        return chartItem;
      });
    };

    const chartData = prepareChartData();

    if (loading) {
      return (
        <>
          <KPI>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </KPI>
          <ChartCard>
            <SkeletonLine height="28px" width="200px" />
            <SkeletonLine height="300px" />
          </ChartCard>
        </>
      );
    }

    if (error) {
      return (
        <div style={{ color: "#dc2626", padding: "24px", textAlign: "center" }}>
          에러가 발생했습니다: {error}
        </div>
      );
    }

    if (!branchSalesStatistics) {
      return null;
    }

    return (
      <>
        <KPI>
          <KPICard>
            <KPIIcon $color="#ede9fe">
              <Icon path={mdiCash} size={1.5} color="#6b46c1" />
            </KPIIcon>
            <KPIInfo>
              <KPILabel>총 매출</KPILabel>
              <KPIValue>
                {formatCurrency(branchSalesStatistics.totalSales || 0)}
              </KPIValue>
              <KPIChange $positive>
                기간: {format(startDate, "yyyy.MM.dd")} ~{" "}
                {format(endDate, "yyyy.MM.dd")}
              </KPIChange>
            </KPIInfo>
          </KPICard>
          <KPICard>
            <KPIIcon $color="#dbeafe">
              <Icon path={mdiPackageVariant} size={1.5} color="#3b82f6" />
            </KPIIcon>
            <KPIInfo>
              <KPILabel>총 주문</KPILabel>
              <KPIValue>{branchSalesStatistics.totalOrders || 0}건</KPIValue>
            </KPIInfo>
          </KPICard>
          <KPICard>
            <KPIIcon $color="#d1fae5">
              <Icon path={mdiHandCoin} size={1.5} color="#10b981" />
            </KPIIcon>
            <KPIInfo>
              <KPILabel>평균 주문액</KPILabel>
              <KPIValue>
                {branchSalesStatistics.totalSales &&
                branchSalesStatistics.totalOrders
                  ? formatCurrency(
                      Math.floor(
                        branchSalesStatistics.totalSales /
                          branchSalesStatistics.totalOrders
                      )
                    )
                  : "0원"}
              </KPIValue>
            </KPIInfo>
          </KPICard>
        </KPI>

        {chartData.length > 0 && (
          <ChartCard>
            <ChartTitle>
              {periodType === "HOUR"
                ? "시간별"
                : periodType === "DAY_OF_WEEK"
                  ? "요일별"
                  : "기간별"}{" "}
              매출 추이
            </ChartTitle>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "매출" || name === "평균주문액") {
                      return formatCurrency(value);
                    }
                    return value;
                  }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="매출" fill="#6b46c1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {chartData.length > 0 && (
          <ChartCard>
            <ChartTitle>주문 추이</ChartTitle>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "평균주문액") {
                      return formatCurrency(value);
                    }
                    return value;
                  }}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="주문수"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="평균주문액"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </>
    );
  }
);

BranchSalesStatistics.displayName = "BranchSalesStatistics";

export default BranchSalesStatistics;

