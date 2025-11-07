import React, { useEffect, useState, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
import { Icon } from "@mdi/react";
import { mdiChartLine } from "@mdi/js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchBranchSalesForecastForBranch } from "../../stores/slices/salesReportSlice";
import { salesReportService } from "../../service/salesReportService";
import { useToast } from "../../components/common/Toast";

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InputContainer = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  width: 200px;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const InfoCard = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  border-left: 4px solid #6b46c1;
`;

const InfoLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const InfoValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:hover {
    background: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #1f2937;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => (props.$type === "current" ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$type === "current" ? "#16a34a" : "#6b7280")};
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

const BranchSalesForecastTab = React.forwardRef(({ branchId }, ref) => {
  const dispatch = useDispatch();
  const { branchSalesForecast, loading, error } = useSelector(
    (state) => state.salesReport
  );
  const toast = useToast();

  // 기본값: 오늘 날짜
  const [targetDate, setTargetDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    if (branchId) {
      dispatch(fetchBranchSalesForecastForBranch({ branchId, targetDate }));
    }
  }, [dispatch, branchId, targetDate]);

  useImperativeHandle(ref, () => ({
    exportExcel: async () => {
      try {
        await salesReportService.exportBranchSalesForecast(
          branchId,
          targetDate
        );
        toast.addToast({
          type: "success",
          title: "다운로드 완료",
          message: "예상 매출액 엑셀 파일이 다운로드되었습니다.",
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
    if (!branchSalesForecast?.forecastHistory) return [];

    return branchSalesForecast.forecastHistory.map((item, index) => ({
      name: `이력 ${index + 1}`,
      예상매출: item.amount || 0,
      일자: format(new Date(item.createdAt), "yyyy-MM-dd"),
    }));
  };

  const chartData = prepareChartData();

  if (loading) {
    return (
      <>
        <Card>
          <SkeletonLine height="28px" width="200px" />
          <SkeletonLine height="40px" width="200px" />
        </Card>
        <Card>
          <SkeletonLine height="28px" width="200px" />
          <InfoGrid>
            <InfoCard>
              <SkeletonLine height="16px" />
              <SkeletonLine height="32px" />
            </InfoCard>
          </InfoGrid>
        </Card>
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

  if (!branchSalesForecast) {
    return (
      <Card>
        <div style={{ color: "#6b7280", textAlign: "center", padding: "24px" }}>
          예상 매출액 데이터를 불러오는 중입니다.
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardTitle>조회 기간 설정</CardTitle>
        <InputContainer>
          <Label>목표 일자</Label>
          <Input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </InputContainer>
      </Card>

      {branchSalesForecast.currentForecast && (
        <Card>
          <CardTitle>
            <Icon path={mdiChartLine} size={1} />
            현재 예상 매출액
          </CardTitle>
          <InfoGrid>
            <InfoCard>
              <InfoLabel>지점명</InfoLabel>
              <InfoValue>{branchSalesForecast.branchName || "N/A"}</InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>예상 매출액</InfoLabel>
              <InfoValue>
                {formatCurrency(
                  branchSalesForecast.currentForecast.amount || 0
                )}
              </InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>기간</InfoLabel>
              <InfoValue>
                {branchSalesForecast.currentForecast.periodStart &&
                branchSalesForecast.currentForecast.periodEnd
                  ? `${format(new Date(branchSalesForecast.currentForecast.periodStart), "yyyy-MM-dd")} ~ ${format(new Date(branchSalesForecast.currentForecast.periodEnd), "yyyy-MM-dd")}`
                  : "N/A"}
              </InfoValue>
            </InfoCard>
            <InfoCard>
              <InfoLabel>생성일시</InfoLabel>
              <InfoValue>
                {branchSalesForecast.currentForecast.createdAt
                  ? format(
                      new Date(branchSalesForecast.currentForecast.createdAt),
                      "yyyy-MM-dd HH:mm"
                    )
                  : "N/A"}
              </InfoValue>
            </InfoCard>
            {branchSalesForecast.currentForecast.forecastBasis && (
              <InfoCard style={{ gridColumn: "1 / -1" }}>
                <InfoLabel>예측 근거</InfoLabel>
                <InfoValue
                  style={{ fontSize: "14px", wordBreak: "break-word" }}
                >
                  {branchSalesForecast.currentForecast.forecastBasis}
                </InfoValue>
              </InfoCard>
            )}
          </InfoGrid>
        </Card>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardTitle>예상 매출액 이력 추이</CardTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="예상매출"
                stroke="#6b46c1"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {branchSalesForecast.forecastHistory &&
        branchSalesForecast.forecastHistory.length > 0 && (
          <Card>
            <CardTitle>예상 매출액 이력 테이블</CardTitle>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>예상 매출액</TableHeaderCell>
                  <TableHeaderCell>기간</TableHeaderCell>
                  <TableHeaderCell>생성일시</TableHeaderCell>
                  <TableHeaderCell>상태</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <tbody>
                {branchSalesForecast.forecastHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatCurrency(item.amount || 0)}</TableCell>
                    <TableCell>
                      {item.periodStart && item.periodEnd
                        ? `${format(new Date(item.periodStart), "yyyy-MM-dd")} ~ ${format(new Date(item.periodEnd), "yyyy-MM-dd")}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {item.createdAt
                        ? format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {index === 0 ? (
                        <Badge $type="current">현재</Badge>
                      ) : (
                        <Badge>이력</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
    </>
  );
});

BranchSalesForecastTab.displayName = "BranchSalesForecastTab";

export default BranchSalesForecastTab;
