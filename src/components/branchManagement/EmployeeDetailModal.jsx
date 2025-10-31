import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { Icon } from '@mdi/react';
import {
  mdiClose,
  mdiEmail,
  mdiPhone,
  mdiMapMarker,
  mdiCalendar,
  mdiAccount,
  mdiBriefcase,
  mdiAccountGroup,
  mdiClockOutline,
  mdiCash,
  mdiNoteText,
  mdiPencil,
} from '@mdi/js';
import BaseModal from '../common/BaseModal';

function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  loading = false,
}) {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (employee?.id) {
      navigate(`/staff/create?id=${employee.id}`);
    }
  };
  // Enum 값 한글 변환 함수들
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

  const getRelationshipText = (relationship) => {
    switch (relationship) {
      case 'PARENT':
        return '부모';
      case 'SIBLING':
        return '형제/자매';
      case 'SPOUSE':
        return '배우자';
      case 'CHILD':
        return '자녀';
      case 'FRIEND':
        return '친구';
      case 'NEIGHBOR':
        return '이웃';
      case 'OTHER':
        return '기타';
      default:
        return '-';
    }
  };

  const getAuthorityTypeText = (authorityType) => {
    switch (authorityType) {
      case 'HQ_ADMIN':
        return '본점(본사) 관리자';
      case 'BRANCH_ADMIN':
        return '지점(직영점) 관리자';
      case 'FRANCHISE_OWNER':
        return '가맹점주 (관리자)';
      case 'STAFF':
        return '직원';
      default:
        return '-';
    }
  };

  const getEmploymentStatusText = (employmentStatus) => {
    switch (employmentStatus) {
      case 'ACTIVE':
        return '재직';
      case 'ON_LEAVE':
        return '휴직';
      case 'TERMINATED':
        return '퇴사';
      default:
        return '-';
    }
  };

  const getEmploymentStatusBadge = (employmentStatus) => {
    switch (employmentStatus) {
      case 'ACTIVE':
        return <StatusBadge status="active">재직</StatusBadge>;
      case 'ON_LEAVE':
        return <StatusBadge status="leave">휴직</StatusBadge>;
      case 'TERMINATED':
        return <StatusBadge status="terminated">퇴사</StatusBadge>;
      default:
        return <StatusBadge status="unknown">알 수 없음</StatusBadge>;
    }
  };

  const getEmploymentTypeText = (employmentType) => {
    switch (employmentType) {
      case 'FULL_TIME':
        return '정규직';
      case 'PART_TIME':
        return '비정규직';
      default:
        return '-';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    // LocalTime 형식 (HH:mm:ss)을 HH:mm으로 변환
    const time = timeString.substring(0, 5);
    return time;
  };

  if (!employee && !loading) {
    return null;
  }

  return (
    <>
      {isOpen && <ModalGlobalStyle />}
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="900px"
        allowBackdropClose={true}
        className="employee-detail-modal"
      >
        <ModalContainer>
        <ModalHeader>
          <ModalTitle>점주 상세 정보</ModalTitle>
          <CloseButton onClick={onClose}>
            <Icon path={mdiClose} size={1.5} />
          </CloseButton>
        </ModalHeader>

        {loading ? (
          <LoadingContainer>
            <LoadingText>로딩 중...</LoadingText>
          </LoadingContainer>
        ) : (
          <ModalBody>
            {/* 프로필 섹션 */}
            <ProfileSection>
              <ProfileImageContainer>
                {employee?.profileImageUrl ? (
                  <ProfileImage src={employee.profileImageUrl} alt={employee.name} />
                ) : (
                  <ProfilePlaceholder>
                    {employee?.name ? employee.name.substring(0, 2) : '??'}
                  </ProfilePlaceholder>
                )}
              </ProfileImageContainer>
              <ProfileInfo>
                <ProfileName>{employee?.name || '-'}</ProfileName>
                <ProfileId>사번: {employee?.employeeNumber || '-'}</ProfileId>
                {employee?.jobGradeName && (
                  <ProfileGrade>직급: {employee.jobGradeName}</ProfileGrade>
                )}
              </ProfileInfo>
              <StatusContainer>
                {employee?.employmentStatus && getEmploymentStatusBadge(employee.employmentStatus)}
              </StatusContainer>
            </ProfileSection>

            {/* 기본 정보 */}
            <InfoSection>
              <SectionTitle>기본 정보</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiCalendar} size={1} />
                    생년월일
                  </InfoLabel>
                  <InfoValue>{formatDate(employee?.dateOfBirth)}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiAccount} size={1} />
                    성별
                  </InfoLabel>
                  <InfoValue>{getGenderText(employee?.gender)}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiEmail} size={1} />
                    이메일
                  </InfoLabel>
                  <InfoValue>{employee?.email || '-'}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiPhone} size={1} />
                    휴대폰번호
                  </InfoLabel>
                  <InfoValue>{employee?.mobile || '-'}</InfoValue>
                </InfoItem>

                <InfoItem fullWidth>
                  <InfoLabel>
                    <Icon path={mdiMapMarker} size={1} />
                    주소
                  </InfoLabel>
                  <InfoValue>
                    {employee?.zipcode && `[${employee.zipcode}] `}
                    {employee?.address || '-'}
                    {employee?.addressDetail && ` ${employee.addressDetail}`}
                  </InfoValue>
                </InfoItem>
              </InfoGrid>
            </InfoSection>

            {/* 긴급 연락처 */}
            {employee?.emergencyName && (
              <InfoSection>
                <SectionTitle>긴급 연락처</SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>연락처 이름</InfoLabel>
                    <InfoValue>{employee.emergencyName}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>
                      <Icon path={mdiPhone} size={1} />
                      연락처 전화번호
                    </InfoLabel>
                    <InfoValue>{employee.emergencyTel || '-'}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>관계</InfoLabel>
                    <InfoValue>{getRelationshipText(employee.relationship)}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </InfoSection>
            )}

            {/* 고용 정보 */}
            <InfoSection>
              <SectionTitle>
                <Icon path={mdiBriefcase} size={1.2} />
                고용 정보
              </SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiCalendar} size={1} />
                    입사일
                  </InfoLabel>
                  <InfoValue>{formatDate(employee?.hireDate)}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiCalendar} size={1} />
                    퇴사일
                  </InfoLabel>
                  <InfoValue>{formatDate(employee?.terminateDate)}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>권한 유형</InfoLabel>
                  <InfoValue>{getAuthorityTypeText(employee?.authorityType)}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>고용 상태</InfoLabel>
                  <InfoValue>{getEmploymentStatusText(employee?.employmentStatus)}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>고용 유형</InfoLabel>
                  <InfoValue>{getEmploymentTypeText(employee?.employmentType)}</InfoValue>
                </InfoItem>

                {employee?.hourlyPay !== null && employee?.hourlyPay !== undefined && (
                  <InfoItem>
                    <InfoLabel>
                      <Icon path={mdiCash} size={1} />
                      시급
                    </InfoLabel>
                    <InfoValue>{employee.hourlyPay.toLocaleString()}원</InfoValue>
                  </InfoItem>
                )}
              </InfoGrid>
            </InfoSection>

            {/* 근무 템플릿 */}
            {employee?.attendanceTemplate && (
              <InfoSection>
                <SectionTitle>
                  <Icon path={mdiClockOutline} size={1.2} />
                  근무 템플릿
                </SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>템플릿명</InfoLabel>
                    <InfoValue>{employee.attendanceTemplate.name || '-'}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>기본 출근시간</InfoLabel>
                    <InfoValue>{formatTime(employee.attendanceTemplate.defaultClockIn)}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>기본 휴게 시작시간</InfoLabel>
                    <InfoValue>{formatTime(employee.attendanceTemplate.defaultBreakStart)}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>기본 휴게 종료시간</InfoLabel>
                    <InfoValue>{formatTime(employee.attendanceTemplate.defaultBreakEnd)}</InfoValue>
                  </InfoItem>

                  <InfoItem>
                    <InfoLabel>기본 퇴근시간</InfoLabel>
                    <InfoValue>{formatTime(employee.attendanceTemplate.defaultClockOut)}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </InfoSection>
            )}

            {/* 배치 정보 */}
            {employee?.dispatches && employee.dispatches.length > 0 && (
              <InfoSection>
                <SectionTitle>
                  <Icon path={mdiAccountGroup} size={1.2} />
                  배치 정보
                </SectionTitle>
                <DispatchTable>
                  <DispatchTableHeader>
                    <DispatchTableRow>
                      <DispatchTableHeaderCell>지점명</DispatchTableHeaderCell>
                      <DispatchTableHeaderCell>배치 시작일</DispatchTableHeaderCell>
                      <DispatchTableHeaderCell>배치 종료일</DispatchTableHeaderCell>
                      <DispatchTableHeaderCell>배치 여부</DispatchTableHeaderCell>
                    </DispatchTableRow>
                  </DispatchTableHeader>
                  <DispatchTableBody>
                    {employee.dispatches.map((dispatch, index) => (
                      <DispatchTableRow key={dispatch.id || index}>
                        <DispatchTableCell>{dispatch.branchName || '-'}</DispatchTableCell>
                        <DispatchTableCell>{formatDate(dispatch.assignedFrom)}</DispatchTableCell>
                        <DispatchTableCell>{formatDate(dispatch.assignedTo)}</DispatchTableCell>
                        <DispatchTableCell>
                          {dispatch.placementYn === 'Y' ? '배치됨' : '미배치'}
                        </DispatchTableCell>
                      </DispatchTableRow>
                    ))}
                  </DispatchTableBody>
                </DispatchTable>
              </InfoSection>
            )}

            {/* 비고 */}
            {employee?.remark && (
              <InfoSection>
                <SectionTitle>
                  <Icon path={mdiNoteText} size={1.2} />
                  비고
                </SectionTitle>
                <RemarkBox>{employee.remark}</RemarkBox>
              </InfoSection>
            )}

            {/* 시스템 정보 */}
            <InfoSection>
              <SectionTitle>시스템 정보</SectionTitle>
              <InfoGrid>
                <InfoItem>
                  <InfoLabel>활성 여부</InfoLabel>
                  <InfoValue>{employee?.enabled ? '활성' : '비활성'}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiCalendar} size={1} />
                    등록일
                  </InfoLabel>
                  <InfoValue>{employee?.createdAt ? formatDate(employee.createdAt) : '-'}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>
                    <Icon path={mdiCalendar} size={1} />
                    수정일
                  </InfoLabel>
                  <InfoValue>{employee?.updatedAt ? formatDate(employee.updatedAt) : '-'}</InfoValue>
                </InfoItem>
              </InfoGrid>
            </InfoSection>

            <ModalFooter>
              {employee?.id && (
                <EditButtonLarge onClick={handleEdit}>
                  <Icon path={mdiPencil} size={1} />
                  수정
                </EditButtonLarge>
              )}
              <CloseButtonLarge onClick={onClose}>닫기</CloseButtonLarge>
            </ModalFooter>
          </ModalBody>
        )}
      </ModalContainer>
    </BaseModal>
    </>
  );
}

