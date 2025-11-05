import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  
  &:hover {
    color: #374151;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.cancel {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  &.save {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
    
    &:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }
  }
`;

const ReadOnlyInfo = styled.div`
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const ReadOnlyLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const ReadOnlyValue = styled.div`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

function EditInventoryFlowModal({ isOpen, onClose, item, onSave }) {
  const [formData, setFormData] = useState({
    inQuantity: '',
    outQuantity: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        inQuantity: item.inQuantity || '',
        outQuantity: item.outQuantity || '',
        remark: item.remark || ''
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.inQuantity && !formData.outQuantity) {
      alert('입고수량 또는 출고수량 중 하나는 입력해야 합니다.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        ...formData,
        inQuantity: formData.inQuantity ? parseInt(formData.inQuantity) : null,
        outQuantity: formData.outQuantity ? parseInt(formData.outQuantity) : null
      });
      onClose();
    } catch (error) {
      console.error('입출고 기록 수정 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContent, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '입출고 기록 수정'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement(ReadOnlyInfo, null,
          React.createElement(ReadOnlyLabel, null, '상품명'),
          React.createElement(ReadOnlyValue, null, item.productName || '-'),
          item.attributeValueName && React.createElement(React.Fragment, null,
            React.createElement(ReadOnlyLabel, { style: { marginTop: '8px' } }, '속성'),
            React.createElement(ReadOnlyValue, null, `${item.attributeTypeName || ''} ${item.attributeValueName}`)
          ),
          React.createElement(ReadOnlyLabel, { style: { marginTop: '8px' } }, '지점'),
          React.createElement(ReadOnlyValue, null, item.branchId === 1 ? '본점' : `지점-${item.branchId}`)
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '입고수량'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: formData.inQuantity,
            onChange: (e) => handleChange('inQuantity', e.target.value),
            placeholder: '입고수량을 입력하세요'
          })
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '출고수량'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: formData.outQuantity,
            onChange: (e) => handleChange('outQuantity', e.target.value),
            placeholder: '출고수량을 입력하세요'
          })
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '비고'),
          React.createElement(TextArea, {
            value: formData.remark,
            onChange: (e) => handleChange('remark', e.target.value),
            placeholder: '비고를 입력하세요'
          })
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(Button, {
            type: 'button',
            className: 'cancel',
            onClick: onClose
          }, '취소'),
          React.createElement(Button, {
            type: 'submit',
            className: 'save',
            disabled: loading
          }, loading ? '저장 중...' : '저장')
        )
      )
    )
  );
}

export default EditInventoryFlowModal;
