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
  cursor: ${props => props.$sortable ? 'pointer' : 'default'};
  user-select: none;
  position: relative;
  transition: all 0.2s;
  
  &:hover {
    ${props => props.$sortable && `
      color: #6d28d9;
      background: #f9fafb;
    `}
  }
`;

const SortIndicator = styled.span`
  margin-left: 4px;
  font-size: 10px;
  color: ${props => props.$active ? '#6d28d9' : '#d1d5db'};
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

const DeleteLink = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  
  &:hover {
    color: #dc2626;
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

// 정렬 가능한 컬럼 정의
const SORTABLE_COLUMNS = {
  productName: 'productName',
  category: 'category',
  currentStock: 'currentStock',
  safetyStock: 'safetyStock',
  supplyPrice: 'supplyPrice',
  salesPrice: 'salesPrice',
  totalValue: 'totalValue',
};

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
  onModify,
  onViewDetail,
  onDelete,
  onSort,
  currentSort
}) {
  const handleSort = (field) => {
    if (!onSort) return;
    
    let direction = 'asc';
    
    // 현재 정렬 필드와 동일하면 방향 토글
    if (currentSort?.field === field) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(field, direction);
  };

  const getSortIndicator = (field) => {
    if (!currentSort || currentSort.field !== field) {
      return React.createElement(SortIndicator, null, '⇅');
    }
    return React.createElement(SortIndicator, { $active: true },
      currentSort.direction === 'asc' ? '↑' : '↓'
    );
  };
  return React.createElement(TableContainer, null,
    React.createElement(Table, null,
      React.createElement(TableHeader, null,
        React.createElement('tr', null,
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.productName)
          }, '상품', getSortIndicator(SORTABLE_COLUMNS.productName)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.category)
          }, '카테고리', getSortIndicator(SORTABLE_COLUMNS.category)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.currentStock)
          }, '현재고', getSortIndicator(SORTABLE_COLUMNS.currentStock)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.safetyStock)
          }, '안전재고', getSortIndicator(SORTABLE_COLUMNS.safetyStock)),
          React.createElement(TableHeaderCell, null, '상태'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.supplyPrice)
          }, '공급가', getSortIndicator(SORTABLE_COLUMNS.supplyPrice)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.salesPrice)
          }, '판매가', getSortIndicator(SORTABLE_COLUMNS.salesPrice)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.totalValue)
          }, '총 가치', getSortIndicator(SORTABLE_COLUMNS.totalValue)),
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
            React.createElement(TableCell, null, item.salesPrice ? `₩${item.salesPrice.toLocaleString()}` : '-'),
            React.createElement(TableCell, null, `₩${item.totalValue.toLocaleString()}`),
            React.createElement(TableCell, null,
              React.createElement(ActionLinks, null,
                React.createElement(ActionLink, { onClick: () => onModify(item) }, '수정'),
                onViewDetail && React.createElement(ActionLink, { onClick: () => onViewDetail(item) }, '상세'),
                React.createElement(DeleteLink, { onClick: () => onDelete(item) }, '삭제')
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
