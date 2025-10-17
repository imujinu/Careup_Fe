import React, { useState } from 'react';
import styled from 'styled-components';
import CancelOrderModal from './CancelOrderModal';

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

const CancelOrderButton = styled.button`
  height: 36px;
  padding: 0 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #dc2626;
  }
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

const InfoPanels = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  background: #fef3c7;
  color: #92400e;
`;

const TabSection = styled.div`
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 24px;
`;

const TabHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
`;

const TabButton = styled.button`
  flex: 1;
  padding: 16px;
  border: none;
  background: ${props => props.active ? '#ffffff' : '#f9fafb'};
  color: ${props => props.active ? '#6b46c1' : '#6b7280'};
  font-size: 14px;
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: ${props => props.active ? '2px solid #6b46c1' : '2px solid transparent'};
  
  &:hover {
    background: #ffffff;
  }
`;

const TabContent = styled.div`
  padding: 24px;
`;

const ProductTable = styled.table`
  width: 100%;
  border-collapse: collapse;
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

const ProductNameCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: center;
  gap: 8px;
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

const StatusTracking = styled.div`
  margin-bottom: 24px;
`;

const StatusTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
`;

const StatusSteps = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const StatusStep = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 20px;
    right: -50%;
    width: 100%;
    height: 2px;
    background: ${props => props.completed ? '#6b46c1' : '#e5e7eb'};
    z-index: 1;
  }
`;

const StatusIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: ${props => {
    if (props.completed) return '#6b46c1';
    if (props.current) return '#f3f4f6';
    return '#e5e7eb';
  }};
  color: ${props => {
    if (props.completed) return '#ffffff';
    if (props.current) return '#6b46c1';
    return '#9ca3af';
  }};
  z-index: 2;
  position: relative;
`;

const StatusText = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.completed ? '#6b46c1' : '#6b7280'};
  text-align: center;
`;

const StatusDate = styled.div`
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
`;

const DeliveryInfo = styled.div`
  background: #f9fafb;
  padding: 16px;
  border-radius: 6px;
`;

const DeliveryTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const DeliveryAddress = styled.div`
  font-size: 14px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
`;

