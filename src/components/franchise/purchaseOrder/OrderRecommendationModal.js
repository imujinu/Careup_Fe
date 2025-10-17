import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #dc2626;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const InfoSection = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const InfoIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #0ea5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  flex: 1;
`;

const InfoTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0 0 4px 0;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #075985;
  margin: 0;
`;

const RecommendationSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
`;

const RecommendationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  
  &.checkbox-cell {
    width: 50px;
    text-align: center;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  
  &.checkbox-cell {
    text-align: center;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #8b5cf6;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: #fee2e2;
  color: #991b1b;
`;

const RecommendedQuantity = styled.span`
  font-weight: 600;
  color: #dc2626;
`;

const CurrentStock = styled.span`
  color: #6b7280;
`;

const SafetyStock = styled.span`
  color: #059669;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const ApplyRecommendationButton = styled(Button)`
  background: #8b5cf6;
  color: #ffffff;
  
  &:hover {
    background: #7c3aed;
  }
  
  &:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const TotalAmount = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

function OrderRecommendationModal({ isOpen, onClose, onApplyRecommendation }) {
  const [recommendations, setRecommendations] = useState([
    {
      id: 'MATERIAL-001',
      name: '커피원두',
      currentStock: 25,
      safetyStock: 30,
      recommendedQuantity: 15,
      unit: 'kg',
      unitPrice: 15000,
      totalPrice: 225000,
      reason: '재고 부족',
      selected: true
    },
    {
      id: 'MATERIAL-002',
      name: '우유',
      currentStock: 15,
      safetyStock: 25,
      recommendedQuantity: 20,
      unit: 'L',
      unitPrice: 3000,
      totalPrice: 60000,
      reason: '재고 부족',
      selected: true
    },
    {
      id: 'MATERIAL-003',
      name: '크로와상 반죽',
      currentStock: 8,
      safetyStock: 15,
      recommendedQuantity: 12,
      unit: 'kg',
      unitPrice: 12000,
      totalPrice: 144000,
      reason: '재고 부족',
      selected: true
    },
    {
      id: 'MATERIAL-004',
      name: '쿠키반죽',
      currentStock: 3,
      safetyStock: 10,
      recommendedQuantity: 10,
      unit: 'kg',
      unitPrice: 8000,
      totalPrice: 80000,
      reason: '재고 부족',
      selected: true
    },
    {
      id: 'MATERIAL-005',
      name: '치즈케이크 재료',
      currentStock: 2,
      safetyStock: 8,
      recommendedQuantity: 8,
      unit: 'kg',
      unitPrice: 25000,
      totalPrice: 200000,
      reason: '재고 부족',
      selected: true
    }
  ]);

  const selectedItems = recommendations.filter(item => item.selected);
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const selectedCount = selectedItems.length;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const handleToggleItem = (itemId) => {
    setRecommendations(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, selected: !item.selected }
          : item
      )
    );
  };

  const handleToggleAll = () => {
    const allSelected = recommendations.every(item => item.selected);
    setRecommendations(prev => 
      prev.map(item => ({ ...item, selected: !allSelected }))
    );
  };

  const handleApplyRecommendation = () => {
    const orderItems = selectedItems.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.recommendedQuantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    onApplyRecommendation(orderItems);
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '발주 추천'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(InfoSection, null,
          React.createElement(InfoIcon, null, '💡'),
          React.createElement(InfoContent, null,
            React.createElement(InfoTitle, null, 'AI 발주 추천'),
            React.createElement(InfoText, null, '현재 재고 상태와 판매 패턴을 분석하여 최적의 발주량을 추천합니다.')
          )
        ),
        React.createElement(RecommendationSection, null,
          React.createElement(SectionTitle, null, '추천 발주 목록'),
          React.createElement(RecommendationTable, null,
            React.createElement(TableHeader, null,
              React.createElement('tr', null,
                React.createElement(TableHeaderCell, { className: 'checkbox-cell' },
                  React.createElement(Checkbox, {
                    type: 'checkbox',
                    checked: recommendations.every(item => item.selected),
                    onChange: handleToggleAll
                  })
                ),
                React.createElement(TableHeaderCell, null, '상품명'),
                React.createElement(TableHeaderCell, null, '현재고'),
                React.createElement(TableHeaderCell, null, '안전재고'),
                React.createElement(TableHeaderCell, null, '추천수량'),
                React.createElement(TableHeaderCell, null, '단가'),
                React.createElement(TableHeaderCell, null, '금액'),
                React.createElement(TableHeaderCell, null, '사유')
              )
            ),
            React.createElement(TableBody, null,
              recommendations.map((item, index) =>
                React.createElement(TableRow, { key: index },
                  React.createElement(TableCell, { className: 'checkbox-cell' },
                    React.createElement(Checkbox, {
                      type: 'checkbox',
                      checked: item.selected,
                      onChange: () => handleToggleItem(item.id)
                    })
                  ),
                  React.createElement(TableCell, null, item.name),
                  React.createElement(TableCell, null,
                    React.createElement(CurrentStock, null, `${item.currentStock}${item.unit}`)
                  ),
                  React.createElement(TableCell, null,
                    React.createElement(SafetyStock, null, `${item.safetyStock}${item.unit}`)
                  ),
                  React.createElement(TableCell, null,
                    React.createElement(RecommendedQuantity, null, `${item.recommendedQuantity}${item.unit}`)
                  ),
                  React.createElement(TableCell, null, `₩${formatAmount(item.unitPrice)}`),
                  React.createElement(TableCell, null, `₩${formatAmount(item.totalPrice)}`),
                  React.createElement(TableCell, null,
                    React.createElement(StatusBadge, null, item.reason)
                  )
                )
              )
            )
          )
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '16px' } },
            React.createElement(TotalAmount, null, 
              `선택된 항목: ${selectedCount}개 | 총 금액: ₩${formatAmount(totalAmount)}`
            ),
            React.createElement(ApplyRecommendationButton, { 
              onClick: handleApplyRecommendation,
              disabled: selectedCount === 0
            }, '추천 적용')
          )
        )
      )
    )
  );
}

export default OrderRecommendationModal;
