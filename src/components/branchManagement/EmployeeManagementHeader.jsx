import React from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { 
  mdiAccountGroup, 
  mdiFileDocument, 
  mdiCalendarPlus,
  mdiPlus
} from '@mdi/js';

function EmployeeManagementHeader({ 
  summary, 
  onAddEmployee, 
  loading = false,
  readOnly = false,
}) {
  const { totalEmployees = 0, activeEmployees = 0, recentlyAdded = 0 } = summary;

  return (
    <HeaderContainer>
      <HeaderContent>
        <HeaderInfo>
          <HeaderTitle>점주 관리</HeaderTitle>
          <HeaderDescription>지점의 점주 정보를 관리합니다</HeaderDescription>
        </HeaderInfo>
        {!readOnly && (
          <AddButton onClick={onAddEmployee} disabled={loading}>
            <Icon path={mdiPlus} size={1.2} />
            점주 추가
          </AddButton>
        )}
      </HeaderContent>
      
      <SummaryCards>
        <SummaryCard>
          <CardIcon>
            <Icon path={mdiAccountGroup} size={2} />
          </CardIcon>
          <CardContent>
            <CardNumber>{totalEmployees}</CardNumber>
            <CardLabel>총 점주 수</CardLabel>
          </CardContent>
        </SummaryCard>
        
        <SummaryCard>
          <CardIcon>
            <Icon path={mdiFileDocument} size={2} />
          </CardIcon>
          <CardContent>
            <CardNumber>{activeEmployees}</CardNumber>
            <CardLabel>활성 점주</CardLabel>
          </CardContent>
        </SummaryCard>
        
        <SummaryCard>
          <CardIcon>
            <Icon path={mdiCalendarPlus} size={2} />
          </CardIcon>
          <CardContent>
            <CardNumber>{recentlyAdded}</CardNumber>
            <CardLabel>최근 추가</CardLabel>
          </CardContent>
        </SummaryCard>
      </SummaryCards>
    </HeaderContainer>
  );
}

export default EmployeeManagementHeader;

const HeaderContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const HeaderTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const HeaderDescription = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #a7f3d0 100%);
`;

const SummaryCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  color: white;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 20%;
    bottom: 20%;
    width: 1px;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const CardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CardNumber = styled.div`
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
`;

const CardLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
`;
