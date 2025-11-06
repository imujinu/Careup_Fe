import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiMagnify, mdiFilter, mdiClose } from '@mdi/js';

function EmployeeSearchAndFilter({ 
  searchTerm, 
  onSearchChange, 
  onSearchSubmit,
  onFilterChange, 
  onClearFilters,
  loading = false 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [filters, setFilters] = useState({
    employmentStatus: '',
    gender: '',
    employmentType: '',
    authorityType: ''
  });

  // 외부 searchTerm 변경 시 내부 state 동기화
  useEffect(() => {
    setLocalSearchTerm(searchTerm || '');
  }, [searchTerm]);

  // 검색어 입력 처리 (내부 state만 업데이트)
  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    onSearchChange(value);
  };

  // 검색 실행 (버튼 클릭 또는 엔터키)
  const handleSearchSubmit = () => {
    if (onSearchSubmit) {
      onSearchSubmit(localSearchTerm);
    }
  };

  // 엔터키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      employmentStatus: '',
      gender: '',
      employmentType: '',
      authorityType: ''
    };
    setFilters(clearedFilters);
    setLocalSearchTerm('');
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <SearchContainer>
      <SearchSection>
        <SearchInputContainer>
          <SearchIcon>
            <Icon path={mdiMagnify} size={1.2} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="점주명, 이메일, 전화번호로 검색..."
            value={localSearchTerm}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </SearchInputContainer>
        
        <SearchButton
          onClick={handleSearchSubmit}
          disabled={loading}
        >
          <Icon path={mdiMagnify} size={1.2} />
          검색
        </SearchButton>
        
        <FilterButton
          onClick={() => setShowFilters(!showFilters)}
          hasActiveFilters={hasActiveFilters}
          disabled={loading}
        >
          <Icon path={mdiFilter} size={1.2} />
          필터
        </FilterButton>
      </SearchSection>

      {showFilters && (
        <FilterSection>
          <FilterRow>
            <FilterGroup>
              <FilterLabel>고용 상태</FilterLabel>
              <FilterSelect
                value={filters.employmentStatus}
                onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
              >
                <option value="">전체</option>
                <option value="ACTIVE">활성</option>
                <option value="ON_LEAVE">휴직</option>
                <option value="TERMINATED">퇴사</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>성별</FilterLabel>
              <FilterSelect
                value={filters.gender}
                onChange={(e) => handleFilterChange('gender', e.target.value)}
              >
                <option value="">전체</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>고용 유형</FilterLabel>
              <FilterSelect
                value={filters.employmentType}
                onChange={(e) => handleFilterChange('employmentType', e.target.value)}
              >
                <option value="">전체</option>
                <option value="FULL_TIME">정규직</option>
                <option value="PART_TIME">비정규직</option>
              </FilterSelect>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>권한 유형</FilterLabel>
              <FilterSelect
                value={filters.authorityType}
                onChange={(e) => handleFilterChange('authorityType', e.target.value)}
              >
                <option value="">전체</option>
                <option value="HQ_ADMIN">본사 관리자</option>
                <option value="BRANCH_ADMIN">지점 관리자</option>
                <option value="FRANCHISE_OWNER">가맹점주</option>
                <option value="STAFF">일반 직원</option>
              </FilterSelect>
            </FilterGroup>
          </FilterRow>

          <FilterActions>
            <ClearButton onClick={handleClearFilters}>
              <Icon path={mdiClose} size={1} />
              필터 초기화
            </ClearButton>
            <CloseButton onClick={() => setShowFilters(false)}>
              닫기
            </CloseButton>
          </FilterActions>
        </FilterSection>
      )}
    </SearchContainer>
  );
}

export default EmployeeSearchAndFilter;

const SearchContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
`;

const SearchSection = styled.div`
  display: flex;
  gap: 16px;
  padding: 20px 24px;
  align-items: center;
`;

const SearchInputContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  color: #6b7280;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #7c3aed;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const FilterButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasActiveFilters',
})`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${props => props.hasActiveFilters ? '#8b5cf6' : 'white'};
  color: ${props => props.hasActiveFilters ? 'white' : '#6b7280'};
  border: 2px solid ${props => props.hasActiveFilters ? '#8b5cf6' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.hasActiveFilters ? '#7c3aed' : '#f9fafb'};
    border-color: ${props => props.hasActiveFilters ? '#7c3aed' : '#d1d5db'};
  }

  &:disabled {
    background: #f9fafb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

const FilterSection = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 24px;
  background: #f9fafb;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const FilterSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
`;

const CloseButton = styled.button`
  padding: 8px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #7c3aed;
  }
`;
