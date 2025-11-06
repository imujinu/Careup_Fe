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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

const AttributeSection = styled.div`
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const AttributeTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
`;

const AttributeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AttributeItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AttributeTypeName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 4px;
  
  .required {
    color: #ef4444;
  }
`;

const AttributeValueList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const RadioWrapper = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  transition: all 0.2s;
  
  &:hover {
    border-color: #6b46c1;
    background: #f3f4f6;
  }
  
  input[type="radio"] {
    margin-right: 6px;
  }
  
  &:has(input[type="radio"]:checked) {
    border-color: #6b46c1;
    background: #ede9fe;
  }
`;

function ProductSetupModal({ isOpen, onClose, product, onSave }) {
  const [formData, setFormData] = useState({
    serialNumber: '',
    stockQuantity: 0,
    safetyStock: 0,
    supplyPrice: 0,
    sellingPrice: 0
  });

  const [productInfo, setProductInfo] = useState({
    minPrice: 0,
    maxPrice: 0,
    categoryId: null
  });


  useEffect(() => {
    if (product && isOpen && product.productId) {
      setFormData({
        serialNumber: `BR-${product.productId}-${Date.now()}`,
        stockQuantity: 0,
        safetyStock: 0,
        supplyPrice: 0, // fetchProductDetails에서 Product의 supplyPrice로 설정됨
        sellingPrice: 0
      });

      // 상품 상세 정보 가져오기 (공급가, 최저가격, 최고가격, 카테고리)
      const fetchProductDetails = async () => {
        try {
          const response = await inventoryService.getProduct(product.productId);
          const productData = response.data?.data || response.data;
          
          // 공급가는 Product의 supplyPrice (본사 -> 가맹점 공급가)
          const supplyPrice = productData?.supplyPrice || product?.supplyPrice || 0;
          const minPrice = productData?.minPrice || product?.minPrice || 0;
          const maxPrice = productData?.maxPrice || product?.maxPrice || 0;
          const categoryId = productData?.categoryId || productData?.category?.categoryId || product?.categoryId || null;
          
          setProductInfo({
            minPrice: minPrice,
            maxPrice: maxPrice,
            categoryId: categoryId
          });
          
          // 공급가 설정
          setFormData(prev => ({
            ...prev,
            supplyPrice: supplyPrice
          }));
          
          // 판매가를 최대가격으로 초기 설정
          if (maxPrice > 0) {
            setFormData(prev => ({
              ...prev,
              sellingPrice: maxPrice
            }));
          }
        } catch (err) {
          console.error('상품 상세 정보 조회 실패:', err);
          // product prop에서 직접 가져오기
          const supplyPrice = product?.supplyPrice || 0;
          const minPrice = product?.minPrice || 0;
          const maxPrice = product?.maxPrice || 0;
          const categoryId = product?.categoryId || null;
          
          setProductInfo({
            minPrice: minPrice,
            maxPrice: maxPrice,
            categoryId: categoryId
          });
          
          // 공급가 설정
          setFormData(prev => ({
            ...prev,
            supplyPrice: supplyPrice
          }));
          
          // 판매가를 최대가격으로 초기 설정
          if (maxPrice > 0) {
            setFormData(prev => ({
              ...prev,
              sellingPrice: maxPrice
            }));
          }
        }
      };

      fetchProductDetails();
    }
  }, [product, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // 필수 항목 검증
    if (!formData.serialNumber || formData.safetyStock < 0) {
      alert('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    // 판매가 검증 (최저가격 ~ 최고가격 사이)
    if (productInfo.minPrice > 0 && productInfo.maxPrice > 0) {
      const sellingPrice = parseInt(formData.sellingPrice) || 0;
      if (sellingPrice < productInfo.minPrice || sellingPrice > productInfo.maxPrice) {
        alert(`판매가는 ${productInfo.minPrice.toLocaleString()}원 ~ ${productInfo.maxPrice.toLocaleString()}원 사이로 입력해주세요.`);
        return;
      }
    }

    // 선택된 속성 값 ID는 product에서 가져옴 (ProductSelectionModal에서 이미 선택됨)
    onSave({
      productId: product.productId,
      serialNumber: formData.serialNumber,
      stockQuantity: 0,
      safetyStock: parseInt(formData.safetyStock),
      sellingPrice: formData.sellingPrice ? parseInt(formData.sellingPrice) : null,  // 판매가만 전달
      attributeValueId: product.attributeValueId || null  // ProductSelectionModal에서 선택한 속성 값 ID
    });
    
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      serialNumber: '',
      stockQuantity: 0,
      safetyStock: 0,
      supplyPrice: 0,
      sellingPrice: 0
    });
    setProductInfo({
      minPrice: 0,
      maxPrice: 0,
      categoryId: null
    });
    onClose();
  };

  if (!isOpen || !product) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '상품 설정'),
        React.createElement(CloseButton, { onClick: handleClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(ProductInfo, null,
          React.createElement(ProductName, null, product.productName || '알 수 없음'),
          React.createElement(ProductDetails, null, `카테고리: ${product.categoryName || '미분류'}`),
          product.attributeDisplay && React.createElement(ProductDetails, { 
            style: { color: '#6b46c1', fontWeight: '500' } 
          }, `속성: ${product.attributeDisplay}`),
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
            onChange: (e) => {
              const v = e.target.value;
              if (v === '') return handleInputChange('safetyStock', '');
              const n = parseInt(v, 10);
              if (n < 0) return;
              handleInputChange('safetyStock', isNaN(n) ? 0 : n);
            }
          })
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '공급가 (원)'),
          React.createElement(Input, {
            type: 'number',
            value: formData.supplyPrice,
            disabled: true,
            style: { backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }
          })
        ),
        productInfo.minPrice > 0 && productInfo.maxPrice > 0 && React.createElement(React.Fragment, null,
          React.createElement(FormRow, null,
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '최저가격 (원)'),
              React.createElement(Input, {
                type: 'number',
                value: productInfo.minPrice,
                disabled: true,
                style: { backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }
              })
            ),
            React.createElement(FormGroup, null,
              React.createElement(Label, null, '최고가격 (원)'),
              React.createElement(Input, {
                type: 'number',
                value: productInfo.maxPrice,
                disabled: true,
                style: { backgroundColor: '#f9fafb', color: '#6b7280', cursor: 'not-allowed' }
              })
            )
          ),
          React.createElement(FormGroup, null,
            React.createElement(Label, null, '판매가 (원)'),
            React.createElement(Input, {
              type: 'number',
              min: Math.max(productInfo.minPrice || 0, 0),
              max: productInfo.maxPrice || undefined,
              value: formData.sellingPrice,
              onChange: (e) => {
                const v = e.target.value;
                if (v === '') return handleInputChange('sellingPrice', '');
                const n = parseInt(v, 10);
                if (n < 0) return;
                handleInputChange('sellingPrice', isNaN(n) ? 0 : n);
              },
              placeholder: `${productInfo.minPrice.toLocaleString()}원 ~ ${productInfo.maxPrice.toLocaleString()}원 사이로 입력`
            })
          )
        )
      ),
      React.createElement(ButtonGroup, null,
        React.createElement(CancelButton, { onClick: handleClose }, '취소'),
        React.createElement(AddButton, { onClick: handleSave }, '추가')
      )
    )
  );
}

export default ProductSetupModal;
