import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import EditPurchaseOrderModal from './EditPurchaseOrderModal';
import PartialApproveModal from './PartialApproveModal';
import { purchaseOrderService } from '../../../service/purchaseOrderService';

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

const ApproveButton = styled.button`
  height: 36px;
  padding: 0 16px;
  background: #10b981;
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
    background: #059669;
  }
`;

const RejectButton = styled.button`
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

const PartialApproveButton = styled.button`
  height: 36px;
  padding: 0 16px;
  background: #f59e0b;
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
    background: #d97706;
  }
`;

const ModifyButton = styled.button`
  height: 36px;
  padding: 0 16px;
  background: #6b46c1;
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
    background: #553c9a;
  }
`;

const ShipButton = styled.button`
  height: 36px;
  padding: 0 16px;
  background: #3b82f6;
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
    background: #2563eb;
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

function PurchaseOrderDetailModal({ isOpen, onClose, item }) {
  const [activeTab, setActiveTab] = useState('products');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPartialApproveModalOpen, setIsPartialApproveModalOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  // 발주 상세 정보 조회
  useEffect(() => {
    if (isOpen && item?.id) {
      fetchOrderDetail();
    }
  }, [isOpen, item?.id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const data = await purchaseOrderService.getPurchaseOrder(item.id);
      setOrderDetail(data);
    } catch (error) {
      console.error('발주 상세 정보 조회 실패:', error);
      alert('발주 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  // 로딩 중이거나 데이터가 없으면 표시
  if (loading || !orderDetail) {
    return React.createElement(ModalOverlay, { onClick: onClose },
      React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
        React.createElement('div', { style: { padding: '40px', textAlign: 'center' } }, '로딩 중...')
      )
    );
  }

  // orderDetails를 productData로 변환
  const productData = orderDetail.orderDetails?.map(detail => ({
    name: detail.productName || `상품 ID: ${detail.productId}`,
    serialNumber: detail.productId,
    category: detail.categoryName || '미분류',
    quantity: detail.quantity,
    approvedQuantity: detail.approvedQuantity,
    unit: '개',
    unitPrice: detail.unitPrice,
    amount: detail.subtotalPrice
  })) || [];

  const totalAmount = orderDetail.totalPrice || productData.reduce((sum, product) => sum + product.amount, 0);
  const totalQuantity = productData.reduce((sum, product) => sum + product.quantity, 0);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const getStatusText = (status) => {
    // orderDetail이 있으면 API 상태 사용
    const currentStatus = orderDetail?.orderStatus || status;
    
    switch(currentStatus) {
      case 'PENDING': return '대기중';
      case 'APPROVED': return '승인됨';
      case 'REJECTED': return '반려됨';
      case 'PARTIAL': return '부분승인';
      case 'SHIPPED': return '배송중';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소됨';
      // 기존 상태명 호환
      case 'pending': return '대기중';
      case 'inProgress': return '처리중';
      case 'completed': return '완료';
      case 'cancelled': return '취소됨';
      default: return currentStatus;
    }
  };

  const handleModify = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = (formData) => {
    // 여기에 실제 저장 로직을 구현
    handleCloseEditModal();
  };

  // 발주 승인 (전체 수량 승인)
  const handleApprove = async () => {
    try {
      await purchaseOrderService.approvePurchaseOrder(item.id);
      alert('발주가 승인되었습니다.');
      onClose(); // 모달 닫기
      window.location.reload(); // 목록 새로고침
    } catch (error) {
      console.error('발주 승인 실패:', error);
      alert('발주 승인에 실패했습니다.');
    }
  };

  // 발주 반려 (발주 거부)
  const handleReject = async () => {
    try {
      await purchaseOrderService.rejectPurchaseOrder(item.id);
      alert('발주가 반려되었습니다.');
      onClose(); // 모달 닫기
      window.location.reload(); // 목록 새로고침
    } catch (error) {
      console.error('발주 반려 실패:', error);
      alert('발주 반려에 실패했습니다.');
    }
  };

  // 부분승인 모달 열기
  const handlePartialApproveClick = () => {
    setIsPartialApproveModalOpen(true);
  };

  // 부분승인 처리
  const handlePartialApprove = async (approvedData) => {
    try {
      await purchaseOrderService.partialApprovePurchaseOrder(item.id, approvedData);
      alert('발주가 부분승인되었습니다.');
      setIsPartialApproveModalOpen(false); // 부분승인 모달 닫기
      onClose(); // 상세 모달 닫기
      window.location.reload(); // 목록 새로고침
    } catch (error) {
      console.error('발주 부분승인 실패:', error);
      console.error('에러 응답:', error.response?.data);
      alert('발주 부분승인에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
    }
  };

  // 발주 배송 시작
  const handleShip = async () => {
    try {
      await purchaseOrderService.shipPurchaseOrder(item.id);
      alert('배송이 시작되었습니다.');
      onClose(); // 모달 닫기
      window.location.reload(); // 목록 새로고침
    } catch (error) {
      console.error('배송 시작 실패:', error);
      alert('배송 시작에 실패했습니다.');
    }
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
          orderDetail.orderStatus === 'PENDING' && React.createElement(ApproveButton, { onClick: handleApprove },
            React.createElement('span', null, '✅'),
            '승인'
          ),
          orderDetail.orderStatus === 'PENDING' && React.createElement(PartialApproveButton, { onClick: handlePartialApproveClick },
            React.createElement('span', null, '⚠️'),
            '부분승인'
          ),
          orderDetail.orderStatus === 'PENDING' && React.createElement(RejectButton, { onClick: handleReject },
            React.createElement('span', null, '❌'),
            '반려'
          ),
          (orderDetail.orderStatus === 'APPROVED' || orderDetail.orderStatus === 'PARTIAL') && React.createElement(ShipButton, { onClick: handleShip },
            React.createElement('span', null, '🚚'),
            '배송 시작'
          ),
          orderDetail.orderStatus !== 'PENDING' && orderDetail.orderStatus !== 'APPROVED' && orderDetail.orderStatus !== 'PARTIAL' && React.createElement(ModifyButton, { onClick: handleModify },
            React.createElement('span', null, '✏️'),
            '수정'
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
                React.createElement(InfoValue, null, item.branch)
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
                React.createElement(StatusBadge, null, getStatusText(orderDetail.orderStatus))
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
              React.createElement('span', null, '⚡'),
              '발주 상태'
            )
          ),
          React.createElement(TabContent, null,
            activeTab === 'products' ? React.createElement('div', null,
              React.createElement(ProductTable, null,
                React.createElement(ProductTableHeader, null,
                  React.createElement('tr', null,
                    React.createElement(ProductTableHeaderCell, null, '상품명'),
                    React.createElement(ProductTableHeaderCell, null, '카테고리'),
                    React.createElement(ProductTableHeaderCell, null, '수량'),
                    React.createElement(ProductTableHeaderCell, null, '단가'),
                    React.createElement(ProductTableHeaderCell, null, '금액')
                  )
                ),
                React.createElement(ProductTableBody, null,
                  productData.map((product, index) =>
                    React.createElement(ProductTableRow, { key: index },
                      React.createElement(ProductTableCell, null, product.name),
                      React.createElement(ProductTableCell, null, product.category),
                      React.createElement(ProductTableCell, null, `${product.quantity}개`),
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
      React.createElement(EditPurchaseOrderModal, {
        isOpen: isEditModalOpen,
        onClose: handleCloseEditModal,
        item: item,
        onSave: handleSaveEdit
      }),
      React.createElement(PartialApproveModal, {
        isOpen: isPartialApproveModalOpen,
        onClose: () => setIsPartialApproveModalOpen(false),
        products: productData.map(product => ({
          id: product.serialNumber, // productId
          name: product.name,
          quantity: product.quantity
        })),
        onApprove: handlePartialApprove
      })
    )
  );
}

export default PurchaseOrderDetailModal;
