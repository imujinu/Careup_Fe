import React, { useState, useEffect, useImperativeHandle } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { format } from 'date-fns';
import { Icon } from '@mdi/react';
import { mdiFileExcel } from '@mdi/js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchBranchSalesDetail } from '../../stores/slices/salesReportSlice';
import { branchService } from '../../service/branchService';
import { salesReportService } from '../../service/salesReportService';
import { useToast } from '../../components/common/Toast';

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 200px;
  margin-bottom: 24px;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const KPI = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const KPICard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  color: ${props => props.$positive ? '#059669' : '#dc2626'};
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
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

const KPISkeleton = () => (
  <KPICard>
    <SkeletonLine height="16px" width="60px" />
    <SkeletonLine height="32px" width="120px" />
    <SkeletonLine height="14px" width="80px" />
  </KPICard>
);

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

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(value);
};

const BranchDetail = React.forwardRef(({ startDate, endDate, periodType }, ref) => {
  const dispatch = useDispatch();
  const { branchSalesDetail, loading, error } = useSelector((state) => state.salesReport);
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);
  
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  // 지점 목록 가져오기
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchService.fetchBranches({ size: 100 });
        setBranches(response.data || []);
        if (response.data && response.data.length > 0) {
          setSelectedBranchId(response.data[0].id);
        }
      } catch (err) {
        console.error('지점 목록 가져오기 실패:', err);
      }
    };
    fetchBranches();
  }, []);

  // 선택한 지점의 매출 데이터 가져오기
  useEffect(() => {
    if (selectedBranchId) {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      dispatch(fetchBranchSalesDetail({ 
        branchId: selectedBranchId,
        startDate: startDateStr,
        endDate: endDateStr,
        periodType
      }));
    }
  }, [dispatch, selectedBranchId, startDate, endDate, periodType]);

  const handleExportExcel = async () => {
    if (!selectedBranchId) {
      toast.addToast({
        type: 'error',
        title: '다운로드 실패',
        message: '지점을 선택해주세요.',
      });
      return;
    }

    setIsExporting(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      await salesReportService.exportBranchDetailSales(
        selectedBranchId,
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
    if (!branchSalesDetail?.salesData) return [];
    return branchSalesDetail.salesData.map((item) => ({
      date: item.date,
      매출: item.totalSales || 0,
    }));
  };

  const chartData = prepareChartData();

  return (
    <>
      <Select
        value={selectedBranchId || ''}
        onChange={(e) => setSelectedBranchId(Number(e.target.value))}
      >
        <option value="">지점 선택</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.branchName || branch.name}
          </option>
        ))}
      </Select>

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
      ) : branchSalesDetail ? (
        <>
          <KPI>
            <KPICard>
              <KPILabel>지점명</KPILabel>
              <KPIValue>{branchSalesDetail.branchName}</KPIValue>
              <KPIChange $positive>순위: {branchSalesDetail.ranking}위</KPIChange>
            </KPICard>
            <KPICard>
              <KPILabel>총 매출</KPILabel>
              <KPIValue>{formatCurrency(branchSalesDetail.totalSales || 0)}</KPIValue>
              <KPIChange $positive>점유율: {(branchSalesDetail.marketShare || 0).toFixed(2)}%</KPIChange>
            </KPICard>
            <KPICard>
              <KPILabel>총 주문</KPILabel>
              <KPIValue>{branchSalesDetail.totalOrders || 0}건</KPIValue>
            </KPICard>
            <KPICard>
              <KPILabel>평균 주문액</KPILabel>
              <KPIValue>
                {branchSalesDetail.totalSales && branchSalesDetail.totalOrders
                  ? formatCurrency(Math.floor(branchSalesDetail.totalSales / branchSalesDetail.totalOrders))
                  : '0원'}
              </KPIValue>
            </KPICard>
          </KPI>

          <ChartCard>
            <ChartTitle>기간별 매출 추이 (천원단위)</ChartTitle>
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
                <Bar dataKey="매출" fill="#6b46c1" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      ) : null}
    </>
  );
});

export default BranchDetail;

