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
      case 'lowStock': return '#ef4444';
      case 'categories': return '#10b981';
      case 'value': return '#8b5cf6';
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
  return React.createElement(CardsContainer, null,
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'total' },
        React.createElement('span', null, '📦')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '총 재고 품목'),
        React.createElement(CardValue, null, summary.totalItems)
      )
    ),
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'lowStock' },
        React.createElement('span', null, '⚠️')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '재고 부족'),
        React.createElement(CardValue, null, summary.lowStock)
      )
    ),
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'categories' },
        React.createElement('span', null, '📋')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '카테고리 수'),
        React.createElement(CardValue, null, summary.categories)
      )
    ),
    React.createElement(Card, null,
      React.createElement(IconContainer, { type: 'value' },
        React.createElement('span', null, '₩')
      ),
      React.createElement(CardContent, null,
        React.createElement(CardTitle, null, '총 재고 가치'),
        React.createElement(CardValue, null, `₩${(summary.totalValue / 1000).toFixed(0)}K`)
      )
    )
  );
}

export default SummaryCards;
