import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './InventoryChart.css';
import { formatCurrencyKRW } from '../../service/branchDashboardService';

const InventoryChart = ({ data }) => {
  // 카테고리별 매출 분포 데이터 변환
  const categoryDistribution = data?.categorySalesDistribution || {};
  const categoryData = Object.keys(categoryDistribution).map((key) => ({
    name: key,
    value: categoryDistribution[key],
  }));

  // 최고 카테고리 계산
  const topCategory = categoryData.length > 0
    ? categoryData.reduce((max, item) => (item.value > max.value ? item : max), categoryData[0])
    : null;
  
  const totalSales = data?.totalSales || 0;
  const topCategoryPercentage = topCategory && totalSales > 0
    ? ((topCategory.value / totalSales) * 100).toFixed(1)
    : '0';

  const COLORS = [
    '#8B7FE6',
    '#A8E6CF',
    '#FFD93D',
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
  ];

  const formatTooltip = (value) => {
    return formatCurrencyKRW(value);
  };

  const formatLegend = (entry) => {
    const percentage = totalSales > 0 ? ((entry.value / totalSales) * 100).toFixed(1) : '0';
    return `${entry.name} (${percentage}%)`;
  };

  return (
    <div className="inventory-chart">
      <div className="chart-header">
        <h3>카테고리별 매출 비중</h3>
        <div className="chart-controls">
          <select className="period-select" disabled>
            <option value="today">오늘</option>
            <option value="week">최근 1주</option>
            <option value="month">최근 1개월</option>
          </select>
        </div>
      </div>
      <div className="chart-container">
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: '#ffffff',
                  border: '1px solid #8B7FE6',
                  borderRadius: '8px',
                }}
              />
              <Legend 
                formatter={formatLegend}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            데이터가 없습니다
          </div>
        )}
      </div>
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">총 매출</span>
          <span className="summary-value">
            {formatCurrencyKRW(totalSales)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">최고 카테고리</span>
          <span className="summary-value">
            {topCategory ? `${topCategory.name} (${topCategoryPercentage}%)` : '-'}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">카테고리 수</span>
          <span className="summary-value">
            {categoryData.length}개
          </span>
        </div>
      </div>
    </div>
  );
};

export default InventoryChart;

