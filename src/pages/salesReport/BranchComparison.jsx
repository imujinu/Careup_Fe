import React, { useState, useEffect, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Icon } from '@mdi/react';
import { mdiFileExcel } from '@mdi/js';
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
} from 'recharts';
import { fetchBranchComparison } from '../../stores/slices/salesReportSlice';
import { branchService } from '../../service/branchService';
import { salesReportService } from '../../service/salesReportService';
import { useToast } from '../../components/common/Toast';

const SelectContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    border-color: #6b46c1;
    background: #f9fafb;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  ${props => props.$checked && `
    border-color: #6b46c1;
    background: #f3f4f6;
    color: #6b46c1;
    font-weight: 600;
  `}
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

const TableBody = styled.tbody``;

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

const SkeletonLine = styled.div`
  height: ${props => props.$height || '20px'};
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
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(value);
};

const ExcelButton = styled.button`
  background: #059669;
  color: white;
  border: none;
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
    background: #047857;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BranchComparison = React.forwardRef(({ startDate, endDate, periodType }, ref) => {
  const dispatch = useDispatch();
  const { branchComparison, loading, error } = useSelector((state) => state.salesReport);
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranchIds, setSelectedBranchIds] = useState([]);

  // 지점 목록 가져오기
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchService.fetchBranches({ size: 100 });
        setBranches(response.data || []);
      } catch (err) {
        console.error('지점 목록 가져오기 실패:', err);
      }
    };
    fetchBranches();
  }, []);

  // 선택한 지점들의 매출 비교 데이터 가져오기
  useEffect(() => {
    if (selectedBranchIds.length > 0) {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      dispatch(fetchBranchComparison({ 
        branchIds: selectedBranchIds,
        startDate: startDateStr,
        endDate: endDateStr,
        periodType
      }));
    }
  }, [dispatch, selectedBranchIds, startDate, endDate, periodType]);

  const handleBranchToggle = (branchId) => {
    setSelectedBranchIds(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
  };

  const handleExportExcel = async () => {
    if (selectedBranchIds.length < 2) {
      toast.addToast({
        type: 'error',
        title: '다운로드 실패',
        message: '최소 2개 이상의 지점을 선택해주세요.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      await salesReportService.exportBranchComparisonSales(
        selectedBranchIds,
        startDateStr,
        endDateStr,
        periodType
      );
      
      toast.addToast({
        type: 'success',
        title: '다운로드 완료',
        message: '엑셀 파일이 다운로드되었습니다.',
      });
    } catch (error) {
      toast.addToast({
        type: 'error',
        title: '다운로드 실패',
        message: error.message || '엑셀 파일 다운로드에 실패했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportExcel: handleExportExcel,
    isExporting,
  }));

  const prepareChartData = () => {
    if (!branchComparison?.comparisonData) return [];
    
    // 지점별 날짜별 데이터를 가공
    const dataMap = new Map();
    
    branchComparison.comparisonData.forEach((item) => {
      if (!dataMap.has(item.date)) {
        dataMap.set(item.date, { date: item.date });
      }
      dataMap.get(item.date)[item.branchName] = item.totalSales || 0;
    });
    
    return Array.from(dataMap.values());
  };

  const chartData = prepareChartData();
  const colors = ['#6b46c1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <>
      <SelectContainer>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
          비교할 지점 선택 (최소 2개 이상)
        </h4>
        <CheckboxGroup>
          {branches.map((branch) => (
            <CheckboxLabel
              key={branch.id}
              $checked={selectedBranchIds.includes(branch.id)}
              onClick={() => handleBranchToggle(branch.id)}
            >
              <input
                type="checkbox"
                checked={selectedBranchIds.includes(branch.id)}
                onChange={() => handleBranchToggle(branch.id)}
              />
              {branch.branchName || branch.name}
            </CheckboxLabel>
          ))}
        </CheckboxGroup>
      </SelectContainer>

      {loading ? (
        <>
          <SummaryCard>
            <SummaryItem>
              <SkeletonLine height="16px" />
              <SkeletonLine height="32px" />
            </SummaryItem>
          </SummaryCard>
          <ChartCard>
            <SkeletonLine height="28px" />
            <SkeletonLine height="300px" />
          </ChartCard>
        </>
      ) : error ? (
        <div>에러가 발생했습니다: {error}</div>
      ) : branchComparison && selectedBranchIds.length >= 2 ? (
        <>
          <SummaryCard>
            <SummaryItem>
              <SummaryLabel>총 매출</SummaryLabel>
              <SummaryValue>{formatCurrency(branchComparison.totalSales || 0)}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>비교 지점 수</SummaryLabel>
              <SummaryValue>{selectedBranchIds.length}개</SummaryValue>
            </SummaryItem>
          </SummaryCard>

          <ChartCard>
            <ChartTitle>지점별 매출 비교 (천원단위)</ChartTitle>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
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
                {Object.keys(branchComparison.branchNames || {}).map((branchId, index) => (
                  <Line
                    key={branchId}
                    type="monotone"
                    dataKey={branchComparison.branchNames[branchId]}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>지점명</TableHeaderCell>
                <TableHeaderCell>총 매출</TableHeaderCell>
                <TableHeaderCell>총 주문</TableHeaderCell>
                <TableHeaderCell>평균 주문액</TableHeaderCell>
                <TableHeaderCell>점유율</TableHeaderCell>
                <TableHeaderCell>순위</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branchComparison.comparisonData
                .filter((item, index, self) => 
                  index === self.findIndex(i => i.branchId === item.branchId)
                )
                .map((item, index) => (
                  <TableRow key={item.branchId}>
                    <TableCell>{item.branchName}</TableCell>
                    <TableCell>{formatCurrency(item.totalSales || 0)}</TableCell>
                    <TableCell>{item.totalOrders || 0}건</TableCell>
                    <TableCell>
                      {item.totalSales && item.totalOrders
                        ? formatCurrency(Math.floor(item.totalSales / item.totalOrders))
                        : '0원'}
                    </TableCell>
                    <TableCell>{(item.marketShare || 0).toFixed(2)}%</TableCell>
                    <TableCell>{index + 1}위</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </>
      ) : selectedBranchIds.length < 2 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
          최소 2개 이상의 지점을 선택해주세요.
        </div>
      ) : null}
    </>
  );
});

export default BranchComparison;

