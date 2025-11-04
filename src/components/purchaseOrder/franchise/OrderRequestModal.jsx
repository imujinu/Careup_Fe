import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';
import { purchaseOrderService } from '../../../service/purchaseOrderService';
import { inventoryService } from '../../../service/inventoryService';
import { authService } from '../../../service/authService';

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

function OrderRequestModal({ isOpen, onClose, onSubmitOrderRequest }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});
  const [focusedInputs, setFocusedInputs] = useState({}); // 포커스된 입력 필드 추적
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // 검색어 debounce 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 상품 목록 조회 (가맹점에 등록된 상품 목록만)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 2; // 가맹점 branchId (2번으로 가정)
      
      // 가맹점에 등록된 상품 목록만 조회
      const data = await inventoryService.getBranchProducts(branchId);
      
      const formattedProducts = data.map(item => ({
        id: item.branchProductId,
        productId: item.productId, // 실제 productId 저장
        name: item.productName || '상품명 없음',
        category: item.categoryName || '미분류',
        unit: '개', // 기본 단위
        unitPrice: item.price && item.price > 0 ? item.price : 0
      }));
      
      
      setProducts(formattedProducts);
      
      // 상품이 하나도 없으면 경고
      if (formattedProducts.length === 0) {
        alert('가맹점에 등록된 상품이 없습니다. 먼저 상품을 추가해주세요.');
      }
    } catch (error) {
      console.error('가맹점 상품 목록 조회 실패:', error);
      // 실패 시 빈 배열로 설정
      setProducts([]);
      alert('상품 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const data = await inventoryService.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('카테고리 목록 조회 실패:', error);
      setCategories([]);
    }
  };

  // 모달이 열릴 때 상품 목록 및 카테고리 목록 조회
  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      fetchCategories();
      setSelectedProducts({}); // 모달이 열릴 때 선택 상태 초기화
    }
  }, [isOpen]);

  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !debouncedSearchTerm || 
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        String(product.id).toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearchTerm, categoryFilter]);

  const handleQuantityChange = (productId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    if (numQuantity < 0) return;
    
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: numQuantity
    }));
  };
  
  const handleQuantityFocus = (productId) => {
    setFocusedInputs(prev => ({
      ...prev,
      [productId]: true
    }));
  };
  
  const handleQuantityBlur = (productId) => {
    // blur 시 포커스 상태 제거 및 빈 값이면 0으로 설정
    setFocusedInputs(prev => ({
      ...prev,
      [productId]: false
    }));
    
    const currentValue = selectedProducts[productId];
    if (currentValue === '' || currentValue === null || currentValue === undefined) {
      setSelectedProducts(prev => ({
        ...prev,
        [productId]: 0
      }));
    }
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

  const handleOrderRequest = async () => {
    if (loading) return; // 이미 처리 중이면 중복 실행 방지
    
    const orderItems = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => String(p.id) === String(productId));
        if (!product) {
          console.error('상품을 찾을 수 없습니다:', productId);
          console.log('선택된 productId:', productId);
          console.log('전체 products:', products);
          return null;
        }
        
        // productId 확인
        if (!product.productId) {
          console.error('productId가 없습니다:', product);
          return null;
        }
        
        // unitPrice 안전 처리
        const safeUnitPrice = product.unitPrice || 0;
        
        return {
          productId: product.productId, // 실제 productId 사용
          name: product.name,
          quantity,
          unit: product.unit,
          unitPrice: safeUnitPrice,
          totalPrice: quantity * safeUnitPrice
        };
      })
      .filter(item => item !== null); // null 제거

    if (orderItems.length === 0) {
      alert('발주할 상품을 선택해주세요.');
      return;
    }

    // 데이터 검증
    const invalidItems = orderItems.filter(item => 
      !item.productId || item.quantity <= 0 || !item.unitPrice
    );
    
    if (invalidItems.length > 0) {
      console.error('유효하지 않은 발주 항목들:', invalidItems);
      alert('발주 정보가 올바르지 않습니다. 상품 정보를 확인해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      // 백엔드 API 호출
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 2;
      
      const orderData = {
        branchId: branchId,
        orderDetails: orderItems.map(item => {
          const productId = parseInt(item.productId) || 0;
          const quantity = parseInt(item.quantity) || 0;
          let supplyPrice = 0;
          
          // supplyPrice 안전 변환 (더 강력한 방식)
          try {
            const rawPrice = item.unitPrice;
            
            if (rawPrice === null || rawPrice === undefined || rawPrice === '') {
              supplyPrice = 0;
            } else {
              // 문자열이면 숫자로 변환, 이미 숫자면 그대로 사용
              const numPrice = Number(rawPrice);
              supplyPrice = isNaN(numPrice) ? 0 : Math.floor(numPrice); // 정수로 변환
            }
          } catch (e) {
            console.error('supplyPrice 변환 실패:', e);
            supplyPrice = 0;
          }
          
          console.log(`상품 ${productId}: quantity=${quantity}, supplyPrice=${supplyPrice}`);
          console.log(`  - 원본unitPrice:`, item.unitPrice, `(타입: ${typeof item.unitPrice})`);
          console.log(`  - parseInt 결과:`, parseInt(item.unitPrice), `(isNaN: ${isNaN(parseInt(item.unitPrice))})`);
          console.log(`  - 최종 supplyPrice:`, supplyPrice, `(타입: ${typeof supplyPrice})`);
          
          return {
            productId: productId,
            quantity: quantity,
            supplyPrice: supplyPrice
          };
        })
      };

      // JSON 직렬화 전 최종 검증
      const hasInvalidData = orderData.orderDetails.some(detail => 
        detail.supplyPrice === null || 
        detail.supplyPrice === undefined || 
        isNaN(detail.supplyPrice) ||
        detail.productId === null ||
        detail.productId === undefined ||
        detail.quantity <= 0
      );
      
      if (hasInvalidData) {
        console.error('유효하지 않은 데이터 발견:', orderData.orderDetails);
        alert('발주 데이터에 오류가 있습니다. 다시 시도해주세요.');
        return;
      }
      
      console.log('발주 요청 데이터:', JSON.stringify(orderData, null, 2));
      console.log('원본 orderItems:', orderItems);
      
      // JSON.stringify 후 다시 파싱해서 확인 (실제 전송되는 데이터)
      const serialized = JSON.stringify(orderData);
      const parsed = JSON.parse(serialized);
      console.log('실제 전송될 데이터:', parsed);

      const response = await purchaseOrderService.createPurchaseOrder(orderData);
    
      alert('발주가 성공적으로 생성되었습니다.');
      onSubmitOrderRequest(orderItems); // 부모 컴포넌트에 알림
    onClose();
    } catch (error) {
      console.error('발주 생성 실패:', error);
      console.error('에러 응답 상태:', error.response?.status);
      console.error('에러 응답 데이터:', error.response?.data);
      console.error('에러 config:', error.config);
      
      // 에러 메시지 추출 및 개선된 에러 처리
      let errorMessage = '발주 생성에 실패했습니다.';
      
      if (error.response?.data) {
        if (error.response.data.status_message) {
          errorMessage = error.response.data.status_message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 네트워크 오류인 경우
      if (error.code === 'ERR_NETWORK') {
        errorMessage = '서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
      }
      
      // 예약재고 확보 실패 메시지 파싱 및 개선
      const reservationFailedMatch = errorMessage.match(/예약재고 확보 실패: productId=(\d+), 요청수량=(\d+), 최대가능수량=(\d+)/);
      if (reservationFailedMatch) {
        const productId = reservationFailedMatch[1];
        const requestedQty = reservationFailedMatch[2];
        const availableQty = reservationFailedMatch[3];
        
        // 상품명 찾기
        const product = products.find(p => String(p.productId) === String(productId));
        const productName = product ? product.name : `상품 ID: ${productId}`;
        
        errorMessage = `${productName}의 예약재고 확보에 실패했습니다.\n요청 수량: ${requestedQty}개\n최대 가능 수량: ${availableQty}개\n\n최대 ${availableQty}개까지만 발주 가능합니다.`;
      } else {
        // 기존 형식 (productId만 있는 경우) 파싱
        const oldFormatMatch = errorMessage.match(/예약재고 확보 실패: productId=(\d+)/);
        if (oldFormatMatch) {
          const productId = oldFormatMatch[1];
          const product = products.find(p => String(p.productId) === String(productId));
          const productName = product ? product.name : `상품 ID: ${productId}`;
          errorMessage = `${productName}의 예약재고 확보에 실패했습니다.\n재고가 부족합니다.`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = Object.values(selectedProducts).filter(qty => qty > 0).length;

  if (!isOpen) return null;

  return React.createElement(ModalOverlay, null,
    React.createElement(ModalContainer, { onClick: (e) => e.stopPropagation() },
      React.createElement(ModalHeader, null,
        React.createElement(ModalTitle, null, '발주 요청'),
        React.createElement(CloseButton, { onClick: onClose }, '×')
      ),
      React.createElement(ModalBody, { onClick: (e) => e.stopPropagation() },
        React.createElement(SearchFilterSection, { onClick: (e) => e.stopPropagation() },
          React.createElement(SearchContainer, { onClick: (e) => e.stopPropagation() },
            React.createElement(SearchIcon, null,
              React.createElement(Icon, { path: mdiMagnify, size: 1 })
            ),
            React.createElement(SearchInput, {
              type: 'text',
              autoComplete: 'off',
              placeholder: '상품명으로 검색',
              value: searchTerm,
              onChange: (e) => {
                e.stopPropagation();
                setSearchTerm(e.target.value);
              },
              onKeyDown: (e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              },
              onClick: (e) => {
                e.stopPropagation();
              },
              onFocus: (e) => {
                e.stopPropagation();
              }
            })
          ),
          React.createElement(CategorySelect, {
            value: categoryFilter,
            onChange: (e) => {
              e.stopPropagation();
              setCategoryFilter(e.target.value);
            },
            onClick: (e) => e.stopPropagation(),
            onFocus: (e) => e.stopPropagation()
          },
            React.createElement('option', { value: '' }, '전체 카테고리'),
            ...categories.map(category => 
              React.createElement('option', { 
                key: category.categoryId || category.id, 
                value: category.name 
              }, category.name)
            )
          )
        ),
        React.createElement(ProductSection, null,
          React.createElement(SectionHeader, null,
            React.createElement(SectionTitle, null, `상품 선택 (${filteredProducts.length}개)`),
            React.createElement(SelectedCount, null, `선택된 상품: ${selectedCount}개`)
          ),
          loading ? 
            React.createElement('div', { style: { textAlign: 'center', padding: '40px' } }, '상품 목록을 불러오는 중...') :
          React.createElement(ProductGrid, null,
            filteredProducts.map((product) =>
              React.createElement(ProductCard, { key: product.id },
                React.createElement(ProductHeader, null,
                  React.createElement(ProductName, null, product.name),
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
                      value: focusedInputs[product.id] && (selectedProducts[product.id] === '' || selectedProducts[product.id] === null || selectedProducts[product.id] === undefined) 
                        ? '' 
                        : (selectedProducts[product.id] || 0),
                      onChange: (e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setSelectedProducts(prev => ({
                            ...prev,
                            [product.id]: ''
                          }));
                        } else {
                          handleQuantityChange(product.id, value);
                        }
                      },
                      onFocus: () => handleQuantityFocus(product.id),
                      onBlur: () => handleQuantityBlur(product.id),
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
            disabled: selectedCount === 0 || loading
          }, loading ? '처리 중...' : '발주 요청')
        )
      )
    )
  );
}

export default OrderRequestModal;
