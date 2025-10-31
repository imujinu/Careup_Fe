import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { inventoryService } from '../../../service/inventoryService';

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
  
  &:disabled {
    background-color: #f3f4f6;
    color: #6b7280;
    cursor: not-allowed;
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
    currentStock: 0,
    safetyStock: 0,
    unitPrice: 0,
    category: '',
    notes: '',
    sellingPrice: 0
  });
  const [productInfo, setProductInfo] = useState({
    minPrice: 0,
    maxPrice: 0,
    supplyPrice: 0
  });

  // item이 변경될 때 formData 초기화 및 상품 정보 조회
  useEffect(() => {
    if (item && isOpen) {
      console.log('EditInventoryModal에서 받은 item:', item); // 디버깅용
      setFormData({
        currentStock: item.currentStock || item.stockQuantity || 0,
        safetyStock: item.safetyStock || 0,
        unitPrice: item.unitPrice || item.price || 0,
        category: item.category || item.categoryName || '',
        notes: '',
        sellingPrice: item.salesPrice || item.price || 0
      });

      // 상품 상세 정보 가져오기 (최저가격, 최고가격, 공급가)
      const fetchProductDetails = async () => {
        try {
          const productId = item.product?.id || item.productId;
          if (productId) {
            const response = await inventoryService.getProduct(productId);
            const productData = response.data?.data || response.data;
            
            setProductInfo({
              minPrice: productData?.minPrice || 0,
              maxPrice: productData?.maxPrice || 0,
              supplyPrice: productData?.supplyPrice || 0
            });
          }
        } catch (err) {
          console.error('상품 상세 정보 조회 실패:', err);
        }
      };

      fetchProductDetails();
    }
  }, [item, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // 판매가 검증 (최저가격 ~ 최고가격 사이)
    if (productInfo.minPrice > 0 && productInfo.maxPrice > 0) {
      const sellingPrice = parseInt(formData.sellingPrice) || 0;
      if (sellingPrice < productInfo.minPrice || sellingPrice > productInfo.maxPrice) {
        alert(`판매가는 ${productInfo.minPrice.toLocaleString()}원 ~ ${productInfo.maxPrice.toLocaleString()}원 사이로 입력해주세요.`);
        return;
      }
    }

    // 현재고는 제외하고 안전재고와 판매가만 전송 (공급가는 수정 불가)
    const saveData = {
      safetyStock: formData.safetyStock === '' ? 0 : formData.safetyStock,
      sellingPrice: formData.sellingPrice === '' ? 0 : formData.sellingPrice,
      notes: formData.notes
    };
    onSave(saveData);
    onClose();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, null,
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '재고 수정'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '상품 정보'),
          React.createElement(InfoCard, null,
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '상품명:'),
              React.createElement(InfoValue, null, item.product?.name || item.productName || item.name || '-')
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '카테고리:'),
              React.createElement(InfoValue, null, item.category || item.categoryName || '미분류')
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '현재 재고:'),
              React.createElement(InfoValue, null, `${item.currentStock || 0}개`)
            ),
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '안전 재고:'),
              React.createElement(InfoValue, null, `${item.safetyStock || 0}개`)
            )
          )
        ),
        React.createElement(Section, null,
          React.createElement(SectionTitle, null, '재고 정보 수정'),
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '현 재고'),
              React.createElement(Input, {
                type: 'number',
                value: formData.currentStock,
                disabled: true,
                style: { 
                  backgroundColor: '#f3f4f6', 
                  color: '#6b7280',
                  cursor: 'not-allowed'
                }
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null,
                '안전재고 ',
                React.createElement('span', { className: 'required' }, '*')
              ),
              React.createElement(Input, {
                type: 'number',
                value: formData.safetyStock === 0 ? (formData.safetyStock === '' ? '' : formData.safetyStock) : formData.safetyStock,
                onChange: (e) => {
                  const v = e.target.value;
                  if (v === '') return handleInputChange('safetyStock', '');
                  const n = parseInt(v, 10);
                  handleInputChange('safetyStock', isNaN(n) ? 0 : n);
                },
                min: 0
              })
            )
          ),
          React.createElement(Section, null,
            React.createElement(SectionTitle, null, '가격 정보'),
            React.createElement(FormRow, null,
              React.createElement(FormGroup, null,
                React.createElement(Label, null, '공급가 (원)'),
                React.createElement(Input, {
                  type: 'number',
                  value: productInfo.supplyPrice || 0,
                  disabled: true
                })
              ),
              React.createElement(FormGroup, null,
                React.createElement(Label, null,
                  '판매가 (원) ',
                  React.createElement('span', { className: 'required' }, '*')
                ),
                React.createElement(Input, {
                  type: 'number',
                  value: formData.sellingPrice === 0 ? (formData.sellingPrice === '' ? '' : formData.sellingPrice) : formData.sellingPrice,
                  onChange: (e) => {
                    const v = e.target.value;
                    if (v === '') return handleInputChange('sellingPrice', '');
                    const n = parseInt(v, 10);
                    handleInputChange('sellingPrice', isNaN(n) ? 0 : n);
                  },
                  min: productInfo.minPrice || 0,
                  max: productInfo.maxPrice || undefined
                })
              )
            ),
            React.createElement(FormRow, null,
              React.createElement(FormGroup, null,
                React.createElement(Label, null, '최저가격 (원)'),
                React.createElement(Input, {
                  type: 'number',
                  value: productInfo.minPrice || 0,
                  disabled: true
                })
              ),
              React.createElement(FormGroup, null,
                React.createElement(Label, null, '최고가격 (원)'),
                React.createElement(Input, {
                  type: 'number',
                  value: productInfo.maxPrice || 0,
                  disabled: true
                })
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
          React.createElement('div', { style: { 
            fontSize: '12px', 
            color: '#6b7280', 
            marginBottom: '12px',
            padding: '8px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}, 
            '💡 현재고는 발주나 입출고를 통해서만 변경됩니다. 여기서는 안전재고와 판매가만 수정할 수 있습니다. 공급가는 본사에서 정하므로 수정할 수 없습니다.'
          ),
          React.createElement(InfoCard, null,
            React.createElement(InfoRow, null,
              React.createElement(InfoLabel, null, '총 가치:'),
              React.createElement(InfoValue, null, `₩${formatAmount((formData.currentStock || 0) * (productInfo.supplyPrice || 0))}`)
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
