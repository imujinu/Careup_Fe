import React, { useState } from "react";
import styled from "styled-components";
import { Icon } from "@mdi/react";
import {
  mdiViewDashboard,
  mdiTarget,
  mdiAccountGroup,
  mdiFileDocument,
  mdiAccount,
  mdiInformationOutline,
} from "@mdi/js";
import EmployeeManagement from "./EmployeeManagement";
import DocumentManagement from "./DocumentManagement";
import KPIManagement from "./KPIManagement";
import BranchDashboard from "./BranchDashboard";
import LoyalCustomerManagement from "./LoyalCustomerManagement";

function BranchDetailTabs({ branchId, branch, userType, readOnly = false }) {
  // 지점/가맹점 관리자용 탭 (지점 상세 정보로 변경)
  const isBranchAdmin = userType === 'franchise';
  
  // 지점 관리자는 상세 정보 탭을 기본으로
  const [activeTab, setActiveTab] = useState(isBranchAdmin ? "dashboard" : "owner");
  
  const tabs = [
    {
      id: "dashboard",
      label: isBranchAdmin ? "지점 상세 정보" : "대시보드",
      icon: isBranchAdmin ? mdiInformationOutline : mdiViewDashboard,
      component: isBranchAdmin ? (
        <DetailInfoContent branch={branch} />
      ) : (
        <BranchDashboard branchId={branchId} />
      ),
    },
    {
      id: "kpi",
      label: "KPI 관리",
      icon: mdiTarget,
      component: <KPIContent branchId={branchId} readOnly={readOnly} />,
    },
    {
      id: "owner",
      label: "점주 관리",
      icon: mdiAccountGroup,
      component: <EmployeeManagement branchId={branchId} readOnly={readOnly} />,
    },
    {
      id: "contract",
      label: "계약 서류",
      icon: mdiFileDocument,
      component: <DocumentManagement branchId={branchId} readOnly={readOnly} />,
    },
    {
      id: "customer",
      label: "고객 관리",
      icon: mdiAccount,
      component: <CustomerContent branchId={branchId} />,
    },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

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

      <TabContent>{activeTabData?.component}</TabContent>
    </TabsContainer>
  );
}

// 지점 상세 정보 컴포넌트 (지점/가맹점 관리자용)
function DetailInfoContent({ branch }) {
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
      case 'YES':
        return '직영';
      case 'NO':
        return '가맹점';
      default:
        return type || '정보 없음';
    }
  };

  const formatBranchStatus = (status) => {
    switch (status) {
      case 'OPERATING':
      case 'OPENED':
        return '운영중';
      case 'CLOSED':
        return '폐점';
      case 'SUSPENDED':
        return '휴업';
      default:
        return status || '정보 없음';
    }
  };

  if (!branch) {
    return (
      <PlaceholderContent>
        <PlaceholderText>지점 정보를 불러오는 중...</PlaceholderText>
      </PlaceholderContent>
    );
  }

  return (
    <DetailInfoContainer>
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
          <InfoItem fullWidth>
            <InfoLabel>주소</InfoLabel>
            <InfoValue>{branch.address || '정보 없음'}</InfoValue>
          </InfoItem>
          <InfoItem fullWidth>
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
          <InfoItem fullWidth>
            <InfoLabel>비고</InfoLabel>
            <InfoValue>{branch.remark || '정보 없음'}</InfoValue>
          </InfoItem>
        </InfoGrid>
      </InfoSection>
    </DetailInfoContainer>
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
  return <KPIManagement branchId={branchId} />;
}

function CustomerContent({ branchId }) {
  return <LoyalCustomerManagement branchId={branchId} />;
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
  shouldForwardProp: (prop) => prop !== "isActive",
})`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: ${(props) => (props.isActive ? "#8b5cf6" : "transparent")};
  color: ${(props) => (props.isActive ? "white" : "#6b7280")};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: ${(props) => (props.isActive ? "#7c3aed" : "#f1f5f9")};
  }

  ${(props) =>
    props.isActive &&
    `
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

const DetailInfoContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const InfoItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'fullWidth',
})`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${(props) => props.fullWidth && "grid-column: 1 / -1;"}
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
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
`;
