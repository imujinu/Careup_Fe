import React from 'react';
import styled from 'styled-components';

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.columnCount || 4}, 1fr);
  gap: 24px;
  margin-bottom: 32px;
`;

const SummaryCard = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
`;

const CardValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
`;

function SummaryCards({ summary, userRole }) {
  // 금액 포맷 함수
  const formatTotalValue = (value) => {
    if (value === 0) return '₩0';
    if (value < 10000) return `₩${value.toLocaleString()}`;
    if (value < 100000000) return `₩${(value / 10000).toFixed(1)}만원`;
    return `₩${(value / 100000000).toFixed(1)}억`;
  };

  // 가맹점인지 확인
  const isFranchise = userRole === 'BRANCH_MANAGER' || userRole === 'BRANCH_STAFF';

  const cards = [
    {
      title: '총 재고 품목',
      value: summary.totalItems,
      icon: '📦',
      color: '#f3e8ff',
      iconColor: '#6b46c1'
    },
    {
      title: '재고 부족',
      value: summary.lowStockItems ?? summary.lowStock ?? 0,
      icon: '⚠️',
      color: '#fef2f2',
      iconColor: '#ef4444'
    },
    // 가맹점이 아닐 때만 총 지점 수 카드 표시
    ...(isFranchise ? [] : [{
      title: '총 지점 수',
      value: summary.totalBranches ?? 0,
      icon: '🏢',
      color: '#f0fdf4',
      iconColor: '#10b981'
    }]),
    {
      title: '총 재고 가치',
      value: formatTotalValue(summary.totalValue),
      icon: '📈',
      color: '#f3e8ff',
      iconColor: '#6b46c1'
    }
  ];

  const columnCount = cards.length;

  return React.createElement(CardsContainer, { columnCount },
    cards.map((card, index) =>
      React.createElement(SummaryCard, { key: index },
        React.createElement(CardHeader, null,
          React.createElement(CardIcon, { color: card.color },
            React.createElement('span', { style: { color: card.iconColor } }, card.icon)
          )
        ),
        React.createElement(CardTitle, null, card.title),
        React.createElement(CardValue, null, card.value)
      )
    )
  );
}

export default SummaryCards;
