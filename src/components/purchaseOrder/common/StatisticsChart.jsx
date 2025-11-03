import React from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const COLORS = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  partial: '#fbbf24',
  shipped: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444'
};

const STATUS_COLORS = {
  '대기중': '#f59e0b',
  '승인됨': '#10b981',
  '반려됨': '#ef4444',
  '부분승인': '#fbbf24',
  '배송중': '#3b82f6',
  '완료': '#059669',
  '취소됨': '#ef4444'
};

function StatisticsChart({ statusData = [], branchData = [], productData = [] }) {
  // 상태별 데이터 준비
  const statusChartData = statusData.map(item => ({
    name: item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] || '#6b7280'
  }));

  return (
    <ChartsContainer>
      {/* 상태별 파이 차트 */}
      <ChartCard>
        <ChartTitle>발주 상태별 통계</ChartTitle>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 지점별 막대 차트 (세로 막대 그래프 - 수평 막대) */}
      <ChartCard>
        <ChartTitle>지점별 발주 통계</ChartTitle>
        {branchData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, branchData.length * 40)}>
            <BarChart 
              layout="vertical"
              data={[...branchData]
                .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))} // 총 금액 기준 내림차순 정렬, 모든 지점 표시
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="branchName"
                width={70}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalAmount" fill="#10b981" name="총 금액 (만원)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#6b7280' }}>
            지점별 데이터가 없습니다
          </div>
        )}
      </ChartCard>

      {/* 상품별 막대 차트 */}
      <ChartCard>
        <ChartTitle>상품명별 발주 통계 (상위 10개)</ChartTitle>
        {productData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productData}> {/* 이미 정렬된 데이터 사용 */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="productName" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0} // 모든 라벨 표시
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalQuantity" fill="#3b82f6" name="총 수량" />
              <Bar dataKey="totalAmount" fill="#10b981" name="총 금액 (만원)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#6b7280' }}>
            상품별 데이터가 없습니다
          </div>
        )}
      </ChartCard>
    </ChartsContainer>
  );
}

export default StatisticsChart;
