import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import SalesCard from '../cards/SalesCard';
import InventoryCard from '../cards/InventoryCard';
import EmployeeCard from '../cards/EmployeeCard';
import OrderCard from '../cards/OrderCard';
import RevenueChart from '../charts/RevenueChart';
import InventoryChart from '../charts/InventoryChart';
import AttendanceChart from '../charts/AttendanceChart';
import branchDashboardService from '../../service/branchDashboardService';
import { useToast } from '../common/Toast';
import './BranchDashboard.css';

const BranchDashboard = ({ branchId }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrendPeriod, setSalesTrendPeriod] = useState('MONTHLY');
  const [attendancePeriod, setAttendancePeriod] = useState('WEEKLY');
  const [salesTrendData, setSalesTrendData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [salesTrendLoading, setSalesTrendLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [salesTrendError, setSalesTrendError] = useState(null);
  const [attendanceError, setAttendanceError] = useState(null);
  const [categorySalesData, setCategorySalesData] = useState(null);

  useEffect(() => {
    if (branchId) {
      fetchDashboardData();
    }
  }, [branchId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await branchDashboardService.getDashboard(branchId);

      if (response.status_code === 200 && response.result) {
        const result = response.result;
        setDashboardData(result);
        setSalesTrendData(result?.salesTrend || null);
        setCategorySalesData(result?.categorySales || null);
        setAttendanceData(result?.attendanceSummary || null);
      } else {
        throw new Error(response.status_message || '대시보드 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('대시보드 데이터 조회 실패:', err);
      setError(err.message || '대시보드 데이터를 불러오는데 실패했습니다.');
      if (addToast) {
        addToast({
          type: 'error',
          title: '오류',
          message: err.message || '대시보드 데이터를 불러오는데 실패했습니다.',
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesTrendData = useCallback(
    async (targetPeriod) => {
      if (!branchId || !targetPeriod) return;
      try {
        setSalesTrendLoading(true);
        setSalesTrendError(null);

        const response = await branchDashboardService.getDashboard(branchId, targetPeriod);

        if (response.status_code === 200 && response.result) {
          setSalesTrendData(response.result?.salesTrend || null);
        } else {
          throw new Error(response.status_message || '매출 추이 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('매출 추이 데이터 조회 실패:', err);
        setSalesTrendError(err.message || '매출 추이 데이터를 불러오는데 실패했습니다.');
        if (addToast) {
          addToast({
            type: 'error',
            title: '매출 추이 조회 오류',
            message: err.message || '매출 추이 데이터를 불러오는데 실패했습니다.',
            duration: 3000,
          });
        }
      } finally {
        setSalesTrendLoading(false);
      }
    },
    [branchId, addToast]
  );

  const fetchAttendanceData = useCallback(
    async (targetPeriod) => {
      if (!branchId || !targetPeriod) return;
      try {
        setAttendanceLoading(true);
        setAttendanceError(null);

        const response = await branchDashboardService.getDashboard(branchId, targetPeriod);

        if (response.status_code === 200 && response.result) {
          setAttendanceData(response.result?.attendanceSummary || null);
        } else {
          throw new Error(response.status_message || '출근 현황 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('출근 현황 데이터 조회 실패:', err);
        setAttendanceError(err.message || '출근 현황 데이터를 불러오는데 실패했습니다.');
        if (addToast) {
          addToast({
            type: 'error',
            title: '출근 현황 조회 오류',
            message: err.message || '출근 현황 데이터를 불러오는데 실패했습니다.',
            duration: 3000,
          });
        }
      } finally {
        setAttendanceLoading(false);
      }
    },
    [branchId, addToast]
  );

  useEffect(() => {
    if (!branchId) return;
    fetchSalesTrendData(salesTrendPeriod);
  }, [branchId, salesTrendPeriod, fetchSalesTrendData]);

  useEffect(() => {
    if (!branchId) return;
    fetchAttendanceData(attendancePeriod);
  }, [branchId, attendancePeriod, fetchAttendanceData]);

  const handleRefresh = () => {
    fetchDashboardData();
    fetchSalesTrendData(salesTrendPeriod);
    fetchAttendanceData(attendancePeriod);
  };

  const handleSalesTrendPeriodChange = (newPeriod) => {
    setSalesTrendPeriod(newPeriod);
  };

  const handleAttendancePeriodChange = (newPeriod) => {
    setAttendancePeriod(newPeriod);
  };

  if (loading) {
    return (
      <div className="branch-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="branch-dashboard">
        <div className="dashboard-error">
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="branch-dashboard">
        <div className="dashboard-empty">
          <p>대시보드 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="branch-dashboard">
      {/* 대시보드 헤더 */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>대시보드</h2>
          <p>지점 운영 현황을 한눈에 확인하세요</p>
        </div>
        <div className="dashboard-controls">
          <button className="refresh-btn" onClick={handleRefresh}>
            <RotateCcw size={16} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 고정 그리드 레이아웃 */}
      <div className="dashboard-grid">
        {/* 매출 현황 */}
        <div className="dashboard-card card-sales">
          <SalesCard data={dashboardData?.salesSummary} />
        </div>

        {/* 재고 현황 */}
        <div className="dashboard-card card-inventory">
          <InventoryCard data={dashboardData?.inventorySummary} />
        </div>

        {/* 직원 현황 */}
        <div className="dashboard-card card-employee">
          <EmployeeCard data={dashboardData?.employeeSummary} />
        </div>

        {/* 주문 현황 */}
        <div className="dashboard-card card-order">
          <OrderCard data={dashboardData?.orderSummary} />
        </div>

        {/* 매출 추이 */}
        <div className="dashboard-card card-revenue">
          <RevenueChart
            data={salesTrendData}
            period={salesTrendPeriod}
            onPeriodChange={handleSalesTrendPeriodChange}
            loading={salesTrendLoading}
            error={salesTrendError}
            periodOptions={[
              { value: 'WEEKLY', label: '주간' },
              { value: 'MONTHLY', label: '월간' },
              { value: 'YEARLY', label: '연간' },
            ]}
          />
        </div>

        {/* 재고 분석 */}
        <div className="dashboard-card card-category">
          <InventoryChart
            data={categorySalesData}
          />
        </div>

        {/* 출근 현황 */}
        <div className="dashboard-card card-attendance">
          <AttendanceChart
            data={attendanceData}
            period={attendancePeriod}
            onPeriodChange={handleAttendancePeriodChange}
            loading={attendanceLoading}
            error={attendanceError}
            periodOptions={[
              { value: 'WEEKLY', label: '주간' },
              { value: 'MONTHLY', label: '월간' },
              { value: 'YEARLY', label: '연간' },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default BranchDashboard;
