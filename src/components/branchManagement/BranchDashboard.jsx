import React, { useState, useEffect } from 'react';
import { RotateCcw, Calendar, GripVertical } from 'lucide-react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
  const [period, setPeriod] = useState('MONTHLY');
  const [dashboardData, setDashboardData] = useState(null);
  const [gridWidth, setGridWidth] = useState(1200);
  
  // 그리드 레이아웃 설정
  // 상단 4개 카드: 높이 대폭 증가 (h: 8로 설정하여 잘림 완전 방지)
  // 차트: 크기 고정
  const [layout, setLayout] = useState([
    { i: 'sales', x: 0, y: 0, w: 3, h: 6, minW: 3, maxW: 3, minH: 8, maxH: 8 },
    { i: 'inventory', x: 3, y: 0, w: 3, h: 6, minW: 3, maxW: 3, minH: 8, maxH: 8 },
    { i: 'employee', x: 6, y: 0, w: 3, h: 6, minW: 3, maxW: 3, minH: 8, maxH: 8 },
    { i: 'order', x: 9, y: 0, w: 3, h: 6, minW: 3, maxW: 3, minH: 8, maxH: 8 },
    { i: 'revenue', x: 0, y: 8, w: 6, h: 7, minW: 6, maxW: 6, minH: 7, maxH: 7 },
    { i: 'category', x: 6, y: 8, w: 6, h: 7, minW: 6, maxW: 6, minH: 7, maxH: 7 },
    { i: 'attendance', x: 0, y: 15, w: 12, h: 4, minW: 12, maxW: 12, minH: 4, maxH: 4 },
  ]);

  // 그리드 너비 동적 조정 (정확한 계산)
  useEffect(() => {
    const updateGridWidth = () => {
      const container = document.querySelector('.branch-dashboard');
      if (container) {
        // 컨테이너의 실제 사용 가능한 너비 계산
        const containerRect = container.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(container);
        const paddingLeft = parseFloat(computedStyle.paddingLeft) || 24;
        const paddingRight = parseFloat(computedStyle.paddingRight) || 24;
        const availableWidth = containerRect.width - paddingLeft - paddingRight;
        
        // 그리드가 화면에 정확히 맞도록 계산
        // react-grid-layout은 width prop을 사용하므로 정확한 픽셀 값 필요
        const gridWidth = Math.max(Math.floor(availableWidth), 1200);
        setGridWidth(gridWidth);
      }
    };
    
    // 초기 계산 (렌더링 후)
    if (dashboardData) {
      const timer = setTimeout(updateGridWidth, 50);
      window.addEventListener('resize', updateGridWidth);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateGridWidth);
      };
    }
  }, [dashboardData]);

  useEffect(() => {
    if (branchId) {
      fetchDashboardData();
    }
  }, [branchId, period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await branchDashboardService.getDashboard(branchId, period);
      
      if (response.status_code === 200 && response.result) {
        setDashboardData(response.result);
      } else {
        throw new Error(response.status_message || '대시보드 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('대시보드 데이터 조회 실패:', err);
      setError(err.message || '대시보드 데이터를 불러오는데 실패했습니다.');
      addToast({
        type: 'error',
        title: '오류',
        message: err.message || '대시보드 데이터를 불러오는데 실패했습니다.',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleLayoutChange = (newLayout) => {
    // 그리드 경계를 벗어나지 않도록 제한
    const constrainedLayout = newLayout.map(item => {
      const originalItem = layout.find(l => l.i === item.i);
      const fixedW = originalItem?.w || item.w;
      const fixedH = originalItem?.h || item.h;
      
      let newX = item.x;
      
      // x + w가 12를 넘지 않도록 제한
      if (newX + fixedW > 12) {
        newX = Math.max(0, 12 - fixedW);
      }
      // x가 0보다 작지 않도록 제한
      if (newX < 0) {
        newX = 0;
      }
      
      // 크기는 항상 고정값 유지
      return {
        ...item,
        x: newX,
        w: fixedW,
        h: fixedH,
        minW: fixedW,
        maxW: fixedW,
        minH: fixedH,
        maxH: fixedH,
      };
    });
    
    setLayout(constrainedLayout);
    localStorage.setItem(`dashboard-layout-${branchId}`, JSON.stringify(constrainedLayout));
  };

  // 저장된 레이아웃 불러오기
  useEffect(() => {
    const savedLayout = localStorage.getItem(`dashboard-layout-${branchId}`);
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (e) {
        console.error('레이아웃 불러오기 실패:', e);
      }
    }
  }, [branchId]);

  // 데이터 변환 함수들
  const transformSalesData = (salesSummary) => {
    if (!salesSummary) return null;
    
    return {
      totalSales: salesSummary.totalSales || 0,
      monthlySales: salesSummary.monthlySales || 0,
      totalOrders: salesSummary.totalOrders || 0,
      last7DaysSales: salesSummary.last7DaysSales || [],
      // 증가율은 백엔드에서 제공되지 않으면 계산하거나 기본값 사용
      totalSalesGrowth: 0,
      monthlySalesGrowth: 0,
      totalOrdersGrowth: 0,
    };
  };

  const transformInventoryData = (inventorySummary) => {
    if (!inventorySummary) return null;
    
    return {
      totalProducts: inventorySummary.totalProducts || 0,
      lowStockProducts: inventorySummary.lowStockProducts || 0,
      stockFulfillmentRate: inventorySummary.stockFulfillmentRate || 0,
      stockAlerts: inventorySummary.stockAlerts || [],
    };
  };

  const transformEmployeeData = (employeeSummary) => {
    if (!employeeSummary) return null;
    
    return {
      totalEmployees: employeeSummary.totalEmployees || 0,
      presentEmployees: employeeSummary.presentEmployees || 0,
      absentEmployees: employeeSummary.absentEmployees || 0,
      todayAttendanceRate: employeeSummary.todayAttendanceRate || 0,
    };
  };

  const transformOrderData = (orderSummary) => {
    if (!orderSummary) return null;
    
    return {
      totalOrders: orderSummary.totalOrders || 0,
      completedOrders: orderSummary.completedOrders || 0,
      pendingOrders: orderSummary.pendingOrders || 0,
      canceledOrders: orderSummary.canceledOrders || 0,
      orderStatusDistribution: orderSummary.orderStatusDistribution || {},
    };
  };

  const transformSalesTrendData = (salesTrend) => {
    if (!salesTrend) return null;
    
    return {
      period: salesTrend.period || period,
      salesData: salesTrend.salesData || [],
      totalSales: salesTrend.totalSales || 0,
      yearOverYearGrowth: salesTrend.yearOverYearGrowth || 0,
      goalAchievementRate: salesTrend.goalAchievementRate || 0,
    };
  };

  const transformCategorySalesData = (categorySales) => {
    if (!categorySales) return null;
    
    return {
      categorySalesDistribution: categorySales.categorySalesDistribution || {},
      totalSales: categorySales.totalSales || 0,
      topCategory: categorySales.topCategory || '',
      topCategorySales: categorySales.topCategorySales || 0,
    };
  };

  const transformAttendanceData = (attendanceSummary) => {
    if (!attendanceSummary) return null;
    
    return {
      weeklyAttendance: attendanceSummary.weeklyAttendance || {},
      averageAttendanceRate: attendanceSummary.averageAttendanceRate || 0,
      totalWorkDays: attendanceSummary.totalWorkDays || 0,
      lateCount: attendanceSummary.lateCount || 0,
    };
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>대시보드 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>오류가 발생했습니다</h3>
        <p>{error}</p>
        <button onClick={handleRefresh} className="retry-button">
          다시 시도
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-empty">
        <p>대시보드 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="branch-dashboard">
      {/* 대시보드 헤더 */}
      <div className="dashboard-header fade-in">
        <div className="dashboard-title">
          <h2>대시보드</h2>
          <p>지점의 주요 지표와 통계를 한눈에 확인하세요</p>
        </div>
        <div className="dashboard-controls">
          <div className="period-selector">
            <Calendar size={16} />
            <select 
              value={period} 
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="period-select"
            >
              <option value="YEARLY">연간</option>
              <option value="MONTHLY">월간</option>
              <option value="WEEKLY">주간</option>
            </select>
          </div>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
          >
            <RotateCcw size={16} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 구조화된 그리드 레이아웃 (고정 크기, 제한된 배치) */}
      <div className="dashboard-grid-container">
        <GridLayout
          className="dashboard-grid-layout"
          layout={layout}
          onLayoutChange={handleLayoutChange}
        cols={12}
        rowHeight={70}
        width={gridWidth}
          isDraggable={true}
          isResizable={false}
          draggableHandle=".drag-handle"
          margin={[16, 16]}
          containerPadding={[0, 0]}
          compactType="vertical"
          preventCollision={true}
          useCSSTransforms={true}
        >
        {/* 매출 현황 카드 */}
        <div key="sales" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-card">
            <SalesCard data={transformSalesData(dashboardData.salesSummary)} />
          </div>
        </div>

        {/* 재고 현황 카드 */}
        <div key="inventory" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-card">
            <InventoryCard data={transformInventoryData(dashboardData.inventorySummary)} />
          </div>
        </div>

        {/* 직원 현황 카드 */}
        <div key="employee" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-card">
            <EmployeeCard data={transformEmployeeData(dashboardData.employeeSummary)} />
          </div>
        </div>

        {/* 주문 현황 카드 */}
        <div key="order" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-card">
            <OrderCard data={transformOrderData(dashboardData.orderSummary)} />
          </div>
        </div>

        {/* 매출 추이 차트 */}
        <div key="revenue" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-chart">
            <RevenueChart 
              data={transformSalesTrendData(dashboardData.salesTrend)} 
              period={period}
            />
          </div>
        </div>

        {/* 카테고리별 매출 차트 */}
        <div key="category" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-chart">
            <InventoryChart data={transformCategorySalesData(dashboardData.categorySales)} />
          </div>
        </div>

        {/* 출근 현황 차트 */}
        <div key="attendance" className="dashboard-item-wrapper">
          <div className="drag-handle">
            <GripVertical size={16} />
          </div>
          <div className="dashboard-chart">
            <AttendanceChart data={transformAttendanceData(dashboardData.attendanceSummary)} />
          </div>
        </div>
        </GridLayout>
      </div>
    </div>
  );
};

export default BranchDashboard;
