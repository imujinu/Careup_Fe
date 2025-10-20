import React, { useState } from 'react';
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

const SearchFilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  color: #9ca3af;
  font-size: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 16px;
    height: 16px;
    opacity: 0.6;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 48px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  outline: none;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const CategorySelect = styled.select`
  height: 44px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  min-width: 150px;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const ProductSection = styled.div`
  margin-bottom: 24px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin: 0;
`;

const SelectedCount = styled.div`
  font-size: 14px;
  color: #6b46c1;
  font-weight: 500;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
`;

const ProductCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #6b46c1;
    box-shadow: 0 2px 4px rgba(107, 70, 193, 0.1);
  }
`;

const ProductHeader = styled.div`
  margin-bottom: 12px;
`;

const ProductName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
`;

const ProductId = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const ProductCategory = styled.span`
  display: inline-block;
  padding: 2px 8px;
  background: #e5e7eb;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  border-radius: 12px;
`;

const ProductPrice = styled.div`
  font-size: 14px;
  color: #1f2937;
  font-weight: 600;
  margin: 8px 0;
`;

const QuantitySection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuantityLabel = styled.label`
  font-size: 14px;
  color: #374151;
  font-weight: 500;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #f3f4f6;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const QuantityInput = styled.input`
  width: 60px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button`
  height: 44px;
  padding: 0 24px;
  border: none;
  border-radius: 8px;
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

const OrderRequestButton = styled(Button)`
  background: #6b46c1;
  color: #ffffff;
  
  &:hover {
    background: #553c9a;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function OrderRequestModal({ isOpen, onClose, onOrderRequest }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});

  const products = [
    {
      id: 'MATERIAL-001',
      name: '커피원두',
      category: '원재료',
      unit: 'kg',
      unitPrice: 15000
    },
    {
      id: 'MATERIAL-002',
      name: '우유',
      category: '원재료',
      unit: 'L',
      unitPrice: 3000
    },
    {
      id: 'MATERIAL-003',
      name: '크로와상 반죽',
      category: '원재료',
      unit: 'kg',
      unitPrice: 12000
    },
    {
      id: 'MATERIAL-004',
      name: '쿠키반죽',
      category: '원재료',
      unit: 'kg',
      unitPrice: 8000
    },
    {
      id: 'MATERIAL-005',
      name: '치즈케이크',
      category: '원재료',
      unit: 'ea',
      unitPrice: 25000
    },
    {
      id: 'MATERIAL-006',
      name: '선타',
      category: '원재료',
      unit: 'kg',
      unitPrice: 7000
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleQuantityChange = (productId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    if (numQuantity < 0) return;
    
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: numQuantity
    }));
  };

  const handleQuantityIncrease = (productId) => {
    const currentQuantity = selectedProducts[productId] || 0;
    handleQuantityChange(productId, currentQuantity + 1);
  };

  const handleQuantityDecrease = (productId) => {
    const currentQuantity = selectedProducts[productId] || 0;
    if (currentQuantity > 0) {
      handleQuantityChange(productId, currentQuantity - 1);
    }
  };

  const handleOrderRequest = () => {
    const orderItems = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product.name,
          quantity,
          unit: product.unit,
          unitPrice: product.unitPrice,
          totalPrice: quantity * product.unitPrice
        };
      });

    if (orderItems.length === 0) {
      alert('발주할 상품을 선택해주세요.');
      return;
    }

    onOrderRequest(orderItems);
    onClose();
  };

  const selectedCount = Object.values(selectedProducts).filter(qty => qty > 0).length;

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, { onClick: onClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '발주 요청'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(SearchFilterSection, null,
          React.createElement(SearchContainer, null,
            React.createElement(SearchIcon, null,
              React.createElement('img', {
                src: '/header-search.svg',
                alt: '돋보기',
                style: { width: '16px', height: '16px' }
              })
            ),
            React.createElement(SearchInput, {
              type: 'text',
              placeholder: '상품명 또는 SKU로 검색...',
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value)
            })
          ),
          React.createElement(CategorySelect, {
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value)
          },
            React.createElement('option', { value: '' }, '전체 카테고리'),
            React.createElement('option', { value: '원재료' }, '원재료'),
            React.createElement('option', { value: '포장재' }, '포장재')
          )
        ),
        React.createElement(ProductSection, null,
          React.createElement(SectionHeader, null,
            React.createElement(SectionTitle, null, `상품 선택 (${filteredProducts.length}개)`),
            React.createElement(SelectedCount, null, `선택된 상품: ${selectedCount}개`)
          ),
          React.createElement(ProductGrid, null,
            filteredProducts.map((product) =>
              React.createElement(ProductCard, { key: product.id },
                React.createElement(ProductHeader, null,
                  React.createElement(ProductName, null, product.name),
                  React.createElement(ProductId, null, product.id),
                  React.createElement(ProductCategory, null, product.category)
                ),
                React.createElement(ProductPrice, null, `₩${product.unitPrice.toLocaleString()}/${product.unit}`),
                React.createElement(QuantitySection, null,
                  React.createElement(QuantityLabel, null, `수량(${product.unit})`),
                  React.createElement(QuantityControls, null,
                    React.createElement(QuantityButton, {
                      onClick: () => handleQuantityDecrease(product.id),
                      disabled: (selectedProducts[product.id] || 0) <= 0
                    }, '-'),
                    React.createElement(QuantityInput, {
                      type: 'number',
                      value: selectedProducts[product.id] || 0,
                      onChange: (e) => handleQuantityChange(product.id, e.target.value),
                      min: 0
                    }),
                    React.createElement(QuantityButton, {
                      onClick: () => handleQuantityIncrease(product.id)
                    }, '+')
                  )
                )
              )
            )
          )
        ),
        React.createElement(Footer, null,
          React.createElement(CancelButton, { onClick: onClose }, '취소'),
          React.createElement(OrderRequestButton, {
            onClick: handleOrderRequest,
            disabled: selectedCount === 0
          }, '발주 요청')
        )
      )
    )
  );
}

export default OrderRequestModal;
