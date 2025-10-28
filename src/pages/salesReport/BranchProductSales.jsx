import React, { useEffect, useState, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchBranchProductSales } from "../../stores/slices/salesReportSlice";
import { useToast } from "../../components/common/Toast";

const SelectContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 200px;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
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

const Badge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => {
    if (props.$type === "high") return "#dcfce7";
    if (props.$type === "medium") return "#fef3c7";
    return "#fee2e2";
  }};
  color: ${(props) => {
    if (props.$type === "high") return "#16a34a";
    if (props.$type === "medium") return "#d97706";
    return "#dc2626";
  }};
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
  return `${value.toFixed(1)}%`;
};

const BranchProductSales = React.forwardRef(
  ({ branchId, startDate, endDate }, ref) => {
    const dispatch = useDispatch();
    const { branchProductSales, loading, error } = useSelector(
      (state) => state.salesReport
    );
    const toast = useToast();
    const [sortType, setSortType] = useState("HIGH_SALES");

    useEffect(() => {
      if (branchId) {
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        dispatch(
          fetchBranchProductSales({
            branchId,
            startDate: startDateStr,
            endDate: endDateStr,
            sortType,
          })
        );
      }
    }, [dispatch, branchId, startDate, endDate, sortType]);

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
      if (!branchProductSales?.products) return [];

      return branchProductSales.products.slice(0, 10).map((item) => ({
        name: item.productName || "상품명 없음",
        매출: item.totalSales || 0,
        수량: item.totalQuantity || 0,
      }));
    };

    const chartData = prepareChartData();

    const getMarginBadgeType = (marginRate) => {
      if (marginRate >= 30) return "high";
      if (marginRate >= 15) return "medium";
      return "low";
    };

    if (loading) {
      return (
        <>
          <SelectContainer>
            <SkeletonLine height="40px" width="200px" />
          </SelectContainer>
          <ChartCard>
            <SkeletonLine height="28px" width="200px" />
            <SkeletonLine height="300px" />
          </ChartCard>
          <ChartCard>
            <SkeletonLine height="28px" width="200px" />
            <SkeletonLine height="400px" />
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

    if (!branchProductSales) {
      return null;
    }

    return (
      <>
        <SelectContainer>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#374151",
            }}
          >
            정렬 기준
          </label>
          <Select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
          >
            <option value="HIGH_SALES">매출액 높은순</option>
            <option value="LOW_SALES">매출액 낮은순</option>
            <option value="HIGH_MARGIN">마진율 높은순</option>
            <option value="LOW_MARGIN">마진율 낮은순</option>
          </Select>
        </SelectContainer>

        {chartData.length > 0 && (
          <ChartCard>
            <ChartTitle>상위 10개 상품 매출 비교</ChartTitle>
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
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend />
                <Bar dataKey="매출" fill="#6b46c1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <ChartCard>
          <ChartTitle>상품별 매출 상세</ChartTitle>
          {branchProductSales.products &&
          branchProductSales.products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>상품명</TableHeaderCell>
                  <TableHeaderCell>총 판매 수량</TableHeaderCell>
                  <TableHeaderCell>총 매출액</TableHeaderCell>
                  <TableHeaderCell>평균 판매가</TableHeaderCell>
                  <TableHeaderCell>공급가</TableHeaderCell>
                  <TableHeaderCell>마진율</TableHeaderCell>
                  <TableHeaderCell>주문 횟수</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <tbody>
                {branchProductSales.products.map((product, index) => (
                  <TableRow key={product.productId || index}>
                    <TableCell>
                      {product.productName || "상품명 없음"}
                    </TableCell>
                    <TableCell>{product.totalQuantity || 0}개</TableCell>
                    <TableCell>
                      {formatCurrency(product.totalSales || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.averageSellingPrice || 0)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(product.supplyPrice || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        $type={getMarginBadgeType(product.marginRate || 0)}
                      >
                        {formatPercent(product.marginRate || 0)}
                      </Badge>
                    </TableCell>
                    <TableCell>{product.orderCount || 0}회</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          ) : (
            <div
              style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}
            >
              상품별 매출 데이터가 없습니다.
            </div>
          )}
        </ChartCard>
      </>
    );
  }
);

BranchProductSales.displayName = "BranchProductSales";

export default BranchProductSales;
