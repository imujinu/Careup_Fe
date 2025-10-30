import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// 애니메이션 정의
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(0.96);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

const scaleOut = keyframes`
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.96);
    opacity: 0;
  }
`;

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
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.2s ease-out;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: ${props => props.$maxWidth || '500px'};
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  animation: ${props => props.$isClosing ? scaleOut : scaleIn} 0.2s ease-out;
`;

const BaseModal = ({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = '500px',
  allowBackdropClose = false,
  className = ''
}) => {
  const [isClosing, setIsClosing] = React.useState(false);

  // 모달이 열릴 때 뒷단 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // 모달이 닫힐 때 스크롤 위치 복원
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // 애니메이션 시간과 동일
  };

  const handleOverlayClick = (e) => {
    if (allowBackdropClose && e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay 
      onClick={handleOverlayClick}
      $isClosing={isClosing}
    >
      <ModalContent 
        onClick={(e) => e.stopPropagation()}
        $maxWidth={maxWidth}
        $isClosing={isClosing}
        className={className}
      >
        {children}
      </ModalContent>
    </ModalOverlay>
  );
};

export default BaseModal;
