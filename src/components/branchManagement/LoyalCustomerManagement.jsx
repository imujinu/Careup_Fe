import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { loyalCustomerService } from '../../service/loyalCustomerService';
import { Icon } from '@mdi/react';
import { mdiAccountStar, mdiPlus, mdiPencil, mdiDelete, mdiFilter } from '@mdi/js';
import axios from '../../utils/axiosConfig';

/**
 * 지점별 단골고객 관리 컴포넌트
 * BranchDetailTabs의 "고객 관리" 탭에서 사용
 */
function LoyalCustomerManagement({ branchId }) {
  const [loyalCustomers, setLoyalCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (branchId) {
      loadLoyalCustomers();
    }
  }, [branchId, selectedGrade]);

  const loadLoyalCustomers = async () => {
    if (!branchId) return;
    
    try {
      setLoading(true);
      let data;
      
      if (selectedGrade === 'ALL') {
        data = await loyalCustomerService.getLoyalCustomersByBranch(branchId);
      } else {
        data = await loyalCustomerService.getLoyalCustomersByGrade(branchId, selectedGrade);
      }
      
      setLoyalCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('단골고객 목록 조회 실패:', error);
      alert('단골고객 목록을 불러오는데 실패했습니다.');
      setLoyalCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    setSelectedCustomer(null);
    setShowRegisterModal(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleDelete = async (customerId) => {
    if (!confirm('정말로 이 단골고객을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await loyalCustomerService.deleteLoyalCustomer(customerId);
      alert('단골고객이 삭제되었습니다.');
      loadLoyalCustomers();
    } catch (error) {
      console.error('단골고객 삭제 실패:', error);
      alert('단골고객 삭제에 실패했습니다.');
    }
  };

  const handleModalClose = () => {
    setShowRegisterModal(false);
    setShowEditModal(false);
    setSelectedCustomer(null);
    loadLoyalCustomers();
  };

  const getGradeBadgeColor = (grade) => {
    switch (grade) {
      case 'VIP':
        return '#9333ea';
      case 'GOLD':
        return '#f59e0b';
      case 'SILVER':
        return '#6b7280';
      case 'BRONZE':
        return '#92400e';
      default:
        return '#6b7280';
    }
  };

  const getGradeLabel = (grade) => {
    switch (grade) {
      case 'VIP':
        return 'VIP';
      case 'GOLD':
        return '골드';
      case 'SILVER':
        return '실버';
      case 'BRONZE':
        return '브론즈';
      default:
        return grade;
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingText>로딩 중...</LoadingText>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Icon path={mdiAccountStar} size={1.5} />
          단골고객 관리
        </Title>
        <Actions>
          <FilterWrapper>
            <Icon path={mdiFilter} size={1} />
            <FilterSelect
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="ALL">전체 등급</option>
              <option value="BRONZE">브론즈</option>
              <option value="SILVER">실버</option>
              <option value="GOLD">골드</option>
              <option value="VIP">VIP</option>
            </FilterSelect>
          </FilterWrapper>
          <RegisterButton onClick={handleRegister}>
            <Icon path={mdiPlus} size={1} />
            단골고객 등록
          </RegisterButton>
        </Actions>
      </Header>

      {loyalCustomers.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <Icon path={mdiAccountStar} size={4} />
          </EmptyIcon>
          <EmptyTitle>단골고객이 없습니다</EmptyTitle>
          <EmptyText>
            {selectedGrade === 'ALL' 
              ? '이 지점의 단골고객이 아직 등록되지 않았습니다.'
              : `${getGradeLabel(selectedGrade)} 등급 단골고객이 없습니다.`}
          </EmptyText>
        </EmptyState>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>고객명</TableHeader>
              <TableHeader>이메일</TableHeader>
              <TableHeader>누적 금액</TableHeader>
              <TableHeader>주문 횟수</TableHeader>
              <TableHeader>등급</TableHeader>
              <TableHeader>등록일</TableHeader>
              <TableHeader>액션</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loyalCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.memberName || '-'}</TableCell>
                <TableCell>{customer.memberEmail || '-'}</TableCell>
                <TableCell>
                  {customer.totalAmount?.toLocaleString() || 0}원
                </TableCell>
                <TableCell>{customer.orderCount || 0}회</TableCell>
                <TableCell>
                  <GradeBadge $color={getGradeBadgeColor(customer.grade)}>
                    {getGradeLabel(customer.grade)}
                  </GradeBadge>
                </TableCell>
                <TableCell>
                  {customer.registeredAt
                    ? new Date(customer.registeredAt).toLocaleDateString('ko-KR')
                    : '-'}
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton
                      $variant="edit"
                      onClick={() => handleEdit(customer)}
                      title="수정"
                    >
                      <Icon path={mdiPencil} size={0.9} />
                    </ActionButton>
                    <ActionButton
                      $variant="delete"
                      onClick={() => handleDelete(customer.id)}
                      title="삭제"
                    >
                      <Icon path={mdiDelete} size={0.9} />
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* 등록 모달 */}
      {showRegisterModal && (
        <LoyalCustomerModal
          branchId={branchId}
          onClose={handleModalClose}
        />
      )}

      {/* 수정 모달 */}
      {showEditModal && selectedCustomer && (
        <LoyalCustomerEditModal
          customer={selectedCustomer}
          branchId={branchId}
          onClose={handleModalClose}
        />
      )}
    </Container>
  );
}

// 등록 모달 컴포넌트
function LoyalCustomerModal({ branchId, onClose }) {
  const [formData, setFormData] = useState({
    memberId: '',
    memberName: '',
    memberEmail: '',
    memberPhone: '',
    initialAmount: '',
    initialOrderCount: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // 회원 검색 모달 열기
  const handleOpenMemberSearch = () => {
    setShowMemberSearch(true);
  };

  // 회원 선택 시
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setFormData(prev => ({
      ...prev,
      memberId: member.memberId.toString(),
      memberName: member.name || '',
      memberEmail: member.email || '',
      memberPhone: member.phone || '',
    }));
    setShowMemberSearch(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.memberId) {
      alert('회원 ID를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await loyalCustomerService.registerLoyalCustomer({
        memberId: Number(formData.memberId),
        branchId: Number(branchId),
        initialAmount: formData.initialAmount ? Number(formData.initialAmount) : undefined,
        initialOrderCount: formData.initialOrderCount ? Number(formData.initialOrderCount) : undefined,
      });
      alert('단골고객이 등록되었습니다.');
      onClose();
    } catch (error) {
      console.error('단골고객 등록 실패:', error);
      const errorMsg = error.response?.data?.status_message || error.response?.data?.message || '단골고객 등록에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    setFormData(prev => ({
      ...prev,
      memberId: '',
      memberName: '',
      memberEmail: '',
      memberPhone: '',
    }));
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>단골고객 등록</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <InfoBox>
            <InfoIcon>ℹ️</InfoIcon>
            <InfoText>
              회원 검색 버튼을 클릭하여 이름, 이메일, 전화번호로 회원을 검색하고 선택할 수 있습니다.
            </InfoText>
          </InfoBox>
          
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>
                회원 선택 <Required>*</Required>
              </Label>
              {selectedMember ? (
                <SelectedMemberBox>
                  <SelectedMemberInfo>
                    <SelectedMemberName>{selectedMember.name}</SelectedMemberName>
                    <SelectedMemberDetail>
                      {selectedMember.email && `이메일: ${selectedMember.email}`}
                      {selectedMember.phone && ` | 전화번호: ${selectedMember.phone}`}
                    </SelectedMemberDetail>
                  </SelectedMemberInfo>
                  <ClearButton type="button" onClick={handleClearMember} disabled={submitting}>
                    변경
                  </ClearButton>
                </SelectedMemberBox>
              ) : (
                <SearchButton 
                  type="button" 
                  onClick={handleOpenMemberSearch}
                  disabled={submitting}
                  $fullWidth
                >
                  <Icon path={mdiAccountStar} size={1} style={{ marginRight: '8px' }} />
                  회원 검색
                </SearchButton>
              )}
              <HelperText>
                이름, 이메일, 전화번호로 회원을 검색하고 선택할 수 있습니다.
              </HelperText>
            </FormGroup>

            <FormGroup>
              <Label>초기 금액 (선택)</Label>
              <Input
                type="number"
                value={formData.initialAmount}
                onChange={(e) => setFormData({ ...formData, initialAmount: e.target.value })}
                placeholder="초기 누적 금액 (원)"
                min="0"
                disabled={submitting}
              />
              <HelperText>등록 시점의 초기 누적 구매 금액을 설정할 수 있습니다.</HelperText>
            </FormGroup>

            <FormGroup>
              <Label>초기 주문 횟수 (선택)</Label>
              <Input
                type="number"
                value={formData.initialOrderCount}
                onChange={(e) => setFormData({ ...formData, initialOrderCount: e.target.value })}
                placeholder="초기 주문 횟수"
                min="0"
                disabled={submitting}
              />
              <HelperText>등록 시점의 초기 주문 횟수를 설정할 수 있습니다.</HelperText>
            </FormGroup>

            <Divider />

            <InfoBox $type="warning">
              <InfoIcon>⚠️</InfoIcon>
              <InfoText style={{ color: '#92400e' }}>
                단골고객은 주문 승인 시 10만원 이상 구매하면 자동으로 등록됩니다. 
                수동 등록은 특별한 경우에만 사용하세요.
              </InfoText>
            </InfoBox>

            <ModalActions>
              <CancelButton type="button" onClick={onClose} disabled={submitting}>
                취소
              </CancelButton>
              <SubmitButton type="submit" disabled={submitting || !selectedMember}>
                {submitting ? '등록 중...' : '등록'}
              </SubmitButton>
            </ModalActions>
          </Form>
        </ModalBody>
      </ModalContent>

      {/* 회원 검색 모달 */}
      {showMemberSearch && (
        <MemberSearchModal
          branchId={branchId}
          onSelect={handleMemberSelect}
          onClose={() => setShowMemberSearch(false)}
        />
      )}
    </ModalOverlay>
  );
}

// 회원 검색 모달 컴포넌트
function MemberSearchModal({ branchId, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // 주문 내역을 통해 회원 검색
  const searchMembers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      setError('');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      
      // 주문 목록에서 회원 검색 (이름, 이메일로 필터링)
      const response = await axios.get(`${API_BASE_URL}/api/orders`, {
        params: { page: 0, size: 1000 }
      });

      const orders = Array.isArray(response.data?.result) ? response.data.result :
                    Array.isArray(response.data?.data) ? response.data.data :
                    Array.isArray(response.data) ? response.data : [];

      // 회원 정보 추출 및 중복 제거
      const memberMap = new Map();
      orders.forEach(order => {
        if (order.memberId && (
          (order.memberName && order.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.memberEmail && order.memberEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.memberPhone && order.memberPhone.includes(searchTerm))
        )) {
          if (!memberMap.has(order.memberId)) {
            memberMap.set(order.memberId, {
              memberId: order.memberId,
              name: order.memberName || '이름 없음',
              email: order.memberEmail || '',
              phone: order.memberPhone || '',
            });
          }
        }
      });

      const uniqueMembers = Array.from(memberMap.values());
      setSearchResults(uniqueMembers);

      if (uniqueMembers.length === 0) {
        setError('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error('회원 검색 실패:', err);
      setError('회원 검색 중 오류가 발생했습니다.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 검색어 변경 시 자동 검색 (디바운스)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      searchMembers();
    }, 500); // 500ms 디바운스

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelect = (member) => {
    onSelect(member);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <ModalHeader>
          <ModalTitle>회원 검색</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>이름, 이메일, 전화번호로 검색</Label>
            <SearchInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="회원 이름, 이메일 또는 전화번호를 입력하세요"
              autoFocus
            />
            {searching && (
              <HelperText>검색 중...</HelperText>
            )}
          </FormGroup>

          {error && (
            <ErrorMessage>{error}</ErrorMessage>
          )}

          {searchResults.length > 0 && (
            <MembersList>
              {searchResults.map((member) => (
                <MemberCard
                  key={member.memberId}
                  onClick={() => handleSelect(member)}
                >
                  <MemberCardName>{member.name}</MemberCardName>
                  <MemberCardDetail>
                    {member.email && <div>📧 {member.email}</div>}
                    {member.phone && <div>📞 {member.phone}</div>}
                    <div>ID: {member.memberId}</div>
                  </MemberCardDetail>
                </MemberCard>
              ))}
            </MembersList>
          )}

          {searchTerm && !searching && searchResults.length === 0 && !error && (
            <EmptyState>
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                검색어를 입력하면 결과가 표시됩니다.
              </div>
            </EmptyState>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

// 수정 모달 컴포넌트
function LoyalCustomerEditModal({ customer, branchId, onClose }) {
  const [formData, setFormData] = useState({
    totalAmount: customer.totalAmount?.toString() || '',
    orderCount: customer.orderCount?.toString() || '',
    grade: customer.grade || 'BRONZE',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await loyalCustomerService.updateLoyalCustomer(customer.id, {
        totalAmount: formData.totalAmount ? Number(formData.totalAmount) : undefined,
        orderCount: formData.orderCount ? Number(formData.orderCount) : undefined,
        grade: formData.grade,
      });
      alert('단골고객 정보가 수정되었습니다.');
      onClose();
    } catch (error) {
      console.error('단골고객 수정 실패:', error);
      const errorMsg = error.response?.data?.status_message || '단골고객 수정에 실패했습니다.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>단골고객 수정</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>고객명</Label>
              <Input type="text" value={customer.memberName || '-'} disabled />
            </FormGroup>
            <FormGroup>
              <Label>누적 금액</Label>
              <Input
                type="number"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="누적 구매 금액"
              />
            </FormGroup>
            <FormGroup>
              <Label>주문 횟수</Label>
              <Input
                type="number"
                value={formData.orderCount}
                onChange={(e) => setFormData({ ...formData, orderCount: e.target.value })}
                placeholder="주문 횟수"
              />
            </FormGroup>
            <FormGroup>
              <Label>등급</Label>
              <Select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              >
                <option value="BRONZE">브론즈</option>
                <option value="SILVER">실버</option>
                <option value="GOLD">골드</option>
                <option value="VIP">VIP</option>
              </Select>
            </FormGroup>
            <ModalActions>
              <CancelButton type="button" onClick={onClose}>
                취소
              </CancelButton>
              <SubmitButton type="submit" disabled={submitting}>
                {submitting ? '수정 중...' : '수정'}
              </SubmitButton>
            </ModalActions>
          </Form>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default LoyalCustomerManagement;

// Styled Components
const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
`;

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const FilterWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f9fafb;
  border-radius: 8px;
  color: #6b7280;
`;

const FilterSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #1f2937;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

const RegisterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #7c3aed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHead = styled.thead`
  background: #f9fafb;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableHeader = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1f2937;
`;

const GradeBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== '$color',
})`
  display: inline-block;
  padding: 4px 12px;
  background: ${(props) => props.$color || '#6b7280'};
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== '$variant',
})`
  padding: 6px 10px;
  border: 1px solid ${(props) => 
    props.$variant === 'delete' ? '#ef4444' : '#e5e7eb'};
  background: ${(props) => 
    props.$variant === 'delete' ? '#fee2e2' : 'white'};
  color: ${(props) => 
    props.$variant === 'delete' ? '#ef4444' : '#6b7280'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => 
      props.$variant === 'delete' ? '#ef4444' : '#f9fafb'};
    color: ${(props) => 
      props.$variant === 'delete' ? 'white' : '#8b5cf6'};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
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

const EmptyText = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #6b7280;
`;

// Modal Styles
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
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #7c3aed;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Required = styled.span`
  color: #ef4444;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== '$fullWidth',
})`
  padding: 12px 16px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => props.$fullWidth && 'width: 100%;'}

  &:hover:not(:disabled) {
    background: #7c3aed;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  padding: 8px 12px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 13px;
  margin-top: 4px;
`;

const MemberInfoBox = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
`;

const MemberInfoItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MemberInfoLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #0369a1;
  min-width: 60px;
`;

const MemberInfoValue = styled.span`
  font-size: 13px;
  color: #1e40af;
`;

const InfoBox = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$type',
})`
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: ${(props) => 
    props.$type === 'warning' ? '#fef3c7' : '#eff6ff'};
  border: 1px solid ${(props) => 
    props.$type === 'warning' ? '#fde68a' : '#bfdbfe'};
  border-radius: 8px;
  margin-bottom: 20px;
`;

const InfoIcon = styled.span`
  font-size: 18px;
  flex-shrink: 0;
`;

const InfoText = styled.div`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #1e40af;
  flex: 1;
`;

const HelperText = styled.p`
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #6b7280;
`;

const Divider = styled.hr`
  margin: 24px 0;
  border: none;
  border-top: 1px solid #e5e7eb;
`;

const SelectedMemberBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  gap: 12px;
`;

const SelectedMemberInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SelectedMemberName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1e40af;
`;

const SelectedMemberDetail = styled.div`
  font-size: 13px;
  color: #0369a1;
`;

const ClearButton = styled.button`
  padding: 8px 16px;
  background: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const MembersList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MemberCard = styled.div`
  padding: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #8b5cf6;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const MemberCardName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
`;

const MemberCardDetail = styled.div`
  font-size: 13px;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

