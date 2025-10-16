import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #fee2e2;
  color: #991b1b;
`;

const ModifyButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #2563eb;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const PageSizeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageSizeLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const PageSizeSelect = styled.select`
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaginationButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background: ${props => props.active ? '#6b46c1' : '#ffffff'};
  color: ${props => props.active ? '#ffffff' : '#374151'};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.active ? '#553c9a' : '#f3f4f6'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function InventoryTable({ data, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, onModify }) {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'low': return '부족';
      case 'normal': return '정상';
      case 'high': return '과다';
      default: return status;
    }
  };

  return React.createElement(TableContainer, null,
    React.createElement(Table, null,
      React.createElement(TableHeader, null,
        React.createElement('tr', null,
          React.createElement(TableHeaderCell, null, '상품'),
          React.createElement(TableHeaderCell, null, '카테고리'),
          React.createElement(TableHeaderCell, null, '현재고'),
          React.createElement(TableHeaderCell, null, '안전재고'),
          React.createElement(TableHeaderCell, null, '상태'),
          React.createElement(TableHeaderCell, null, '단가'),
          React.createElement(TableHeaderCell, null, '총 가치'),
          React.createElement(TableHeaderCell, null, '마지막 입고'),
          React.createElement(TableHeaderCell, null, '작업')
        )
      ),
      React.createElement(TableBody, null,
        data.map((item, index) =>
          React.createElement(TableRow, { key: index },
            React.createElement(TableCell, null,
              React.createElement('div', null,
                React.createElement('div', { style: { fontWeight: '600', marginBottom: '4px' } }, item.name),
                React.createElement('div', { style: { fontSize: '12px', color: '#6b7280' } }, item.id)
              )
            ),
            React.createElement(TableCell, null, item.category),
            React.createElement(TableCell, null, `${item.currentStock}${item.unit}`),
            React.createElement(TableCell, null, `${item.safetyStock}${item.unit}`),
            React.createElement(TableCell, null,
              React.createElement(StatusBadge, null, getStatusText(item.status))
            ),
            React.createElement(TableCell, null, `₩${formatAmount(item.unitPrice)}`),
            React.createElement(TableCell, null, `₩${formatAmount(item.totalValue)}`),
            React.createElement(TableCell, null, item.lastReceived),
            React.createElement(TableCell, null,
              React.createElement(ModifyButton, { onClick: () => onModify(item) }, '수정')
            )
          )
        )
      )
    ),
    React.createElement(PaginationContainer, null,
      React.createElement(PageSizeContainer, null,
        React.createElement(PageSizeLabel, null, '페이지당 표시'),
        React.createElement(PageSizeSelect, {
          value: pageSize,
          onChange: (e) => onPageSizeChange(parseInt(e.target.value))
        },
          React.createElement('option', { value: 10 }, '10'),
          React.createElement('option', { value: 20 }, '20'),
          React.createElement('option', { value: 50 }, '50')
        )
      ),
      React.createElement(PaginationControls, null,
        React.createElement(PaginationButton, {
          onClick: () => onPageChange(currentPage - 1),
          disabled: currentPage === 1
        }, '<'),
        React.createElement(PaginationButton, {
          active: true,
          onClick: () => onPageChange(1)
        }, '1'),
        React.createElement(PaginationButton, {
          onClick: () => onPageChange(currentPage + 1),
          disabled: currentPage === totalPages
        }, '>')
      )
    )
  );
}

export default InventoryTable;
