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

function SearchAndFilter({ filters, onFiltersChange, onAddInventory, onAddProduct, userRole, branchList = [], categoryList = [] }) {
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
          placeholder: '상품명 검색',
          value: filters.searchTerm,
          onChange: (e) => handleSearchChange(e.target.value)
        })
      ),
      React.createElement(Select, {
        value: filters.categoryFilter || '',
        onChange: (e) => handleCategoryFilterChange(e.target.value)
      },
        React.createElement('option', { value: '' }, '전체 카테고리'),
        ...(categoryList.length > 0
          ? categoryList.map(category => 
              React.createElement('option', { key: category.id, value: category.name }, category.name)
            )
          : [
              // fallback: 카테고리 목록이 없을 때 기본 옵션
              React.createElement('option', { key: '음료', value: '음료' }, '음료'),
              React.createElement('option', { key: '디저트', value: '디저트' }, '디저트')
            ]
        )
      ),
      // 본사 관리자는 지점 필터 표시, 지점 관리자는 표시하지 않음
      userRole === 'HQ_ADMIN' && React.createElement(Select, {
        value: filters.branchFilter,
        onChange: (e) => handleBranchFilterChange(e.target.value)
      },
        // 전체 지점 옵션을 맨 위에 추가
        React.createElement('option', { key: 'all', value: '' }, '전체 지점'),
        ...(branchList.length > 0 
          ? (() => {
              // 본점/본사를 먼저, 나머지를 역순으로 정렬
              const sortedList = [...branchList].sort((a, b) => {
                const aName = a.name || '';
                const bName = b.name || '';
                const aIsMain = aName.includes('본점') || aName.includes('본사') || a.id === 1;
                const bIsMain = bName.includes('본점') || bName.includes('본사') || b.id === 1;
                
                if (aIsMain && !bIsMain) return -1;
                if (!aIsMain && bIsMain) return 1;
                
                // 둘 다 본점이거나 둘 다 일반 지점인 경우, 이름 역순
                return bName.localeCompare(aName, 'ko');
              });
              
              // 본점이 먼저, 그 다음 나머지 지점들
              return sortedList.map(branch => 
                React.createElement('option', { key: branch.id, value: branch.name }, branch.name)
              );
            })()
          : [
              React.createElement('option', { key: 1, value: '본사' }, '본사')
            ]
        )
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
        React.createElement(AddButton, { onClick: onAddProduct },
          React.createElement('span', null, '+'),
          '지점에 상품 추가'
        )
    )
  );
}

export default SearchAndFilter;
