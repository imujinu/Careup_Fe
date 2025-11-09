import React from 'react';
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
import './AttendanceChart.css';

const AttendanceChart = ({
  data,
  period = 'WEEKLY',
  onPeriodChange,
  loading = false,
  error = null,
  periodOptions = [
    { value: 'WEEKLY', label: '주간' },
    { value: 'MONTHLY', label: '월간' },
    { value: 'YEARLY', label: '연간' },
  ],
}) => {
  const normalizedPeriod = typeof period === 'string' ? period.toLowerCase() : 'weekly';

  const capitalize = (text = '') => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '');

  const resolveAttendanceCollection = () => {
    if (!data) return null;
    const candidates = [
      data?.attendanceByPeriod?.[normalizedPeriod],
      data?.attendanceByPeriod?.[period],
      data?.[`attendanceBy${capitalize(normalizedPeriod)}`],
      data?.[`${normalizedPeriod}Attendance`],
      data?.attendanceData?.[normalizedPeriod],
      data?.attendance,
      data?.weeklyAttendance,
    ];
    return candidates.find((candidate) => candidate) || null;
  };

  const attendanceCollection = resolveAttendanceCollection();

  const formatLabelDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
    return value;
  };

  const chartData = (() => {
    if (!attendanceCollection) return [];
    if (Array.isArray(attendanceCollection)) {
      return attendanceCollection.map((item, index) => ({
        date: formatLabelDate(item.date || item.day || item.periodStart || item.label || index + 1),
        present: item.presentCount ?? item.present ?? item.actual ?? 0,
        total: item.totalCount ?? item.total ?? item.expected ?? item.targetCount ?? 0,
        target: item.targetCount ?? item.totalCount ?? item.target ?? item.expected ?? 0,
      }));
    }

    const sortedKeys = Object.keys(attendanceCollection).sort((a, b) => {
      const da = new Date(a);
      const db = new Date(b);
      if (!Number.isNaN(da.getTime()) && !Number.isNaN(db.getTime())) {
        return da - db;
      }
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => {
      const current = attendanceCollection[key] || {};
      return {
        date: formatLabelDate(key),
        present: current.presentCount ?? current.present ?? current.actual ?? 0,
        total: current.totalCount ?? current.total ?? current.expected ?? current.targetCount ?? 0,
        target: current.targetCount ?? current.totalCount ?? current.target ?? current.expected ?? 0,
      };
    });
  })();

  const resolveSummary = () => {
    if (!data) return {};
    const candidates = [
      data?.attendanceSummaryByPeriod?.[normalizedPeriod],
      data?.attendanceSummaryByPeriod?.[period],
      data?.[`attendanceSummary${capitalize(normalizedPeriod)}`],
      data?.summaryByPeriod?.[normalizedPeriod],
      data?.summary?.[normalizedPeriod],
      data,
    ];
    return candidates.find((candidate) => candidate) || {};
  };

  const summary = resolveSummary();

  const averageAttendanceRate =
    summary?.averageAttendanceRate ??
    summary?.averageRate ??
    summary?.avgAttendanceRate ??
    data?.averageAttendanceRate ??
    0;

  const totalWorkDays =
    summary?.totalWorkDays ??
    summary?.workDays ??
    data?.totalWorkDays ??
    0;

  const lateCount =
    summary?.lateCount ??
    summary?.late ??
    data?.lateCount ??
    0;

  const getChartTitle = () => {
    switch (period) {
      case 'YEARLY':
        return '연간 출근 현황';
      case 'MONTHLY':
        return '월간 출근 현황';
      case 'WEEKLY':
      default:
        return '주간 출근 현황';
    }
  };

  const formatTooltip = (value, name) => {
    return [`${value}명`, name === 'present' ? '출근자 수' : '목표 출근자 수'];
  };

  return (
    <div className="attendance-chart">
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
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date"
                stroke="#666"
                style={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
              />
              <YAxis 
                stroke="#666"
                style={{ fontSize: '11px', fontFamily: 'Pretendard, sans-serif' }}
                label={{ value: '명', angle: -90, position: 'insideLeft' }}
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
              <Bar 
                dataKey="present" 
                name="출근자 수" 
                fill="#8B7FE6" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="target" 
                name="목표 출근자 수" 
                fill="#E0E0E0" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            데이터가 없습니다
          </div>
        )}
      </div>
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-label">평균 출근률</span>
          <span className="summary-value">
            {Number(averageAttendanceRate || 0).toFixed(1)}%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">총 출근일</span>
          <span className="summary-value">
            {totalWorkDays || 0}일
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">지각 횟수</span>
          <span className={`summary-value ${(lateCount || 0) > 0 ? 'warning' : ''}`}>
            {lateCount || 0}회
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;

