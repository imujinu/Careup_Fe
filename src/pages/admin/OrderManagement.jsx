import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiCheckCircle, mdiCloseCircle, mdiFileDocumentOutline, mdiMagnify } from '@mdi/js';
import orderService from '../../service/orderService';
import authService from '../../service/authService';
import OrderDetailModal from '../../components/admin/OrderDetailModal';

const PageContainer = styled.div`
  width: 100%;
  padding: 24px;
  background: #f9fafb;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const SearchFilterContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const Select = styled.select`
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const InfoText = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
`;

const TableCell = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$status) {
      case 'PENDING':
        return '#fef3c7';
      case 'APPROVED':
        return '#dbeafe';
      case 'REJECTED':
        return '#fee2e2';
      case 'COMPLETED':
        return '#d1fae5';
      default:
        return '#f3f4f6';
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case 'PENDING':
        return '#92400e';
      case 'APPROVED':
        return '#1e40af';
      case 'REJECTED':
        return '#991b1b';
      case 'COMPLETED':
        return '#065f46';
      default:
        return '#374151';
    }
  }};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: ${(props) => (props.$danger ? '#ef4444' : '#3b82f6')};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-right: 8px;
  transition: background 0.2s;

  &:hover {
    background: ${(props) => (props.$danger ? '#dc2626' : '#2563eb')};
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
`;

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // 상태 한글 변환 함수
  const getStatusText = (status) => {
    if (!status) return status;
    switch (status.toUpperCase()) {
      case 'PENDING':
        return '대기중';
      case 'APPROVED':
        return '승인됨';
      case 'REJECTED':
        return '거부됨';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소됨';
      default:
        return status;
    }
  };

  // 주문 목록 조회
  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('주문 목록 조회 시작...');
      const response = await orderService.getAllOrders();
      console.log('주문 목록 조회 응답:', response);
      
      let ordersData = [];
      
      // ResponseDto 구조에 맞게 데이터 추출
      if (response.result) {
        ordersData = response.result;
      } else if (Array.isArray(response)) {
        ordersData = response;
      } else if (response.data) {
        ordersData = response.data;
      }

      console.log('파싱된 주문 데이터:', ordersData);

      // 데이터 변환
      const formattedOrders = ordersData.map((order) => ({
        id: order.orderId || order.id,
        memberName: order.memberName || '-',
        branchId: order.branchId || '-',
        totalAmount: order.totalAmount || 0,
        status: order.orderStatus || order.status || 'PENDING',
        createdAt: order.createdAt || new Date().toISOString(),
        orderItems: order.orderItems || []
      }));

      console.log('포맷팅된 주문 데이터:', formattedOrders);
      setOrders(formattedOrders);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      console.error('에러 상세:', error.response);
      // 에러 발생 시 빈 배열 설정
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 필터링된 주문 목록
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);
    const matchesStatus = !statusFilter || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 통계 계산
  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    approved: orders.filter((o) => o.status === 'APPROVED').length,
    rejected: orders.filter((o) => o.status === 'REJECTED').length,
  };

  // 본점 주문만 승인/거부 가능
  const handleApprove = async (orderId) => {
    if (!window.confirm('이 주문을 승인하시겠습니까?')) return;

    try {
      const userInfo = authService.getCurrentUser();
      const approvedBy = userInfo?.id || 1;

      await orderService.approveOrder(orderId, approvedBy);
      alert('주문이 승인되었습니다.');
      fetchOrders(); // 목록 새로고침
    } catch (error) {
      console.error('주문 승인 실패:', error);
      alert('주문 승인에 실패했습니다.');
    }
  };

  const handleReject = async (orderId, reason = null) => {
    let rejectReason = reason;
    if (!rejectReason) {
      rejectReason = window.prompt('거부 사유를 입력해주세요:');
      if (!rejectReason) return;
    }

    try {
      await orderService.rejectOrder(orderId, rejectReason);
      alert('주문이 거부되었습니다.');
      fetchOrders(); // 목록 새로고침
    } catch (error) {
      console.error('주문 거부 실패:', error);
      alert('주문 거부에 실패했습니다.');
    }
  };

  // 본점(branchId=1) 주문인지 확인
  const isBranchOfficeOrder = (order) => {
    return order.branchId === 1;
  };

  // 상세 모달 열기
  const handleOpenDetail = async (order) => {
    try {
      const orderDetail = await orderService.getOrderDetail(order.id);
      // ResponseDto 구조에 맞게 데이터 추출
      const detailData = orderDetail.result || orderDetail;
      setSelectedOrder(detailData);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      setSelectedOrder(order);
      setIsDetailModalOpen(true);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Header>
          <Title>주문 관리</Title>
        </Header>
        <EmptyState>로딩 중...</EmptyState>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <Title>주문 관리</Title>
      </Header>

      {/* 통계 카드 */}
      <SummaryCards>
        <SummaryCard>
          <SummaryLabel>전체 주문</SummaryLabel>
          <SummaryValue>{summary.total}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>대기중</SummaryLabel>
          <SummaryValue>{summary.pending}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>승인됨</SummaryLabel>
          <SummaryValue>{summary.approved}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>거부됨</SummaryLabel>
          <SummaryValue>{summary.rejected}</SummaryValue>
        </SummaryCard>
      </SummaryCards>

      {/* 검색 및 필터 */}
      <SearchFilterContainer>
        <SearchInput
          type="text"
          placeholder="고객명 또는 주문번호로 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Icon path={mdiMagnify} size={1.2} style={{ marginLeft: '-40px', color: '#6b7280' }} />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="PENDING">대기중</option>
          <option value="APPROVED">승인됨</option>
          <option value="REJECTED">거부됨</option>
          <option value="COMPLETED">완료</option>
        </Select>
      </SearchFilterContainer>

      {/* 주문 테이블 */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>주문번호</TableHeader>
              <TableHeader>고객명</TableHeader>
              <TableHeader>지점</TableHeader>
              <TableHeader>총액</TableHeader>
              <TableHeader>상태</TableHeader>
              <TableHeader>주문일시</TableHeader>
              <TableHeader>조치</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <TableCell colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState>주문 내역이 없습니다.</EmptyState>
                </TableCell>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.memberName}</TableCell>
                  <TableCell>{order.branchId}</TableCell>
                  <TableCell>₩{order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge $status={order.status}>{getStatusText(order.status)}</StatusBadge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleString('ko-KR')}</TableCell>
                  <TableCell>
                    <ActionButton onClick={() => handleOpenDetail(order)}>상세</ActionButton>
                    {order.status === 'PENDING' && isBranchOfficeOrder(order) && (
                      <>
                        <ActionButton onClick={() => handleApprove(order.id)}>승인</ActionButton>
                        <ActionButton $danger onClick={() => handleReject(order.id)}>
                          거부
                        </ActionButton>
                      </>
                    )}
                    {order.status === 'PENDING' && !isBranchOfficeOrder(order) && (
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        (지점에서 처리)
                      </span>
                    )}
                  </TableCell>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      {/* 상세 모달 */}
      {isDetailModalOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
          }}
          onApprove={(orderId) => {
            handleApprove(orderId);
            setIsDetailModalOpen(false);
          }}
          onReject={(orderId, reason) => {
            handleReject(orderId, reason);
            setIsDetailModalOpen(false);
          }}
          canApproveAndReject={isBranchOfficeOrder(selectedOrder)}
        />
      )}
    </PageContainer>
  );
}

export default OrderManagement;
