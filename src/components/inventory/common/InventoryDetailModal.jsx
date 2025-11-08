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
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 700px;
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

const HeaderButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const PrintButton = styled.button`
  height: 36px;
  padding: 0 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #e5e7eb;
  }
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
  padding: 0 24px 24px 24px;
`;

const InfoPanels = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 32px;
`;

const InfoPanel = styled.div`
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
`;

const PanelHeader = styled.div`
  background: #6b46c1;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
`;

const PanelContent = styled.div`
  padding: 16px;
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

const InventorySection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 32px;
`;

const SectionHeader = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const AttributeGroup = styled.div`
  border-bottom: 2px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const AttributeGroupHeader = styled.div`
  background: #f3f4f6;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const AttributeValueGroup = styled.div`
  padding-left: 24px;
  border-bottom: 1px solid #f3f4f6;
  
  &:last-child {
    border-bottom: none;
  }
`;

const AttributeValueHeader = styled.div`
  padding: 10px 16px;
  background: #fafafa;
  font-weight: 500;
  font-size: 14px;
  color: #4b5563;
  border-bottom: 1px solid #f3f4f6;
`;

const InventoryDetails = styled.div`
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: center;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
`;

const DetailLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const DetailValue = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
`;

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
  width: fit-content;
  background: ${props => {
    if (props.status === 'low') return '#fef2f2';
    if (props.status === 'normal') return '#dcfce7';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.status === 'low') return '#dc2626';
    if (props.status === 'normal') return '#166534';
    return '#374151';
  }};
`;

const HistorySection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => {
    if (props.$remark) return '300px';
    if (props.$date) return '180px';
    if (props.$quantity) return '100px';
    return '150px';
  }};
  ${props => props.$remark && `
    overflow-x: auto;
    overflow-y: hidden;
    text-overflow: clip;
    min-width: 200px;
    max-width: 400px;
    &::-webkit-scrollbar {
      height: 4px;
    }
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 2px;
    }
    &::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 2px;
      &:hover {
        background: #555;
      }
    }
  `}
`;

const TypeBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.type === '입고') return '#dcfce7';
    if (props.type === '출고') return '#fef2f2';
    if (props.type === '조정') return '#eff6ff';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.type === '입고') return '#166534';
    if (props.type === '출고') return '#dc2626';
    if (props.type === '조정') return '#2563eb';
    return '#374151';
  }};
`;

const EmptyMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  color: #1f2937;
  min-width: 150px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #6b46c1;
    box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
  }
`;

