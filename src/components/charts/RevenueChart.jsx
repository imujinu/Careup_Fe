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

const RevenueChart = ({
  data,
  period = 'MONTHLY',
  onPeriodChange,
  loading = false,
  error = null,
  periodOptions = [
    { value: 'YEARLY', label: '연간' },
    { value: 'MONTHLY', label: '월간' },
    { value: 'WEEKLY', label: '주간' },
  ],
}) => {
  const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  };

  const formatDateLabel = (value, fallback) => {
    const date = normalizeDate(value);
    if (!date) {
      if (fallback !== undefined && fallback !== null) {
        return String(fallback);
      }
      return value ?? '';
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 데이터 변환
  const chartData =
    data?.salesData?.map((item) => {
      const startDate =
        item.startDate ||
        item.periodStart ||
        item.from ||
        item.rangeStart ||
        item.begin;
      const endDate =
        item.endDate ||
        item.periodEnd ||
        item.to ||
        item.rangeEnd ||
        item.finish;

      const [rawStartLabel, rawEndLabel] =
        typeof item.periodLabel === 'string'
          ? item.periodLabel.split('~').map((part) => part.trim())
          : [null, null];

      const displayStart = formatDateLabel(startDate, rawStartLabel);
      const displayEnd = formatDateLabel(endDate, rawEndLabel);

      const weeklyLabel =
        displayStart && displayEnd
          ? `${displayStart} ~ ${displayEnd}`
          : item.periodLabel || '';

      return {
        label:
          period === 'WEEKLY'
            ? weeklyLabel
            : period === 'MONTHLY'
              ? item.periodLabel || displayStart
              : item.periodLabel,
        sales: item.sales,
        target: item.target || 0,
        startDate,
        endDate,
        displayStart,
        displayEnd,
      };
    }) || [];

  const displayedData =
    period === 'WEEKLY' && chartData.length > 7
      ? chartData.slice(-7)
      : chartData;

  const formatTooltip = (value) => {
    return formatCurrencyKRW(value);
  };

  const formatTooltipLabel = (label, payload) => {
    if (period === 'WEEKLY' && payload && payload.length > 0) {
      const { startDate, endDate, displayStart, displayEnd } = payload[0].payload || {};
      const startLabel = displayStart || formatDateLabel(startDate);
      const endLabel = displayEnd || formatDateLabel(endDate);

      if (startLabel && endLabel) {
        return `${startLabel} ~ ${endLabel}`;
      }
      if (startLabel) {
        return `${startLabel} ~`;
      }
    }
    return label;
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
          <select
            className="period-select"
            value={period}
            onChange={(e) => onPeriodChange && onPeriodChange(e.target.value)}
            disabled={!onPeriodChange || loading}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="chart-container">
        {loading ? (
          <div className="chart-loading">데이터를 불러오는 중입니다...</div>
        ) : error ? (
          <div className="chart-error">{error}</div>
        ) : displayedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              stroke="#666"
              style={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
              interval={period === 'WEEKLY' ? 0 : 'preserveEnd'}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              stroke="#666"
              style={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#ffffff',
                border: '1px solid #8B7FE6',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#ffffff' }}
              itemStyle={{ color: '#ffffff' }}
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

