import React from 'react';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './InventoryCard.css';

const InventoryCard = ({ data }) => {
  const totalProducts = data?.totalProducts || 0;
  const lowStockProducts = data?.lowStockProducts || 0;
  const stockFulfillmentRate = data?.stockFulfillmentRate || 0;

  return (
    <div className="inventory-card">
      <div className="card-header">
        <Package className="card-icon" size={24} />
        <h3>재고 현황</h3>
      </div>
      
      <div className="inventory-stats">
        <div className="stat-item">
          <div className="stat-label">총 재고 품목</div>
          <div className="stat-value primary">
            {totalProducts}개
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">재고 부족 품목</div>
          <div className="stat-value warning">
            {lowStockProducts}개
          </div>
          {lowStockProducts > 0 && (
            <div className="stat-alert">
              <AlertTriangle size={14} />
              <span>재고 보충 필요</span>
            </div>
          )}
        </div>

        <div className="stat-item">
          <div className="stat-label">재고 충족률</div>
          <div className="stat-value">
            {stockFulfillmentRate.toFixed(1)}%
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${stockFulfillmentRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="inventory-alerts">
        <div className="alert-header">
          <Clock size={16} />
          <span>재고 알림</span>
        </div>
        <div className="alert-list">
          {lowStockProducts > 0 ? (
            <div className="alert-item warning">
              <AlertTriangle size={12} />
              <span>{lowStockProducts}개 품목 재고 부족</span>
            </div>
          ) : (
            <div className="alert-item success">
              <CheckCircle size={12} />
              <span>모든 재고 충족</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryCard;

