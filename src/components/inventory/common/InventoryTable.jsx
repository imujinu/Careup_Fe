import React from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  overflow-x: auto; /* 가로 스크롤 추가 */
  overflow-y: visible;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  min-width: 100%;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
    
    &:hover {
      background: #a8a8a8;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: auto; /* 자동 레이아웃 */
  min-width: 1400px; /* 최소 너비 설정 */
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 8px; /* 패딩 축소 */
  text-align: ${props => props.$center ? 'center' : 'left'};
  font-size: 13px; /* 폰트 크기 약간 축소 */
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  cursor: ${props => props.$sortable ? 'pointer' : 'default'};
  user-select: none;
  position: relative;
  transition: all 0.2s;
  white-space: nowrap; /* 헤더 텍스트 줄바꿈 방지 */
  min-width: ${props => {
    if (props.$productName) return '120px';
    if (props.$option) return '80px';
    if (props.$category) return '100px';
    if (props.$branch) return '80px';
    if (props.$number) return '90px';
    if (props.$price) return '100px';
    if (props.$action) return '120px';
    return '80px';
  }};
  
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
  padding: 12px 8px; /* 패딩 축소 */
  font-size: 13px; /* 폰트 크기 약간 축소 */
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap; /* 텍스트 줄바꿈 방지 */
  text-align: ${props => props.$center ? 'center' : 'left'};
  min-width: ${props => {
    if (props.$productName) return '120px';
    if (props.$option) return '80px';
    if (props.$category) return '100px';
    if (props.$branch) return '80px';
    if (props.$number) return '90px';
    if (props.$price) return '100px';
    if (props.$action) return '120px';
    return '80px';
  }};
  max-width: ${props => {
    if (props.$productName) return '180px';
    if (props.$option) return '100px';
    if (props.$category) return '120px';
    if (props.$branch) return '100px';
    if (props.$number) return '110px';
    if (props.$price) return '120px';
    if (props.$action) return '140px';
    return 'none';
  }};
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProductSku = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$status === 'normal' ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.$status === 'normal' ? '#166534' : '#dc2626'};
`;

const ActionLinks = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: nowrap;
  align-items: center;
  white-space: nowrap;
`;

const ActionLink = styled.button`
  background: none;
  border: none;
  color: #6b46c1;
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
  padding: 2px 4px;
  
  &:hover {
    color: #553c9a;
  }
`;

const TableFooter = styled.div`
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

const Pagination = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PageButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: ${props => props.$isActive ? '#6b46c1' : '#ffffff'};
  color: ${props => props.$isActive ? '#ffffff' : '#374151'};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.$isActive ? '#553c9a' : '#f9fafb'};
  }
`;

// 정렬 가능한 컬럼 정의
const SORTABLE_COLUMNS = {
  productName: 'productName',
  category: 'category',
  branch: 'branch',
  currentStock: 'currentStock',
  safetyStock: 'safetyStock',
  unitPrice: 'unitPrice',
  salesPrice: 'salesPrice',
  totalValue: 'totalValue',
};

