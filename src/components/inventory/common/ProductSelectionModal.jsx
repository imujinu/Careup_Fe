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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categoryList, setCategoryList] = useState([]); // 카테고리 목록
  const [loading, setLoading] = useState(false);

  // 모달이 열릴 때 뒷단 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      fetchProducts();
      fetchCategories();
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
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
      const branchProducts = response || [];
      
      // 같은 상품(productId)을 그룹화하고, 각 그룹 내에서 속성 정보를 수집
      const productMap = new Map();
      
      for (const bp of branchProducts) {
        const productId = bp.productId;
        
        if (!productMap.has(productId)) {
          // 상품의 모든 속성 값 조회
          try {
            const attributes = await inventoryService.getProductAttributeValues(productId);
            productMap.set(productId, {
              productId: productId,
              productName: bp.productName,
              productDescription: bp.productDescription,
              categoryName: bp.categoryName,
              categoryId: bp.categoryId,
              allAttributes: attributes || [],
              branchProducts: []
            });
          } catch (err) {
            console.error(`상품 ${productId} 속성 조회 실패:`, err);
            productMap.set(productId, {
              productId: productId,
              productName: bp.productName,
              productDescription: bp.productDescription,
              categoryName: bp.categoryName,
              categoryId: bp.categoryId,
              allAttributes: [],
              branchProducts: []
            });
          }
        }
        
        productMap.get(productId).branchProducts.push(bp);
      }
      
      // 각 상품에 대해 속성 정보를 표시 형식으로 변환
      const productsWithAttributes = [];
      
      for (const [productId, productData] of productMap.entries()) {
        // 각 BranchProduct별로 속성 정보 생성
        for (const bp of productData.branchProducts) {
          // 이 BranchProduct의 속성 정보
          const currentAttributeType = bp.attributeTypeName;
          const currentAttributeValue = bp.attributeValueName;
          
          // 상품의 모든 속성 중에서 이 BranchProduct와 관련된 속성들을 찾아서 표시
          const attributeGroups = {};
          
          // 현재 BranchProduct의 속성 ID 찾기
          let currentAttributeValueId = bp.attributeValueId || null;
          
          // 상품 마스터의 속성에서 현재 속성 값과 일치하는 ID 찾기
          if (currentAttributeType && currentAttributeValue && productData.allAttributes) {
            const matchedAttr = productData.allAttributes.find(attr => {
              const typeName = attr.attributeTypeName || attr.attributeType?.name;
              const valueName = attr.displayName || attr.value || '';
              return typeName === currentAttributeType && valueName === currentAttributeValue;
            });
            if (matchedAttr && !currentAttributeValueId) {
              currentAttributeValueId = matchedAttr.attributeValueId || matchedAttr.id || null;
            }
          }
          
          // 현재 BranchProduct의 속성 추가
          if (currentAttributeType && currentAttributeValue) {
            attributeGroups[currentAttributeType] = {
              typeName: currentAttributeType,
              values: [currentAttributeValue]
            };
          }
          
          // 상품 마스터의 다른 속성들도 추가 (같은 속성 타입의 다른 값들)
          if (productData.allAttributes && productData.allAttributes.length > 0) {
            productData.allAttributes.forEach(attr => {
              const typeId = attr.attributeTypeId || attr.attributeType?.id;
              const typeName = attr.attributeTypeName || attr.attributeType?.name;
              const valueName = attr.displayName || attr.value || '-';
              
              if (typeName && typeName === currentAttributeType) {
                // 같은 속성 타입이면 기존 그룹에 추가
                if (!attributeGroups[typeName]) {
                  attributeGroups[typeName] = {
                    typeName: typeName,
                    values: []
                  };
                }
                if (!attributeGroups[typeName].values.includes(valueName)) {
                  attributeGroups[typeName].values.push(valueName);
                }
              } else if (typeName && typeName !== currentAttributeType) {
                // 다른 속성 타입도 추가 (상품에 등록된 모든 속성 표시)
                if (!attributeGroups[typeName]) {
                  attributeGroups[typeName] = {
                    typeName: typeName,
                    values: []
                  };
                }
                if (!attributeGroups[typeName].values.includes(valueName)) {
                  attributeGroups[typeName].values.push(valueName);
                }
              }
            });
          }
          
          // 속성 표시 문자열 생성 (예: "사이즈: L, 색상: 브라운")
          const attributeDisplayParts = Object.values(attributeGroups).map(group => {
            return `${group.typeName}: ${group.values.join(', ')}`;
          });
          const attributeDisplay = attributeDisplayParts.length > 0 
            ? attributeDisplayParts.join(', ')
            : null;
          
          productsWithAttributes.push({
            ...bp,
            attributeDisplay: attributeDisplay,
            attributeValueId: currentAttributeValueId  // 속성 값 ID 명시적으로 포함
          });
        }
      }
      
      setProducts(productsWithAttributes);
    } catch (error) {
      console.error('상품 목록 조회 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const data = await inventoryService.getCategories();
      const categories = Array.isArray(data) ? data : (data?.data || data?.result || []);
      if (categories.length > 0) {
        setCategoryList(categories.map(cat => ({
          id: cat.categoryId || cat.id,
          name: cat.name || cat.categoryName
        })));
      }
    } catch (err) {
      console.error('카테고리 목록 조회 실패:', err);
      setCategoryList([]);
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
    // 상품 클릭 시 바로 선택하고 설정 모달로 이동
    onNext([product]);
  };

  const handleClose = () => {
    setSearchTerm('');
    setCategoryFilter('');
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '상품 선택'),
        React.createElement(CloseButton, { onClick: handleClose }, '×')
      ),
      React.createElement(ModalBody, null,
        React.createElement(SearchContainer, null,
          React.createElement(SearchInput, {
            type: 'text',
            placeholder: '상품명으로 검색',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value)
          }),
          React.createElement(CategorySelect, {
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value)
          },
            React.createElement('option', { value: '' }, '전체 카테고리'),
            ...(categoryList.length > 0
              ? categoryList.map(category =>
                  React.createElement('option', { key: category.id, value: category.name }, category.name)
                )
              : [
                  // fallback: 카테고리 로드 실패 시 기본 옵션
                  React.createElement('option', { key: '음료', value: '음료' }, '음료'),
                  React.createElement('option', { key: '디저트', value: '디저트' }, '디저트')
                ]
            )
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
              filteredProducts.map((product, index) => {
                // 속성 정보 표시
                const attributeDisplay = product.attributeDisplay;
                
                return React.createElement(ProductCard, {
                  key: `${product.branchProductId || product.productId}-${index}`,
                  $selected: false,
                  onClick: () => handleProductSelect(product)
                },
                  React.createElement(ProductName, null, product.productName || '알 수 없음'),
                  React.createElement(ProductInfo, null, `카테고리: ${product.categoryName || '미분류'}`),
                  attributeDisplay && React.createElement(ProductInfo, { 
                    style: { color: '#6b46c1', fontWeight: '500', marginTop: '4px' } 
                  }, attributeDisplay),
                  React.createElement(ProductInfo, null, `설명: ${product.productDescription || '-'}`)
                );
              })
            ),
        React.createElement(ButtonGroup, null,
          React.createElement(CancelButton, { onClick: handleClose }, '취소')
        )
      )
    )
  );
}

export default ProductSelectionModal;