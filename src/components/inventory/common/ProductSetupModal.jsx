import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { inventoryService } from '../../../service/inventoryService';
import { authService } from '../../../service/authService';

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
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
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
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
`;

const ProductInfo = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
`;

const ProductName = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
`;

const ProductDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  background: white;
  flex-shrink: 0;
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: #f9fafb;
  }
`;

const AddButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #6b46c1;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  
  &:hover {
    background: #553c9a;
  }
`;

function ProductSetupModal({ isOpen, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    serialNumber: '',
    stockQuantity: 0,
    safetyStock: 0,
    price: 0
  });
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (product && isOpen) {
      setFormData({
        serialNumber: `BR-${product.productId}-${Date.now()}`,
        stockQuantity: 0, // 상품 등록 시 재고는 항상 0
        safetyStock: 0,
        price: product.price || 0
      });
    }
  }, [product, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (loading) return;
    
    if (!formData.serialNumber || formData.safetyStock < 0 || formData.price < 0) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 2;
      
      const requestData = {
        productId: product.productId,
        branchId: branchId,
        serialNumber: formData.serialNumber,
        stockQuantity: 0, // 상품 등록 시 재고는 항상 0
        safetyStock: parseInt(formData.safetyStock),
        price: parseInt(formData.price)
      };

      console.log('지점 상품 등록 요청 데이터:', requestData);
      const response = await inventoryService.createBranchProduct(requestData);
      console.log('지점 상품 등록 응답:', response);

      alert('상품이 성공적으로 등록되었습니다.');
      onSave({
        productId: product.productId,
        serialNumber: formData.serialNumber,
        stockQuantity: 0,
        safetyStock: parseInt(formData.safetyStock),
        price: parseInt(formData.price)
      });
      handleClose();
    } catch (error) {
      console.error('지점 상품 등록 실패:', error);
      alert('상품 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      serialNumber: '',
      stockQuantity: 0,
      safetyStock: 0,
      price: 0
    });
    onClose();
  };

  if (!isOpen || !product) return null;

  return React.createElement(ModalOverlay, { onClick: handleClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '상품 설정'),
        React.createElement(CloseButton, { onClick: handleClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(ProductInfo, null,
          React.createElement(ProductName, null, product.productName || '알 수 없음'),
          React.createElement(ProductDetails, null, `ID: ${product.productId}`),
          React.createElement(ProductDetails, null, `카테고리: ${product.categoryName || '미분류'}`),
          React.createElement(ProductDetails, null, `설명: ${product.productDescription || '-'}`)
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '시리얼 번호'),
          React.createElement(Input, {
            type: 'text',
            value: formData.serialNumber,
            onChange: (e) => handleInputChange('serialNumber', e.target.value)
          })
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '초기 재고 수량'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: 0,
            disabled: true,
            style: { backgroundColor: '#f9fafb', color: '#6b7280' }
          }),
          React.createElement('div', { 
            style: { 
              fontSize: '12px', 
              color: '#6b7280', 
              marginTop: '4px' 
            } 
          }, '상품 등록 시 재고는 0으로 시작됩니다. 발주를 통해 재고를 늘릴 수 있습니다.')
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '안전 재고'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: formData.safetyStock,
            onChange: (e) => handleInputChange('safetyStock', e.target.value)
          })
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '판매 가격 (원)'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: formData.price,
            onChange: (e) => handleInputChange('price', e.target.value)
          })
        )
      ),
      React.createElement(ButtonGroup, null,
        React.createElement(CancelButton, { onClick: handleClose, disabled: loading }, '취소'),
        React.createElement(AddButton, { onClick: handleSave, disabled: loading }, loading ? '등록 중...' : '추가')
      )
    )
  );
}

export default ProductSetupModal;
