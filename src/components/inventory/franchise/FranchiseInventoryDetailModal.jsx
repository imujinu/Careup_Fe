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
  z-index: 10000;
`;

const ModalContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  width: 900px;
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

const StatusBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$status === 'normal' ? '#dcfce7' : '#fef2f2'};
  color: ${props => props.$status === 'normal' ? '#166534' : '#dc2626'};
`;

const HistorySection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
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
    if (props.type === '예약') return '#fef3c7';
    if (props.type === '예약해제') return '#f3f4f6';
    return '#f3f4f6';
  }};
  color: ${props => {
    if (props.type === '입고') return '#166534';
    if (props.type === '출고') return '#dc2626';
    if (props.type === '조정') return '#2563eb';
    if (props.type === '예약') return '#92400e';
    if (props.type === '예약해제') return '#374151';
    return '#374151';
  }};
`;

function FranchiseInventoryDetailModal({ isOpen, onClose, item }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productInfo, setProductInfo] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      fetchInventoryFlows();
      fetchProductDetails();
    }
  }, [isOpen, item]);
  
  const fetchProductDetails = async () => {
    if (!item?.product?.id) return;
    
    try {
      const response = await inventoryService.getProduct(item.product.id);
      const productData = response.data?.data || response.data;
      setProductInfo(productData);
    } catch (error) {
      console.error('상품 상세 정보 조회 실패:', error);
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
      
      const branchId = item.branchId || 1;
      const data = await inventoryService.getInventoryFlows(branchId, productId);
      
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

  if (!isOpen || !item) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '재고 상세보기'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
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
                React.createElement(InfoValue, null, item.product?.name || '알 수 없음')
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '카테고리:'),
                React.createElement(InfoValue, null, item.category || '미분류')
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '공급가:'),
                React.createElement(InfoValue, null, `₩${(item.unitPrice || 0).toLocaleString()}`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '판매가:'),
                React.createElement(InfoValue, null, item.salesPrice ? `₩${item.salesPrice.toLocaleString()}` : '-')
              ),
            )
          ),
          React.createElement(InfoPanel, null,
            React.createElement(PanelHeader, null,
              React.createElement('span', null, '📋'),
              '재고 현황'
            ),
            React.createElement(PanelContent, null,
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '현재고:'),
                React.createElement(InfoValue, null, `${item.currentStock || 0}개`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '안전재고:'),
                React.createElement(InfoValue, null, `${item.safetyStock || 0}개`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '상태:'),
                React.createElement(StatusBadge, { $status: item.status || 'normal' }, 
                  item.status === 'low' ? '부족' : '정상'
                )
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '총 가치:'),
                React.createElement(InfoValue, null, `₩${(item.totalValue || 0).toLocaleString()}`)
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
                React.createElement(TableHeaderCell, null, '비고')
              )
            ),
            React.createElement(TableBody, null,
              loading ? 
                React.createElement(TableRow, null,
                  React.createElement(TableCell, { colSpan: 4, style: { textAlign: 'center', padding: '20px' } }, '로딩 중...')
                ) :
                historyData.length === 0 ?
                  React.createElement(TableRow, null,
                    React.createElement(TableCell, { colSpan: 4, style: { textAlign: 'center', padding: '20px' } }, '변동 이력이 없습니다.')
                  ) :
                  historyData.map((history, index) => {
                    const inQty = history.inQuantity || 0;
                    const outQty = history.outQuantity || 0;
                    const netChange = inQty - outQty;
                    const remark = history.remark || '-';
                    
                    let type, quantity;
                    
                    // 예약 관련 처리
                    if (remark.includes('예약:') || remark.includes('예약')) {
                      if (remark.includes('해제')) {
                        type = '예약해제';
                        const match = remark.match(/\(수량:\s*(\d+)\)/);
                        quantity = match ? `-${match[1]}` : '-';
                      } else {
                        type = '예약';
                        const match = remark.match(/\(수량:\s*(\d+)\)/);
                        quantity = match ? `+${match[1]}` : '+';
                      }
                    } else if (netChange > 0) {
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
                    
                    const date = new Date(history.createdAt || history.createAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    return React.createElement(TableRow, { key: index },
                      React.createElement(TableCell, null, date),
                      React.createElement(TableCell, null,
                        React.createElement(TypeBadge, { type }, type)
                      ),
                      React.createElement(TableCell, null, quantity),
                      React.createElement(TableCell, null, remark)
                    );
                  })
            )
          )
        )
      )
    )
  );
}

export default FranchiseInventoryDetailModal;

