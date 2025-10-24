import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { fetchBranchList, setParams, deleteBranchAction } from '../../stores/slices/branchSlice';
import BranchTable from '../../components/branch/BranchTable';
import BranchTableSkeleton from '../../components/branch/BranchTableSkeleton';
import Pagination from '../../components/branch/Pagination';
import DeleteConfirmModal from '../../components/common/DeleteConfirmModal';
import { useToast } from '../../components/common/Toast';
import styled from 'styled-components';

function HeadquartersBranchList() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  const { list, pagination, loading, error, params, deleteLoading, deleteError } = useAppSelector((s) => s.branch);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, branch: null });

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

  const handleRegisterClick = () => {
    console.log('등록 버튼 클릭됨 - 지점 등록 페이지로 이동');
    console.log('현재 경로:', window.location.pathname);
    console.log('이동할 경로: /branch/register');
    navigate('/branch/register');
  };

  const handleTestClick = () => {
    console.log('테스트 버튼 클릭됨');
    navigate('/branch/test-register');
  };

  const handleEditBranch = (branch) => {
    console.log('지점 수정 버튼 클릭됨:', branch);
    navigate(`/branch/edit/${branch.id}`);
  };

  const handleViewBranchDetail = (branch) => {
    console.log('지점 상세 보기 클릭됨:', branch);
    navigate(`/branch/detail/${branch.id}`);
  };

  const handleDeleteBranch = (branch) => {
    console.log('지점 삭제 버튼 클릭됨:', branch);
    setDeleteModal({ isOpen: true, branch });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.branch) return;
    
    try {
      await dispatch(deleteBranchAction(deleteModal.branch.id)).unwrap();
      setDeleteModal({ isOpen: false, branch: null });
      
      // 성공 토스트 알림
      addToast({
        type: 'success',
        title: '지점 삭제 완료',
        message: `${deleteModal.branch.name} 지점이 성공적으로 삭제되었습니다.`,
        duration: 3000
      });
    } catch (error) {
      console.error('지점 삭제 실패:', error);
      
      // 실패 토스트 알림
      addToast({
        type: 'error',
        title: '지점 삭제 실패',
        message: error || '지점 삭제 중 오류가 발생했습니다.',
        duration: 3000
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, branch: null });
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
          <PrimaryButton 
            type="button"
            onClick={handleRegisterClick}
            title="지점 등록"
          >
            등록
          </PrimaryButton>
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
          onEdit={handleEditBranch}
          onDelete={handleDeleteBranch}
          onViewDetail={handleViewBranchDetail}
        />
      )}

      {!loading && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onChange={handleChangePage}
        />
      )}

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="지점 삭제"
        message="해당 지점을 영구히 삭제하시겠습니까?"
        itemName={deleteModal.branch?.name}
        isLoading={deleteLoading}
      />
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
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: #5b21b6;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    background: #4c1d95;
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.3);
  }
`;

const ErrorMsg = styled.div`
  color: #b91c1c;
  margin-bottom: 8px;
`;


