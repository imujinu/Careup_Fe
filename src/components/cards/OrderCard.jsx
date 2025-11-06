import React from 'react';
import { ShoppingCart, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import './OrderCard.css';

const OrderCard = ({ data }) => {
  const totalOrders = data?.totalOrders || 0;
  const completedOrders = data?.completedOrders || 0;
  const pendingOrders = data?.pendingOrders || 0;
  const canceledOrders = data?.canceledOrders || 0;

  const completedPercentage = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const pendingPercentage = totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0;
  const canceledPercentage = totalOrders > 0 ? Math.round((canceledOrders / totalOrders) * 100) : 0;

  return (
    <div className="order-card">
      <div className="card-header">
        <ShoppingCart className="card-icon" size={24} />
        <h3>주문 현황</h3>
      </div>
      
      <div className="order-stats">
        <div className="stat-item">
          <div className="stat-label">총 주문 수</div>
          <div className="stat-value primary">
            {totalOrders.toLocaleString()}건
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">처리 완료</div>
          <div className="stat-value success">
            {completedOrders.toLocaleString()}건
          </div>
          <div className="stat-indicator">
            <CheckCircle size={14} />
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">대기 중</div>
          <div className="stat-value warning">
            {pendingOrders.toLocaleString()}건
          </div>
          <div className="stat-indicator">
            <Clock size={14} />
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">취소됨</div>
          <div className="stat-value danger">
            {canceledOrders.toLocaleString()}건
          </div>
          <div className="stat-indicator">
            <XCircle size={14} />
          </div>
        </div>
      </div>

      <div className="order-status-chart">
        <div className="status-header">
          <AlertCircle size={16} />
          <span>주문 상태 분포</span>
        </div>
        <div className="status-bars">
          <div className="status-bar">
            <div className="bar-label">완료</div>
            <div className="bar-container">
              <div 
                className="bar-fill success" 
                style={{ width: `${completedPercentage}%` }}
              ></div>
            </div>
            <div className="bar-percentage">
              {completedPercentage}%
            </div>
          </div>
          <div className="status-bar">
            <div className="bar-label">대기</div>
            <div className="bar-container">
              <div 
                className="bar-fill warning" 
                style={{ width: `${pendingPercentage}%` }}
              ></div>
            </div>
            <div className="bar-percentage">
              {pendingPercentage}%
            </div>
          </div>
          <div className="status-bar">
            <div className="bar-label">취소</div>
            <div className="bar-container">
              <div 
                className="bar-fill danger" 
                style={{ width: `${canceledPercentage}%` }}
              ></div>
            </div>
            <div className="bar-percentage">
              {canceledPercentage}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;

