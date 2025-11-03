import React, { useState } from 'react';
import styled from 'styled-components';

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
  z-index: 10002;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const WarningSection = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const WarningIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #ef4444;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
`;

const WarningContent = styled.div`
  flex: 1;
`;

const WarningTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #991b1b;
  margin: 0 0 4px 0;
`;

const WarningText = styled.p`
  font-size: 14px;
  color: #7f1d1d;
  margin: 0;
`;

const OrderInfoSection = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const OrderInfoTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
`;

const OrderInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const OrderInfoLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const OrderInfoValue = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

const ReasonSection = styled.div`
  margin-bottom: 24px;
`;

const ReasonTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
`;

const ReasonTextArea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const ConfirmCancelButton = styled(Button)`
  background: #ef4444;
  color: #ffffff;
  
  &:hover {
    background: #dc2626;
  }
`;

function CancelOrderModal({ isOpen, onClose, item, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleReasonChange = (e) => {
    setReason(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '발주 취소'),
        React.createElement(CloseButton, { onClick: handleClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(WarningSection, null,
          React.createElement(WarningIcon, null, '⚠️'),
          React.createElement(WarningContent, null,
            React.createElement(WarningTitle, null, '발주 취소 확인'),
            React.createElement(WarningText, null, '발주를 취소하면 복구할 수 없습니다. 정말로 취소하시겠습니까?')
          )
        ),
        React.createElement(OrderInfoSection, null,
          React.createElement(OrderInfoTitle, null, '취소할 발주 정보'),
          React.createElement(OrderInfoRow, null,
            React.createElement(OrderInfoLabel, null, '발주번호:'),
            React.createElement(OrderInfoValue, null, item.id)
          ),
          React.createElement(OrderInfoRow, null,
            React.createElement(OrderInfoLabel, null, '발주일:'),
            React.createElement(OrderInfoValue, null, item.orderDate)
          ),
          React.createElement(OrderInfoRow, null,
            React.createElement(OrderInfoLabel, null, '총 금액:'),
            React.createElement(OrderInfoValue, null, `₩${formatAmount(item.totalAmount)}`)
          ),
          React.createElement(OrderInfoRow, null,
            React.createElement(OrderInfoLabel, null, '배송일자:'),
            React.createElement(OrderInfoValue, null, item.deliveryDate)
          )
        ),
        React.createElement(ReasonSection, null,
          React.createElement(ReasonTitle, null, '취소 사유'),
          React.createElement(ReasonTextArea, {
            placeholder: '발주 취소 사유를 입력해주세요 (선택사항)',
            value: reason,
            onChange: handleReasonChange
          })
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: handleClose }, '취소'),
          React.createElement(ConfirmCancelButton, { onClick: handleConfirm }, '발주 취소')
        )
      )
    )
  );
}

export default CancelOrderModal;
