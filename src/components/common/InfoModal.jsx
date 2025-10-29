import React from 'react';
import styled from 'styled-components';
import BaseModal from './BaseModal';

const InfoModal = ({ isOpen, onClose, title, message, buttonText = "확인", buttonColor = "#A87C7C" }) => {
  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose}
      maxWidth="400px"
      allowBackdropClose={false}
    >
      <ModalTitle>{title}</ModalTitle>
      <ModalMessage>{message}</ModalMessage>
      <ModalButton 
        onClick={onClose}
        buttonColor={buttonColor}
      >
        {buttonText}
      </ModalButton>
    </BaseModal>
  );
};

export default InfoModal;


const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: bold;
  color: #000;
`;

const ModalMessage = styled.p`
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #000;
  line-height: 1.5;
`;

const ModalButton = styled.button`
  background: ${props => props.buttonColor};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-width: 80px;
  
  &:hover {
    opacity: 0.9;
  }
`;
