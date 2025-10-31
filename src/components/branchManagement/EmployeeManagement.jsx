import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { 
  fetchEmployeeListAction,
  fetchEmployeeListByBranchAction, 
  createEmployeeAction, 
  updateEmployeeAction, 
  deactivateEmployeeAction, 
  rehireEmployeeAction,
  clearErrors 
} from '../../stores/slices/employeeSlice';
import EmployeeManagementHeader from './EmployeeManagementHeader';
import EmployeeSearchAndFilter from './EmployeeSearchAndFilter';
import EmployeeTable from './EmployeeTable';
import EmployeeModal from './EmployeeModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { useToast } from '../common/Toast';
import styled from 'styled-components';

function EmployeeManagement({ branchId, readOnly = false }) {
  const dispatch = useAppDispatch();
  const { addToast } = useToast();
  
  const {
    list: employees,
    loading,
    createLoading,
    updateLoading,
    deactivateLoading,
    rehireLoading,
    summary,
    error,
    createError,
    updateError,
    deactivateError,
    rehireError
  } = useAppSelector(state => state.employee);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [modalAction, setModalAction] = useState('terminate'); // 'terminate' or 'rehire'

  useEffect(() => {
    if (branchId) {
      dispatch(fetchEmployeeListByBranchAction({ 
        branchId, 
        params: { 
          page: 0, 
          size: 20, 
          sort: 'employmentStatus,asc' 
        } 
      }));
    }
  }, [dispatch, branchId]);

  useEffect(() => {
    if (error) {
      addToast({
        type: 'error',
        title: '오류',
        message: error,
        duration: 3000
      });
      dispatch(clearErrors());
    }
  }, [error, addToast, dispatch]);

  useEffect(() => {
    if (createError) {
      addToast({
        type: 'error',
        title: '등록 실패',
        message: createError,
        duration: 3000
      });
      dispatch(clearErrors());
    }
  }, [createError, addToast, dispatch]);

  useEffect(() => {
    if (updateError) {
      addToast({
        type: 'error',
        title: '수정 실패',
        message: updateError,
        duration: 3000
      });
      dispatch(clearErrors());
    }
  }, [updateError, addToast, dispatch]);

  useEffect(() => {
    if (deactivateError) {
      addToast({
        type: 'error',
        title: '삭제 실패',
        message: deactivateError,
        duration: 3000
      });
      dispatch(clearErrors());
    }
  }, [deactivateError, addToast, dispatch]);

  useEffect(() => {
    if (rehireError) {
      addToast({
        type: 'error',
        title: '재입사 실패',
        message: rehireError,
        duration: 3000
      });
      dispatch(clearErrors());
    }
  }, [rehireError, addToast, dispatch]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    // 검색어가 변경되면 API 호출
    if (branchId) {
      dispatch(fetchEmployeeListByBranchAction({ 
        branchId, 
        params: { 
          page: 0, 
          size: 20, 
          sort: 'employmentStatus,asc',
          search: term
        } 
      }));
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // 필터가 변경되면 API 호출
    if (branchId) {
      const filterParams = Object.entries(newFilters)
        .filter(([key, value]) => value !== '')
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      dispatch(fetchEmployeeListByBranchAction({ 
        branchId, 
        params: { 
          page: 0, 
          size: 20, 
          sort: 'employmentStatus,asc',
          ...filterParams
        } 
      }));
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchTerm('');
    // 필터 초기화 시 API 호출
    if (branchId) {
      dispatch(fetchEmployeeListByBranchAction({ 
        branchId, 
        params: { 
          page: 0, 
          size: 20, 
          sort: 'employmentStatus,asc'
        } 
      }));
    }
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleViewDetail = (employee) => {
    // 상세보기 로직 (추후 구현)
    console.log('View detail:', employee);
  };

  const handleTerminateEmployee = (employee) => {
    setDeletingEmployee(employee);
    setModalAction('terminate');
    setShowDeleteModal(true);
  };

  const handleRehireEmployee = (employee) => {
    setDeletingEmployee(employee);
    setModalAction('rehire');
    setShowDeleteModal(true);
  };

  const handleSaveEmployee = async (employeeData, profileImage) => {
    console.log('=== EmployeeManagement 데이터 처리 시작 ===');
    console.log('편집 중인 직원:', editingEmployee);
    console.log('받은 직원 데이터:', employeeData);
    console.log('받은 프로필 이미지:', profileImage);
    
    try {
      if (editingEmployee) {
        console.log('직원 수정 모드 - Redux Action 호출');
        await dispatch(updateEmployeeAction({
          employeeId: editingEmployee.id,
          employeeData,
          profileImage
        })).unwrap();
        
        console.log('직원 수정 성공');
        addToast({
          type: 'success',
          title: '수정 완료',
          message: '점주 정보가 성공적으로 수정되었습니다.',
          duration: 3000
        });
      } else {
        console.log('직원 등록 모드 - Redux Action 호출');
        await dispatch(createEmployeeAction({
          employeeData,
          profileImage
        })).unwrap();
        
        console.log('직원 등록 성공');
        addToast({
          type: 'success',
          title: '등록 완료',
          message: '새로운 점주가 성공적으로 등록되었습니다.',
          duration: 3000
        });
      }
      
      setShowModal(false);
      setEditingEmployee(null);
      
      console.log('목록 새로고침 시작');
      // 목록 새로고침
      dispatch(fetchEmployeeListByBranchAction({ 
        branchId, 
        params: { 
          page: 0, 
          size: 20, 
          sort: 'employmentStatus,asc' 
        } 
      }));
      console.log('=== EmployeeManagement 데이터 처리 완료 ===');
    } catch (error) {
      console.error('직원 저장 중 오류 발생:', error);
      // 에러는 useEffect에서 처리됨
    }
  };

  const handleConfirmAction = async () => {
    if (deletingEmployee) {
      try {
        if (modalAction === 'terminate') {
          await dispatch(deactivateEmployeeAction(deletingEmployee.id)).unwrap();
          
          addToast({
            type: 'success',
            title: '퇴사 처리 완료',
            message: `${deletingEmployee.name} 점주가 성공적으로 퇴사 처리되었습니다.`,
            duration: 3000
          });
        } else if (modalAction === 'rehire') {
          await dispatch(rehireEmployeeAction(deletingEmployee.id)).unwrap();
          
          addToast({
            type: 'success',
            title: '재입사 처리 완료',
            message: `${deletingEmployee.name} 점주가 성공적으로 재입사 처리되었습니다.`,
            duration: 3000
          });
        }
        
        setShowDeleteModal(false);
        setDeletingEmployee(null);
        setModalAction('terminate');
        
        // 목록 새로고침
        dispatch(fetchEmployeeListByBranchAction({ 
          branchId, 
          params: { 
            page: 0, 
            size: 20, 
            sort: 'employmentStatus,asc' 
          } 
        }));
      } catch (error) {
        // 에러는 useEffect에서 처리됨
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingEmployee(null);
    setModalAction('terminate');
  };

  // 백엔드에서 필터링된 직원 목록을 그대로 사용
  const filteredEmployees = employees;

  return (
    <Container>
      <EmployeeManagementHeader
        summary={summary}
        onAddEmployee={readOnly ? undefined : handleAddEmployee}
        loading={loading}
        readOnly={readOnly}
      />
      
      <EmployeeSearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        loading={loading}
      />
      
      <EmployeeTable
        employees={filteredEmployees}
        loading={loading}
        onViewDetail={handleViewDetail}
        onEdit={readOnly ? undefined : handleEditEmployee}
        onDelete={readOnly ? undefined : handleTerminateEmployee}
        onRehire={readOnly ? undefined : handleRehireEmployee}
        readOnly={readOnly}
      />

      {(!readOnly) && showModal && (
        <EmployeeModal
          isOpen={showModal}
          onClose={handleCloseModal}
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          loading={createLoading || updateLoading}
          branchId={branchId}
        />
      )}

      {(!readOnly) && showDeleteModal && deletingEmployee && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmAction}
          title={modalAction === 'terminate' ? '점주 퇴사 처리' : '점주 재입사 처리'}
          message={modalAction === 'terminate' 
            ? `${deletingEmployee.name} 점주를 퇴사 처리하시겠습니까?`
            : `${deletingEmployee.name} 점주를 재입사 처리하시겠습니까?`
          }
          confirmText={modalAction === 'terminate' ? '퇴사 처리' : '재입사 처리'}
          loading={modalAction === 'terminate' ? deactivateLoading : rehireLoading}
        />
      )}
    </Container>
  );
}

export default EmployeeManagement;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  
  gap: 24px;
`;
