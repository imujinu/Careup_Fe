import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import './SalesCard.css';

const SalesCard = ({ data }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num || 0);
  };

  // 최근 7일 매출 데이터 처리
  const last7DaysSales = data?.last7DaysSales || [];
  const maxSales = last7DaysSales.length > 0 
    ? Math.max(...last7DaysSales.map(d => d.sales || 0), 1)
    : 1;
  
  // 증가율 계산 (백엔드에서 제공되지 않으면 기본값 사용)
  const totalSalesGrowth = data?.totalSalesGrowth || 0;
  const monthlySalesGrowth = data?.monthlySalesGrowth || 0;
  const totalOrdersGrowth = data?.totalOrdersGrowth || 0;

  return (
    <div className="sales-card">
      <div className="card-header">
        <DollarSign className="card-icon" size={24} />
        <h3>매출 현황</h3>
      </div>
      
      <div className="sales-stats">
        <div className="stat-item">
          <div className="stat-label">총 매출</div>
          <div className="stat-value primary">
            {formatCurrency(data?.totalSales)}
          </div>
          <div className={`stat-change ${totalSalesGrowth >= 0 ? 'positive' : 'negative'}`}>
            <TrendingUp size={14} />
            <span>{totalSalesGrowth >= 0 ? '+' : ''}{totalSalesGrowth.toFixed(1)}%</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">월간 매출</div>
          <div className="stat-value">
            {formatCurrency(data?.monthlySales)}
          </div>
          <div className={`stat-change ${monthlySalesGrowth >= 0 ? 'positive' : 'negative'}`}>
            <TrendingUp size={14} />
            <span>{monthlySalesGrowth >= 0 ? '+' : ''}{monthlySalesGrowth.toFixed(1)}%</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">총 주문 수</div>
          <div className="stat-value">
            {formatNumber(data?.totalOrders)}건
          </div>
          <div className={`stat-change ${totalOrdersGrowth >= 0 ? 'positive' : 'negative'}`}>
            <TrendingDown size={14} />
            <span>{Math.abs(totalOrdersGrowth).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="sales-chart-mini">
        <div className="chart-header">
          <Calendar size={16} />
          <span>최근 7일 매출</span>
        </div>
        <div className="mini-chart">
          {last7DaysSales.length > 0 ? (
            last7DaysSales.map((day, index) => (
              <div
                key={index}
                className="chart-bar"
                style={{ height: `${((day.sales || 0) / maxSales) * 100}%` }}
              />
            ))
          ) : (
            // 데이터가 없을 때 기본 바
            Array.from({ length: 7 }).map((_, index) => (
              <div
                key={index}
                className="chart-bar"
                style={{ height: `${60 + Math.random() * 30}%` }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesCard;

