import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './RevenueChart.css';
import { formatCurrencyKRW } from '../../service/branchDashboardService';

const RevenueChart = ({ data, period = 'MONTHLY' }) => {
  // 데이터 변환
  const chartData = data?.salesData?.map((item) => ({
    label: item.periodLabel,
    sales: item.sales,
    target: item.target || 0,
  })) || [];

  const formatTooltip = (value) => {
    return formatCurrencyKRW(value);
  };

  const formatYAxis = (value) => {
    return `${Math.round(value / 10000)}만`;
  };

  // 기간에 따른 제목 설정
  const getChartTitle = () => {
    switch (period) {
      case 'YEARLY':
        return '연간 매출 추이';
      case 'MONTHLY':
        return '월별 매출 추이';
      case 'WEEKLY':
        return '주간 매출 추이';
      default:
        return '매출 추이';
    }
  };

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <h3>{getChartTitle()}</h3>
        <div className="chart-controls">
          <select className="period-select" value={period} disabled>
            <option value="YEARLY">연간</option>
            <option value="MONTHLY">월간</option>
            <option value="WEEKLY">주간</option>
          </select>
        </div>
      </div>
      <div className="chart-container">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              stroke="#666"
              style={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              stroke="#666"
              style={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
            />
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
              wrapperStyle={{ fontSize: '12px', fontFamily: 'Pretendard, sans-serif' }}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#8B7FE6" 
              strokeWidth={3}
              dot={{ fill: '#8B7FE6', r: 4 }}
              activeDot={{ r: 6 }}
              name="매출(만원)"
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#E0E0E0" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#E0E0E0', r: 4 }}
              name="목표(만원)"
            />
          </LineChart>
        </ResponsiveContainer>
        ) : (
          <div className="chart-empty">
            <p>데이터가 없습니다</p>
          </div>
        )}
      </div>
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">올해 총 매출</span>
          <span className="summary-value">
            {formatCurrencyKRW(data?.totalSales || 0)}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">전년 대비</span>
          <span className={`summary-value ${(data?.yearOverYearGrowth || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(data?.yearOverYearGrowth || 0) >= 0 ? '+' : ''}{(data?.yearOverYearGrowth || 0).toFixed(1)}%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">목표 달성률</span>
          <span className="summary-value">
            {(data?.goalAchievementRate || 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;

