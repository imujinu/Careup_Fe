import React from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';

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
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 16px;
    height: 16px;
    opacity: 0.6;
  }
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

const Input = styled.input`
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  
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
  outline: none;
  background: #ffffff;
  min-width: 120px;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const Button = styled.button`
  height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OrderRequestButton = styled(Button)`
  background: #3b82f6;
  color: #ffffff;
  
  &:hover {
    background: #2563eb;
  }
`;

function SearchAndFilter({ filters, onFiltersChange, onOrderRequest }) {
  const handleProductNameChange = (e) => {
    onFiltersChange({
      ...filters,
      productName: e.target.value
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

  const handleStatusFilterChange = (e) => {
    onFiltersChange({
      ...filters,
      statusFilter: e.target.value
    });
  };

  return React.createElement(SearchFilterContainer, null,
    React.createElement(SearchContainer, null,
      React.createElement(SearchIcon, null,
        React.createElement(Icon, { path: mdiMagnify, size: 1 })
      ),
      React.createElement(SearchInput, {
        type: 'text',
        placeholder: '상품명으로 검색',
        value: filters.productName || '',
        onChange: handleProductNameChange
      })
    ),
    React.createElement(FilterContainer, null,
      React.createElement(Input, {
        type: 'date',
        value: filters.startDate || '',
        onChange: handleStartDateChange
      }),
      React.createElement('span', null, '~'),
      React.createElement(Input, {
        type: 'date',
        value: filters.endDate || '',
        onChange: handleEndDateChange
      }),
      React.createElement(Select, {
        value: filters.statusFilter,
        onChange: handleStatusFilterChange
      },
        React.createElement('option', { value: '' }, '전체 상태'),
        React.createElement('option', { value: 'pending' }, '대기 중'),
        React.createElement('option', { value: 'inProgress' }, '처리 중'),
        React.createElement('option', { value: 'completed' }, '완료'),
        React.createElement('option', { value: 'rejected' }, '반려됨'),
        React.createElement('option', { value: 'cancelled' }, '취소됨')
      )
    ),
    React.createElement(ButtonGroup, null,
      React.createElement(OrderRequestButton, { onClick: onOrderRequest },
        React.createElement('span', null, '+'),
        '발주 요청'
      )
    )
  );
}

export default SearchAndFilter;
