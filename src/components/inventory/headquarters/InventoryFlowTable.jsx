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
  text-align: ${props => props.$center ? 'center' : 'left'};
  font-weight: 600;
  font-size: 14px;
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

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #f3f4f6;
  text-align: ${props => props.$center ? 'center' : 'left'};
  max-width: ${props => {
    if (props.$productName) return '200px';
    if (props.$branch) return '120px';
    if (props.$remark) return '200px';
    return 'none';
  }};
  overflow: ${props => (props.$productName || props.$branch || props.$remark) ? 'hidden' : 'visible'};
  text-overflow: ${props => (props.$productName || props.$branch || props.$remark) ? 'ellipsis' : 'clip'};
  white-space: ${props => (props.$productName || props.$branch || props.$remark) ? 'nowrap' : 'normal'};
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

// 정렬 가능한 컬럼 정의
const SORTABLE_COLUMNS = {
  productName: 'productName',
  branch: 'branch',
  createdAt: 'createdAt',
  inQuantity: 'inQuantity',
  outQuantity: 'outQuantity',
};

function InventoryFlowTable({ 
  data = [], 
  currentPage = 1, 
  totalPages = 1, 
  pageSize = 10,
  totalCount = null,
  branchList = [],
  onPageChange,
  onPageSizeChange,
  onEdit,
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

  const getBranchName = (branchId, itemBranchName) => {
    // branchId가 1이면 항상 본점으로 표시
    if (branchId === 1) {
      return '본점';
    }
    
    // API 응답에 branchName이 포함되어 있으면 사용 (본사가 들어올 경우 본점으로 변경)
    if (itemBranchName) {
      return itemBranchName === '본사' ? '본점' : itemBranchName;
    }
    
    // branchList에서 지점명 찾기
    const branch = branchList.find(b => {
      const branchIdMatch = b.id === branchId || String(b.id) === String(branchId);
      const branchNameMatch = b.name && b.name.includes(String(branchId));
      return branchIdMatch || branchNameMatch;
    });
    
    if (branch && branch.name) {
      // branchList에서 찾은 이름도 본사면 본점으로 변경
      return branch.name === '본사' ? '본점' : branch.name;
    }
    
    // 찾지 못한 경우 fallback
    return `지점-${branchId}`;
  };
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
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.productName)
          }, '상품명', getSortIndicator(SORTABLE_COLUMNS.productName)),
          React.createElement(TableHeaderCell, { $center: true }, '옵션1'),
          React.createElement(TableHeaderCell, { $center: true }, '옵션명1'),
          React.createElement(TableHeaderCell, { $center: true }, '옵션2'),
          React.createElement(TableHeaderCell, { $center: true }, '옵션명2'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.branch)
          }, '지점', getSortIndicator(SORTABLE_COLUMNS.branch)),
          React.createElement(TableHeaderCell, null, '구분'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.inQuantity)
          }, '입고수량', getSortIndicator(SORTABLE_COLUMNS.inQuantity)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.outQuantity)
          }, '출고수량', getSortIndicator(SORTABLE_COLUMNS.outQuantity)),
          React.createElement(TableCell, null, '비고'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.createdAt)
          }, '등록일시', getSortIndicator(SORTABLE_COLUMNS.createdAt)),
          React.createElement(TableHeaderCell, null, '작업')
        )
      ),
      React.createElement('tbody', null,
        data.map((item, index) => {
          // 속성 정보 배열로 변환 (최대 2개)
          const attributes = [];
          
          // item.attributes가 배열인 경우
          if (Array.isArray(item.attributes)) {
            attributes.push(...item.attributes.slice(0, 2));
          } 
          // 단일 속성 정보가 있는 경우
          else if (item.attributeTypeName && item.attributeValueName) {
            attributes.push({
              attributeTypeName: item.attributeTypeName,
              attributeValueName: item.attributeValueName
            });
          }
          
          const option1 = attributes[0];
          const option2 = attributes[1];
          
          return React.createElement(TableRow, { key: item.id || index },
            React.createElement(TableCell, { $productName: true }, item.productName || '-'),
            React.createElement(TableCell, { $center: true }, option1?.attributeTypeName || '-'),
            React.createElement(TableCell, { $center: true }, option1?.attributeValueName || '-'),
            React.createElement(TableCell, { $center: true }, option2?.attributeTypeName || '-'),
            React.createElement(TableCell, { $center: true }, option2?.attributeValueName || '-'),
            React.createElement(TableCell, { $branch: true }, getBranchName(item.branchId, item.branchName)),
            React.createElement(TableCell, null, getStatusBadge(item)),
            React.createElement(TableCell, null, formatQuantity(item.inQuantity)),
            React.createElement(TableCell, null, formatQuantity(item.outQuantity)),
            React.createElement(TableCell, { $remark: true }, item.remark || '-'),
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
          );
        })
      )
    ),
    totalPages > 1 && React.createElement(PaginationContainer, null,
      React.createElement(PaginationInfo, null,
        `총 ${totalCount !== null ? totalCount : data.length}개 중 ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalCount !== null ? totalCount : data.length)}개 표시`
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
