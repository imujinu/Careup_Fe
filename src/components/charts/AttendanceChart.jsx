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

const AttendanceChart = ({ data }) => {
  // 주간 출근 현황 데이터 변환
  const weeklyAttendance = data?.weeklyAttendance || {};
  // 날짜 순서대로 정렬
  const sortedDates = Object.keys(weeklyAttendance).sort((a, b) => {
    return new Date(a) - new Date(b);
  });
  
  const chartData = sortedDates.map((date) => {
    const dayData = weeklyAttendance[date];
    return {
      date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      present: dayData.presentCount || 0,
      total: dayData.totalCount || 0,
      target: dayData.targetCount || dayData.totalCount || 0,
    };
  });

  const formatTooltip = (value, name) => {
    return [`${value}명`, name === 'present' ? '출근자 수' : '목표 출근자 수'];
  };

  return (
    <div className="attendance-chart">
      <div className="chart-header">
        <h3>주간 출근 현황</h3>
        <div className="chart-controls">
          <select className="period-select" disabled>
            <option value="thisWeek">이번 주</option>
            <option value="lastWeek">이전 주</option>
          </select>
        </div>
      </div>
      <div className="chart-container">
        {chartData.length > 0 ? (
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
            {(data?.averageAttendanceRate || 0).toFixed(1)}%
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">총 출근일</span>
          <span className="summary-value">
            {data?.totalWorkDays || 0}일
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">지각 횟수</span>
          <span className={`summary-value ${(data?.lateCount || 0) > 0 ? 'warning' : ''}`}>
            {data?.lateCount || 0}회
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;

