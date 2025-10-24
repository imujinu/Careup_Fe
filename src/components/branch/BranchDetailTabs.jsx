import React, { useState } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { 
  mdiViewDashboard,
  mdiTarget,
  mdiAccountGroup,
  mdiFileDocument,
  mdiAccount
} from '@mdi/js';
import EmployeeManagement from './EmployeeManagement';
import DocumentManagement from './DocumentManagement';

function BranchDetailTabs({ branchId }) {
  const [activeTab, setActiveTab] = useState('owner');

  const tabs = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: mdiViewDashboard,
      component: <DashboardContent branchId={branchId} />
    },
    {
      id: 'kpi',
      label: 'KPI 관리',
      icon: mdiTarget,
      component: <KPIContent branchId={branchId} />
    },
    {
      id: 'owner',
      label: '점주 관리',
      icon: mdiAccountGroup,
      component: <EmployeeManagement branchId={branchId} />
    },
    {
      id: 'contract',
      label: '계약 서류',
      icon: mdiFileDocument,
      component: <DocumentManagement branchId={branchId} />
    },
    {
      id: 'customer',
      label: '고객 관리',
      icon: mdiAccount,
      component: <CustomerContent branchId={branchId} />
    }
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <TabsContainer>
      <TabsHeader>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            isActive={activeTab === tab.id}
            onClick={() => handleTabClick(tab.id)}
          >
            <TabIcon>
              <Icon path={tab.icon} size={1.2} />
            </TabIcon>
            <TabLabel>{tab.label}</TabLabel>
          </TabButton>
        ))}
      </TabsHeader>
      
      <TabContent>
        {activeTabData?.component}
      </TabContent>
    </TabsContainer>
  );
}

// 각 탭의 컨텐츠 컴포넌트들 (추후 구현 예정)
function DashboardContent({ branchId }) {
  return (
    <PlaceholderContent>
      <PlaceholderIcon>
        <Icon path={mdiViewDashboard} size={3} />
      </PlaceholderIcon>
      <PlaceholderTitle>대시보드</PlaceholderTitle>
      <PlaceholderText>
        지점 {branchId}의 대시보드 정보가 여기에 표시됩니다.
        <br />
        매출, 방문자 수, 인기도 등의 통계 정보를 확인할 수 있습니다.
      </PlaceholderText>
    </PlaceholderContent>
  );
}

function KPIContent({ branchId }) {
  return (
    <PlaceholderContent>
      <PlaceholderIcon>
        <Icon path={mdiTarget} size={3} />
      </PlaceholderIcon>
      <PlaceholderTitle>KPI 관리</PlaceholderTitle>
      <PlaceholderText>
        지점 {branchId}의 KPI 관리 정보가 여기에 표시됩니다.
        <br />
        목표 설정, 성과 측정, 분석 리포트를 확인할 수 있습니다.
      </PlaceholderText>
    </PlaceholderContent>
  );
}



function CustomerContent({ branchId }) {
  return (
    <PlaceholderContent>
      <PlaceholderIcon>
        <Icon path={mdiAccount} size={3} />
      </PlaceholderIcon>
      <PlaceholderTitle>고객 관리</PlaceholderTitle>
      <PlaceholderText>
        지점 {branchId}의 고객 관리 정보가 여기에 표시됩니다.
        <br />
        고객 목록, 구매 이력, 문의사항 등을 확인할 수 있습니다.
      </PlaceholderText>
    </PlaceholderContent>
  );
}

export default BranchDetailTabs;

const TabsContainer = styled.div`
  background: white;
  margin: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TabsHeader = styled.div`
  display: flex;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
`;

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'isActive',
})`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: ${props => props.isActive ? '#8b5cf6' : 'transparent'};
  color: ${props => props.isActive ? 'white' : '#6b7280'};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background: ${props => props.isActive ? '#7c3aed' : '#f1f5f9'};
  }
  
  ${props => props.isActive && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #8b5cf6, #a7f3d0);
    }
  `}
`;

const TabIcon = styled.span`
  font-size: 20px;
`;

const TabLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
`;

const TabContent = styled.div`
  min-height: 400px;
  padding: 32px;
`;

const PlaceholderContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
`;

const PlaceholderIcon = styled.div`
  margin-bottom: 16px;
  opacity: 0.6;
  color: #6b7280;
`;

const PlaceholderTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #374151;
`;

const PlaceholderText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin: 0;
  max-width: 500px;
`;
