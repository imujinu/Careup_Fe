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

function SearchAndFilter({ filters, onFiltersChange, onAddProduct }) {
  const handleSearchChange = (e) => {
    onFiltersChange({
      ...filters,
      searchTerm: e.target.value
    });
  };

  const handleCategoryFilterChange = (e) => {
    onFiltersChange({
      ...filters,
      categoryFilter: e.target.value
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
        placeholder: '상품명, SKU로 검색...',
        value: filters.searchTerm,
        onChange: handleSearchChange
      })
    ),
    React.createElement(FilterContainer, null,
      React.createElement(Select, {
        value: filters.categoryFilter,
        onChange: handleCategoryFilterChange
      },
        React.createElement('option', { value: '' }, '전체 카테고리'),
        React.createElement('option', { value: '원재료' }, '원재료'),
        React.createElement('option', { value: '음료' }, '음료'),
        React.createElement('option', { value: '디저트' }, '디저트')
      ),
      React.createElement(AddButton, { onClick: onAddProduct },
        React.createElement('span', null, '+'),
        '상품 추가'
      )
    )
  );
}

export default SearchAndFilter;
