import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  
  &:hover {
    background: #f9fafb;
  }
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  
  &.in {
    background: #d1fae5;
    color: #065f46;
  }
  
  &.out {
    background: #fee2e2;
    color: #991b1b;
  }
  
  &.adjustment {
    background: #fef3c7;
    color: #92400e;
  }
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  margin-right: 8px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.edit {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  }
  
  &.delete {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const PaginationButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
`;

function InventoryFlowTable({ 
  data = [], 
  currentPage = 1, 
  totalPages = 1, 
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete 
}) {
  const getStatusBadge = (item) => {
    const inQty = item.inQuantity || 0;
    const outQty = item.outQuantity || 0;
    const netChange = inQty - outQty;
    
    if (netChange > 0) {
      return React.createElement(StatusBadge, { className: "in" }, `입고 (+${netChange})`);
    } else if (netChange < 0) {
      return React.createElement(StatusBadge, { className: "out" }, `출고 (${netChange})`);
    } else if (inQty > 0 && outQty > 0) {
      return React.createElement(StatusBadge, { className: "adjustment" }, `조정 (입${inQty}/출${outQty})`);
    } else {
      return React.createElement(StatusBadge, { className: "adjustment" }, "조정");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // 날짜 파싱 실패시 원본 문자열 반환
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString; // 에러 발생시 원본 문자열 반환
    }
  };

  const formatQuantity = (quantity) => {
    return quantity ? quantity.toLocaleString() : '-';
  };

  if (data.length === 0) {
    return React.createElement(TableContainer, null,
      React.createElement(EmptyState, null, '입출고 기록이 없습니다.')
    );
  }

  return React.createElement(TableContainer, null,
    React.createElement(Table, null,
      React.createElement(TableHeader, null,
        React.createElement(TableRow, null,
          React.createElement(TableHeaderCell, null, '상품명'),
          React.createElement(TableHeaderCell, null, '지점'),
          React.createElement(TableHeaderCell, null, '구분'),
          React.createElement(TableHeaderCell, null, '입고수량'),
          React.createElement(TableHeaderCell, null, '출고수량'),
          React.createElement(TableHeaderCell, null, '비고'),
          React.createElement(TableHeaderCell, null, '등록일시'),
          React.createElement(TableHeaderCell, null, '작업')
        )
      ),
      React.createElement('tbody', null,
        data.map((item, index) => 
          React.createElement(TableRow, { key: item.id || index },
            React.createElement(TableCell, null, item.productName || '-'),
            React.createElement(TableCell, null, item.branchId === 1 ? '본사' : `지점-${item.branchId}`),
            React.createElement(TableCell, null, getStatusBadge(item)),
            React.createElement(TableCell, null, formatQuantity(item.inQuantity)),
            React.createElement(TableCell, null, formatQuantity(item.outQuantity)),
            React.createElement(TableCell, null, item.remark || '-'),
            React.createElement(TableCell, null, formatDate(item.createdAt)),
            React.createElement(TableCell, null,
              React.createElement(ActionButton, {
                className: 'edit',
                onClick: () => onEdit && onEdit(item)
              }, '수정'),
              React.createElement(ActionButton, {
                className: 'delete',
                onClick: () => {
                  if (window.confirm('이 입출고 기록을 삭제하시겠습니까?')) {
                    onDelete && onDelete(item);
                  }
                }
              }, '삭제')
            )
          )
        )
      )
    ),
    totalPages > 1 && React.createElement(PaginationContainer, null,
      React.createElement(PaginationInfo, null,
        `총 ${data.length}개 중 ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, data.length)}개 표시`
      ),
      React.createElement(PaginationButtons, null,
        React.createElement(PaginationButton, {
          onClick: () => onPageChange && onPageChange(currentPage - 1),
          disabled: currentPage === 1
        }, '이전'),
        Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
          return React.createElement(PaginationButton, {
            key: pageNum,
            className: currentPage === pageNum ? 'active' : '',
            onClick: () => onPageChange && onPageChange(pageNum)
          }, pageNum);
        }),
        React.createElement(PaginationButton, {
          onClick: () => onPageChange && onPageChange(currentPage + 1),
          disabled: currentPage === totalPages
        }, '다음')
      )
    )
  );
}

export default InventoryFlowTable;
