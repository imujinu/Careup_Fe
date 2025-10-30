import React from 'react';
import styled from 'styled-components';

const SearchFilterContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  color: #9ca3af;
  font-size: 16px;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 48px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  outline: none;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Select = styled.select`
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  min-width: 120px;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

function SearchAndFilter({ filters, onFiltersChange, branchList = [] }) {
  const handleSearchChange = (e) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  const handleBranchFilterChange = (e) => {
    onFiltersChange({
      ...filters,
      branchFilter: e.target.value
    });
  };

  const handleStatusFilterChange = (e) => {
    onFiltersChange({
      ...filters,
      statusFilter: e.target.value
    });
  };

  return React.createElement(SearchFilterContainer, null,
    React.createElement(SearchContainer, null,
      React.createElement(SearchIcon, null, '🔍'),
      React.createElement(SearchInput, {
        type: 'text',
        placeholder: '지점명, 상품명, 발주번호로 검색',
        value: filters.searchTerm,
        onChange: handleSearchChange
      })
    ),
    React.createElement(FilterContainer, null,
      React.createElement(Select, {
        value: filters.branchFilter,
        onChange: handleBranchFilterChange
      },
        React.createElement('option', { value: '' }, '전체 지점'),
        ...branchList.map(branch => 
          React.createElement('option', { 
            key: branch.id, 
            value: branch.name 
          }, branch.name)
        )
      ),
      React.createElement(Select, {
        value: filters.statusFilter,
        onChange: handleStatusFilterChange
      },
        React.createElement('option', { value: '' }, '전체 상태'),
        React.createElement('option', { value: 'PENDING' }, '대기중'),
        React.createElement('option', { value: 'APPROVED' }, '승인됨'),
        React.createElement('option', { value: 'REJECTED' }, '반려됨'),
        React.createElement('option', { value: 'PARTIAL' }, '부분승인'),
        React.createElement('option', { value: 'SHIPPED' }, '배송중'),
        React.createElement('option', { value: 'COMPLETED' }, '완료'),
        React.createElement('option', { value: 'CANCELLED' }, '취소됨')
      )
    )
  );
}

export default SearchAndFilter;
