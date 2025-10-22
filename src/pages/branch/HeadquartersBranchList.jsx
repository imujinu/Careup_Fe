import React, { useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { fetchBranchList, setParams } from '../../stores/slices/branchSlice';
import BranchTable from '../../components/branch/BranchTable';
import BranchTableSkeleton from '../../components/branch/BranchTableSkeleton';
import Pagination from '../../components/branch/Pagination';
import styled from 'styled-components';

function HeadquartersBranchList() {
  const dispatch = useAppDispatch();
  const { list, pagination, loading, error, params } = useAppSelector((s) => s.branch);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchBranchList(params));
  }, [dispatch, params.page, params.size, params.sort]);

  const handleChangePage = (page) => {
    dispatch(setParams({ page }));
  };

  const handleSort = (field, direction) => {
    // Spring Boot 형식의 정렬 문자열 생성 (예: "name,asc" 또는 "id,desc")
    const sortString = `${field},${direction}`;
    dispatch(setParams({ sort: sortString, page: 0 })); // 정렬 변경시 첫 페이지로 이동
  };

  // 현재 정렬 상태 파싱
  const currentSort = useMemo(() => {
    if (!params.sort) return null;
    const [field, direction] = params.sort.split(',');
    return { field, direction: direction || 'asc' };
  }, [params.sort]);

  // 검색 필터링 (클라이언트 사이드)
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return list;
    
    const term = searchTerm.toLowerCase();
    return list.filter(branch => 
      branch.name?.toLowerCase().includes(term) ||
      branch.businessDomain?.toLowerCase().includes(term) ||
      branch.status?.toLowerCase().includes(term) ||
      branch.phone?.includes(term) ||
      branch.businessNumber?.includes(term) ||
      branch.address?.toLowerCase().includes(term)
    );
  }, [list, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Wrap>
      <HeaderRow>
        <Title>지점관리</Title>
        <Right>
          <SearchInput 
            placeholder="검색..." 
            value={searchTerm}
            onChange={handleSearch}
          />
          <PrimaryButton>등록</PrimaryButton>
        </Right>
      </HeaderRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {loading ? (
        <BranchTableSkeleton rows={pagination.size || 5} />
      ) : (
        <BranchTable 
          branches={filteredList} 
          onSort={handleSort}
          currentSort={currentSort}
        />
      )}

      {!loading && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onChange={handleChangePage}
        />
      )}
    </Wrap>
  );
}

export default HeadquartersBranchList;

const Wrap = styled.div`
  padding: 24px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h2`
  margin: 0;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SearchInput = styled.input`
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const PrimaryButton = styled.button`
  background: #6d28d9;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
`;

const ErrorMsg = styled.div`
  color: #b91c1c;
  margin-bottom: 8px;
`;


