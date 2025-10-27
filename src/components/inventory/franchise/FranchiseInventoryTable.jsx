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

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
`;

const ProductSku = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$status === 'normal' ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.$status === 'normal' ? '#166534' : '#dc2626'};
`;

const ActionLinks = styled.div`
  display: flex;
  gap: 16px;
`;

const ActionLink = styled.button`
  background: none;
  border: none;
  color: #6b46c1;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: #553c9a;
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

const PageSizeSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: #ffffff;
`;

const PageButton = styled.button`
  padding: 8px 12px;
  margin: 0 4px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: ${props => props.$isActive ? '#6b46c1' : '#ffffff'};
  color: ${props => props.$isActive ? '#ffffff' : '#374151'};
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.$isActive ? '#553c9a' : '#f9fafb'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function FranchiseInventoryTable({
  data,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onModify
}) {
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
          React.createElement(TableHeaderCell, null, '작업')
        )
      ),
      React.createElement(TableBody, null,
        data.map((item, index) =>
          React.createElement(TableRow, { key: index },
            React.createElement(TableCell, null,
              React.createElement(ProductInfo, null,
                React.createElement(ProductName, null, item.product.name)
              )
            ),
            React.createElement(TableCell, null, item.category || '미분류'),
            React.createElement(TableCell, null, `${item.currentStock}개`),
            React.createElement(TableCell, null, `${item.safetyStock}개`),
            React.createElement(TableCell, null,
              React.createElement(StatusBadge, { $status: item.status },
                item.status === 'normal' ? '정상' : '부족'
              )
            ),
            React.createElement(TableCell, null, `₩${item.unitPrice.toLocaleString()}`),
            React.createElement(TableCell, null, `₩${item.totalValue.toLocaleString()}`),
            React.createElement(TableCell, null,
              React.createElement(ActionLinks, null,
                React.createElement(ActionLink, { onClick: () => onModify(item) }, '수정')
              )
            )
          )
        )
      )
    ),
    React.createElement(PaginationContainer, null,
      React.createElement('div', null,
        React.createElement('span', { style: { marginRight: '8px', fontSize: '14px', color: '#6b7280' } }, '페이지당 표시'),
        React.createElement(PageSizeSelect, {
          value: pageSize,
          onChange: (e) => onPageSizeChange(parseInt(e.target.value))
        },
          React.createElement('option', { value: 10 }, '10'),
          React.createElement('option', { value: 20 }, '20'),
          React.createElement('option', { value: 50 }, '50')
        )
      ),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        React.createElement(PageButton, {
          onClick: () => onPageChange(currentPage - 1),
          disabled: currentPage === 1,
          $isActive: false
        }, '<'),
        // 모든 페이지 번호 표시
        ...Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum =>
          React.createElement(PageButton, {
            key: pageNum,
            onClick: () => onPageChange(pageNum),
            $isActive: pageNum === currentPage
          }, pageNum)
        ),
        React.createElement(PageButton, {
          onClick: () => onPageChange(currentPage + 1),
          disabled: currentPage === totalPages,
          $isActive: false
        }, '>')
      )
    )
  );
}

export default FranchiseInventoryTable;
