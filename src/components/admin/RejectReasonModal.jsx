import React, { useState } from 'react';
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
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
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

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CharacterCount = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-align: right;
  margin-top: 4px;
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
  font-size: 14px;

  ${(props) => {
    if (props.$primary) {
      return `
        background: #ef4444;
        color: white;
        &:hover {
          background: #dc2626;
        }
        &:disabled {
          background: #d1d5db;
          cursor: not-allowed;
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
`;

function RejectReasonModal({ isOpen, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement(
    ModalOverlay,
    { onClick: handleClose },
    React.createElement(
      ModalContent,
      { onClick: (e) => e.stopPropagation() },
      React.createElement(
        ModalHeader,
        {},
        React.createElement(ModalTitle, {}, '거부 사유 입력'),
        React.createElement(
          CloseButton,
          { onClick: handleClose },
          React.createElement(Icon, { path: mdiClose, size: 1.5 })
        )
      ),
      React.createElement(
        ModalBody,
        {},
        React.createElement(Label, {}, '거부 사유'),
        React.createElement(TextArea, {
          placeholder: '주문 거부 사유를 입력해주세요.',
          value: reason,
          onChange: (e) => setReason(e.target.value),
          maxLength: 500
        }),
        React.createElement(CharacterCount, {}, `${reason.length}/500`)
      ),
      React.createElement(
        ModalFooter,
        {},
        React.createElement(Button, { onClick: handleClose }, '취소'),
        React.createElement(Button, { $primary: true, onClick: handleConfirm }, '거부하기')
      )
    )
  );
}

export default RejectReasonModal;
