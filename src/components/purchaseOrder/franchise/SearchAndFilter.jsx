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

const OrderRecommendationButton = styled(Button)`
  background: #8b5cf6;
  color: #ffffff;
  
  &:hover {
    background: #7c3aed;
  }
`;

const OrderAutomationButton = styled(Button)`
  background: #10b981;
  color: #ffffff;
  
  &:hover {
    background: #059669;
  }
`;

function SearchAndFilter({ filters, onFiltersChange, onOrderRequest, onOrderRecommendation, onOrderAutomation }) {
  const handleSearchChange = (e) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value
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
        React.createElement('img', {
          src: '/header-search.svg',
          alt: '돋보기',
          style: { width: '16px', height: '16px' }
        })
      ),
      React.createElement(SearchInput, {
        type: 'text',
        placeholder: '발주번호로 검색...',
        value: filters.searchTerm,
        onChange: handleSearchChange
      })
    ),
    React.createElement(FilterContainer, null,
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
      ),
      React.createElement(OrderRecommendationButton, { onClick: onOrderRecommendation },
        React.createElement('span', null, '💡'),
        '발주 추천'
      ),
      React.createElement(OrderAutomationButton, { onClick: onOrderAutomation },
        React.createElement('span', null, '🤖'),
        '발주 자동화'
      )
    )
  );
}

export default SearchAndFilter;
