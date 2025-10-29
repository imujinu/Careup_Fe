import React from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiClose } from '@mdi/js';

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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: color 0.2s;

  &:hover {
    color: #1f2937;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
`;

const InfoItem = styled.div``;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const InfoValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) => {
    if (props.$primary) {
      return `
        background: #6b46c1;
        color: white;
        &:hover {
          background: #5b21b6;
        }
      `;
    }
    if (props.$danger) {
      return `
        background: #ef4444;
        color: white;
        &:hover {
          background: #dc2626;
        }
      `;
    }
    return `
      background: #f3f4f6;
      color: #374151;
      &:hover {
        background: #e5e7eb;
      }
    `;
  }}

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

function OrderDetailModal({ order, onClose, onApprove, onReject, canApproveAndReject = true }) {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const handleApprove = () => {
    const orderId = order.orderId || order.id;
    onApprove(orderId);
  };

  const handleReject = () => {
    const reason = window.prompt('거부 사유를 입력해주세요:');
    if (!reason) return;

    const orderId = order.orderId || order.id;
    onReject(orderId, reason);
  };

  if (!order) return null;

  const orderItems = order.orderItems || [];

  return React.createElement(
    ModalOverlay,
    { onClick: onClose },
    React.createElement(
      ModalContent,
      { onClick: (e) => e.stopPropagation() },
      React.createElement(
        ModalHeader,
        {},
        React.createElement(ModalTitle, {}, '주문 상세'),
        React.createElement(
          CloseButton,
          { onClick: onClose },
          React.createElement(Icon, { path: mdiClose, size: 1.5 })
        )
      ),
      React.createElement(
        ModalBody,
        {},
        React.createElement(
          Section,
          {},
          React.createElement(SectionTitle, {}, '주문 정보'),
          React.createElement(
            InfoGrid,
            {},
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '주문번호'),
              React.createElement(InfoValue, {}, `#${order.orderId || order.id}`)
            ),
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '상태'),
              React.createElement(StatusBadge, { $status: order.orderStatus || order.status },
                getStatusText(order.orderStatus || order.status)
              )
            ),
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '고객명'),
              React.createElement(InfoValue, {}, order.memberName || '-')
            ),
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '지점 ID'),
              React.createElement(InfoValue, {}, order.branchId || '-')
            ),
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '주문 유형'),
              React.createElement(InfoValue, {}, order.orderType || '-')
            ),
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '주문일시'),
              React.createElement(InfoValue, {}, formatDate(order.createdAt))
            ),
            React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '총 금액'),
              React.createElement(InfoValue, {}, `₩${(order.totalAmount || 0).toLocaleString()}`)
            ),
            order.approvedBy && React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '승인자 ID'),
              React.createElement(InfoValue, {}, order.approvedBy)
            ),
            order.rejectedReason && React.createElement(
              InfoItem,
              {},
              React.createElement(InfoLabel, {}, '거부 사유'),
              React.createElement(InfoValue, {}, order.rejectedReason)
            )
          )
        ),
        React.createElement(
          Section,
          {},
          React.createElement(SectionTitle, {}, '주문 상품'),
          orderItems.length > 0 ? React.createElement(
            Table,
            {},
            React.createElement(
              'thead',
              {},
              React.createElement(
                'tr',
                {},
                React.createElement(TableHeader, {}, '상품명'),
                React.createElement(TableHeader, {}, '수량'),
                React.createElement(TableHeader, {}, '단가'),
                React.createElement(TableHeader, {}, '총액')
              )
            ),
            React.createElement(
              'tbody',
              {},
              orderItems.map((item, index) =>
                React.createElement(
                  'tr',
                  { key: index },
                  React.createElement(TableCell, {}, item.productName || '-'),
                  React.createElement(TableCell, {}, `${item.quantity}개`),
                  React.createElement(TableCell, {}, `₩${(item.unitPrice || 0).toLocaleString()}`),
                  React.createElement(TableCell, {}, `₩${(item.totalPrice || 0).toLocaleString()}`)
                )
              )
            )
          ) : React.createElement('div', {}, '주문 상품이 없습니다.')
        )
      ),
      React.createElement(
        ModalFooter,
        {},
        React.createElement(Button, { onClick: onClose }, '닫기'),
        (order.orderStatus || order.status) === 'PENDING' && canApproveAndReject && React.createElement(
          React.Fragment,
          {},
          React.createElement(Button, { $primary: true, onClick: handleApprove }, '승인'),
          React.createElement(Button, { $danger: true, onClick: handleReject }, '거부')
        )
      )
    )
  );
}

export default OrderDetailModal;
