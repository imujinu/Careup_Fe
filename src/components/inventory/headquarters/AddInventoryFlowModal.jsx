import React, { useState, useEffect, useMemo } from 'react';
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
  justify-content: center;
  align-items: center;
  z-index: 10001;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
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
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }
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

const HelpText = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;

const SelectedProductInfo = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  font-size: 14px;
  color: #0369a1;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: 12px;
  margin-top: 8px;
  font-size: 14px;
  color: #dc2626;
`;

function AddInventoryFlowModal({ isOpen, onClose, onSave, branchProducts = [] }) {
  const [formData, setFormData] = useState({
    branchProductId: '',
    inQuantity: '',
    outQuantity: '',
    remark: ''
  });
  const [loading, setLoading] = useState(false);
  
  // 속성 선택을 위한 상태
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({}); // { attributeTypeId: attributeValueId }
  const [selectedBranchProduct, setSelectedBranchProduct] = useState(null);

  // 상품 목록 (중복 제거)
  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    branchProducts.forEach(bp => {
      const productId = bp.productId || bp.product?.id;
      if (productId && !productMap.has(String(productId))) {
        // productName에서 속성 정보 제거 (예: "사이다 - 사이즈 S" -> "사이다")
        let productName = bp.productName || '알 수 없음';
        // " - " 패턴으로 속성 정보가 포함되어 있으면 제거
        if (productName.includes(' - ')) {
          productName = productName.split(' - ')[0];
        }
        
        productMap.set(String(productId), {
          productId: String(productId),
          productName: productName.trim()
        });
      }
    });
    return Array.from(productMap.values());
  }, [branchProducts]);

  // 선택한 상품의 속성별 BranchProduct 그룹화
  const attributeGroups = useMemo(() => {
    if (!selectedProductId || !categoryAttributes.length) {
      console.log('속성 그룹 없음 - selectedProductId:', selectedProductId, 'categoryAttributes:', categoryAttributes.length);
      return [];
    }

    const sortedAttributes = [...categoryAttributes].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    console.log('속성 그룹 생성:', sortedAttributes);

    return sortedAttributes.map(attr => ({
      attributeType: attr,
      availableValues: attr.availableValues || []
    }));
  }, [selectedProductId, categoryAttributes]);

  // 선택한 속성 조합에 해당하는 BranchProduct 찾기
  useEffect(() => {
    if (!selectedProductId || !branchProducts.length) {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
      return;
    }

    const productBranchProducts = branchProducts.filter(bp => {
      const bpProductId = bp.productId || bp.product?.id;
      return String(bpProductId) === String(selectedProductId);
    });

    // 속성이 없는 경우
    if (!categoryAttributes.length) {
      const bp = productBranchProducts[0];
      if (bp) {
        setSelectedBranchProduct(bp);
        setFormData(prev => ({ ...prev, branchProductId: bp.id }));
      } else {
        setSelectedBranchProduct(null);
        setFormData(prev => ({ ...prev, branchProductId: '' }));
      }
      return;
    }

    // 선택한 속성 값들과 일치하는 BranchProduct 찾기
    const selectedValues = Object.values(selectedAttributeValues);
    if (selectedValues.length === 0) {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
      return;
    }

    // 모든 속성 타입이 선택되었는지 확인
    const sortedAttributes = [...categoryAttributes].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );
    
    const allSelected = sortedAttributes.every(attr => {
      return selectedAttributeValues[String(attr.attributeTypeId)];
    });

    if (!allSelected) {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
      return;
    }

    // 선택한 속성 값들과 일치하는 BranchProduct 찾기
    // 여러 속성이 있을 때는 정확히 매칭되는 것을 찾아야 함
    const matchingBP = productBranchProducts.find(bp => {
      // 속성이 하나인 경우
      if (sortedAttributes.length === 1) {
        return String(bp.attributeValueId) === String(selectedValues[0]);
      }
      
      // 여러 속성이 있는 경우 - 실제로는 각 BranchProduct가 하나의 속성 값만 가지므로
      // 선택한 속성 값 중 하나와 일치하면 됨
      // 하지만 정확한 매칭을 위해서는 모든 속성 값을 확인해야 함
      // 현재 구조에서는 BranchProduct가 하나의 attributeValueId만 가지므로
      // 마지막으로 선택한 속성 값과 일치하는 것을 찾음
      return String(bp.attributeValueId) === String(selectedValues[selectedValues.length - 1]);
    });

    console.log('매칭된 BranchProduct:', matchingBP);
    console.log('선택한 속성 값들:', selectedValues);

    if (matchingBP) {
      setSelectedBranchProduct(matchingBP);
      setFormData(prev => ({ ...prev, branchProductId: matchingBP.id }));
    } else {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
    }
  }, [selectedProductId, selectedAttributeValues, branchProducts, categoryAttributes]);

  // 상품 선택 시 카테고리 속성 조회
  useEffect(() => {
    if (!isOpen) return;

    const resetForm = () => {
      setFormData({
        branchProductId: '',
        inQuantity: '',
        outQuantity: '',
        remark: ''
      });
      setSelectedProductId('');
      setSelectedProduct(null);
      setCategoryAttributes([]);
      setSelectedAttributeValues({});
      setSelectedBranchProduct(null);
    };

    resetForm();
  }, [isOpen]);

  const handleProductSelect = async (productId) => {
    if (!productId) {
      setSelectedProductId('');
      setSelectedProduct(null);
      setCategoryAttributes([]);
      setSelectedAttributeValues({});
      return;
    }

    console.log('상품 선택:', productId);
    setSelectedProductId(String(productId));
    setSelectedAttributeValues({});
    
    // 선택한 상품 정보 찾기
    const product = uniqueProducts.find(p => String(p.productId) === String(productId));
    setSelectedProduct(product);

    // 해당 상품의 BranchProduct에서 속성 정보 가져오기
    const productBPs = branchProducts.filter(bp => {
      const bpProductId = bp.productId || bp.product?.id;
      return String(bpProductId) === String(productId);
    });

    console.log('선택한 상품의 BranchProduct:', productBPs);

    if (productBPs.length === 0) {
      setCategoryAttributes([]);
      return;
    }

    // 상품 정보를 통해 카테고리 ID 가져오기
    try {
      const productDetail = await inventoryService.getProduct(productId);
      const productData = productDetail.data?.data || productDetail.data;
      
      console.log('상품 상세 정보:', productData);
      
      if (productData?.category?.id) {
        const attributes = await inventoryService.getCategoryAttributes(productData.category.id);
        console.log('카테고리 속성:', attributes);
        setCategoryAttributes(attributes || []);
      } else {
        console.log('카테고리 정보 없음');
        setCategoryAttributes([]);
      }
    } catch (error) {
      console.error('카테고리 속성 조회 실패:', error);
      setCategoryAttributes([]);
    }
  };

  const handleAttributeValueSelect = (attributeTypeId, attributeValueId) => {
    console.log('속성 값 선택:', attributeTypeId, attributeValueId);
    setSelectedAttributeValues(prev => {
      const newValues = { ...prev };
      const typeIdStr = String(attributeTypeId);
      if (attributeValueId) {
        newValues[typeIdStr] = String(attributeValueId);
      } else {
        delete newValues[typeIdStr];
        // 이후 속성 선택도 초기화
        const sortedAttributes = [...categoryAttributes].sort((a, b) => 
          (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        const currentIndex = sortedAttributes.findIndex(a => String(a.attributeTypeId) === typeIdStr);
        sortedAttributes.slice(currentIndex + 1).forEach(attr => {
          delete newValues[String(attr.attributeTypeId)];
        });
      }
      console.log('새로운 속성 값들:', newValues);
      return newValues;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.branchProductId) {
      alert('상품과 속성을 모두 선택해주세요.');
      return;
    }
    
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
      console.error('입출고 기록 등록 실패:', error);
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

  // 속성 타입별로 사용 가능한 속성 값 필터링
  const getAvailableValues = (attributeType) => {
    if (!selectedProductId) return [];

    const productBPs = branchProducts.filter(bp => {
      const bpProductId = bp.productId || bp.product?.id;
      return String(bpProductId) === String(selectedProductId);
    });

    // 해당 속성 타입의 값을 가진 BranchProduct들에서 속성 값 추출
    const availableValueIds = new Set(
      productBPs
        .filter(bp => {
          // 해당 속성 타입의 속성 값을 가진 BranchProduct만 필터링
          // categoryAttributes에서 해당 속성 타입의 availableValues에 포함된 값인지 확인
          const attrValues = attributeType.availableValues || [];
          return attrValues.some(av => av.id === bp.attributeValueId);
        })
        .map(bp => bp.attributeValueId)
        .filter(Boolean)
    );

    return (attributeType.availableValues || []).filter(value => 
      availableValueIds.has(value.id)
    );
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContent, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '입출고 기록 등록'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '상품 *'),
          React.createElement(Select, {
            value: selectedProductId,
            onChange: (e) => handleProductSelect(e.target.value),
            required: true
          },
            React.createElement('option', { value: '' }, '상품을 선택하세요'),
            uniqueProducts.map(product => 
              React.createElement('option', { 
                key: product.productId, 
                value: product.productId 
              }, product.productName)
            )
          ),
          selectedProduct && React.createElement(SelectedProductInfo, null,
            `선택한 상품: ${selectedProduct.productName}`
          )
        ),
        
        // 속성 선택 (속성이 있는 경우)
        attributeGroups.length > 0 && attributeGroups.map((group, index) => {
          const attributeType = group.attributeType;
          const availableValues = getAvailableValues(attributeType);
          const prevAttributeType = index > 0 ? attributeGroups[index - 1].attributeType : null;
          const isDisabled = prevAttributeType && !selectedAttributeValues[String(prevAttributeType.attributeTypeId)];
          
          return React.createElement(FormGroup, { key: attributeType.attributeTypeId },
            React.createElement(Label, null, `${attributeType.attributeTypeName || '속성'} *`),
            React.createElement(Select, {
              value: selectedAttributeValues[String(attributeType.attributeTypeId)] || '',
              onChange: (e) => handleAttributeValueSelect(attributeType.attributeTypeId, e.target.value),
              disabled: isDisabled,
              required: true
            },
              React.createElement('option', { value: '' }, 
                isDisabled ? '이전 속성을 먼저 선택하세요' : `${attributeType.attributeTypeName || '속성'} 선택`
              ),
              availableValues.map(value => 
                React.createElement('option', { 
                  key: value.id, 
                  value: value.id 
                }, value.name)
              )
            ),
            availableValues.length === 0 && selectedProductId && React.createElement(ErrorMessage, null,
              `해당 상품에 ${attributeType.attributeTypeName} 속성이 없습니다.`
            )
          );
        }),

        // 선택한 BranchProduct 정보 표시
        selectedBranchProduct && React.createElement(FormGroup, null,
          React.createElement(SelectedProductInfo, null,
            React.createElement('div', { style: { marginBottom: '4px' } },
              `선택한 상품: ${selectedProduct?.productName || ''}`
            ),
            selectedBranchProduct.attributeTypeName && selectedBranchProduct.attributeValueName && 
              React.createElement('div', null,
                `속성: ${selectedBranchProduct.attributeTypeName} ${selectedBranchProduct.attributeValueName}`
              ),
            React.createElement('div', { style: { marginTop: '4px', fontSize: '12px', opacity: 0.8 } },
              `현재 재고: ${selectedBranchProduct.stockQuantity || 0}개`
            )
          )
        ),

        React.createElement(FormGroup, null,
          React.createElement(Label, null, '입고수량'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: formData.inQuantity,
            onChange: (e) => handleChange('inQuantity', e.target.value),
            placeholder: '입고수량을 입력하세요'
          }),
          React.createElement(HelpText, null, '새 상품 입고, 반품 등록 등')
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '출고수량'),
          React.createElement(Input, {
            type: 'number',
            min: '0',
            value: formData.outQuantity,
            onChange: (e) => handleChange('outQuantity', e.target.value),
            placeholder: '출고수량을 입력하세요'
          }),
          React.createElement(HelpText, null, '불량품 폐기, 재고손실, 조정 등 (주문 출고는 자동 처리됨)')
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '비고'),
          React.createElement(TextArea, {
            value: formData.remark,
            onChange: (e) => handleChange('remark', e.target.value),
            placeholder: '비고를 입력하세요 (예: 불량품 폐기, 재고조정, 손실 등)'
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
            disabled: loading || !formData.branchProductId
          }, loading ? '저장 중...' : '저장')
        )
      )
    )
  );
}

export default AddInventoryFlowModal;
