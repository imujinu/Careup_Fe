import React from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

const SearchRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  height: 44px;
  padding: 0 16px 0 48px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #f9fafb;
  outline: none;
  position: relative;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
    background: #ffffff;
  }
`;

const SearchInputContainer = styled.div`
  flex: 1;
  position: relative;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 16px;
  z-index: 1;
`;

const Select = styled.select`
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  outline: none;
  min-width: 140px;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const AddButton = styled.button`
  height: 44px;
  padding: 0 20px;
  background: #6b46c1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #553c9a;
  }
`;

function SearchAndFilter({ filters, onFiltersChange, onAddInventory, userRole }) {
  const handleSearchChange = (value) => {
    onFiltersChange({ ...filters, searchTerm: value });
  };

  const handleBranchFilterChange = (value) => {
    onFiltersChange({ ...filters, branchFilter: value });
  };

  const handleCategoryFilterChange = (value) => {
    onFiltersChange({ ...filters, categoryFilter: value });
  };

  const handleStatusFilterChange = (value) => {
    onFiltersChange({ ...filters, statusFilter: value });
  };

  return React.createElement(SearchContainer, null,
    React.createElement(SearchRow, null,
      React.createElement(SearchInputContainer, null,
        React.createElement(SearchIcon, null, '🔍'),
        React.createElement(SearchInput, {
          type: 'text',
          placeholder: '상품명, 바코드, SKU로 검색...',
          value: filters.searchTerm,
          onChange: (e) => handleSearchChange(e.target.value)
        })
      ),
      React.createElement(Select, {
        value: filters.categoryFilter || '',
        onChange: (e) => handleCategoryFilterChange(e.target.value)
      },
        React.createElement('option', { value: '' }, '전체 카테고리'),
        React.createElement('option', { value: '음료' }, '음료'),
        React.createElement('option', { value: '디저트' }, '디저트'),
        React.createElement('option', { value: '빵' }, '빵'),
        React.createElement('option', { value: '원두' }, '원두')
      ),
      React.createElement(Select, {
        value: filters.branchFilter,
        onChange: (e) => handleBranchFilterChange(e.target.value)
      },
        React.createElement('option', { value: '' }, '전체 지점'),
        React.createElement('option', { value: '본사' }, '본사'),
        React.createElement('option', { value: '강남점' }, '강남점'),
        React.createElement('option', { value: '신촌점' }, '신촌점'),
        React.createElement('option', { value: '홍대점' }, '홍대점')
      ),
      React.createElement(Select, {
        value: filters.statusFilter,
        onChange: (e) => handleStatusFilterChange(e.target.value)
      },
        React.createElement('option', { value: '' }, '전체 상태'),
        React.createElement('option', { value: 'normal' }, '정상'),
        React.createElement('option', { value: 'low' }, '부족')
      ),
      // 본사 관리자는 상품 등록, 지점 관리자는 지점별 상품 추가
      userRole === 'HQ_ADMIN' ? 
        React.createElement(AddButton, { onClick: onAddInventory },
          React.createElement('span', null, '+'),
          '상품 등록'
        ) :
        React.createElement(AddButton, { onClick: onAddInventory },
          React.createElement('span', null, '+'),
          '지점에 상품 추가'
        )
    )
  );
}

export default SearchAndFilter;