function InventoryDetailModal({ isOpen, onClose, item }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [branchProducts, setBranchProducts] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [productAttributeValuesData, setProductAttributeValuesData] = useState([]); // 상품 속성 값 원본 데이터

  useEffect(() => {
    if (isOpen && item) {
      fetchProductDetails();
      fetchBranchProducts();
      fetchInventoryFlows();
    }
  }, [isOpen, item]);
  
  const fetchProductDetails = async () => {
    if (!item?.product?.id) return;
    
    try {
      const response = await inventoryService.getProduct(item.product.id);
      const productData = response.data?.data || response.data;
      setProductInfo(productData);
      
      // 상품 속성 값 먼저 가져오기
      let productAttributeValues = [];
      try {
        productAttributeValues = await inventoryService.getProductAttributeValues(item.product.id);
        console.log('상세보기 - 상품 속성 값:', productAttributeValues);
        setProductAttributeValuesData(productAttributeValues || []);
      } catch (err) {
        console.warn('상품 속성 값 조회 실패:', err);
        setProductAttributeValuesData([]);
      }
      
      // 카테고리 속성 조회
      if (productData?.category?.id) {
        try {
          const attributes = await inventoryService.getCategoryAttributes(productData.category.id);
          console.log('상세보기 - 카테고리 속성:', attributes);
          
          // 속성 정보 정규화
          let normalizedAttributes = [];
          
          if (Array.isArray(attributes) && attributes.length > 0) {
            normalizedAttributes = attributes.map(attr => {
              const typeId = String(attr.attributeTypeId || attr.attributeType?.id || attr.id || '');
              const typeName = attr.attributeTypeName || attr.attributeType?.name || attr.name || '속성';
              
              // 상품 속성 값에서 해당 타입의 값 가져오기
              let availableValues = attr.availableValues || attr.attributeType?.attributeValues || [];
              
              if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
                const productValues = productAttributeValues
                  .filter(pav => {
                    const pavTypeId = String(pav.attributeTypeId || pav.attributeType?.id || '');
                    const pavTypeName = pav.attributeTypeName || '';
                    return pavTypeId === typeId || pavTypeName === typeName;
                  })
                  .map(pav => ({
                    id: pav.attributeValueId || pav.attributeValue?.id || pav.id,
                    name: pav.attributeValueName || pav.attributeValue?.name || pav.displayName || pav.name
                  }))
                  .filter(val => val.id && val.name); // 유효한 값만
                
                if (productValues.length > 0) {
                  availableValues = productValues;
                }
              }
              
              // availableValues 정규화
              const normalizedValues = availableValues
                .map(val => ({
                  id: val.id || val.attributeValueId,
                  name: val.name || val.attributeValueName
                }))
                .filter(val => val.id && val.name); // 유효한 값만
              
              return {
                ...attr,
                attributeTypeId: typeId || typeName,
                attributeTypeName: typeName,
                availableValues: normalizedValues
              };
            });
          } else if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
            // 카테고리 속성이 없으면 상품 속성 값에서 속성 타입별로 그룹화
            const productAttrMap = new Map();
            productAttributeValues.forEach(pav => {
              const typeId = String(pav.attributeTypeId || pav.attributeType?.id || pav.attributeTypeName || '');
              const typeName = pav.attributeTypeName || pav.attributeType?.name || '속성';
              const valueId = pav.attributeValueId || pav.attributeValue?.id || pav.id;
              const valueName = pav.attributeValueName || pav.attributeValue?.name || pav.displayName || pav.name;
              
              if (typeName && valueId && valueName) {
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
            
            normalizedAttributes = Array.from(productAttrMap.values());
          }
          
          console.log('상세보기 - 정규화된 속성:', normalizedAttributes);
          setCategoryAttributes(normalizedAttributes);
        } catch (error) {
          console.error('카테고리 속성 조회 실패:', error);
          // 카테고리 속성 조회 실패 시 상품 속성 값에서만 추출
          if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
            const productAttrMap = new Map();
            productAttributeValues.forEach(pav => {
              const typeId = String(pav.attributeTypeId || pav.attributeType?.id || pav.attributeTypeName || '');
              const typeName = pav.attributeTypeName || pav.attributeType?.name || '속성';
              const valueId = pav.attributeValueId || pav.attributeValue?.id || pav.id;
              const valueName = pav.attributeValueName || pav.attributeValue?.name || pav.displayName || pav.name;
              
              if (typeName && valueId && valueName) {
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
            
            const extractedAttributes = Array.from(productAttrMap.values());
            console.log('상세보기 - 상품 속성 값에서 추출한 속성:', extractedAttributes);
            setCategoryAttributes(extractedAttributes);
          } else {
          setCategoryAttributes([]);
        }
        }
      } else if (Array.isArray(productAttributeValues) && productAttributeValues.length > 0) {
        // 카테고리 정보가 없어도 상품 속성 값이 있으면 사용
        const productAttrMap = new Map();
        productAttributeValues.forEach(pav => {
          const typeId = String(pav.attributeTypeId || pav.attributeType?.id || pav.attributeTypeName || '');
          const typeName = pav.attributeTypeName || pav.attributeType?.name || '속성';
          const valueId = pav.attributeValueId || pav.attributeValue?.id || pav.id;
          const valueName = pav.attributeValueName || pav.attributeValue?.name || pav.displayName || pav.name;
          
          if (typeName && valueId && valueName) {
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
        
        const extractedAttributes = Array.from(productAttrMap.values());
        console.log('상세보기 - 상품 속성 값에서 추출한 속성 (카테고리 없음):', extractedAttributes);
        setCategoryAttributes(extractedAttributes);
      }
    } catch (error) {
      console.error('상품 상세 정보 조회 실패:', error);
    }
  };

  const fetchBranchProducts = async () => {
    if (!item?.product?.id) return;
    
    try {
      const branchId = item.branchId || 1; // 본점
      const allBranchProducts = await inventoryService.getBranchProducts(branchId);
      
      // 해당 상품의 BranchProduct만 필터링
      const productBranchProducts = (allBranchProducts.data || allBranchProducts || [])
        .filter(bp => bp.productId === item.product.id);
      
      console.log('상세보기 - BranchProduct 목록:', productBranchProducts);
      setBranchProducts(productBranchProducts);
    } catch (error) {
      console.error('BranchProduct 조회 실패:', error);
      setBranchProducts([]);
    }
  };

  const fetchInventoryFlows = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      const productId = item.productId || item.product?.id;
      if (!productId) {
        console.warn('상품 ID를 찾을 수 없습니다.');
        setHistoryData([]);
        return;
      }
      
      const data = await inventoryService.getInventoryFlows(item.branchId || 1, productId);
      
      const filteredData = (data || []).filter(flow => {
        const flowProductId = flow.productId || flow.branchProduct?.productId || flow.product?.id;
        return !flowProductId || flowProductId === productId;
      });
      
      setHistoryData(filteredData);
    } catch (error) {
      console.error('입출고 내역 조회 실패:', error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // 속성별로 재고를 그룹화하는 함수 - 같은 상품의 모든 속성을 하나로 묶음
  const groupedInventory = useMemo(() => {
    if (!branchProducts.length) {
      return [];
    }

    // 속성이 없으면 단순 목록으로 표시
    if (!categoryAttributes.length) {
      return [{
        attributeDisplay: null,
        items: branchProducts
      }];
    }

    // 속성 타입들을 display_order 순으로 정렬
    const sortedAttributes = [...categoryAttributes].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    // 같은 상품의 BranchProduct들을 하나로 묶기
    const productMap = new Map(); // productId -> { attributes: [], branchProducts: [] }

    branchProducts.forEach(bp => {
      const productId = bp.productId;
      
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          attributes: [],
          branchProducts: []
        });
      }
      
      const productData = productMap.get(productId);
      productData.branchProducts.push(bp);
      
      // 속성 정보 수집
      if (bp.attributeTypeName && bp.attributeValueName) {
        const existingAttr = productData.attributes.find(attr => 
          attr.attributeTypeName === bp.attributeTypeName
        );
        
        if (!existingAttr) {
          productData.attributes.push({
            attributeTypeName: bp.attributeTypeName,
            attributeValueName: bp.attributeValueName
          });
        }
      }
    });

    // 상품 속성 값 데이터에서도 속성 정보 수집
    if (productAttributeValuesData.length > 0) {
      productMap.forEach((productData, productId) => {
        const productAttrs = productAttributeValuesData.filter(pav => 
          String(pav.productId || '') === String(productId)
        );
        
        productAttrs.forEach(pav => {
          const typeName = pav.attributeTypeName || pav.attributeType?.name;
          const valueName = pav.attributeValueName || pav.attributeValue?.name || pav.value;
          
          if (typeName && valueName) {
            const existingAttr = productData.attributes.find(attr => 
              attr.attributeTypeName === typeName
            );
            
            if (!existingAttr) {
              productData.attributes.push({
                attributeTypeName: typeName,
                attributeValueName: valueName
              });
            }
          }
        });
      });
    }

    // 속성 정보를 display_order 순으로 정렬
    productMap.forEach((productData) => {
      productData.attributes.sort((a, b) => {
        const aOrder = sortedAttributes.find(attr => 
          attr.attributeTypeName === a.attributeTypeName
        )?.displayOrder || 0;
        const bOrder = sortedAttributes.find(attr => 
          attr.attributeTypeName === b.attributeTypeName
        )?.displayOrder || 0;
        return aOrder - bOrder;
      });
    });

    // 결과 생성: 각 상품의 모든 속성을 한 줄로 표시
    const result = [];
    
    productMap.forEach((productData, productId) => {
      // 속성 정보를 "색상: 블랙, 사이즈: M" 형식으로 조합
      const attributeDisplay = productData.attributes.length > 0
        ? productData.attributes
            .map(attr => `${attr.attributeTypeName}: ${attr.attributeValueName}`)
            .join(', ')
        : null;

      // 첫 번째 BranchProduct를 기준으로 재고 정보 표시 (재고는 합산)
      const firstBP = productData.branchProducts[0];
      const totalStock = productData.branchProducts.reduce((sum, bp) => sum + (bp.stockQuantity || 0), 0);
      const totalReserved = productData.branchProducts.reduce((sum, bp) => sum + (bp.reservedQuantity || 0), 0);
      
      // 합산된 재고 정보를 가진 BranchProduct 생성
      const combinedBP = {
        ...firstBP,
        stockQuantity: totalStock,
        reservedQuantity: totalReserved,
        availableQuantity: totalStock - totalReserved
      };

          result.push({
        attributeDisplay,
        items: [combinedBP]
          });
      });

      return result;
  }, [branchProducts, categoryAttributes, productAttributeValuesData]);

  const getStatus = (stockQuantity, safetyStock) => {
    if (stockQuantity < safetyStock) return 'low';
    return 'normal';
  };

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '재고 상세보기'),
        React.createElement(HeaderButtons, null,
          React.createElement(CloseButton, { onClick: onClose }, '×')
        )
      ),
      React.createElement(ModalBody, null,
        React.createElement(InfoPanels, null,
          React.createElement(InfoPanel, null,
            React.createElement(PanelHeader, null,
              React.createElement('span', null, '🛍️'),
              '상품 정보'
            ),
            React.createElement(PanelContent, null,
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '상품명:'),
                React.createElement(InfoValue, null, item.product.name)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '카테고리명:'),
                React.createElement(InfoValue, null, productInfo?.category?.name || item.category || '미분류')
              ),
              groupedInventory.length > 0 && groupedInventory[0]?.attributeDisplay && React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '속성:'),
                React.createElement(InfoValue, null, groupedInventory[0].attributeDisplay)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '지점명:'),
                React.createElement(InfoValue, null, item.branch)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '최저가격:'),
                React.createElement(InfoValue, null, `₩${(productInfo?.minPrice || item.product?.minPrice || 0).toLocaleString()}`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '최고가격:'),
                React.createElement(InfoValue, null, `₩${(productInfo?.maxPrice || item.product?.maxPrice || 0).toLocaleString()}`)
              ),
            )
          )
        ),
        React.createElement(InventorySection, null,
          React.createElement(SectionHeader, null,
            React.createElement(SectionTitle, null, '재고 현황')
          ),
          branchProducts.length === 0 ? (
            React.createElement(EmptyMessage, null, '등록된 재고가 없습니다.')
          ) : categoryAttributes.length === 0 ? (
            // 속성이 없는 경우 단순 목록 표시
            React.createElement(React.Fragment, null,
              branchProducts.map((bp, index) => 
                React.createElement(AttributeGroup, { key: index },
                  React.createElement(InventoryDetails, null,
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '재고'),
                      React.createElement(DetailValue, null, `${bp.stockQuantity || 0}개`)
                    ),
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '안전재고'),
                      React.createElement(DetailValue, null, `${bp.safetyStock || 0}개`)
                    ),
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '판매가'),
                      React.createElement(DetailValue, null, `₩${(bp.price || 0).toLocaleString()}`)
                    ),
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '상태'),
                      React.createElement(StatusBadge, { 
                        status: getStatus(bp.stockQuantity || 0, bp.safetyStock || 0) 
                      }, getStatus(bp.stockQuantity || 0, bp.safetyStock || 0) === 'low' ? '부족' : '정상')
                    )
                  )
                )
              )
            )
          ) : (
            // 속성이 있는 경우 - 재고 정보만 표시 (속성 정보는 상품 정보 패널에 표시됨)
            groupedInventory.map((group, groupIndex) => 
              React.createElement(AttributeGroup, { key: groupIndex },
                group.items.map((bp, itemIndex) =>
                  React.createElement(InventoryDetails, { key: itemIndex },
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '재고'),
                      React.createElement(DetailValue, null, `${bp.stockQuantity || 0}개`)
                    ),
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '안전재고'),
                      React.createElement(DetailValue, null, `${bp.safetyStock || 0}개`)
                    ),
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '판매가'),
                      React.createElement(DetailValue, null, `₩${(bp.price || 0).toLocaleString()}`)
                    ),
                    React.createElement(DetailItem, null,
                      React.createElement(DetailLabel, null, '상태'),
                      React.createElement(StatusBadge, { 
                        status: getStatus(bp.stockQuantity || 0, bp.safetyStock || 0) 
                      }, getStatus(bp.stockQuantity || 0, bp.safetyStock || 0) === 'low' ? '부족' : '정상')
                    )
                  )
                )
              )
            )
          )
        ),
        React.createElement(HistorySection, null,
          React.createElement(SectionHeader, null,
            React.createElement(SectionTitle, null, '재고 변동 이력')
          ),
          React.createElement(Table, null,
            React.createElement(TableHeader, null,
              React.createElement('tr', null,
                React.createElement(TableHeaderCell, null, '일시'),
                React.createElement(TableHeaderCell, null, '구분'),
                React.createElement(TableHeaderCell, null, '수량'),
                React.createElement(TableHeaderCell, null, '사유'),
                React.createElement(TableHeaderCell, null, '비고')
              )
            ),
            React.createElement(TableBody, null,
              loading ? 
                React.createElement(TableRow, null,
                  React.createElement(TableCell, { colSpan: 5, style: { textAlign: 'center', padding: '20px' } }, '로딩 중...')
                ) :
                historyData.length === 0 ?
                  React.createElement(TableRow, null,
                    React.createElement(TableCell, { colSpan: 5, style: { textAlign: 'center', padding: '20px' } }, '입출고 내역이 없습니다.')
                  ) :
                  historyData.map((history, index) => {
                    const inQty = history.inQuantity || 0;
                    const outQty = history.outQuantity || 0;
                    const netChange = inQty - outQty;
                    
                    let type, quantity;
                    if (netChange > 0) {
                      type = '입고';
                      quantity = `+${netChange}`;
                    } else if (netChange < 0) {
                      type = '출고';
                      quantity = `${netChange}`;
                    } else if (inQty > 0 && outQty > 0) {
                      type = '조정';
                      quantity = `입${inQty}/출${outQty}`;
                    } else {
                      type = '조정';
                      quantity = '0';
                    }
                    const date = new Date(history.createdAt).toLocaleString('ko-KR');
                    
                    return React.createElement(TableRow, { key: index },
                      React.createElement(TableCell, { $date: true }, date),
                      React.createElement(TableCell, null,
                        React.createElement(TypeBadge, { type }, type)
                      ),
                      React.createElement(TableCell, { $quantity: true }, quantity),
                      React.createElement(TableCell, null, history.reason || '-'),
                      React.createElement(TableCell, { $remark: true }, history.remark || '-')
                    );
                  })
            )
          )
        )
      )
    )
  );
}

export default InventoryDetailModal;
