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
  z-index: 10001;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 24px;
`;

const InfoText = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px 0;
`;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProductItem = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
`;

const ProductName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
`;

const QuantityInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const QuantityLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  min-width: 80px;
`;

const QuantityInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 100px;
  
  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const RequestedQuantity = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const ErrorText = styled.div`
  font-size: 12px;
  color: #ef4444;
  margin-top: 4px;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const CancelButton = styled.button`
  height: 40px;
  padding: 0 24px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const ApproveButton = styled.button`
  height: 40px;
  padding: 0 24px;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #d97706;
  }
  
  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

function PartialApproveModal({ isOpen, onClose, products, onApprove }) {
  const [approvedQuantities, setApprovedQuantities] = useState({});
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // 상품별 수량 변경 핸들러
  const handleQuantityChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    setApprovedQuantities({
      ...approvedQuantities,
      [productId]: numValue
    });
    
    // 에러 초기화
    if (errors[productId]) {
      setErrors({
        ...errors,
        [productId]: null
      });
    }
  };

  // 유효성 검사
  const validateQuantities = () => {
    const newErrors = {};
    let hasError = false;

    products.forEach(product => {
      const approvedQty = approvedQuantities[product.id] || 0;
      
      if (approvedQty <= 0) {
        newErrors[product.id] = '승인 수량을 입력해주세요';
        hasError = true;
      } else if (approvedQty > product.quantity) {
        newErrors[product.id] = `요청 수량(${product.quantity}개)을 초과할 수 없습니다`;
        hasError = true;
      }
    });

    setErrors(newErrors);
    return !hasError;
  };

  // 부분승인 처리
  const handleApprove = () => {
    if (!validateQuantities()) {
      return;
    }

    // 백엔드 API 형식에 맞게 변환
    const approvedDetails = products
      .filter(product => approvedQuantities[product.id] > 0)
      .map(product => ({
        productId: product.id,
        approvedQuantity: approvedQuantities[product.id]
      }));

    onApprove({ approvedDetails });
  };

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '부분 승인'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(InfoText, null, '각 상품별로 승인할 수량을 입력해주세요.'),
        React.createElement(ProductList, null,
          products.map(product =>
            React.createElement(ProductItem, { key: product.id },
              React.createElement(ProductName, null,
                React.createElement('div', null, product.name),
                product.attributes && product.attributes.length > 0 && React.createElement('div', { 
                  style: { fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: '400' } 
                }, product.attributes.map(attr => `${attr.attributeTypeName}: ${attr.attributeValueName}`).join('  ·  '))
              ),
              React.createElement(QuantityInputGroup, null,
                React.createElement(QuantityLabel, null, '승인 수량:'),
                React.createElement(QuantityInput, {
                  type: 'number',
                  min: '0',
                  max: product.quantity,
                  value: approvedQuantities[product.id] || '',
                  onChange: (e) => handleQuantityChange(product.id, e.target.value)
                }),
                React.createElement(RequestedQuantity, null, `/ ${product.quantity}개`)
              ),
              errors[product.id] && React.createElement(ErrorText, null, errors[product.id])
            )
          )
        )
      ),
      React.createElement(ModalFooter, null,
        React.createElement(CancelButton, { onClick: onClose }, '취소'),
        React.createElement(ApproveButton, { 
          onClick: handleApprove,
          disabled: products.length === 0
        }, '승인')
      )
    )
  );
}

export default PartialApproveModal;
