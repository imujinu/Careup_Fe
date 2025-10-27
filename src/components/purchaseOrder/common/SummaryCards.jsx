import React from 'react';
import styled from 'styled-components';

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #ffffff;
  background: ${props => {
    switch(props.type) {
      case 'total': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'amount': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardTitle = styled.h3`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 4px 0;
  font-weight: 500;
`;

const CardValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

function SummaryCards({ summary }) {
  // 금액 포맷 함수
  const formatTotalAmount = (value) => {
    if (value === 0) return '₩0';
    if (value < 10000) return `₩${value.toLocaleString()}`;
    if (value < 100000000) return `₩${(value / 10000).toFixed(1)}만원`;
    return `₩${(value / 100000000).toFixed(1)}억`;
  };

  return React.createElement(CardsContainer, null,
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'total' },
        React.createElement('span', null, '🛒')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '총 발주 건수'),
        React.createElement(CardValue, null, summary.totalOrders)
      )
    ),
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'pending' },
        React.createElement('span', null, '⏰')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '대기중'),
        React.createElement(CardValue, null, summary.pending)
      )
    ),
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'completed' },
        React.createElement('span', null, '✅')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '완료'),
        React.createElement(CardValue, null, summary.completed)
      )
    ),
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'amount' },
        React.createElement('span', null, '₩')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '총 발주 금액'),
        React.createElement(CardValue, null, formatTotalAmount(summary.totalAmount))
      )
    )
  );
}

export default SummaryCards;