const ModalGlobalStyle = createGlobalStyle`
  /* BaseModal의 ModalContent 스크롤 제거 */
  .employee-detail-modal {
    overflow: hidden !important;
  }
`;

export default EmployeeDetailModal;

const ModalContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: calc(90vh - 48px);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: #6b7280;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
`;

const ProfileImageContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProfilePlaceholder = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: #6b7280;
`;

const ProfileInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProfileName = styled.div`
  font-size: 22px;
  font-weight: 600;
  color: #1f2937;
`;

const ProfileId = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const ProfileGrade = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const StatusContainer = styled.div`
  display: flex;
  align-items: center;
`;

const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'status',
})`
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
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

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'fullWidth',
})`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}
`;

const InfoLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const InfoValue = styled.div`
  font-size: 15px;
  color: #1f2937;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  min-height: 20px;
`;

const DispatchTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const DispatchTableHeader = styled.thead`
  background: #f9fafb;
`;

const DispatchTableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
  }
`;

const DispatchTableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #1f2937;
  text-align: left;
`;

const DispatchTableHeaderCell = styled.th`
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-align: left;
`;

const DispatchTableBody = styled.tbody``;

const RemarkBox = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  border: 1px solid #e5e7eb;
  white-space: pre-wrap;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  margin-top: 8px;
  flex-shrink: 0;
`;

const EditButtonLarge = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: #4b5563;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const CloseButtonLarge = styled.button`
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #7c3aed;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(139, 92, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