function FranchisePurchaseOrderDetailModal({ isOpen, onClose, item }) {
  const [activeTab, setActiveTab] = useState('products');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (!isOpen || !item) return null;

  const productData = [
    {
      name: '원두',
      serialNumber: '20250918001',
      category: '자재',
      quantity: 50,
      unit: 'kg',
      unitPrice: 4500,
      amount: 225000
    },
    {
      name: '설탕',
      serialNumber: '20250918002',
      category: '자재',
      quantity: 30,
      unit: 'kg',
      unitPrice: 5500,
      amount: 165000
    },
    {
      name: '우유',
      serialNumber: '20250918003',
      category: '자재',
      quantity: 20,
      unit: 'L',
      unitPrice: 6500,
      amount: 130000
    },
    {
      name: '종이컵',
      serialNumber: '20250918004',
      category: '포장재',
      quantity: 40,
      unit: '박스',
      unitPrice: 5000,
      amount: 200000
    },
    {
      name: '빨대',
      serialNumber: '20250918005',
      category: '포장재',
      quantity: 60,
      unit: '봉지',
      unitPrice: 3000,
      amount: 180000
    }
  ];

  const totalAmount = productData.reduce((sum, product) => sum + product.amount, 0);
  const totalQuantity = productData.reduce((sum, product) => sum + product.quantity, 0);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return '대기중';
      case 'inProgress': return '처리중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  const handleCancelOrder = () => {
    setIsCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setIsCancelModalOpen(false);
  };

  const handleConfirmCancel = (reason) => {
    console.log('Order cancelled:', { orderId: item.id, reason });
    // 여기에 실제 취소 로직을 구현
    handleCloseCancelModal();
  };

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, `발주 상세보기 ${item.id}`),
        React.createElement(HeaderButtons, null,
          React.createElement(PrintButton, null,
            React.createElement('span', null, '🖨️'),
            '인쇄'
          ),
          React.createElement(CancelOrderButton, { onClick: handleCancelOrder },
            React.createElement('span', null, '×'),
            '발주취소'
          ),
          React.createElement(CloseButton, { onClick: onClose }, '×')
        )
      ),
      React.createElement(ModalBody, null,
        React.createElement(InfoPanels, null,
          React.createElement(InfoPanel, null,
            React.createElement(PanelHeader, null,
              React.createElement('span', null, '🏢'),
              '지점 정보'
            ),
            React.createElement(PanelContent, null,
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '지점명:'),
                React.createElement(InfoValue, null, '강남점')
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '주소:'),
                React.createElement(InfoValue, null, '서울시 강남구 테헤란로 123')
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '연락처:'),
                React.createElement(InfoValue, null, '02-1234-5678')
              )
            )
          ),
          React.createElement(InfoPanel, null,
            React.createElement(PanelHeader, null,
              React.createElement('span', null, '📅'),
              '발주 정보'
            ),
            React.createElement(PanelContent, null,
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '발주일:'),
                React.createElement(InfoValue, null, item.orderDate)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '배송예정일:'),
                React.createElement(InfoValue, null, item.deliveryDate)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '상태:'),
                React.createElement(StatusBadge, null, getStatusText(item.status))
              )
            )
          ),
          React.createElement(InfoPanel, null,
            React.createElement(PanelHeader, null,
              React.createElement('span', null, '₩'),
              '금액 정보'
            ),
            React.createElement(PanelContent, null,
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '총 상품 수:'),
                React.createElement(InfoValue, null, `${productData.length}개`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '총 수량:'),
                React.createElement(InfoValue, null, `${totalQuantity}개`)
              ),
              React.createElement(InfoRow, null,
                React.createElement(InfoLabel, null, '총 금액:'),
                React.createElement(InfoValue, null, `₩${formatAmount(totalAmount)}`)
              )
            )
          )
        ),
        React.createElement(TabSection, null,
          React.createElement(TabHeader, null,
            React.createElement(TabButton, {
              active: activeTab === 'products',
              onClick: () => setActiveTab('products')
            },
              React.createElement('span', null, '🛒'),
              '상품 목록'
            ),
            React.createElement(TabButton, {
              active: activeTab === 'status',
              onClick: () => setActiveTab('status')
            },
              React.createElement('span', null, '📋'),
              '발주 상태'
            )
          ),
          React.createElement(TabContent, null,
            activeTab === 'products' ? React.createElement('div', null,
              React.createElement(ProductTable, null,
                React.createElement(ProductTableHeader, null,
                  React.createElement('tr', null,
                    React.createElement(ProductTableHeaderCell, null, '상품명'),
                    React.createElement(ProductTableHeaderCell, null, '일련번호'),
                    React.createElement(ProductTableHeaderCell, null, '카테고리'),
                    React.createElement(ProductTableHeaderCell, null, '수량'),
                    React.createElement(ProductTableHeaderCell, null, '단가'),
                    React.createElement(ProductTableHeaderCell, null, '금액')
                  )
                ),
                React.createElement(ProductTableBody, null,
                  productData.map((product, index) =>
                    React.createElement(ProductTableRow, { key: index },
                      React.createElement(ProductNameCell, null,
                        React.createElement('span', { style: { fontSize: '12px', color: '#9ca3af' } }, '📦'),
                        product.name
                      ),
                      React.createElement(ProductTableCell, null, product.serialNumber),
                      React.createElement(ProductTableCell, null, product.category),
                      React.createElement(ProductTableCell, null, `${product.quantity}${product.unit}`),
                      React.createElement(ProductTableCell, null, `₩${formatAmount(product.unitPrice)}`),
                      React.createElement(ProductTableCell, null, `₩${formatAmount(product.amount)}`)
                    )
                  )
                )
              ),
              React.createElement(TotalRow, null, `총 금액: ₩${formatAmount(totalAmount)}`)
            ) : React.createElement('div', null,
              React.createElement(StatusTracking, null,
                React.createElement(StatusTitle, null, '발주 상태 추적'),
                React.createElement(StatusSteps, null,
                  React.createElement(StatusStep, { completed: true },
                    React.createElement(StatusIcon, { completed: true }, '🚀'),
                    React.createElement(StatusText, { completed: true }, '발주 요청'),
                    React.createElement(StatusDate, null, '2025.09.18 14:30')
                  ),
                  React.createElement(StatusStep, { completed: true },
                    React.createElement(StatusIcon, { completed: true }, '✅'),
                    React.createElement(StatusText, { completed: true }, '발주 승인'),
                    React.createElement(StatusDate, null, '2025.09.18 15:45')
                  ),
                  React.createElement(StatusStep, { current: true },
                    React.createElement(StatusIcon, { current: true }, '🚚'),
                    React.createElement(StatusText, { current: true }, '상품 배송'),
                    React.createElement(StatusDate, null, '예정')
                  ),
                  React.createElement(StatusStep, null,
                    React.createElement(StatusIcon, null, '🏠'),
                    React.createElement(StatusText, null, '배송 완료'),
                    React.createElement(StatusDate, null, '예정')
                  )
                )
              ),
              React.createElement(DeliveryInfo, null,
                React.createElement(DeliveryTitle, null, '배송 정보'),
                React.createElement(DeliveryAddress, null,
                  React.createElement('span', null, '📍'),
                  '서울시 강남구 테헤란로 123'
                )
              )
            )
          )
        )
      ),
      React.createElement(CancelOrderModal, {
        isOpen: isCancelModalOpen,
        onClose: handleCloseCancelModal,
        item: item,
        onConfirm: handleConfirmCancel
      })
    )
  );
}

export default FranchisePurchaseOrderDetailModal;
