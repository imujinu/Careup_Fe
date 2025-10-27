import React from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiMagnify, mdiChevronDown, mdiFileDocumentPlus } from '@mdi/js';

function DocumentSearchAndFilter({ 
  searchTerm, 
  onSearchChange, 
  branchFilter, 
  onBranchFilterChange,
  documentTypeFilter,
  onDocumentTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onUploadClick 
}) {
  const documentTypeOptions = [
    { value: '', label: '전체 문서 유형' },
    { value: 'EMPLOYMENT_CONTRACT', label: '고용계약서' },
    { value: 'FRANCHISE_CONTRACT', label: '가맹계약서' },
    { value: 'BUSINESS_REGISTRATION_CERTIFICATE', label: '사업자등록증' },
    { value: 'CORPORATE_REGISTRATION_CERTIFICATE', label: '법인등기부등본' },
    { value: 'SHAREHOLDER_REGISTER', label: '주주명부' },
    { value: 'CORPORATE_SEAL_CERTIFICATE', label: '법인인감증명서' },
    { value: 'PERSONAL_SEAL_CERTIFICATE', label: '개인인감증명서' },
    { value: 'IDENTIFICATION_CARD', label: '신분증' },
    { value: 'BANK_ACCOUNT_PROOF', label: '통장사본' },
    { value: 'CREDIT_REPORT', label: '신용조회서' },
    { value: 'ETC', label: '기타' }
  ];

  const statusOptions = [
    { value: '', label: '전체 상태' },
    { value: 'valid', label: '활성' },
    { value: 'expiring', label: '만료 임박' },
    { value: 'expired', label: '만료됨' }
  ];

  return (
    <SearchAndFilterContainer>
      <TitleSection>
        <Title>계약 서류 관리</Title>
        <Subtitle>지점별 계약 서류를 업로드하고 관리합니다.</Subtitle>
      </TitleSection>

      <SearchAndFilterBar>
        <SearchInputContainer>
          <SearchIcon>
            <Icon path={mdiMagnify} size={1} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="문서명 또는 설명으로 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </SearchInputContainer>

        <FilterGroup>
          <FilterSelectContainer>
            <FilterSelect
              value={branchFilter}
              onChange={(e) => onBranchFilterChange(e.target.value)}
            >
              <option value="">강남점 (BR001)</option>
            </FilterSelect>
            <FilterSelectIcon>
              <Icon path={mdiChevronDown} size={1} />
            </FilterSelectIcon>
          </FilterSelectContainer>

          <FilterSelectContainer>
            <FilterSelect
              value={documentTypeFilter}
              onChange={(e) => onDocumentTypeFilterChange(e.target.value)}
            >
              {documentTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelectIcon>
              <Icon path={mdiChevronDown} size={1} />
            </FilterSelectIcon>
          </FilterSelectContainer>

          <FilterSelectContainer>
            <FilterSelect
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FilterSelect>
            <FilterSelectIcon>
              <Icon path={mdiChevronDown} size={1} />
            </FilterSelectIcon>
          </FilterSelectContainer>

          <UploadButton onClick={onUploadClick}>
            <Icon path={mdiFileDocumentPlus} size={1} />
            문서 업로드
          </UploadButton>
        </FilterGroup>
      </SearchAndFilterBar>
    </SearchAndFilterContainer>
  );
}

export default DocumentSearchAndFilter;

const SearchAndFilterContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
`;

const TitleSection = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
`;

const SearchAndFilterBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInputContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const FilterSelectContainer = styled.div`
  position: relative;
`;

const FilterSelect = styled.select`
  padding: 12px 40px 12px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const FilterSelectIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
`;

const UploadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #7c3aed;
  }
`;
