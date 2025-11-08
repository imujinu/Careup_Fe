import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiMagnify } from '@mdi/js';
import orderService from '../../service/orderService';
import authService from '../../service/authService';
import OrderDetailModal from '../../components/admin/OrderDetailModal';
import RejectReasonModal from '../../components/admin/RejectReasonModal';

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
  grid-template-columns: repeat(5, 1fr);
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
      case 'CONFIRMED':
        return '#dbeafe';
      case 'REJECTED':
        return '#fee2e2';
      case 'COMPLETED':
        return '#d1fae5';
      case 'CANCELLED':
      case 'CANCELED':
        return '#f3f4f6';
      default:
        return '#f3f4f6';
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case 'PENDING':
        return '#92400e';
      case 'APPROVED':
      case 'CONFIRMED':
        return '#1e40af';
      case 'REJECTED':
        return '#991b1b';
      case 'COMPLETED':
        return '#065f46';
      case 'CANCELLED':
      case 'CANCELED':
        return '#374151';
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

function FranchiseOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [pendingRejectOrderId, setPendingRejectOrderId] = useState(null);

  // 상태 한글 변환 함수
  const getStatusText = (status) => {
    if (!status) return status;
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
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

  // 상태 정규화 함수 (CONFIRMED -> APPROVED)
  const normalizeStatus = (status) => {
    if (!status) return status;
    const upperStatus = String(status).toUpperCase();
    if (upperStatus === 'CONFIRMED') return 'APPROVED';
    if (upperStatus === 'CANCELED') return 'CANCELLED';
    return upperStatus;
  };

  // 주문 목록 조회 (지점별)
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // 현재 사용자의 지점 정보 가져오기
      const userInfo = authService.getCurrentUser();
      const currentBranchId = userInfo?.branchId || branchId;
      
      if (!currentBranchId) {
        setOrders([]);
        return;
      }

      setBranchId(currentBranchId);
      const response = await orderService.getOrdersByBranch(currentBranchId);
      
      let ordersData = [];
      
      // ResponseDto 구조에 맞게 데이터 추출
      if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response?.result && Array.isArray(response.result)) {
        ordersData = response.result;
      } else if (Array.isArray(response)) {
        ordersData = response;
      }

      // 데이터 변환
      const formattedOrders = ordersData.map((order) => {
        const rawStatus = order.orderStatus || order.status || 'PENDING';
        const normalizedStatus = normalizeStatus(rawStatus);
        return {
          id: order.orderId || order.id,
          orderId: order.orderId || order.id, // 상세 모달에서 사용하기 위해 추가
          memberName: order.memberName || '-',
          branchId: order.branchId || currentBranchId,
          branchName: order.branchName,
          totalAmount: order.totalAmount || 0,
          status: normalizedStatus,
          createdAt: order.createdAt || new Date().toISOString(),
          orderItems: order.orderItems || [],
          paymentStatus: order.paymentStatus || null,
          isPaymentCompleted: order.isPaymentCompleted || false,
          rejectedBy: order.rejectedBy,
          rejectedByName: order.rejectedByName,
          rejectedAt: order.rejectedAt
        };
      });

      setOrders(formattedOrders);
    } catch (error) {
      console.error('주문 목록 조회 실패:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 필터링된 주문 목록 (최신순 정렬)
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        order.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm);
      // 상태 필터 (정규화된 상태와 비교)
      const normalizedFilterStatus = statusFilter ? normalizeStatus(statusFilter) : null;
      const matchesStatus = !statusFilter || !normalizedFilterStatus || order.status === normalizedFilterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // 주문 번호(ID) 기준 최신순 정렬 (내림차순)
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    });

  // 통계 계산 (정규화된 상태로 필터링)
  const summary = {
    total: orders.length,
    pending: orders.filter((o) => normalizeStatus(o.status) === 'PENDING').length,
    approved: orders.filter((o) => normalizeStatus(o.status) === 'APPROVED').length,
    rejected: orders.filter((o) => normalizeStatus(o.status) === 'REJECTED').length,
    cancelled: orders.filter((o) => normalizeStatus(o.status) === 'CANCELLED').length,
  };

  // 주문 승인
  const handleApprove = async (orderId, orderData = null) => {
    // 결제 완료 여부 확인 (orderData가 있으면 먼저 확인)
    if (orderData && !orderData.isPaymentCompleted) {
      alert('아직 결제가 완료되지 않은 주문입니다. 결제가 완료된 후 승인할 수 있습니다.');
      return;
    }

    if (!window.confirm('이 주문을 승인하시겠습니까?')) return;

    try {
      const userInfo = authService.getCurrentUser();
      const approvedBy = userInfo?.id || 1;

      await orderService.approveOrder(orderId, approvedBy);
      alert('주문이 승인되었습니다.');
      fetchOrders(); // 목록 새로고침
    } catch (error) {
      console.error('주문 승인 실패:', error);
      const errorMessage = error.response?.data?.status_message || error.message || '주문 승인에 실패했습니다.';
      
      // 결제 미완료 에러 메시지 처리
      if (errorMessage.includes('결제가 완료되지 않은') || errorMessage.includes('결제가 완료되지 않았')) {
        alert('아직 결제가 완료되지 않은 주문입니다. 결제가 완료된 후 승인할 수 있습니다.');
      } else {
        alert(errorMessage);
      }
    }
  };

  // 주문 거부
  const handleReject = async (orderId, reason = null) => {
    let rejectReason = reason;
    if (!rejectReason) {
      // 모달로 거부 사유 입력
      setPendingRejectOrderId(orderId);
      setIsRejectModalOpen(true);
      return;
    }

    try {
      const userInfo = authService.getCurrentUser();
      const rejectedBy = userInfo?.id || userInfo?.employeeId || 1;
      const rejectedByName = userInfo?.name || '-';
      await orderService.rejectOrder(orderId, rejectReason, rejectedBy);
      alert('주문이 거부되었습니다.');
      fetchOrders(); // 목록 새로고침
    } catch (error) {
      console.error('주문 거부 실패:', error);
      alert('주문 거부에 실패했습니다.');
    }
  };

  // 거부 사유 모달 확인 처리
  const handleRejectConfirm = async (reason) => {
    if (!pendingRejectOrderId) return;

    try {
      const userInfo = authService.getCurrentUser();
      const rejectedBy = userInfo?.id || userInfo?.employeeId || 1;
      const rejectedByName = userInfo?.name || '-';
      await orderService.rejectOrder(pendingRejectOrderId, reason, rejectedBy);
      alert('주문이 거부되었습니다.');
      setIsRejectModalOpen(false);
      setPendingRejectOrderId(null);
      fetchOrders(); // 목록 새로고침
    } catch (error) {
      console.error('주문 거부 실패:', error);
      alert('주문 거부에 실패했습니다.');
    }
  };

  // 상세 모달 열기
  const handleOpenDetail = async (order) => {
    try {
      const detailData = await orderService.getOrderDetail(order.id || order.orderId);
      const detailResult = detailData?.result || detailData;
      
      // 리스트 항목과 병합하여 필드 누락 방지
      setSelectedOrder({
        id: order.id,
        orderId: detailResult?.orderId ?? order.orderId ?? order.id,
        memberName: detailResult?.memberName ?? order.memberName ?? '-',
        branchId: detailResult?.branchId ?? order.branchId ?? '-',
        totalAmount: detailResult?.totalAmount ?? order.totalAmount ?? 0,
        orderStatus: detailResult?.orderStatus ?? order.status,
        status: (() => {
          const raw = (detailResult?.status ?? detailResult?.orderStatus ?? order.status);
          const up = String(raw || 'PENDING').toUpperCase();
          if (up === 'CONFIRMED') return 'APPROVED';
          if (up === 'CANCELED') return 'CANCELLED';
          return up;
        })(),
        orderType: detailResult?.orderType ?? order.orderType,
        createdAt: detailResult?.createdAt ?? order.createdAt,
        orderItems: detailResult?.orderItems ?? order.orderItems ?? [],
        paymentStatus: detailResult?.paymentStatus ?? order.paymentStatus ?? null,
        isPaymentCompleted: detailResult?.isPaymentCompleted ?? order.isPaymentCompleted ?? false,
        approvedBy: detailResult?.approvedBy ?? order.approvedBy,
        approvedByName: detailResult?.approvedByName ?? order.approvedByName,
        branchName: detailResult?.branchName ?? order.branchName,
        rejectedBy: detailResult?.rejectedBy ?? order.rejectedBy,
        rejectedByName: detailResult?.rejectedByName ?? order.rejectedByName,
        rejectedAt: detailResult?.rejectedAt ?? order.rejectedAt,
        rejectedReason: detailResult?.rejectedReason ?? order.rejectedReason,
        cancelledReason: detailResult?.cancelledReason ?? detailResult?.cancelReason ?? detailResult?.cancellationReason ?? order.cancelledReason ?? order.cancelReason ?? order.cancellationReason
      });
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      console.error('에러 상세:', error.response);
      // 실패해도 기본 정보로 모달 표시
      setSelectedOrder({
        ...order,
        orderId: order.orderId ?? order.id,
        orderStatus: order.status,
        orderItems: order.orderItems ?? []
      });
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
        <SummaryCard>
          <SummaryLabel>취소됨</SummaryLabel>
          <SummaryValue>{summary.cancelled}</SummaryValue>
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
          <option value="CANCELLED">취소됨</option>
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
              <TableHeader>총액</TableHeader>
              <TableHeader>상태</TableHeader>
              <TableHeader>주문일시</TableHeader>
              <TableHeader>조치</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <TableCell colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  <EmptyState>주문 내역이 없습니다.</EmptyState>
                </TableCell>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <TableCell>#{order.id}</TableCell>
                  <TableCell>{order.memberName}</TableCell>
                  <TableCell>₩{order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge $status={order.status}>{getStatusText(order.status)}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    {order.createdAt ? (() => {
                        const dateStr = order.createdAt;
                        const normalized = typeof dateStr === 'string' && !dateStr.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(dateStr) 
                          ? dateStr.trim() + 'Z' 
                          : dateStr;
                        return new Date(normalized).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
                      })() : '-'}
                  </TableCell>
                  <TableCell>
                    <ActionButton onClick={() => handleOpenDetail(order)}>상세</ActionButton>
                    {order.status === 'PENDING' && (
                      <>
                        <ActionButton 
                          onClick={() => handleApprove(order.id, order)}
                          disabled={order.isPaymentCompleted === false}
                          title={order.isPaymentCompleted === false ? '결제가 완료되지 않은 주문입니다' : ''}
                        >
                          승인
                        </ActionButton>
                        <ActionButton $danger onClick={() => handleReject(order.id, null)}>
                          거부
                        </ActionButton>
                      </>
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
          onReject={(orderId, reason, rejectedBy, rejectedByName) => {
            handleReject(orderId, reason);
            setIsDetailModalOpen(false);
          }}
        />
      )}

      {/* 거부 사유 입력 모달 */}
      <RejectReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setPendingRejectOrderId(null);
        }}
        onConfirm={handleRejectConfirm}
      />
    </PageContainer>
  );
}

export default FranchiseOrderManagement;
