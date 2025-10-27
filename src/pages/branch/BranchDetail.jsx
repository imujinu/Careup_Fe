import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { getBranchDetail } from '../../service/branchService';
import BranchDetailHeader from '../../components/branchManagement/BranchDetailHeader';
import BranchDetailTabs from '../../components/branchManagement/BranchDetailTabs';
import BranchDetailModal from '../../components/branchManagement/BranchDetailModal';
import { useToast } from '../../components/common/Toast';
import styled from 'styled-components';

function BranchDetail() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (branchId) {
      fetchBranchDetail();
    }
  }, [branchId]);

  const fetchBranchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBranchDetail(branchId);
      setBranchData(data);
    } catch (err) {
      console.error('지점 상세 정보 조회 실패:', err);
      setError('지점 정보를 불러오는데 실패했습니다.');
      addToast({
        type: 'error',
        title: '오류',
        message: '지점 정보를 불러오는데 실패했습니다.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    navigate('/branch');
  };

  const handleShowDetail = () => {
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>로딩 중...</LoadingSpinner>
      </Container>
    );
  }

  if (error || !branchData) {
    return (
      <Container>
        <ErrorMessage>
          <h3>오류가 발생했습니다</h3>
          <p>{error || '지점 정보를 찾을 수 없습니다.'}</p>
          <BackButton onClick={handleBackToList}>목록으로 돌아가기</BackButton>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <BranchDetailHeader 
        branch={branchData}
        onBack={handleBackToList}
        onShowDetail={handleShowDetail}
      />
      
      <BranchDetailTabs branchId={branchId} />

      {showDetailModal && (
        <BranchDetailModal
          branch={branchData}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
        />
      )}
    </Container>
  );
}

export default BranchDetail;

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  
  h3 {
    color: #dc2626;
    margin-bottom: 16px;
  }
  
  p {
    color: #6b7280;
    margin-bottom: 24px;
  }
`;

const BackButton = styled.button`
  background: #6d28d9;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #5b21b6;
  }
`;
