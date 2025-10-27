import React from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiClose } from '@mdi/js';

function BranchDetailModal({ branch, isOpen, onClose }) {
  if (!isOpen || !branch) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatOwnershipType = (type) => {
    switch (type) {
      case 'HEADQUARTERS':
        return '본사';
      case 'FRANCHISE':
        return '가맹점';
      case 'DIRECT':
        return '직영';
      default:
        return type || '정보 없음';
    }
  };

  const formatBranchStatus = (status) => {
    switch (status) {
      case 'OPERATING':
        return '운영중';
      case 'CLOSED':
        return '폐점';
      case 'SUSPENDED':
        return '휴업';
      default:
        return status || '정보 없음';
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>지점 상세 정보</ModalTitle>
          <CloseButton onClick={onClose}>
            <Icon path={mdiClose} size={1.2} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <InfoSection>
            <SectionTitle>기본 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>지점명</InfoLabel>
                <InfoValue>{branch.name || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>사업자명</InfoLabel>
                <InfoValue>{branch.businessDomain || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>지점 유형</InfoLabel>
                <InfoValue>{formatOwnershipType(branch.ownershipType)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>운영 상태</InfoLabel>
                <InfoValue>{formatBranchStatus(branch.status)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>개업일</InfoLabel>
                <InfoValue>{formatDate(branch.openDate)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>전화번호</InfoLabel>
                <InfoValue>{branch.phone || '정보 없음'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>사업자 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>사업자등록번호</InfoLabel>
                <InfoValue>{branch.businessNumber || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>법인등록번호</InfoLabel>
                <InfoValue>{branch.corporationNumber || '정보 없음'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>주소 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>우편번호</InfoLabel>
                <InfoValue>{branch.zipcode || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>주소</InfoLabel>
                <InfoValue>{branch.address || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>상세주소</InfoLabel>
                <InfoValue>{branch.addressDetail || '정보 없음'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>지점장 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>지점장명</InfoLabel>
                <InfoValue>{branch.attorneyName || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>지점장 연락처</InfoLabel>
                <InfoValue>{branch.attorneyPhoneNumber || '정보 없음'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>위치 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>위도</InfoLabel>
                <InfoValue>{branch.latitude || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>경도</InfoLabel>
                <InfoValue>{branch.longitude || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>지오펜스 반경 (m)</InfoLabel>
                <InfoValue>{branch.geofenceRadius || '정보 없음'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>

          <InfoSection>
            <SectionTitle>기타 정보</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>이메일</InfoLabel>
                <InfoValue>{branch.email || '정보 없음'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>비고</InfoLabel>
                <InfoValue>{branch.remark || '정보 없음'}</InfoValue>
              </InfoItem>
            </InfoGrid>
          </InfoSection>
        </ModalBody>

        <ModalFooter>
          <CloseModalButton onClick={onClose}>닫기</CloseModalButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}

export default BranchDetailModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const InfoSection = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

const InfoValue = styled.span`
  font-size: 16px;
  color: #111827;
  word-break: break-word;
`;

const ModalFooter = styled.div`
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
`;

const CloseModalButton = styled.button`
  background: #6d28d9;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: #5b21b6;
  }
`;
