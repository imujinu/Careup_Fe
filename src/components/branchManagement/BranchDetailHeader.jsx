import React from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { 
  mdiArrowLeft, 
  mdiMapMarker, 
  mdiPhone, 
  mdiEmail, 
  mdiChevronDown,
  mdiPencil,
  mdiDelete,
  mdiDotsVertical
} from '@mdi/js';

function BranchDetailHeader({ branch, onBack, onShowDetail }) {
  if (!branch) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPERATING':
      case '운영중':
        return '#a78bfa';
      case 'CLOSED':
      case '폐점':
        return '#ef4444';
      case 'SUSPENDED':
      case '휴업':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OPERATING':
        return '운영중';
      case 'CLOSED':
        return '폐점';
      case 'SUSPENDED':
        return '휴업';
      default:
        return status || '알 수 없음';
    }
  };

  return (
    <HeaderContainer>
      <BackButton onClick={onBack}>
        <Icon path={mdiArrowLeft} size={1} />
        목록으로
      </BackButton>
      
      <HeaderContent>
        <LeftSection>
          <BranchInfo>
            <BranchName>{branch.name}</BranchName>
            <StatusBadge statusColor={getStatusColor(branch.status)}>
              {getStatusText(branch.status)}
            </StatusBadge>
          </BranchInfo>
          
          <ContactInfo>
            <ContactItem>
              <Icon path={mdiMapMarker} size={1} />
              <span>{branch.address || '주소 정보 없음'}</span>
            </ContactItem>
            <ContactItem>
              <Icon path={mdiPhone} size={1} />
              <span>{branch.phone || '전화번호 없음'}</span>
            </ContactItem>
            <ContactItem>
              <Icon path={mdiEmail} size={1} />
              <span>{branch.email || '이메일 없음'}</span>
            </ContactItem>
          </ContactInfo>
        </LeftSection>

        <RightSection>
          <ManagerCard>
            <ManagerTitle>지점장 정보</ManagerTitle>
            <ManagerInfo>
              <ManagerName>{branch.attorneyName || '지점장 정보 없음'}</ManagerName>
              <ManagerPhone>{branch.attorneyPhoneNumber || '연락처 없음'}</ManagerPhone>
            </ManagerInfo>
            
            <ActionButtons>
              <EditButton>
                <Icon path={mdiPencil} size={0.8} />
                수정
              </EditButton>
              <DeleteButton>
                <Icon path={mdiDelete} size={0.8} />
                삭제
              </DeleteButton>
              <MoreButton>
                <Icon path={mdiDotsVertical} size={1} />
              </MoreButton>
            </ActionButtons>
          </ManagerCard>
        </RightSection>
      </HeaderContent>

      <DetailToggleButton onClick={onShowDetail}>
        <Icon path={mdiChevronDown} size={1} />
      </DetailToggleButton>
    </HeaderContainer>
  );
}

export default BranchDetailHeader;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, #8b5cf6 0%, #a7f3d0 100%);
  border-radius: 16px;
  padding: 24px;
  margin: 24px;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
`;

const LeftSection = styled.div`
  flex: 2;
`;

const BranchInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
`;

const BranchName = styled.h1`
  color: white;
  font-size: 32px;
  font-weight: 700;
  margin: 0;
`;

const StatusBadge = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'statusColor',
})`
  background: ${props => props.statusColor};
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 16px;
`;

const RightSection = styled.div`
  flex: 1;
`;

const ManagerCard = styled.div`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ManagerTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const ManagerInfo = styled.div`
  margin-bottom: 20px;
`;

const ManagerName = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const ManagerPhone = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const EditButton = styled.button`
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: #059669;
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover {
    background: #dc2626;
  }
`;

const MoreButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const DetailToggleButton = styled.button`
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
  
  &:hover {
    transform: translateX(-50%) translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

