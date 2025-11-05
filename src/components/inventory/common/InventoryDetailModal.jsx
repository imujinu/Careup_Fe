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
  width: 1000px;
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
  grid-template-columns: repeat(2, 1fr);
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
  padding: 12px 16px 12px 48px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
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

function InventoryDetailModal({ isOpen, onClose, item }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);
  const [branchProducts, setBranchProducts] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState([]);

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
      
      // 카테고리 속성 조회
      if (productData?.category?.id) {
        try {
          const attributes = await inventoryService.getCategoryAttributes(productData.category.id);
          setCategoryAttributes(attributes || []);
        } catch (error) {
          console.error('카테고리 속성 조회 실패:', error);
          setCategoryAttributes([]);
        }
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

  // 속성별로 재고를 그룹화하는 함수
  const groupedInventory = useMemo(() => {
    if (!branchProducts.length) {
      return [];
    }

    // 속성이 없으면 단순 목록으로 표시
    if (!categoryAttributes.length) {
      return [{
        attributeTypeName: null,
        attributeValueName: null,
        items: branchProducts
      }];
    }

    // 속성 타입들을 display_order 순으로 정렬
    const sortedAttributes = [...categoryAttributes].sort((a, b) => 
      (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    const firstAttributeType = sortedAttributes[0];
    const hasSecondAttribute = sortedAttributes.length > 1;

    // 첫 번째 속성 타입의 값으로 그룹화
    const grouped = {};

    branchProducts.forEach(bp => {
      // API 응답에서 직접 속성 정보 가져오기
      const attributeTypeName = bp.attributeTypeName;
      const attributeValueName = bp.attributeValueName;

      if (!attributeTypeName || !attributeValueName) {
        // 속성 정보가 없는 경우
        if (!grouped['_no_attribute']) {
          grouped['_no_attribute'] = {
            attributeTypeName: null,
            attributeValueName: null,
            items: []
          };
        }
        grouped['_no_attribute'].items.push(bp);
        return;
      }

      // 첫 번째 속성 타입의 값으로 그룹화
      const groupKey = `${attributeTypeName}_${attributeValueName}`;
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          attributeTypeName,
          attributeValueName,
          items: []
        };
      }
      grouped[groupKey].items.push(bp);
    });

    // 두 번째 속성 타입이 있으면 하위 그룹화
    if (hasSecondAttribute) {
      const secondAttributeType = sortedAttributes[1];
      const result = [];

      Object.values(grouped).forEach(group => {
        const subGrouped = {};
        
        group.items.forEach(bp => {
          // 각 BranchProduct는 하나의 속성 값만 가지고 있으므로
          // 첫 번째 속성 타입의 값인지 두 번째 속성 타입의 값인지 확인
          const bpAttributeTypeName = bp.attributeTypeName;
          
          if (bpAttributeTypeName === secondAttributeType.attributeTypeName) {
            // 두 번째 속성 타입의 값인 경우
            const subGroupKey = `${bpAttributeTypeName}_${bp.attributeValueName}`;
            if (!subGrouped[subGroupKey]) {
              subGrouped[subGroupKey] = {
                attributeTypeName: bpAttributeTypeName,
                attributeValueName: bp.attributeValueName,
                items: []
              };
            }
            subGrouped[subGroupKey].items.push(bp);
          } else {
            // 첫 번째 속성 타입의 값인 경우 (하위 그룹 없음)
            if (!subGrouped['_no_sub']) {
              subGrouped['_no_sub'] = {
                attributeTypeName: null,
                attributeValueName: null,
                items: []
              };
            }
            subGrouped['_no_sub'].items.push(bp);
          }
        });

        // 하위 그룹이 있으면 추가
        if (Object.keys(subGrouped).length > 0) {
          result.push({
            ...group,
            subGroups: Object.values(subGrouped)
          });
        } else {
          // 하위 그룹이 없으면 그대로 추가
          result.push(group);
        }
      });

      return result;
    }

    // 속성 타입이 하나만 있는 경우
    return Object.values(grouped);
  }, [branchProducts, categoryAttributes]);

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
          React.createElement(PrintButton, null,
            React.createElement('span', null, '🖨️'),
            '인쇄'
          ),
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
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '최저가격:'),
                React.createElement(InfoValue, null, `₩${(productInfo?.minPrice || item.product?.minPrice || 0).toLocaleString()}`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '최고가격:'),
                React.createElement(InfoValue, null, `₩${(productInfo?.maxPrice || item.product?.maxPrice || 0).toLocaleString()}`)
              ),
            )
          ),
          React.createElement(InfoPanel, null,
            React.createElement(PanelHeader, null,
              React.createElement('span', null, '🏢'),
              '지점 정보'
            ),
            React.createElement(PanelContent, null,
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '지점명:'),
                React.createElement(InfoValue, null, item.branch)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '지점 ID:'),
                React.createElement(InfoValue, null, item.branchId || 1)
              )
            )
          )
        ),
        React.createElement(InventorySection, null,
          React.createElement(SectionHeader, null,
            React.createElement(SectionTitle, null, '속성별 재고 현황')
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
            // 속성이 있는 경우 계층 구조 표시
            groupedInventory.map((group, groupIndex) => {
              // 하위 그룹이 있는 경우 (속성 타입이 2개 이상)
              if (group.subGroups) {
                return React.createElement(AttributeGroup, { key: groupIndex },
                  React.createElement(AttributeGroupHeader, null, 
                    `${group.attributeTypeName}: ${group.attributeValueName}`
                  ),
                  group.subGroups.map((subGroup, subIndex) => 
                    React.createElement(AttributeValueGroup, { key: subIndex },
                      subGroup.attributeTypeName && subGroup.attributeValueName !== '-' ? (
                        React.createElement(AttributeValueHeader, null,
                          `${subGroup.attributeTypeName}: ${subGroup.attributeValueName}`
                        )
                      ) : null,
                      subGroup.items.map((bp, itemIndex) =>
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
                );
              } else {
                // 하위 그룹이 없는 경우 (속성 타입이 1개)
                return React.createElement(AttributeGroup, { key: groupIndex },
                  React.createElement(AttributeGroupHeader, null, 
                    `${group.attributeTypeName}: ${group.attributeValueName}`
                  ),
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
                );
              }
            })
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
                React.createElement(TableHeaderCell, null, '속성'),
                React.createElement(TableHeaderCell, null, '사유'),
                React.createElement(TableHeaderCell, null, '비고')
              )
            ),
            React.createElement(TableBody, null,
              loading ? 
                React.createElement(TableRow, null,
                  React.createElement(TableCell, { colSpan: 6, style: { textAlign: 'center', padding: '20px' } }, '로딩 중...')
                ) :
                historyData.length === 0 ?
                  React.createElement(TableRow, null,
                    React.createElement(TableCell, { colSpan: 6, style: { textAlign: 'center', padding: '20px' } }, '입출고 내역이 없습니다.')
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
                    const attributeInfo = history.attributeTypeName && history.attributeValueName
                      ? `${history.attributeTypeName} ${history.attributeValueName}`
                      : '-';
                    
                    return React.createElement(TableRow, { key: index },
                      React.createElement(TableCell, null, date),
                      React.createElement(TableCell, null,
                        React.createElement(TypeBadge, { type }, type)
                      ),
                      React.createElement(TableCell, null, quantity),
                      React.createElement(TableCell, null, attributeInfo),
                      React.createElement(TableCell, null, history.reason || '-'),
                      React.createElement(TableCell, null, history.remark || '-')
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
