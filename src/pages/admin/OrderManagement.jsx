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
    const s = String(status).toUpperCase();
    switch (s) {
      case 'PENDING':
        return '대기중';
      case 'APPROVED':
      case 'CONFIRMED': // 백엔드에서 CONFIRMED로 들어오는 케이스 대응
        return '승인됨';
      case 'REJECTED':
        return '거부됨';
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
      case 'CANCELED': // 철자 변형 대응
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
      
      // 본점(branchId=1)인 경우 본점 주문만 조회
      const userInfo = authService.getCurrentUser();
      const currentBranchId = userInfo?.branchId;
      
      let response;
      if (currentBranchId === 1) {
        // 본점인 경우 본점 주문만 조회
        console.log('본점 주문만 조회 - branchId: 1');
        response = await orderService.getOrdersByBranch(1);
      } else {
        // 본사 관리자나 다른 지점인 경우 전체 주문 조회
        console.log('전체 주문 조회');
        response = await orderService.getAllOrders();
      }
      
      console.log('주문 목록 조회 응답(normalized):', response);

      // 응답 구조 파싱 (지점별 조회와 전체 조회 모두 대응)
      let ordersData = [];
      if (Array.isArray(response)) {
        ordersData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (response?.result && Array.isArray(response.result)) {
        ordersData = response.result;
      } else if (response?.items && Array.isArray(response.items)) {
        ordersData = response.items;
      }

      console.log('파싱된 주문 데이터:', ordersData);

      // 데이터 변환
      const formattedOrders = ordersData.map((order) => {
        const raw = (order.orderStatus || order.status || 'PENDING');
        const norm = String(raw).toUpperCase();
        // 상태 표준화
        const normalized = norm === 'CONFIRMED' ? 'APPROVED' : (norm === 'CANCELED' ? 'CANCELLED' : norm);
        return {
          id: order.orderId || order.id,
          memberName: order.memberName || '-',
          branchId: order.branchId || '-',
          totalAmount: order.totalAmount || 0,
          status: normalized,
          createdAt: order.createdAt || new Date().toISOString(),
          orderItems: order.orderItems || [],
          paymentStatus: order.paymentStatus || null,
          isPaymentCompleted: order.isPaymentCompleted || false
        };
      });

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
  const handleApprove = async (orderId, orderData = null) => {
    // 결제 완료 여부 확인
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
      // 즉시 카운팅 반영
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'APPROVED' } : o)));
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

  const handleReject = async (orderId, reason = null) => {
    let rejectReason = reason;
    if (!rejectReason) {
      rejectReason = window.prompt('거부 사유를 입력해주세요:');
      if (!rejectReason) return;
    }

    try {
      await orderService.rejectOrder(orderId, rejectReason);
      alert('주문이 거부되었습니다.');
      // 즉시 카운팅 반영 + 거부자 기록
      const userInfo = authService.getCurrentUser();
      const rejectedBy = userInfo?.id || 'me';
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'REJECTED', rejectedBy } : o)));
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
      const detailData = await orderService.getOrderDetail(order.id);
      // 리스트 항목과 병합하여 필드 누락 방지
      setSelectedOrder({
        id: order.id,
        orderId: detailData.orderId ?? order.orderId ?? order.id,
        memberName: detailData.memberName ?? order.memberName ?? '-',
        branchId: detailData.branchId ?? order.branchId ?? '-',
        totalAmount: detailData.totalAmount ?? order.totalAmount ?? 0,
        orderStatus: (detailData.orderStatus ?? order.status),
        status: (() => {
          const raw = (detailData.status ?? detailData.orderStatus ?? order.status);
          const up = String(raw || 'PENDING').toUpperCase();
          if (up === 'CONFIRMED') return 'APPROVED';
          if (up === 'CANCELED') return 'CANCELLED';
          return up;
        })(),
        orderType: detailData.orderType ?? order.orderType,
        createdAt: detailData.createdAt ?? order.createdAt,
        orderItems: detailData.orderItems ?? order.orderItems ?? [],
        paymentStatus: detailData.paymentStatus ?? order.paymentStatus ?? null,
        isPaymentCompleted: detailData.isPaymentCompleted ?? order.isPaymentCompleted ?? false
      });
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('주문 상세 조회 실패:', error);
      // 실패해도 기본 정보로 모달 표시
      setSelectedOrder({ ...order, orderId: order.orderId ?? order.id });
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
                        <ActionButton 
                          onClick={() => handleApprove(order.id, order)}
                          disabled={order.isPaymentCompleted === false}
                          title={order.isPaymentCompleted === false ? '결제가 완료되지 않은 주문입니다' : ''}
                        >
                          승인
                        </ActionButton>
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
