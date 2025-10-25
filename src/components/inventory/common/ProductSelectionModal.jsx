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
  max-width: 800px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
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
  max-height: 60vh;
  overflow-y: auto;
`;

const SearchContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const CategorySelect = styled.select`
  height: 40px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  min-width: 120px;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
`;

const ProductCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$selected ? '#f3f4f6' : '#ffffff'};
  border-color: ${props => props.$selected ? '#6b46c1' : '#e5e7eb'};
  
  &:hover {
    border-color: #6b46c1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const ProductName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
`;

const ProductInfo = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const ProductPrice = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #059669;
  margin-top: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
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

const NextButton = styled.button`
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
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

function ProductSelectionModal({ isOpen, onClose, onNext, existingProducts = [] }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, existingProducts]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // 본사 상품 목록 조회 (모든 상품)
      const response = await inventoryService.getBranchProducts(1); // 본사 branchId = 1
      setProducts(response || []);
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // 이미 등록된 상품 제외
    const existingProductIds = existingProducts.map(item => item.product?.id || item.productId);
    filtered = filtered.filter(product => 
      !existingProductIds.includes(product.productId)
    );

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(product => 
        product.categoryName === categoryFilter
      );
    }

    setFilteredProducts(filtered);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  const handleNext = () => {
    if (selectedProduct) {
      onNext(selectedProduct);
    }
  };

  const handleClose = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setCategoryFilter('');
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, { onClick: handleClose },
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '상품 선택'),
        React.createElement(CloseButton, { onClick: handleClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(SearchContainer, null,
          React.createElement(SearchInput, {
            type: 'text',
            placeholder: '상품명으로 검색...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value)
          }),
          React.createElement(CategorySelect, {
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value)
          },
            React.createElement('option', { value: '' }, '전체 카테고리'),
            React.createElement('option', { value: '음료' }, '음료'),
            React.createElement('option', { value: '디저트' }, '디저트'),
            React.createElement('option', { value: '빵' }, '빵'),
            React.createElement('option', { value: '원두' }, '원두')
          )
        ),
        loading ? 
          React.createElement('div', { style: { textAlign: 'center', padding: '40px' } }, '로딩 중...') :
          filteredProducts.length === 0 ?
            React.createElement('div', { 
              style: { 
                textAlign: 'center', 
                padding: '40px',
                color: '#6b7280'
              } 
            }, 
              React.createElement('div', { style: { fontSize: '18px', marginBottom: '8px' } }, '📦'),
              React.createElement('div', { style: { fontSize: '16px', fontWeight: '600', marginBottom: '4px' } }, '등록 가능한 상품이 없습니다'),
              React.createElement('div', { style: { fontSize: '14px' } }, '모든 상품이 이미 등록되었거나 검색 조건에 맞는 상품이 없습니다.')
            ) :
            React.createElement(ProductGrid, null,
              filteredProducts.map((product) =>
                React.createElement(ProductCard, {
                  key: product.productId,
                  $selected: selectedProduct?.productId === product.productId,
                  onClick: () => handleProductSelect(product)
                },
                  React.createElement(ProductName, null, product.productName || '알 수 없음'),
                  React.createElement(ProductInfo, null, `카테고리: ${product.categoryName || '미분류'}`),
                  React.createElement(ProductInfo, null, `설명: ${product.productDescription || '-'}`),
                  React.createElement(ProductPrice, null, `공급가: ₩${product.price?.toLocaleString() || 0}`)
                )
              )
            ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: handleClose }, '취소'),
          React.createElement(NextButton, {
            onClick: handleNext,
            disabled: !selectedProduct
          }, '다음')
        )
      )
    )
  );
}

export default ProductSelectionModal;
