import React from 'react';
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

const InfoSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #6b46c1;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const InfoLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
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

function EditPurchaseOrderModal({ isOpen, onClose, item }) {
  if (!isOpen || !item) return null;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, `발주 상세 - ${item.id}`),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(InfoSection, null,
          React.createElement(SectionTitle, null, '기본 정보'),
          React.createElement(InfoRow, null,
            React.createElement(InfoLabel, null, '지점명'),
            React.createElement(InfoValue, null, item.branch)
          ),
          React.createElement(InfoRow, null,
            React.createElement(InfoLabel, null, '발주일'),
            React.createElement(InfoValue, null, item.orderDate)
          ),
          React.createElement(InfoRow, null,
            React.createElement(InfoLabel, null, '배송예정일'),
            React.createElement(InfoValue, null, item.deliveryDate || '-')
          ),
          React.createElement(InfoRow, null,
            React.createElement(InfoLabel, null, '발주 상태'),
            React.createElement(InfoValue, null, item.status === 'pending' ? '대기중' : item.status === 'completed' ? '완료' : item.status)
          )
        ),
        React.createElement(InfoSection, null,
          React.createElement(SectionTitle, null, '상품 목록'),
          React.createElement(ProductTable, null,
            React.createElement(ProductTableHeader, null,
              React.createElement('tr', null,
                React.createElement(ProductTableHeaderCell, null, '상품명'),
                React.createElement(ProductTableHeaderCell, null, '수량'),
                React.createElement(ProductTableHeaderCell, null, '단가'),
                React.createElement(ProductTableHeaderCell, null, '금액')
              )
            ),
            React.createElement(ProductTableBody, null,
              (item.products || []).map((product, index) =>
                React.createElement(ProductTableRow, { key: index },
                  React.createElement(ProductTableCell, null, product.name),
                  React.createElement(ProductTableCell, null, `${product.quantity}개`),
                  React.createElement(ProductTableCell, null, `₩${formatAmount(product.unitPrice)}`),
                  React.createElement(ProductTableCell, null, `₩${formatAmount(product.amount)}`)
                )
              )
            )
          ),
          React.createElement(TotalRow, null, `총 금액: ₩${formatAmount((item.products || []).reduce((sum, product) => sum + product.amount, 0))}`)
        )
      )
    )
  );
}

export default EditPurchaseOrderModal;
