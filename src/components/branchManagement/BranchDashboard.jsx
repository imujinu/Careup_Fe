import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// 초기 레이아웃 정의 (12열 그리드 기준)
const getDefaultLayout = () => [
  { i: 'sales', x: 0, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
  { i: 'inventory', x: 3, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
  { i: 'employee', x: 6, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
  { i: 'order', x: 9, y: 0, w: 3, h: 4, minW: 3, minH: 3 },
  { i: 'revenue', x: 0, y: 4, w: 6, h: 5, minW: 4, minH: 4 },
  { i: 'category', x: 6, y: 4, w: 6, h: 5, minW: 4, minH: 4 },
  { i: 'attendance', x: 0, y: 9, w: 12, h: 5, minW: 6, minH: 4 },
];

const BranchDashboard = ({ branchId }) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('MONTHLY');
  const [dashboardData, setDashboardData] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [gridCols, setGridCols] = useState(12);

  // 레이아웃 상태 관리 (12열 기준으로 저장)
  const defaultLayout = useMemo(() => getDefaultLayout(), []);
  const [savedLayout12Col, setSavedLayout12Col] = useState(() => {
    const saved = localStorage.getItem(`dashboard-layout-${branchId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultLayout;
      }
    }
    return defaultLayout;
  });

  // 현재 그리드 열 수에 맞게 스케일링된 레이아웃
  const [layout, setLayout] = useState(savedLayout12Col);

  // 컨테이너 너비 및 그리드 열 수 상태 관리
  useEffect(() => {
    let resizeTimeout;
    const updateWidth = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = Math.max(600, rect.width - 48);

        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          setContainerWidth(width);

          let newCols;
          if (width < 600) {
            newCols = 4;
          } else if (width < 900) {
            newCols = 6;
          } else if (width < 1200) {
            newCols = 8;
          } else if (width < 1600) {
            newCols = 10;
          } else if (width < 1920) {
            newCols = 11;
          } else {
            newCols = 12;
          }

          setGridCols(newCols);
        }, 150);
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateWidth);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

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

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  // 레이아웃 변경 핸들러
  const handleLayoutChange = (newLayout) => {
    const normalizedLayout = newLayout.map((item) => {
      const minW = Math.min(3, Math.max(2, Math.floor(gridCols / 4)));
      const minH = item.minH || 2;

      let w = Math.max(minW, Math.min(item.w, gridCols));
      let x = Math.max(0, Math.min(item.x, gridCols - w));
      const h = Math.max(minH, item.h || 2);

      return {
        ...item,
        x,
        w,
        h,
        minW: minW,
        minH: minH,
      };
    });

    setLayout(normalizedLayout);

    const savedLayout12Col = normalizedLayout.map((item) => {
      const scaleFactor = 12 / gridCols;
      return {
        ...item,
        x: Math.max(0, Math.round(item.x * scaleFactor)),
        w: Math.max(3, Math.round(item.w * scaleFactor)),
        minW: 3,
        minH: item.minH || 2,
      };
    });

    setSavedLayout12Col(savedLayout12Col);
    localStorage.setItem(`dashboard-layout-${branchId}`, JSON.stringify(savedLayout12Col));
  };

  // 그리드 열 수가 변경될 때 레이아웃 스케일링
  const prevGridColsRef = useRef(gridCols);
  useEffect(() => {
    if (savedLayout12Col.length > 0 && gridCols > 0 && prevGridColsRef.current !== gridCols) {
      const scaledLayout = savedLayout12Col.map((item) => {
        const scaleFactor = gridCols / 12;
        let newW = Math.round(item.w * scaleFactor);
        let newX = Math.round(item.x * scaleFactor);

        const minW = Math.min(3, Math.max(2, Math.floor(gridCols / 4)));
        const minH = item.minH || 2;

        newW = Math.max(minW, Math.min(newW, gridCols));
        newX = Math.max(0, Math.min(newX, gridCols - newW));

        return {
          ...item,
          x: newX,
          w: newW,
          minW: minW,
          minH: minH,
        };
      });

      setLayout(scaledLayout);
      prevGridColsRef.current = gridCols;
    }
  }, [gridCols, savedLayout12Col]);

  // 초기 레이아웃으로 되돌리기
  const resetLayout = () => {
    const initialLayout = getDefaultLayout();
    setSavedLayout12Col(initialLayout);
    const scaleFactor = gridCols / 12;
    const minW = Math.min(3, Math.max(2, Math.floor(gridCols / 4)));
    const scaledLayout = initialLayout.map((item) => {
      let newW = Math.round(item.w * scaleFactor);
      let newX = Math.round(item.x * scaleFactor);
      const minH = item.minH || 2;

      newW = Math.max(minW, Math.min(newW, gridCols));
      newX = Math.max(0, Math.min(newX, gridCols - newW));

      return {
        ...item,
        x: newX,
        w: newW,
        minW: minW,
        minH: minH,
      };
    });
    setLayout(scaledLayout);
    localStorage.removeItem(`dashboard-layout-${branchId}`);
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
          <p>카드를 드래그하여 레이아웃을 조정할 수 있습니다</p>
        </div>
        <div className="dashboard-controls">
          <div className="period-selector">
            <Calendar size={16} />
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="period-select"
            >
              <option value="WEEKLY">주간</option>
              <option value="MONTHLY">월간</option>
              <option value="YEARLY">연간</option>
            </select>
          </div>
          <button className="reset-btn" onClick={resetLayout} title="레이아웃 초기화">
            <RotateCcw size={16} />
            <span>레이아웃 리셋</span>
          </button>
          <button className="refresh-btn" onClick={handleRefresh}>
            <RotateCcw size={16} />
            <span>새로고침</span>
          </button>
        </div>
      </div>

      {/* 그리드 레이아웃 */}
      <div className="dashboard-grid-container" ref={containerRef}>
        <GridLayout
          className="dashboard-grid-layout"
          layout={layout}
          cols={gridCols}
          rowHeight={60}
          width={containerWidth}
          onLayoutChange={handleLayoutChange}
          isDraggable={true}
          isResizable={true}
          draggableHandle=".drag-handle"
          margin={[24, 24]}
          compactType="vertical"
          preventCollision={false}
          verticalCompact={true}
          allowOverlap={false}
        >
          {/* 매출 현황 */}
          <div key="sales" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <SalesCard data={dashboardData?.salesSummary} />
          </div>

          {/* 재고 현황 */}
          <div key="inventory" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <InventoryCard data={dashboardData?.inventorySummary} />
          </div>

          {/* 직원 현황 */}
          <div key="employee" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <EmployeeCard data={dashboardData?.employeeSummary} />
          </div>

          {/* 주문 현황 */}
          <div key="order" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <OrderCard data={dashboardData?.orderSummary} />
          </div>

          {/* 매출 추이 */}
          <div key="revenue" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <RevenueChart data={dashboardData?.salesTrend} period={period} />
          </div>

          {/* 카테고리별 매출 비중 */}
          <div key="category" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <InventoryChart data={dashboardData?.categorySales} />
          </div>

          {/* 출근 현황 */}
          <div key="attendance" className="dashboard-card" style={{ position: 'relative' }}>
            <div className="drag-handle" title="드래그하여 이동">
              <GripVertical size={16} />
            </div>
            <AttendanceChart data={dashboardData?.attendanceSummary} />
          </div>
        </GridLayout>
      </div>
    </div>
  );
};

export default BranchDashboard;
