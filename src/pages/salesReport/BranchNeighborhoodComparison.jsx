import React, { useEffect, useState, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
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
import { fetchNeighborhoodComparison } from "../../stores/slices/salesReportSlice";
import { salesReportService } from "../../service/salesReportService";
import { useToast } from "../../components/common/Toast";

const InputContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  width: 120px;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const SummaryCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #6b46c1;
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

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1f2937;
`;

const GrowthBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => (props.$positive ? "#dcfce7" : "#fee2e2")};
  color: ${(props) => (props.$positive ? "#16a34a" : "#dc2626")};
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

const formatCurrency = (value) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  if (value === null || value === undefined) return "0%";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const BranchNeighborhoodComparison = React.forwardRef(
  ({ branchId, startDate, endDate }, ref) => {
    const dispatch = useDispatch();
    const { neighborhoodComparison, loading, error } = useSelector(
      (state) => state.salesReport
    );
    const toast = useToast();
    const [radiusKm, setRadiusKm] = useState(10.0);

    useEffect(() => {
      if (branchId) {
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        dispatch(
          fetchNeighborhoodComparison({
            branchId,
            startDate: startDateStr,
            endDate: endDateStr,
            radiusKm,
          })
        );
      }
    }, [dispatch, branchId, startDate, endDate, radiusKm]);

    useImperativeHandle(ref, () => ({
      exportExcel: async () => {
        try {
          const startDateStr = format(startDate, "yyyy-MM-dd");
          const endDateStr = format(endDate, "yyyy-MM-dd");
          await salesReportService.exportNeighborhoodComparison(
            branchId,
            startDateStr,
            endDateStr,
            radiusKm
          );
          toast.addToast({
            type: "success",
            title: "다운로드 완료",
            message: "인근 지역 비교 엑셀 파일이 다운로드되었습니다.",
          });
        } catch (error) {
          toast.addToast({
            type: "error",
            title: "다운로드 실패",
            message: error.message || "엑셀 파일 다운로드에 실패했습니다.",
          });
        }
      },
    }));

    const prepareChartData = () => {
      if (!neighborhoodComparison || !Array.isArray(neighborhoodComparison))
        return [];

      return neighborhoodComparison.map((item) => ({
        name: item.branchName || `지점-${item.branchId}`,
        매출: item.totalSales || 0,
        주문수: item.totalOrders || 0,
        평균주문액: item.averageOrderAmount || 0,
      }));
    };

    const chartData = prepareChartData();

    // 평균 계산
    const calculateAverage = () => {
      if (!neighborhoodComparison || neighborhoodComparison.length === 0) {
        return { avgSales: 0, avgOrders: 0, avgOrderAmount: 0 };
      }

      const totalSales = neighborhoodComparison.reduce(
        (sum, item) => sum + (item.totalSales || 0),
        0
      );
      const totalOrders = neighborhoodComparison.reduce(
        (sum, item) => sum + (item.totalOrders || 0),
        0
      );
      const totalOrderAmount = neighborhoodComparison.reduce(
        (sum, item) => sum + (item.averageOrderAmount || 0),
        0
      );

      const count = neighborhoodComparison.length;

      return {
        avgSales: Math.floor(totalSales / count),
        avgOrders: Math.floor(totalOrders / count),
        avgOrderAmount: Math.floor(totalOrderAmount / count),
      };
    };

    const averages = calculateAverage();
    const currentBranch = neighborhoodComparison?.find(
      (item) => item.branchId === branchId
    );

    if (loading) {
      return (
        <>
          <InputContainer>
            <SkeletonLine height="40px" width="200px" />
          </InputContainer>
          <SummaryCard>
            <SummaryItem>
              <SkeletonLine height="16px" />
              <SkeletonLine height="32px" />
            </SummaryItem>
          </SummaryCard>
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

    if (!neighborhoodComparison || neighborhoodComparison.length === 0) {
      return (
        <div style={{ color: "#6b7280", padding: "24px", textAlign: "center" }}>
          인근 지역 가맹점 데이터가 없습니다.
        </div>
      );
    }

    return (
      <>
        <InputContainer>
          <InputGroup>
            <Label>반경 (km):</Label>
            <Input
              type="number"
              min="1"
              max="50"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value) || 10.0)}
            />
          </InputGroup>
        </InputContainer>

        <SummaryCard>
          <SummaryItem>
            <SummaryLabel>평균 매출</SummaryLabel>
            <SummaryValue>{formatCurrency(averages.avgSales)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>평균 주문수</SummaryLabel>
            <SummaryValue>{averages.avgOrders}건</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>평균 주문액</SummaryLabel>
            <SummaryValue>
              {formatCurrency(averages.avgOrderAmount)}
            </SummaryValue>
          </SummaryItem>
          {currentBranch && (
            <SummaryItem>
              <SummaryLabel>내 지점 매출</SummaryLabel>
              <SummaryValue>
                {formatCurrency(currentBranch.totalSales || 0)}
              </SummaryValue>
            </SummaryItem>
          )}
        </SummaryCard>

        {chartData.length > 0 && (
          <ChartCard>
            <ChartTitle>인근 가맹점 매출 비교</ChartTitle>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
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

        <ChartCard>
          <ChartTitle>인근 가맹점 상세 정보</ChartTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>지점명</TableHeaderCell>
                <TableHeaderCell>총 매출</TableHeaderCell>
                <TableHeaderCell>총 주문</TableHeaderCell>
                <TableHeaderCell>평균 주문액</TableHeaderCell>
                <TableHeaderCell>매출 성장률</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {neighborhoodComparison.map((item, index) => (
                <TableRow key={item.branchId || index}>
                  <TableCell>
                    {item.branchName || `지점-${item.branchId}`}
                    {item.branchId === branchId && (
                      <span
                        style={{
                          marginLeft: "8px",
                          color: "#6b46c1",
                          fontWeight: 600,
                        }}
                      >
                        (내 지점)
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(item.totalSales || 0)}</TableCell>
                  <TableCell>{item.totalOrders || 0}건</TableCell>
                  <TableCell>
                    {formatCurrency(item.averageOrderAmount || 0)}
                  </TableCell>
                  <TableCell>
                    {item.salesGrowthRate !== null &&
                    item.salesGrowthRate !== undefined ? (
                      <GrowthBadge $positive={item.salesGrowthRate >= 0}>
                        {formatPercent(item.salesGrowthRate)}
                      </GrowthBadge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </ChartCard>
      </>
    );
  }
);

BranchNeighborhoodComparison.displayName = "BranchNeighborhoodComparison";

export default BranchNeighborhoodComparison;