function InventoryTable({
  data,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onModify,
  onDetail,
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
            $productName: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.productName)
          }, '상품명', getSortIndicator(SORTABLE_COLUMNS.productName)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $category: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.category)
          }, '카테고리', getSortIndicator(SORTABLE_COLUMNS.category)),
          React.createElement(TableHeaderCell, { $center: true, $option: true }, '옵션1'),
          React.createElement(TableHeaderCell, { $center: true, $option: true }, '옵션명1'),
          React.createElement(TableHeaderCell, { $center: true, $option: true }, '옵션2'),
          React.createElement(TableHeaderCell, { $center: true, $option: true }, '옵션명2'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $center: true,
            $branch: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.branch)
          }, '지점', getSortIndicator(SORTABLE_COLUMNS.branch)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $center: true,
            $number: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.currentStock)
          }, '현재고', getSortIndicator(SORTABLE_COLUMNS.currentStock)),
          React.createElement(TableHeaderCell, { 
            $center: true,
            $number: true
          }, '예약재고'),
          React.createElement(TableHeaderCell, { 
            $center: true,
            $number: true
          }, '사용가능'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $center: true,
            $number: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.safetyStock)
          }, '안전재고', getSortIndicator(SORTABLE_COLUMNS.safetyStock)),
          React.createElement(TableHeaderCell, { $center: true, $number: true }, '상태'),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $center: true,
            $price: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.unitPrice)
          }, '공급가', getSortIndicator(SORTABLE_COLUMNS.unitPrice)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $center: true,
            $price: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.salesPrice)
          }, '판매가', getSortIndicator(SORTABLE_COLUMNS.salesPrice)),
          React.createElement(TableHeaderCell, { 
            $sortable: true,
            $center: true,
            $price: true,
            onClick: () => handleSort(SORTABLE_COLUMNS.totalValue)
          }, '총 가치', getSortIndicator(SORTABLE_COLUMNS.totalValue)),
          React.createElement(TableHeaderCell, { $center: true, $action: true }, '작업')
        )
      ),
      React.createElement(TableBody, null,
        data.map((item, index) => {
          // 속성 정보 추출 (최대 2개)
          const attributes = item.attributes || [];
          const option1 = attributes[0] || null;
          const option2 = attributes[1] || null;
          
          return React.createElement(TableRow, { key: index },
            React.createElement(TableCell, { $productName: true },
              React.createElement(ProductName, null, item.product.name)
            ),
            React.createElement(TableCell, { $category: true }, item.category || '미분류'),
            React.createElement(TableCell, { $center: true, $option: true }, option1?.attributeTypeName || '-'),
            React.createElement(TableCell, { $center: true, $option: true }, option1?.attributeValueName || '-'),
            React.createElement(TableCell, { $center: true, $option: true }, option2?.attributeTypeName || '-'),
            React.createElement(TableCell, { $center: true, $option: true }, option2?.attributeValueName || '-'),
            React.createElement(TableCell, { $center: true, $branch: true }, item.branch),
            React.createElement(TableCell, { $center: true, $number: true }, `${item.currentStock}개`),
            React.createElement(TableCell, { $center: true, $number: true, style: { color: '#6b7280' } }, `${item.reservedStock || 0}개`),
            React.createElement(TableCell, { 
              $center: true,
              $number: true,
              style: { 
                color: (item.availableStock || 0) <= 0 ? '#dc2626' : '#059669',
                fontWeight: 600
              } 
            }, `${item.availableStock || 0}개`),
            React.createElement(TableCell, { $center: true, $number: true }, `${item.safetyStock}개`),
            React.createElement(TableCell, { $center: true, $number: true },
              React.createElement(StatusBadge, { $status: item.status },
                item.status === 'normal' ? '정상' : '부족'
              )
            ),
            React.createElement(TableCell, { $center: true, $price: true }, `₩${item.unitPrice.toLocaleString()}`),
            React.createElement(TableCell, { $center: true, $price: true }, item.salesPrice ? `₩${item.salesPrice.toLocaleString()}` : '-'),
            React.createElement(TableCell, { $center: true, $price: true }, `₩${item.totalValue.toLocaleString()}`),
            React.createElement(TableCell, { $center: true, $action: true },
              React.createElement(ActionLinks, null,
                React.createElement(ActionLink, { onClick: () => onModify(item) }, '수정'),
                React.createElement(ActionLink, { onClick: () => onDetail(item) }, '상세'),
                React.createElement(ActionLink, { 
                  onClick: () => onDelete && onDelete(item),
                  style: { color: '#dc2626' }
                }, '삭제')
              )
            )
          );
        })
      )
    ),
    React.createElement(TableFooter, null,
      React.createElement(PageSizeSelect, {
        value: pageSize,
        onChange: (e) => onPageSizeChange(Number(e.target.value))
      },
        React.createElement('option', { value: 10 }, '페이지당 표시: 10'),
        React.createElement('option', { value: 20 }, '페이지당 표시: 20'),
        React.createElement('option', { value: 50 }, '페이지당 표시: 50')
      ),
      React.createElement(Pagination, null,
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

export default InventoryTable;


