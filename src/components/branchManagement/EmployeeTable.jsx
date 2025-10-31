import React, { useState } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { 
  mdiEmail, 
  mdiPhone, 
  mdiMapMarker, 
  mdiCalendar, 
  mdiDotsVertical,
  mdiEye,
  mdiPencil,
  mdiDelete,
  mdiAccountReactivate,
  mdiAccountGroup
} from '@mdi/js';

function EmployeeTable({ 
  employees = [], 
  loading = false, 
  onViewDetail, 
  onEdit, 
  onDelete, 
  onRehire,
  readOnly = false,
}) {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = (e, employee) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      employee
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleAction = (action, employee) => {
    action(employee);
    setContextMenu(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const getStatusBadge = (employmentStatus) => {
    switch (employmentStatus) {
      case 'ACTIVE':
        return <StatusBadge status="active">활성</StatusBadge>;
      case 'ON_LEAVE':
        return <StatusBadge status="leave">휴직</StatusBadge>;
      case 'TERMINATED':
        return <StatusBadge status="terminated">퇴사</StatusBadge>;
      default:
        return <StatusBadge status="unknown">알 수 없음</StatusBadge>;
    }
  };

  const getGenderText = (gender) => {
    switch (gender) {
      case 'MALE':
        return '남성';
      case 'FEMALE':
        return '여성';
      default:
        return '-';
    }
  };

  if (loading) {
    return (
      <TableContainer>
        <LoadingContainer>
          <LoadingSpinner>로딩 중...</LoadingSpinner>
        </LoadingContainer>
      </TableContainer>
    );
  }

  if (employees.length === 0) {
    return (
      <TableContainer>
        <EmptyContainer>
          <EmptyIcon>
            <Icon path={mdiAccountGroup} size={4} />
          </EmptyIcon>
          <EmptyTitle>등록된 점주가 없습니다</EmptyTitle>
          <EmptyDescription>
            새로운 점주를 등록하여 지점을 관리해보세요.
          </EmptyDescription>
        </EmptyContainer>
      </TableContainer>
    );
  }

  return (
    <>
      <TableContainer>
        <EmployeeGrid>
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              onMouseEnter={() => setHoveredRow(employee.id)}
              onMouseLeave={() => setHoveredRow(null)}
              onContextMenu={(e) => handleContextMenu(e, employee)}
            >
              <CardHeader>
                <ProfileSection>
                  <ProfileImage>
                    {employee.profileImageUrl ? (
                      <img src={employee.profileImageUrl} alt={employee.name} />
                    ) : (
                      <ProfileInitials>
                        {employee.name ? employee.name.substring(0, 2) : '??'}
                      </ProfileInitials>
                    )}
                  </ProfileImage>
                  <ProfileInfo>
                    <EmployeeName>{employee.name}</EmployeeName>
                    <EmployeeId>{employee.employeeNumber}</EmployeeId>
                  </ProfileInfo>
                </ProfileSection>
                
                {!readOnly && hoveredRow === employee.id && (
                  <ActionButton
                    onClick={(e) => handleContextMenu(e, employee)}
                  >
                    <Icon path={mdiDotsVertical} size={1.2} />
                  </ActionButton>
                )}
              </CardHeader>

              <CardBody>
                <InfoRow>
                  <InfoItem>
                    <Icon path={mdiEmail} size={1} />
                    <span>{employee.email}</span>
                  </InfoItem>
                  <InfoItem>
                    <Icon path={mdiPhone} size={1} />
                    <span>{employee.mobile}</span>
                  </InfoItem>
                </InfoRow>

                <InfoRow>
                  <InfoItem>
                    <Icon path={mdiMapMarker} size={1} />
                    <span>{employee.address}</span>
                  </InfoItem>
                </InfoRow>

                <InfoRow>
                  <InfoItem>
                    <Icon path={mdiCalendar} size={1} />
                    <span>{getGenderText(employee.gender)} • {formatDate(employee.dateOfBirth)}</span>
                  </InfoItem>
                </InfoRow>

                <StatusSection>
                  {getStatusBadge(employee.employmentStatus)}
                  {employee.remark && (
                    <RemarkText>{employee.remark}</RemarkText>
                  )}
                </StatusSection>

                <DateSection>
                  <DateItem>
                    <span>등록일: {formatDate(employee.createdAt)}</span>
                  </DateItem>
                  <DateItem>
                    <span>수정일: {formatDate(employee.updatedAt)}</span>
                  </DateItem>
                </DateSection>
              </CardBody>
            </EmployeeCard>
          ))}
        </EmployeeGrid>
      </TableContainer>

      {!readOnly && contextMenu && (
        <ContextMenuOverlay onClick={handleContextMenuClose}>
          <ContextMenu
            style={{
              left: contextMenu.x,
              top: contextMenu.y
            }}
          >
            <ContextMenuItem onClick={() => handleAction(onViewDetail, contextMenu.employee)}>
              <Icon path={mdiEye} size={1} />
              상세보기
            </ContextMenuItem>
            {onEdit && (
              <ContextMenuItem onClick={() => handleAction(onEdit, contextMenu.employee)}>
                <Icon path={mdiPencil} size={1} />
                수정
              </ContextMenuItem>
            )}
            {contextMenu.employee.employmentStatus === 'TERMINATED'
              ? (onRehire && (
                  <ContextMenuItem onClick={() => handleAction(onRehire, contextMenu.employee)}>
                    <Icon path={mdiAccountReactivate} size={1} />
                    재입사
                  </ContextMenuItem>
                ))
              : (onDelete && (
                  <ContextMenuItem 
                    onClick={() => handleAction(onDelete, contextMenu.employee)}
                    danger
                  >
                    <Icon path={mdiDelete} size={1} />
                    퇴사 처리
                  </ContextMenuItem>
                ))}
          </ContextMenu>
        </ContextMenuOverlay>
      )}
    </>
  );
}

export default EmployeeTable;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const LoadingSpinner = styled.div`
  font-size: 16px;
  color: #6b7280;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  color: #d1d5db;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const EmptyDescription = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const EmployeeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
  padding: 24px;
`;

const EmployeeCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: #8b5cf6;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProfileImage = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ProfileInitials = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const EmployeeName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const EmployeeId = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const ActionButton = styled.button`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;

  svg {
    color: #6b7280;
    flex-shrink: 0;
  }
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'status',
})`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'active':
        return '#dcfce7';
      case 'leave':
        return '#fef3c7';
      case 'terminated':
        return '#fee2e2';
      default:
        return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active':
        return '#166534';
      case 'leave':
        return '#92400e';
      case 'terminated':
        return '#991b1b';
      default:
        return '#6b7280';
    }
  }};
`;

const RemarkText = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
`;

const DateSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
`;

const DateItem = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const ContextMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
`;

const ContextMenu = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  padding: 8px 0;
  min-width: 160px;
  z-index: 1001;
`;

const ContextMenuItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'danger',
})`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  color: ${props => props.danger ? '#dc2626' : '#374151'};
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.danger ? '#fef2f2' : '#f9fafb'};
  }

  svg {
    color: ${props => props.danger ? '#dc2626' : '#6b7280'};
  }
`;
