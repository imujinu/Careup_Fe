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
  width: 36px;
  height: 36px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #dc2626;
  }
`;

const ModalBody = styled.div`
  padding: 0 24px 24px 24px;
`;

const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    right: 0;
    height: 1px;
    background: #6b46c1;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  
  .required {
    color: #ef4444;
  }
`;

const Input = styled.input`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const Select = styled.select`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const InfoCard = styled.div`
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
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

const SaveButton = styled(Button)`
  background: #6b46c1;
  color: #ffffff;
  
  &:hover {
    background: #553c9a;
  }
`;

function EditInventoryModal({ isOpen, onClose, item, onSave }) {
  const [formData, setFormData] = useState({
    currentStock: item?.currentStock || 0,
    safetyStock: item?.safetyStock || 0,
    unitPrice: item?.unitPrice || 0,
    category: item?.category || '',
    notes: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, `재고 수정 - ${item.name}`),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '상품 정보'),
          React.createElement(InfoCard, null,
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '상품명:'),
              React.createElement(InfoValue, null, item.name)
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, 'SKU:'),
              React.createElement(InfoValue, null, item.id)
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '단위:'),
              React.createElement(InfoValue, null, item.unit)
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '마지막 입고:'),
              React.createElement(InfoValue, null, item.lastReceived)
            )
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '재고 정보 수정'),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '현재고 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.currentStock,
                onChange: (e) => handleInputChange('currentStock', parseInt(e.target.value) || 0),
                min: 0
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '안전재고 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.safetyStock,
                onChange: (e) => handleInputChange('safetyStock', parseInt(e.target.value) || 0),
                min: 0
              })
            )
          ),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '단가 (원) ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.unitPrice,
                onChange: (e) => handleInputChange('unitPrice', parseInt(e.target.value) || 0),
                min: 0
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '카테고리'),
              React.createElement(Select, {
                value: formData.category,
                onChange: (e) => handleInputChange('category', e.target.value)
              },
                React.createElement('option', { value: '' }, '카테고리 선택'),
                React.createElement('option', { value: '원재료' }, '원재료'),
                React.createElement('option', { value: '음료' }, '음료'),
                React.createElement('option', { value: '디저트' }, '디저트')
              )
            )
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '비고'),
            React.createElement(Input, {
              type: 'text',
              placeholder: '재고 수정 사유나 메모를 입력하세요',
              value: formData.notes,
              onChange: (e) => handleInputChange('notes', e.target.value)
            })
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '수정 후 예상 정보'),
          React.createElement(InfoCard, null,
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '총 가치:'),
              React.createElement(InfoValue, null, `₩${formatAmount(formData.currentStock * formData.unitPrice)}`)
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '재고 상태:'),
              React.createElement(InfoValue, null, 
                formData.currentStock < formData.safetyStock ? '부족' : '정상'
              )
            )
          )
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement(SaveButton, { onClick: handleSave }, '저장')
        )
      )
    )
  );
}

export default EditInventoryModal;
