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
  width: 800px;
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

const ProductTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const ProductTableHeader = styled.thead`
  background: #f9fafb;
`;

const ProductTableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const ProductTableBody = styled.tbody``;

const ProductTableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const ProductTableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
`;

const QuantityInput = styled.input`
  width: 80px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  outline: none;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const RemoveButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: #dc2626;
  }
`;

const AddProductButton = styled.button`
  background: #6b46c1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 16px;
  
  &:hover {
    background: #553c9a;
  }
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
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

function EditPurchaseOrderModal({ isOpen, onClose, item, onSave }) {
  const [formData, setFormData] = useState({
    branch: item?.branch || '',
    orderDate: item?.orderDate || '',
    deliveryDate: item?.deliveryDate || '',
    status: item?.status || 'pending',
    products: item?.products || [
      {
        id: 1,
        name: '아메리카노',
        serialNumber: '20250918001',
        category: '음료',
        quantity: 50,
        unitPrice: 4500,
        amount: 225000
      },
      {
        id: 2,
        name: '크로와상',
        serialNumber: '20250918002',
        category: '베이커리',
        quantity: 30,
        unitPrice: 5500,
        amount: 165000
      }
    ]
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProductChange = (productId, field, value) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(product => {
        if (product.id === productId) {
          const updatedProduct = { ...product, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updatedProduct.amount = updatedProduct.quantity * updatedProduct.unitPrice;
          }
          return updatedProduct;
        }
        return product;
      })
    }));
  };

  const handleRemoveProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(product => product.id !== productId)
    }));
  };

  const handleAddProduct = () => {
    const newProduct = {
      id: Date.now(),
      name: '',
      serialNumber: '',
      category: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    };
    setFormData(prev => ({
      ...prev,
      products: [...prev.products, newProduct]
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const totalAmount = formData.products.reduce((sum, product) => sum + product.amount, 0);

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, `발주 수정 - ${item.id}`),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '기본 정보'),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '지점 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Select, {
                value: formData.branch,
                onChange: (e) => handleInputChange('branch', e.target.value)
              },
                React.createElement('option', { value: '' }, '지점 선택'),
                React.createElement('option', { value: '강남점' }, '강남점'),
                React.createElement('option', { value: '신촌점' }, '신촌점'),
                React.createElement('option', { value: '홍대점' }, '홍대점')
              )
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '발주일 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'date',
                value: formData.orderDate,
                onChange: (e) => handleInputChange('orderDate', e.target.value)
              })
            )
          ),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '배송예정일 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'date',
                value: formData.deliveryDate,
                onChange: (e) => handleInputChange('deliveryDate', e.target.value)
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '상태 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Select, {
                value: formData.status,
                onChange: (e) => handleInputChange('status', e.target.value)
              },
                React.createElement('option', { value: 'pending' }, '대기중'),
                React.createElement('option', { value: 'completed' }, '완료'),
                React.createElement('option', { value: 'cancelled' }, '취소됨')
              )
            )
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '상품 목록'),
          React.createElement(ProductTable, null,
            React.createElement(ProductTableHeader, null,
              React.createElement('tr', null,
                React.createElement(ProductTableHeaderCell, null, '상품명'),
                React.createElement(ProductTableHeaderCell, null, '일련번호'),
                React.createElement(ProductTableHeaderCell, null, '카테고리'),
                React.createElement(ProductTableHeaderCell, null, '수량'),
                React.createElement(ProductTableHeaderCell, null, '단가'),
                React.createElement(ProductTableHeaderCell, null, '금액'),
                React.createElement(ProductTableHeaderCell, null, '작업')
              )
            ),
            React.createElement(ProductTableBody, null,
              formData.products.map((product) =>
                React.createElement(ProductTableRow, { key: product.id },
                  React.createElement(ProductTableCell, null,
                    React.createElement(Input, {
                      type: 'text',
                      value: product.name,
                      onChange: (e) => handleProductChange(product.id, 'name', e.target.value),
                      placeholder: '상품명'
                    })
                  ),
                  React.createElement(ProductTableCell, null,
                    React.createElement(Input, {
                      type: 'text',
                      value: product.serialNumber,
                      onChange: (e) => handleProductChange(product.id, 'serialNumber', e.target.value),
                      placeholder: '일련번호'
                    })
                  ),
                  React.createElement(ProductTableCell, null,
                    React.createElement(Select, {
                      value: product.category,
                      onChange: (e) => handleProductChange(product.id, 'category', e.target.value)
                    },
                      React.createElement('option', { value: '' }, '카테고리'),
                      React.createElement('option', { value: '음료' }, '음료'),
                      React.createElement('option', { value: '베이커리' }, '베이커리'),
                      React.createElement('option', { value: '디저트' }, '디저트')
                    )
                  ),
                  React.createElement(ProductTableCell, null,
                    React.createElement(QuantityInput, {
                      type: 'number',
                      value: product.quantity,
                      onChange: (e) => handleProductChange(product.id, 'quantity', parseInt(e.target.value) || 0),
                      min: 1
                    })
                  ),
                  React.createElement(ProductTableCell, null,
                    React.createElement(Input, {
                      type: 'number',
                      value: product.unitPrice,
                      onChange: (e) => handleProductChange(product.id, 'unitPrice', parseInt(e.target.value) || 0),
                      placeholder: '단가'
                    })
                  ),
                  React.createElement(ProductTableCell, null, `₩${formatAmount(product.amount)}`),
                  React.createElement(ProductTableCell, null,
                    React.createElement(RemoveButton, {
                      onClick: () => handleRemoveProduct(product.id)
                    }, '삭제')
                  )
                )
              )
            )
          ),
          React.createElement(AddProductButton, { onClick: handleAddProduct }, '+ 상품 추가'),
          React.createElement(TotalRow, null, `총 금액: ₩${formatAmount(totalAmount)}`)
        ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement(SaveButton, { onClick: handleSave }, '저장')
        )
      )
    )
  );
}

export default EditPurchaseOrderModal;
