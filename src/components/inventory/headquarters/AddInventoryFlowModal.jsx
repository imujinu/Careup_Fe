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
  const [productAttributeValuesData, setProductAttributeValuesData] = useState([]); // 상품 속성 값 데이터 저장

  // 상품 목록 (상품명 기준으로 중복 제거)
  const uniqueProducts = useMemo(() => {
    const productMap = new Map();
    branchProducts.forEach(bp => {
      const productId = bp.productId || bp.product?.id;
      if (productId) {
        // productName에서 속성 정보 제거 (예: "사이다 - 사이즈 S" -> "사이다")
        let productName = bp.productName || '알 수 없음';
        // " - " 패턴으로 속성 정보가 포함되어 있으면 제거
        if (productName.includes(' - ')) {
          productName = productName.split(' - ')[0];
        }
        productName = productName.trim();
        
        // 상품명 기준으로 중복 제거 (같은 상품명이면 하나만 표시)
        if (!productMap.has(productName)) {
          productMap.set(productName, {
          productId: String(productId),
            productName: productName
        });
        }
      }
    });
    return Array.from(productMap.values());
  }, [branchProducts]);

  // 선택한 상품의 속성별 BranchProduct 그룹화
  const attributeGroups = useMemo(() => {
    if (!selectedProductId) {
      return [];
    }

    if (!categoryAttributes || categoryAttributes.length === 0) {
      return [];
    }

    const sortedAttributes = [...categoryAttributes].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    return sortedAttributes
      .filter(attr => {
        // attributeTypeId가 있는 것만 필터링
        const typeId = attr.attributeTypeId || attr.attributeType?.id || attr.id;
        return !!typeId;
      })
      .map(attr => ({
      attributeType: attr,
      availableValues: attr.availableValues || []
    }));
  }, [selectedProductId, categoryAttributes]);

  // 선택한 속성 조합에 해당하는 BranchProduct 찾기
  useEffect(() => {
    if (!selectedProductId || !selectedProduct || !branchProducts.length) {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
      return;
    }

    // 선택한 상품명과 일치하는 모든 BranchProduct 찾기
    const selectedProductName = selectedProduct.productName;
    const productBranchProducts = branchProducts.filter(bp => {
      let bpProductName = bp.productName || '알 수 없음';
      if (bpProductName.includes(' - ')) {
        bpProductName = bpProductName.split(' - ')[0].trim();
      } else {
        bpProductName = bpProductName.trim();
      }
      return bpProductName === selectedProductName;
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
      const typeId = String(attr.attributeTypeId || attr.attributeType?.id || attr.id);
      const isSelected = !!selectedAttributeValues[typeId];
      return isSelected;
    });

    if (!allSelected) {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
      return;
    }
    
    let matchingBP = null;
    
      // 속성이 하나인 경우
      if (sortedAttributes.length === 1) {
      matchingBP = productBranchProducts.find(bp => {
        return String(bp.attributeValueId) === String(selectedValues[0]);
      });
    } else {
      // 여러 속성이 있는 경우 - productAttributeValuesData를 사용해서 정확한 조합 찾기
      if (productAttributeValuesData.length > 0) {
        // 선택한 속성 값들을 타입별로 정리
        const selectedAttrMap = new Map();
        sortedAttributes.forEach(attr => {
          const typeId = String(attr.attributeTypeId || attr.attributeType?.id || attr.id);
          const typeName = attr.attributeTypeName || attr.attributeType?.name || attr.name;
          const selectedValueId = selectedAttributeValues[typeId] || selectedAttributeValues[typeName];
          
          if (selectedValueId) {
            selectedAttrMap.set(typeId, String(selectedValueId));
            selectedAttrMap.set(typeName, String(selectedValueId));
          }
        });
        
        // productAttributeValuesData에서 선택한 모든 속성 값과 일치하는 조합 찾기
        const productIdGroups = new Map();
        productAttributeValuesData.forEach(pav => {
          const productId = String(pav.productId || '');
          if (!productIdGroups.has(productId)) {
            productIdGroups.set(productId, []);
          }
          productIdGroups.get(productId).push(pav);
        });
        
        // 마지막 속성(옵션2)의 선택된 값 ID 가져오기
        const lastAttr = sortedAttributes[sortedAttributes.length - 1];
        const lastTypeId = String(lastAttr.attributeTypeId || lastAttr.attributeType?.id || lastAttr.id);
        const lastTypeName = lastAttr.attributeTypeName || lastAttr.attributeType?.name || lastAttr.name;
        const lastSelectedValueId = selectedAttributeValues[lastTypeId] || selectedAttributeValues[lastTypeName];
        
        // 모든 선택한 속성이 정확히 일치하는 productId 찾기
        // 마지막 속성(옵션2) 값 ID와 일치하는 productId를 우선적으로 찾음
        let matchedProductId = null;
        productIdGroups.forEach((attrs, productId) => {
          // 속성 개수가 정확히 일치해야 함
          if (attrs.length !== sortedAttributes.length) {
            return;
          }
          
          let allMatch = true;
          
          // 각 선택한 속성이 이 productId의 속성에 정확히 일치하는지 확인
          // 타입 ID만 확인 (타입 이름은 건너뛰기)
          for (const attr of sortedAttributes) {
            const typeId = String(attr.attributeTypeId || attr.attributeType?.id || attr.id);
            const selectedValueId = selectedAttrMap.get(typeId);
            
            if (!selectedValueId) {
              continue; // 선택되지 않은 속성은 건너뛰기
            }
            
            const hasMatchingAttr = attrs.some(pav => {
              const pavTypeId = String(pav.attributeTypeId || pav.attributeType?.id || '');
              const pavValueId = String(pav.attributeValueId || pav.attributeValue?.id || pav.id || '');
              
              return pavTypeId === typeId && pavValueId === selectedValueId;
            });
            
            if (!hasMatchingAttr) {
              allMatch = false;
              break;
            }
          }
          
          // 모든 속성이 일치하고, 마지막 속성(옵션2) 값 ID도 일치하는 productId 찾기
          if (allMatch && lastSelectedValueId) {
            const hasLastAttrMatch = attrs.some(pav => {
              const pavTypeId = String(pav.attributeTypeId || pav.attributeType?.id || '');
              const pavValueId = String(pav.attributeValueId || pav.attributeValue?.id || pav.id || '');
              
              return pavTypeId === lastTypeId && pavValueId === String(lastSelectedValueId);
            });
            
            if (hasLastAttrMatch) {
              matchedProductId = productId;
              return; // 마지막 속성 값과 일치하는 productId 찾으면 종료
            }
          }
        });
        
        // 매칭된 productId의 마지막 속성(옵션2) 값 ID와 일치하는 BranchProduct 찾기
        if (matchedProductId && lastSelectedValueId) {
          // BranchProduct의 attributeValueId가 마지막 속성(옵션2) 값 ID와 일치하는지 확인
          // 또한 BranchProduct의 attributeTypeId도 마지막 속성 타입 ID와 일치해야 함
          matchingBP = productBranchProducts.find(bp => {
            const bpValueId = String(bp.attributeValueId || '');
            const bpTypeId = String(bp.attributeTypeId || '');
            return bpValueId === String(lastSelectedValueId) && bpTypeId === lastTypeId;
          });
        }
      }
      
      // productAttributeValuesData를 사용한 매칭 실패 시, 기존 방식으로 폴백
      if (!matchingBP) {
        // 마지막 속성(옵션2)의 선택된 값 ID로 매칭 시도
        const lastAttr = sortedAttributes[sortedAttributes.length - 1];
        const lastTypeId = String(lastAttr.attributeTypeId || lastAttr.attributeType?.id || lastAttr.id);
        const lastTypeName = lastAttr.attributeTypeName || lastAttr.attributeType?.name || lastAttr.name;
        const lastSelectedValueId = selectedAttributeValues[lastTypeId] || selectedAttributeValues[lastTypeName];
        
        if (lastSelectedValueId) {
          matchingBP = productBranchProducts.find(bp => {
            const bpValueId = String(bp.attributeValueId || '');
            const bpTypeId = String(bp.attributeTypeId || '');
            return bpValueId === String(lastSelectedValueId) && bpTypeId === lastTypeId;
          });
        }
      }
    }

    // 매칭 실패 시: BranchProduct에 속성 정보가 없는 경우
    // 첫 번째 BranchProduct를 사용 (속성 정보가 없어도 해당 상품의 재고이므로)
    if (!matchingBP && productBranchProducts.length > 0) {
      matchingBP = productBranchProducts[0];
    }

    if (matchingBP) {
      setSelectedBranchProduct(matchingBP);
      setFormData(prev => ({ ...prev, branchProductId: matchingBP.id }));
    } else {
      setSelectedBranchProduct(null);
      setFormData(prev => ({ ...prev, branchProductId: '' }));
    }
  }, [selectedProductId, selectedAttributeValues, branchProducts, categoryAttributes, productAttributeValuesData, selectedProduct]);

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

    setSelectedProductId(String(productId));
    setSelectedAttributeValues({});
    
    // 선택한 상품 정보 찾기
    const product = uniqueProducts.find(p => String(p.productId) === String(productId));
    setSelectedProduct(product);

    // 선택한 상품명과 일치하는 모든 BranchProduct 찾기 (같은 상품명이면 모두 포함)
    const selectedProductName = product?.productName;
    const productBPs = branchProducts.filter(bp => {
      let bpProductName = bp.productName || '알 수 없음';
      if (bpProductName.includes(' - ')) {
        bpProductName = bpProductName.split(' - ')[0].trim();
      } else {
        bpProductName = bpProductName.trim();
      }
      return bpProductName === selectedProductName;
    });


    if (productBPs.length === 0) {
      setCategoryAttributes([]);
      return;
    }

    // branchProducts에서 속성 정보 추출
    const attributeMap = new Map();
    
    productBPs.forEach(bp => {
      if (bp.attributeTypeId && bp.attributeTypeName) {
        const typeId = String(bp.attributeTypeId);
        const typeName = bp.attributeTypeName;
        const valueId = bp.attributeValueId;
        const valueName = bp.attributeValueName;
        
        if (!attributeMap.has(typeId)) {
          attributeMap.set(typeId, {
            attributeTypeId: typeId,
            attributeTypeName: typeName,
            availableValues: new Map()
          });
        }
        
        const attr = attributeMap.get(typeId);
        if (valueId && valueName && !attr.availableValues.has(String(valueId))) {
          attr.availableValues.set(String(valueId), {
            id: valueId,
            name: valueName
          });
        }
      }
    });

    // API를 통해 상품 속성 정보와 카테고리 속성 정보 가져오기
    try {
      const productDetail = await inventoryService.getProduct(productId);
      const productData = productDetail.data?.data || productDetail.data || productDetail;
      
      // 상품에 연결된 속성 값 가져오기
      let productAttributeValues = [];
      try {
        // 선택한 상품명과 일치하는 모든 productId의 속성 값 가져오기
        const selectedProductName = product?.productName;
        const matchingProductIds = branchProducts
          .filter(bp => {
            let bpProductName = bp.productName || '알 수 없음';
            if (bpProductName.includes(' - ')) {
              bpProductName = bpProductName.split(' - ')[0].trim();
            } else {
              bpProductName = bpProductName.trim();
            }
            return bpProductName === selectedProductName;
          })
          .map(bp => bp.productId || bp.product?.id)
          .filter((id, index, self) => id && self.indexOf(id) === index); // 중복 제거
        
        // 모든 productId의 속성 값 가져오기
        const allProductAttributeValues = [];
        for (const pid of matchingProductIds) {
          try {
            const attrs = await inventoryService.getProductAttributeValues(pid);
            if (Array.isArray(attrs)) {
              allProductAttributeValues.push(...attrs);
            }
          } catch (err) {
            // 속성 값 조회 실패 무시
          }
        }
        
        productAttributeValues = allProductAttributeValues;
        setProductAttributeValuesData(productAttributeValues);
      } catch (err) {
        setProductAttributeValuesData([]);
      }
      
      if (productData?.category?.id) {
        const categoryAttributes = await inventoryService.getCategoryAttributes(productData.category.id);
        
        if (Array.isArray(categoryAttributes) && categoryAttributes.length > 0) {
          // 카테고리 속성과 상품 속성 값, branchProducts 속성 정보 결합
          const combinedAttributes = categoryAttributes.map(attr => {
            const typeId = String(attr.attributeTypeId || attr.attributeType?.id || attr.id);
            const typeName = attr.attributeTypeName || attr.attributeType?.name || attr.name;
            
            // 1. branchProducts에서 추출한 속성 값 사용
            // 2. 없으면 상품 속성 값 사용
            // 3. 없으면 카테고리 속성의 availableValues 사용
            const bpAttr = attributeMap.get(typeId);
            let availableValues = [];
            
            if (bpAttr?.availableValues && bpAttr.availableValues.size > 0) {
              // branchProducts에서 추출한 값 사용
              availableValues = Array.from(bpAttr.availableValues.values());
            } else if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
              // 상품 속성 값에서 해당 타입의 값 필터링
              const productValues = productAttributeValues
                .filter(pav => {
                  const pavTypeId = String(pav.attributeTypeId || pav.attributeType?.id || pav.attributeTypeId);
                  return pavTypeId === typeId;
                })
                .map(pav => ({
                  id: pav.attributeValueId || pav.attributeValue?.id || pav.id,
                  name: pav.attributeValueName || pav.attributeValue?.name || pav.name
                }));
              
              if (productValues.length > 0) {
                availableValues = productValues;
              } else {
                // 카테고리 속성의 availableValues 사용
                availableValues = (attr.availableValues || attr.attributeType?.attributeValues || []).map(val => ({
                  id: val.id || val.attributeValueId,
                  name: val.name || val.attributeValueName
                }));
              }
            } else {
              // 카테고리 속성의 availableValues 사용
              availableValues = (attr.availableValues || attr.attributeType?.attributeValues || []).map(val => ({
                id: val.id || val.attributeValueId,
                name: val.name || val.attributeValueName
              }));
            }
            
            return {
              ...attr,
              attributeTypeId: typeId,
              attributeTypeName: typeName,
              availableValues: availableValues
            };
          });
          
          setCategoryAttributes(combinedAttributes);
        } else {
          // 카테고리 속성이 없는 경우
          // branchProducts 또는 상품 속성 값에서 추출
          if (attributeMap.size > 0) {
            const extractedAttributes = Array.from(attributeMap.values()).map(attr => ({
              attributeTypeId: attr.attributeTypeId,
              attributeTypeName: attr.attributeTypeName,
              availableValues: Array.from(attr.availableValues.values())
            }));
            setCategoryAttributes(extractedAttributes);
          } else if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
            // 상품 속성 값에서 속성 타입별로 그룹화
            const productAttrMap = new Map();
            productAttributeValues.forEach(pav => {
              // attributeTypeId가 없으면 attributeTypeName을 키로 사용
              const typeId = String(pav.attributeTypeId || pav.attributeType?.id || pav.attributeTypeName || '');
              const typeName = pav.attributeTypeName || pav.attributeType?.name || '';
              const valueId = pav.attributeValueId || pav.attributeValue?.id || pav.id;
              // value 필드가 있으면 그것을 사용, 없으면 attributeValueName 사용
              const valueName = pav.attributeValueName || pav.attributeValue?.name || pav.displayName || '';
              
              if (typeName && valueId) {
                if (!productAttrMap.has(typeId)) {
                  productAttrMap.set(typeId, {
                    attributeTypeId: typeId,
                    attributeTypeName: typeName,
                    availableValues: []
                  });
                }
                productAttrMap.get(typeId).availableValues.push({
                  id: valueId,
                  name: valueName
                });
              }
            });
            
            if (productAttrMap.size > 0) {
              const extractedAttributes = Array.from(productAttrMap.values());
              setCategoryAttributes(extractedAttributes);
            } else {
              setCategoryAttributes([]);
            }
          } else {
            setCategoryAttributes([]);
          }
        }
      } else {
          // 카테고리 정보가 없는 경우
          if (attributeMap.size > 0) {
            const extractedAttributes = Array.from(attributeMap.values()).map(attr => ({
              attributeTypeId: attr.attributeTypeId,
              attributeTypeName: attr.attributeTypeName,
              availableValues: Array.from(attr.availableValues.values())
            }));
            setCategoryAttributes(extractedAttributes);
          } else if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
            // 상품 속성 값에서 속성 타입별로 그룹화
            const productAttrMap = new Map();
            productAttributeValues.forEach(pav => {
              const typeId = String(pav.attributeTypeId || pav.attributeType?.id || pav.attributeTypeName || '');
              const typeName = pav.attributeTypeName || pav.attributeType?.name || '';
              const valueId = pav.attributeValueId || pav.attributeValue?.id || pav.id;
              const valueName = pav.attributeValueName || pav.attributeValue?.name || pav.displayName || '';
              
              if (typeName && valueId) {
                if (!productAttrMap.has(typeId)) {
                  productAttrMap.set(typeId, {
                    attributeTypeId: typeId,
                    attributeTypeName: typeName,
                    availableValues: []
                  });
                }
                productAttrMap.get(typeId).availableValues.push({
                  id: valueId,
                  name: valueName
                });
              }
            });
            
            if (productAttrMap.size > 0) {
              const extractedAttributes = Array.from(productAttrMap.values());
              setCategoryAttributes(extractedAttributes);
            } else {
              setCategoryAttributes([]);
            }
      } else {
        setCategoryAttributes([]);
      }
      }
    } catch (error) {
      // API 호출 실패 시에도 branchProducts에서 추출한 정보 사용
      if (attributeMap.size > 0) {
        const extractedAttributes = Array.from(attributeMap.values()).map(attr => ({
          attributeTypeId: attr.attributeTypeId,
          attributeTypeName: attr.attributeTypeName,
          availableValues: Array.from(attr.availableValues.values())
        }));
        setCategoryAttributes(extractedAttributes);
      } else {
      setCategoryAttributes([]);
      }
    }
  };

  const handleAttributeValueSelect = (attributeTypeId, attributeValueId) => {
    setSelectedAttributeValues(prev => {
      const newValues = { ...prev };
      
      // 속성 타입 정보 찾기
      const attrType = categoryAttributes.find(a => {
        const aTypeId = a.attributeTypeId || a.attributeType?.id || a.id;
        return String(aTypeId) === String(attributeTypeId);
      });
      
      // 타입 이름과 타입 ID 모두 키로 사용
      const typeIdStr = String(attributeTypeId);
      const typeNameStr = attrType?.attributeTypeName || attrType?.attributeType?.name || attrType?.name || '';
      
      if (attributeValueId) {
        // 타입 ID와 타입 이름 모두 키로 저장
        newValues[typeIdStr] = String(attributeValueId);
        if (typeNameStr) {
          newValues[typeNameStr] = String(attributeValueId);
        }
      } else {
        delete newValues[typeIdStr];
        if (typeNameStr) {
          delete newValues[typeNameStr];
        }
        // 이후 속성 선택도 초기화
        const sortedAttributes = [...categoryAttributes].sort((a, b) => 
          (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        const currentIndex = sortedAttributes.findIndex(a => {
          const aTypeId = a.attributeTypeId || a.attributeType?.id || a.id;
          return String(aTypeId) === typeIdStr;
        });
        sortedAttributes.slice(currentIndex + 1).forEach(attr => {
          const attrTypeId = attr.attributeTypeId || attr.attributeType?.id || attr.id;
          const attrTypeName = attr.attributeTypeName || attr.attributeType?.name || attr.name || '';
          delete newValues[String(attrTypeId)];
          if (attrTypeName) {
            delete newValues[attrTypeName];
          }
        });
      }
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
      // 에러 처리
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
    if (!selectedProductId || !selectedProduct) return [];

    // 선택한 상품명과 일치하는 모든 BranchProduct 찾기
    const selectedProductName = selectedProduct.productName;
    let productBPs = branchProducts.filter(bp => {
      let bpProductName = bp.productName || '알 수 없음';
      if (bpProductName.includes(' - ')) {
        bpProductName = bpProductName.split(' - ')[0].trim();
      } else {
        bpProductName = bpProductName.trim();
      }
      return bpProductName === selectedProductName;
    });

    const typeId = String(attributeType.attributeTypeId || attributeType.attributeType?.id || attributeType.id);
    const typeName = String(attributeType.attributeTypeName || attributeType.attributeType?.name || attributeType.name || '');
    
    // 현재 속성의 인덱스 찾기
    const sortedAttributes = [...categoryAttributes].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );
    const currentIndex = sortedAttributes.findIndex(a => {
      const aTypeId = a.attributeTypeId || a.attributeType?.id || a.id;
      const aTypeName = a.attributeTypeName || a.attributeType?.name || a.name || '';
      // 타입 ID 또는 타입 이름으로 비교
      return String(aTypeId) === typeId || String(aTypeName) === typeName;
    });
    
    // valueMap 초기화
    const valueMap = new Map();
    
    // 이전에 선택한 속성 값들과 함께 존재하는 속성 값만 필터링
    if (currentIndex > 0 && Object.keys(selectedAttributeValues).length > 0 && productAttributeValuesData.length > 0) {
      // 각 productId별로 속성 조합 그룹화
      const productIdGroups = new Map();
      productAttributeValuesData.forEach(pav => {
        const productId = String(pav.productId || '');
        if (!productIdGroups.has(productId)) {
          productIdGroups.set(productId, []);
        }
        productIdGroups.get(productId).push(pav);
      });
      
      // 이전 속성 값들과 일치하는 속성 조합을 가진 productId 찾기
      const validProductIds = new Set();
      
      productIdGroups.forEach((attrs, productId) => {
        // 이 productId에 이전 속성 값들이 모두 포함되어 있는지 확인
        let allPrevAttrsMatch = true;
        
        for (let i = 0; i < currentIndex; i++) {
          const prevAttr = sortedAttributes[i];
          const prevTypeId = String(prevAttr.attributeTypeId || prevAttr.attributeType?.id || prevAttr.id);
          const prevTypeName = String(prevAttr.attributeTypeName || prevAttr.attributeType?.name || prevAttr.name || '');
          
          // selectedAttributeValues의 키가 타입 ID인지 타입 이름인지 확인
          // 타입 이름을 우선으로 확인 (콘솔 로그에서 "색상"으로 저장되어 있음)
          let selectedValueId = selectedAttributeValues[prevTypeName] || selectedAttributeValues[prevTypeId];
          
          if (selectedValueId) {
            // 이 productId의 속성 중에 이전 속성 타입과 값이 일치하는 것이 있는지 확인
            const hasMatchingAttr = attrs.some(pav => {
              const pavTypeId = String(pav.attributeTypeId || pav.attributeType?.id || '');
              const pavTypeName = String(pav.attributeTypeName || pav.attributeType?.name || '');
              const pavValueId = String(pav.attributeValueId || pav.attributeValue?.id || pav.id || '');
              
              // 타입 ID 또는 타입 이름으로 비교
              const typeMatches = pavTypeId === prevTypeId || pavTypeName === prevTypeName;
              const valueMatches = pavValueId === String(selectedValueId);
              
              return typeMatches && valueMatches;
            });
            
            if (!hasMatchingAttr) {
              allPrevAttrsMatch = false;
              break;
            }
          }
        }
        
        if (allPrevAttrsMatch) {
          validProductIds.add(productId);
        }
      });
      
      // 유효한 productId들에 연결된 현재 속성 타입의 값만 필터링
      // 주의: 같은 productId에 여러 속성 조합이 있을 수 있으므로, 
      // 각 속성 조합이 이전 속성 값들과 일치하는지 확인해야 함
      
      // 현재 속성 타입의 이름도 가져오기
      const currentAttrType = sortedAttributes.find(a => {
        const aTypeId = a.attributeTypeId || a.attributeType?.id || a.id;
        return String(aTypeId) === typeId;
      });
      const currentTypeName = String(currentAttrType?.attributeTypeName || currentAttrType?.attributeType?.name || currentAttrType?.name || '');
      
      // 각 productId에 대해, 이전 속성 값들과 일치하는 속성 조합을 찾고
      // 그 조합에 포함된 현재 속성 타입의 값만 추가
      validProductIds.forEach(productId => {
        const productAttrs = productIdGroups.get(productId) || [];
        
        // 현재 속성 타입의 값 찾기
        productAttrs.forEach(attr => {
          const attrTypeId = String(attr.attributeTypeId || attr.attributeType?.id || '');
          const attrTypeName = String(attr.attributeTypeName || attr.attributeType?.name || '');
          const attrValueId = String(attr.attributeValueId || attr.attributeValue?.id || attr.id || '');
          const attrValueName = attr.attributeValueName || attr.attributeValue?.name || attr.displayName || '';
          
          // 현재 속성 타입과 일치하는지 확인 (타입 ID 또는 타입 이름으로 비교)
          const typeMatches = attrTypeId === typeId || attrTypeName === currentTypeName;
          
          // 현재 속성 타입과 일치하는 값만 추가
          if (typeMatches && attrValueId && attrValueName) {
            if (!valueMap.has(attrValueId)) {
              valueMap.set(attrValueId, {
                id: attr.attributeValueId || attr.attributeValue?.id || attr.id,
                name: attrValueName
              });
            }
          }
        });
      });
      
      // 필터링된 값이 없으면, branchProducts에서도 확인
      if (valueMap.size === 0) {
        productBPs.forEach(bp => {
          const bpTypeId = String(bp.attributeTypeId || '');
          if (bpTypeId === typeId && bp.attributeValueId && bp.attributeValueName) {
            // 이전 속성 값과 일치하는지 확인
            let matches = true;
            for (let i = 0; i < currentIndex; i++) {
              const prevAttr = sortedAttributes[i];
              const prevTypeId = String(prevAttr.attributeTypeId || prevAttr.attributeType?.id || prevAttr.id);
              const selectedValueId = selectedAttributeValues[prevTypeId];
              
              // BranchProduct는 하나의 속성만 가지므로, 다른 속성 타입과 매칭 확인이 어려움
              // 대신 productAttributeValuesData에서 확인해야 함
            }
            
            // 일단 추가해보고, 나중에 필터링
            const valueId = String(bp.attributeValueId);
            if (!valueMap.has(valueId)) {
              valueMap.set(valueId, {
                id: bp.attributeValueId,
                name: bp.attributeValueName
              });
            }
          }
        });
      }
    } else {
      // 이전 속성이 없거나 선택되지 않은 경우, branchProducts에서 직접 추출
      productBPs.forEach(bp => {
        const bpTypeId = String(bp.attributeTypeId || '');
        if (bpTypeId === typeId && bp.attributeValueId && bp.attributeValueName) {
          const valueId = String(bp.attributeValueId);
          if (!valueMap.has(valueId)) {
            valueMap.set(valueId, {
              id: bp.attributeValueId,
              name: bp.attributeValueName
            });
          }
        }
      });
      
      // 이전 속성이 없는 경우에만 availableValues 추가 (첫 번째 속성 선택 시)
          const attrValues = attributeType.availableValues || [];
      if (attrValues.length > 0) {
        attrValues.forEach(val => {
          const valueId = String(val.id || val.attributeValueId || '');
          const valueName = val.name || val.attributeValueName || '';
          if (valueId && valueName && !valueMap.has(valueId)) {
            valueMap.set(valueId, {
              id: val.id || val.attributeValueId,
              name: valueName
            });
          }
        });
      }
    }
    
    if (valueMap.size > 0) {
      const values = Array.from(valueMap.values());
      return values;
    }

    return [];
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>입출고 기록 등록</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>상품 *</Label>
            <Select
              value={selectedProductId}
              onChange={(e) => handleProductSelect(e.target.value)}
              required
            >
              <option value="">상품을 선택하세요</option>
              {uniqueProducts.map(product => (
                <option key={product.productId} value={product.productId}>
                  {product.productName}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* 속성 선택 (속성이 있는 경우) */}
          {selectedProductId && attributeGroups.length > 0 && attributeGroups.map((group, index) => {
          const attributeType = group.attributeType;
            const typeId = attributeType.attributeTypeId || attributeType.attributeType?.id || attributeType.id;
            const typeName = attributeType.attributeTypeName || attributeType.attributeType?.name || attributeType.name || '속성';
          const availableValues = getAvailableValues(attributeType);
          const prevAttributeType = index > 0 ? attributeGroups[index - 1].attributeType : null;
            const prevTypeId = prevAttributeType ? (prevAttributeType.attributeTypeId || prevAttributeType.attributeType?.id || prevAttributeType.id) : null;
            const isDisabled = prevTypeId && !selectedAttributeValues[String(prevTypeId)];
            
            return (
              <FormGroup key={typeId || index}>
                <Label>{typeName} *</Label>
                <Select
                  value={selectedAttributeValues[String(typeId)] || ''}
                  onChange={(e) => handleAttributeValueSelect(typeId, e.target.value)}
                  disabled={isDisabled}
                  required
                >
                  <option value="">
                    {isDisabled ? '이전 속성을 먼저 선택하세요' : `${typeName} 선택`}
                  </option>
                  {availableValues.map(value => (
                    <option key={value.id || value.attributeValueId} value={value.id || value.attributeValueId}>
                      {value.name || value.attributeValueName}
                    </option>
                  ))}
                </Select>
                {availableValues.length === 0 && selectedProductId && (
                  <ErrorMessage>
                    해당 상품에 {typeName} 속성이 없습니다.
                  </ErrorMessage>
                )}
              </FormGroup>
            );
          })}
          
          {/* 디버깅: 속성 정보 표시 */}
          {selectedProductId && categoryAttributes.length === 0 && (
            <FormGroup>
              <HelpText style={{ color: '#6b7280', fontStyle: 'italic' }}>
                이 상품에는 속성이 없습니다.
              </HelpText>
            </FormGroup>
          )}

          {/* 선택한 BranchProduct 정보 표시 */}
          {selectedBranchProduct && (
            <FormGroup>
              <SelectedProductInfo>
                <div style={{ marginBottom: '4px' }}>
                  선택한 상품: {selectedProduct?.productName || ''}
                </div>
                {selectedBranchProduct.attributeTypeName && selectedBranchProduct.attributeValueName && (
                  <div>
                    속성: {selectedBranchProduct.attributeTypeName} {selectedBranchProduct.attributeValueName}
                  </div>
                )}
                <div style={{ marginTop: '4px', fontSize: '12px', opacity: 0.8 }}>
                  현재 재고: {selectedBranchProduct.stockQuantity || 0}개
                </div>
              </SelectedProductInfo>
            </FormGroup>
          )}

          <FormGroup>
            <Label>입고수량</Label>
            <Input
              type="number"
              min="0"
              value={formData.inQuantity}
              onChange={(e) => handleChange('inQuantity', e.target.value)}
              placeholder="입고수량을 입력하세요"
            />
            <HelpText>새 상품 입고, 반품 등록 등</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>출고수량</Label>
            <Input
              type="number"
              min="0"
              value={formData.outQuantity}
              onChange={(e) => handleChange('outQuantity', e.target.value)}
              placeholder="출고수량을 입력하세요"
            />
            <HelpText>불량품 폐기, 재고손실, 조정 등 (주문 출고는 자동 처리됨)</HelpText>
          </FormGroup>

          <FormGroup>
            <Label>비고</Label>
            <TextArea
              value={formData.remark}
              onChange={(e) => handleChange('remark', e.target.value)}
              placeholder="비고를 입력하세요 (예: 불량품 폐기, 재고조정, 손실 등)"
            />
          </FormGroup>

          <ButtonGroup>
            <Button
              type="button"
              className="cancel"
              onClick={onClose}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="save"
              disabled={loading || !formData.branchProductId}
            >
              {loading ? '저장 중...' : '저장'}
            </Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default AddInventoryFlowModal;
