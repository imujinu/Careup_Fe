import React from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';

const FilterContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 24px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInputContainer = styled.div`
  flex: 1;
  min-width: 200px;
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

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 48px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #f9fafb;
  outline: none;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
    background: #ffffff;
  }
`;

const DateInput = styled.input`
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

const DateRangeContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const DateLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
`;

function InventoryFlowFilter({ filters, onFiltersChange, branchList = [] }) {
  const handleSearchChange = (e) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  const handleStartDateChange = (e) => {
    onFiltersChange({
      ...filters,
      startDate: e.target.value
    });
  };

  const handleEndDateChange = (e) => {
    onFiltersChange({
      ...filters,
      endDate: e.target.value
    });
  };

  const handleBranchFilterChange = (e) => {
    onFiltersChange({
      ...filters,
      branchFilter: e.target.value
    });
  };

  const handleTypeFilterChange = (e) => {
    onFiltersChange({
      ...filters,
      typeFilter: e.target.value
    });
  };

  return React.createElement(FilterContainer, null,
    React.createElement(FilterRow, null,
      React.createElement(SearchInputContainer, null,
        React.createElement(SearchIcon, null,
          React.createElement(Icon, { path: mdiMagnify, size: 1 })
        ),
        React.createElement(SearchInput, {
          type: 'text',
          placeholder: '상품명으로 검색',
          value: filters.searchTerm || '',
          onChange: handleSearchChange
        })
      ),
      React.createElement(DateRangeContainer, null,
        React.createElement(DateLabel, null, '시작일:'),
        React.createElement(DateInput, {
          type: 'date',
          value: filters.startDate || '',
          onChange: handleStartDateChange
        })
      ),
      React.createElement(DateRangeContainer, null,
        React.createElement(DateLabel, null, '종료일:'),
        React.createElement(DateInput, {
          type: 'date',
          value: filters.endDate || '',
          onChange: handleEndDateChange
        })
      ),
      React.createElement(Select, {
        value: filters.branchFilter || '',
        onChange: handleBranchFilterChange
      },
        // 전체 지점 옵션을 맨 위에 추가
        React.createElement('option', { value: '' }, '전체 지점'),
        ...(branchList.length > 0
          ? (() => {
              // 본점을 먼저, 나머지를 역순으로 정렬
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
              
              return sortedList.map(branch => 
                React.createElement('option', {
                  key: branch.id || branch.name,
                  value: branch.name || branch.id
                }, branch.name || `지점-${branch.id}`)
              );
            })()
          : []
        )
      ),
      React.createElement(Select, {
        value: filters.typeFilter || '',
        onChange: handleTypeFilterChange
      },
        React.createElement('option', { value: '' }, '전체 구분'),
        React.createElement('option', { value: 'in' }, '입고만'),
        React.createElement('option', { value: 'out' }, '출고만')
      )
    )
  );
}

export default InventoryFlowFilter;

