import React, { useEffect, useState, createContext, useContext } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Toast = styled.div`
  background: ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#10b981';
    }
  }};
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 300px;
  max-width: 400px;
  animation: ${props => props.isVisible ? slideIn : slideOut} 0.3s ease-in-out;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToastIcon = styled.div`
  font-size: 20px;
  flex-shrink: 0;
`;

const ToastContent = styled.div`
  flex: 1;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
`;

const ToastMessage = styled.div`
  font-size: 13px;
  opacity: 0.9;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

function ToastNotification({ 
  id, 
  type = 'success', 
  title, 
  message, 
  duration = 3000, 
  onClose 
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose(id);
      }, 300); // 애니메이션 완료 후 제거
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '✓';
    }
  };

  return (
    <Toast type={type} isVisible={isVisible}>
      <ToastIcon>{getIcon()}</ToastIcon>
      <ToastContent>
        <ToastTitle>{title}</ToastTitle>
        <ToastMessage>{message}</ToastMessage>
      </ToastContent>
      <CloseButton onClick={handleClose}>×</CloseButton>
    </Toast>
  );
}

// Toast Context 생성
const ToastContext = createContext();

// Toast Context Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const value = {
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export { ToastProvider };
export default ToastNotification;
