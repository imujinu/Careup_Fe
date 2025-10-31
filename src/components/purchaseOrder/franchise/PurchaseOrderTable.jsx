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

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    const status = props.status?.toLowerCase();
    switch(status) {
      case 'pending': return '#fef3c7';
      case 'approved': return '#d1fae5';
      case 'rejected': return '#fee2e2';
      case 'partial': return '#fef3c7';
      case 'shipped': return '#e0e7ff';
      case 'completed': return '#fef3c7';
      case 'cancelled': return '#fee2e2';
      case 'inprogress': return '#dbeafe';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    const status = props.status?.toLowerCase();
    switch(status) {
      case 'pending': return '#92400e';
      case 'approved': return '#065f46';
      case 'rejected': return '#991b1b';
      case 'partial': return '#d97706';
      case 'shipped': return '#4338ca';
      case 'completed': return '#92400e';
      case 'cancelled': return '#991b1b';
      case 'inprogress': return '#1e40af';
      default: return '#374151';
    }
  }};
`;

const DetailLink = styled.button`
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

// 정렬 가능한 컬럼 정의
const SORTABLE_COLUMNS = {
  orderNo: 'orderNo',
  orderDate: 'orderDate',
  productCount: 'productCount',
  totalAmount: 'totalAmount',
  status: 'status',
  deliveryDate: 'deliveryDate',
};

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

function PurchaseOrderTable({ data, currentPage, totalPages, pageSize, onPageChange, onPageSizeChange, onDetail, onSort, currentSort }) {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusText = (status) => {
    if (!status) return status;
    const upperStatus = status.toUpperCase();
    switch(upperStatus) {
      case 'PENDING': return '대기중';
      case 'APPROVED': return '승인됨';
      case 'REJECTED': return '반려됨';
      case 'PARTIAL': return '부분승인';
      case 'SHIPPED': return '배송중';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소됨';
      // 기존 상태 호환
      case 'INPROGRESS': return '처리중';
      default: return status;
    }
  };

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
          React.createElement(TableHeaderCell, null, '목록번호'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.orderNo)
          }, '발주번호', getSortIndicator(SORTABLE_COLUMNS.orderNo)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.orderDate)
          }, '발주일', getSortIndicator(SORTABLE_COLUMNS.orderDate)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.productCount)
          }, '상품 수', getSortIndicator(SORTABLE_COLUMNS.productCount)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.totalAmount)
          }, '총 금액', getSortIndicator(SORTABLE_COLUMNS.totalAmount)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.status)
          }, '상태', getSortIndicator(SORTABLE_COLUMNS.status)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.deliveryDate)
          }, '배송예정일', getSortIndicator(SORTABLE_COLUMNS.deliveryDate)),
          React.createElement(TableHeaderCell, null, '작업')
        )
      ),
      React.createElement(TableBody, null,
        data.map((item, index) =>
          React.createElement(TableRow, { key: index },
            React.createElement(TableCell, null, index + 1),
            React.createElement(TableCell, null, item.displayOrderNo || item.id),
            React.createElement(TableCell, null, item.orderDate),
            React.createElement(TableCell, null, `${item.productCount}개`),
            React.createElement(TableCell, null, `₩${formatAmount(item.totalAmount)}`),
            React.createElement(TableCell, null,
              React.createElement(StatusBadge, { status: (item.status || '').toLowerCase() }, getStatusText(item.status))
            ),
            React.createElement(TableCell, null, item.deliveryDate),
            React.createElement(TableCell, null,
              React.createElement(DetailLink, { onClick: () => onDetail(item) }, '상세보기')
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
        // 모든 페이지 번호 표시
        ...Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum =>
          React.createElement(PaginationButton, {
            key: pageNum,
            active: pageNum === currentPage,
            onClick: () => onPageChange(pageNum)
          }, pageNum)
        ),
        React.createElement(PaginationButton, {
          onClick: () => onPageChange(currentPage + 1),
          disabled: currentPage === totalPages
        }, '>')
      )
    )
  );
}

export default PurchaseOrderTable;
