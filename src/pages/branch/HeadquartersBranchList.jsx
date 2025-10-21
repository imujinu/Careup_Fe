import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { fetchBranchList, setParams } from '../../stores/slices/branchSlice';
import BranchTable from '../../components/branch/BranchTable';
import BranchTableSkeleton from '../../components/branch/BranchTableSkeleton';
import Pagination from '../../components/branch/Pagination';
import styled from 'styled-components';

function HeadquartersBranchList() {
  const dispatch = useAppDispatch();
  const { list, pagination, loading, error, params } = useAppSelector((s) => s.branch);

  useEffect(() => {
    dispatch(fetchBranchList(params));
  }, [dispatch, params.page, params.size, params.sort]);

  const handleChangePage = (page) => {
    dispatch(setParams({ page }));
  };

  return (
    <Wrap>
      <HeaderRow>
        <Title>지점관리</Title>
        <Right>
          <SearchInput placeholder="검색..." />
          <PrimaryButton>등록</PrimaryButton>
        </Right>
      </HeaderRow>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {loading ? (
        <BranchTableSkeleton rows={pagination.size || 5} />
      ) : (
        <BranchTable branches={list} />
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


