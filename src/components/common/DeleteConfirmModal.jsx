import React from 'react';
import styled from 'styled-components';
import BaseModal from './BaseModal';

function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "지점 삭제", 
  message = "해당 지점을 영구히 삭제하시겠습니까?",
  confirmText = "삭제",
  cancelText = "취소",
  isLoading = false,
  itemName = ""
}) {
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
        <ModalMessage>
          {itemName && `${itemName} `}{message}
          <br />
          <strong>이 작업은 되돌릴 수 없습니다.</strong>
        </ModalMessage>
      </ModalHeader>
      
      <ModalActions>
        <CancelButton 
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </CancelButton>
        <DeleteButton 
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner />}
          {confirmText}
        </DeleteButton>
      </ModalActions>
    </BaseModal>
  );
}

export default DeleteConfirmModal;

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
`;

const DeleteButton = styled(Button)`
  background: #dc2626;
  color: white;
  
  &:hover {
    background: #b91c1c;
  }
  
  &:active {
    background: #991b1b;
  }
  
  &:disabled {
    background: #9ca3af;
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
