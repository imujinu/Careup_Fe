import React from 'react';
import styled from 'styled-components';
import BaseModal from './BaseModal';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "확인", 
  message = "이 작업을 진행하시겠습니까?",
  confirmText = "확인",
  cancelText = "취소",
  isLoading = false,
  confirmColor = "#10b981"
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="400px"
      allowBackdropClose={false}
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        <ModalMessage>{message}</ModalMessage>
      </ModalHeader>
      
      <ModalActions>
        <CancelButton 
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </CancelButton>
        <ConfirmButton 
          onClick={handleConfirm}
          disabled={isLoading}
          $confirmColor={confirmColor}
        >
          {isLoading && <LoadingSpinner />}
          {confirmText}
        </ConfirmButton>
      </ModalActions>
    </BaseModal>
  );
};

export default ConfirmModal;


const ModalHeader = styled.div`
  margin-bottom: 16px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
`;

const ModalMessage = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #374151;
  
  &:hover {
    background: #e5e7eb;
  }
  
  &:active {
    background: #d1d5db;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled(Button)`
  background: ${props => props.$confirmColor};
  color: white;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:active {
    opacity: 0.8;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

