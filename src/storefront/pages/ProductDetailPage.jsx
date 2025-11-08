import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductDetail from '../components/ProductDetail';
import { useShopCart } from '../hooks/useShopCart';
import { customerProductService } from '../../service/customerProductService';
import { cartService } from '../../service/cartService';
import { customerAuthService } from '../../service/customerAuthService';
import { inventoryService } from '../../service/inventoryService';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { handleAddToCart } = useShopCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        setError(null);

        // URL 파라미터에서 productId 추출 및 유효성 검사
        const parsedProductId = Number(productId);
        const isValidProductId = !isNaN(parsedProductId) && 
                                 Number.isInteger(parsedProductId) && 
                                 parsedProductId > 0;

        if (!isValidProductId) {
          setError('유효하지 않은 상품 ID입니다.');
          return;
        }

        // 상품 상세 정보 로드
        const response = await shopApi.get(`/api/public/products/with-branches`, {
          params: { 
            page: 0, 
            size: 100 
          }
        });

        const responseData = response?.data?.data;
        const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
        const products = isPageResponse ? (responseData.content || []) : (responseData || []);

        const foundProduct = products.find(p => p.productId === parsedProductId);

        if (!foundProduct) {
          setError('상품을 찾을 수 없습니다.');
          return;
        }

        // 상품 조회 기록 POST 요청 (유효한 productId만 전달)
        await customerProductService.recordProductView(parsedProductId);

        // 상품명이 같은 모든 상품 찾기
        const productName = foundProduct.productName || '';
        const sameNameProducts = products.filter(
          p => (p.productName || '').trim() === productName.trim()
        );

        // 모든 상품의 availableBranches 통합
        const allBranches = sameNameProducts.flatMap(p => p.availableBranches || []);
        
        // 속성별로 상품을 그룹화하기 위해 availableBranches를 속성 타입별로 분류
        const branchesByAttributeType = {};
        
        // 속성 값별로 해당하는 상품 정보 매핑
        const attributeValueToProductMap = {};
        sameNameProducts.forEach(product => {
          if (product.availableBranches && product.availableBranches.length > 0) {
            product.availableBranches.forEach(branch => {
              if (branch.attributeValueId) {
                const key = `${branch.attributeTypeName || '기본'}_${branch.attributeValueId}`;
                if (!attributeValueToProductMap[key]) {
                  attributeValueToProductMap[key] = {
                    productId: product.productId,
                    imageUrl: product.imageUrl,
                    productName: product.productName
                  };
                }
              }
            });
          }
        });
        
        allBranches.forEach(branch => {
          // 속성 타입별로 그룹화
          const attributeTypeName = branch.attributeTypeName || '기본';
          
          if (!branchesByAttributeType[attributeTypeName]) {
            branchesByAttributeType[attributeTypeName] = {
              attributeTypeName: attributeTypeName,
              values: {} // 속성 값별로 분류
            };
          }
          
          // 속성 값별로 분류
          const valueName = branch.attributeValueName || '기본';
          const valueKey = `${branch.attributeValueId || valueName}`;
          
          if (!branchesByAttributeType[attributeTypeName].values[valueKey]) {
            // 해당 속성 값에 맞는 상품 정보 찾기
            const productInfo = attributeValueToProductMap[`${attributeTypeName}_${branch.attributeValueId}`] || 
                                sameNameProducts.find(p => 
                                  p.availableBranches?.some(b => 
                                    b.attributeValueId === branch.attributeValueId
                                  )
                                );
            
            branchesByAttributeType[attributeTypeName].values[valueKey] = {
              attributeValueId: branch.attributeValueId,
              attributeValueName: branch.attributeValueName,
              branches: [],
              // 해당 속성 값의 상품 정보 추가
              productId: productInfo?.productId || foundProduct.productId,
              imageUrl: productInfo?.imageUrl || foundProduct.imageUrl,
              productName: productInfo?.productName || foundProduct.productName
            };
          }
          branchesByAttributeType[attributeTypeName].values[valueKey].branches.push(branch);
        });
        
        // 2단 옵션 조합 구성 (상품이 조합 단위로 나뉜 경우)
        // 각 상품의 attributeValues에서 타입별 값을 추출해 조합 맵 생성
        const comboMap = new Map(); // key: `${opt1Id}-${opt2Id}` -> variant info
        
        // 상품의 카테고리 ID 가져오기 (여러 방법으로 시도)
        let categoryId = foundProduct.categoryId || foundProduct.category?.id || foundProduct.category?.categoryId;
        
        // categoryId가 없고 categoryName이 있으면 카테고리 이름으로 ID 찾기
        if (!categoryId && foundProduct.categoryName) {
          try {
            const categoriesResponse = await shopApi.get('/api/categories');
            const categoriesData = categoriesResponse?.data?.data ?? categoriesResponse?.data ?? [];
            const categories = Array.isArray(categoriesData) ? categoriesData : [];
            
            // 카테고리 이름으로 ID 찾기
            const matchedCategory = categories.find(c => 
              c.name === foundProduct.categoryName || 
              c.categoryName === foundProduct.categoryName
            );
            
            if (matchedCategory) {
              categoryId = matchedCategory.id || matchedCategory.categoryId;
            }
          } catch (err) {
            console.warn('카테고리 목록 조회 실패:', err);
          }
        }
        
        // 카테고리별 속성 정보 가져오기 (displayOrder를 위해)
        let categoryAttributesMap = new Map();
        let attributeValuesMap = new Map(); // attributeValueId -> { displayOrder, attributeValueName }
        if (categoryId) {
          try {
            const categoryAttributes = await inventoryService.getCategoryAttributes(categoryId);
            if (Array.isArray(categoryAttributes)) {
              // attributeTypeName을 키로 하는 Map 생성 (displayOrder 포함)
              categoryAttributes.forEach(ca => {
                const typeName = ca.attributeTypeName || ca.attributeType?.name;
                if (typeName) {
                  categoryAttributesMap.set(typeName, {
                    displayOrder: ca.displayOrder || 0,
                    attributeTypeId: ca.attributeTypeId || ca.attributeType?.id
                  });
                  
                  // 속성 값들의 displayOrder 정보 저장
                  const availableValues = ca.availableValues || [];
                  availableValues.forEach(av => {
                    const valueId = av.id || av.attributeValueId;
                    if (valueId) {
                      attributeValuesMap.set(valueId, {
                        displayOrder: av.displayOrder || 0,
                        attributeValueName: av.displayName || av.attributeValueName || av.name
                      });
                    }
                  });
                }
              });
            }
          } catch (err) {
            console.warn('카테고리 속성 조회 실패:', err);
          }
        }
        
        // 속성 타입별로 그룹화하고 displayOrder 수집
        // attributeValues와 availableBranches 모두에서 속성 타입 수집
        const attributeTypeMap = new Map(); // attributeTypeName -> { displayOrder, attributeTypeId }
        
        // 1. attributeValues에서 속성 타입 수집
        sameNameProducts.forEach(p => {
          const attrs = Array.isArray(p.attributeValues) ? p.attributeValues : [];
          attrs.forEach(a => {
            const tName = a.attributeTypeName;
            if (tName && !attributeTypeMap.has(tName)) {
              // 카테고리별 displayOrder 우선 사용
              const categoryAttr = categoryAttributesMap.get(tName);
              const displayOrder = categoryAttr?.displayOrder !== undefined 
                ? categoryAttr.displayOrder 
                : (a.attributeType?.displayOrder || a.displayOrder || 999); // 없으면 큰 값으로 설정하여 뒤로
              
              attributeTypeMap.set(tName, {
                displayOrder: displayOrder,
                attributeTypeId: a.attributeTypeId || a.attributeType?.id
              });
            }
          });
        });
        
        // 2. availableBranches에서도 속성 타입 수집 (attributeValues가 없는 경우 대비)
        allBranches.forEach(branch => {
          const tName = branch.attributeTypeName;
          if (tName && !attributeTypeMap.has(tName)) {
            // 카테고리별 displayOrder 우선 사용
            const categoryAttr = categoryAttributesMap.get(tName);
            const displayOrder = categoryAttr?.displayOrder !== undefined 
              ? categoryAttr.displayOrder 
              : 999; // 기본값
            
            attributeTypeMap.set(tName, {
              displayOrder: displayOrder,
              attributeTypeId: branch.attributeTypeId
            });
          }
        });
        
        // displayOrder 순으로 정렬
        const sortedAttributeTypes = Array.from(attributeTypeMap.entries())
          .sort((a, b) => (a[1].displayOrder || 0) - (b[1].displayOrder || 0))
          .map(entry => entry[0]); // attributeTypeName만 추출
        
        // 최대 2개로 제한
        const type1 = sortedAttributeTypes[0];
        const type2 = sortedAttributeTypes[1];

        sameNameProducts.forEach(p => {
          const attrs = Array.isArray(p.attributeValues) ? p.attributeValues : [];
          const t1 = attrs.find(a => a.attributeTypeName === type1);
          const t2 = attrs.find(a => a.attributeTypeName === type2);
          const opt1Id = t1?.attributeValueId || null;
          const opt2Id = t2?.attributeValueId || null;
          if (opt1Id) {
            const key = `${opt1Id}-${opt2Id || 'na'}`;
            if (!comboMap.has(key)) {
              comboMap.set(key, {
                opt1Id,
                opt1Name: t1?.displayName,
                opt2Id,
                opt2Name: t2?.displayName,
                productId: p.productId,
                imageUrl: p.imageUrl,
                branches: p.availableBranches || []
              });
            }
          }
        });

        // 속성 값 정렬 함수: 숫자로 인식 가능하면 숫자 순서로, 아니면 displayOrder로
        const sortAttributeValues = (values) => {
          // 사이즈 순서 정의
          const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
          const getSizeOrder = (name) => {
            const upperName = name.toUpperCase().trim();
            const index = sizeOrder.findIndex(size => upperName === size || upperName.startsWith(size));
            return index >= 0 ? index : Infinity;
          };
          
          // 모든 값에서 숫자 추출 시도
          const valuesWithNumbers = values.map(v => {
            const name = v.attributeValueName || '';
            const trimmedName = name.trim();
            
            // 1. 순수 숫자 체크 (예: "1", "2", "10")
            const numberMatch = trimmedName.match(/^-?\d+(\.\d+)?$/);
            const number = numberMatch ? parseFloat(numberMatch[0]) : null;
            
            // 2. 사이즈 체크
            const sizeOrderIndex = getSizeOrder(trimmedName);
            const isSize = sizeOrderIndex !== Infinity;
            
            // 3. 문자열에서 첫 번째 숫자 시퀀스 추출 시도 (예: "사이즈 10", "옵션 5")
            let extractedNumber = null;
            if (number === null && !isSize) {
              const numInString = trimmedName.match(/\d+/);
              if (numInString) {
                extractedNumber = parseFloat(numInString[0]);
              }
            } else if (number !== null) {
              extractedNumber = number;
            }
            
            return {
              ...v,
              extractedNumber,
              isPureNumber: number !== null,
              isSize,
              sizeOrderIndex
            };
          });
          
          // 모든 값이 순수 숫자인지 확인
          const allPureNumbers = valuesWithNumbers.every(v => v.isPureNumber);
          
          // 모든 값이 사이즈인지 확인
          const allSizes = valuesWithNumbers.every(v => v.isSize) && valuesWithNumbers.some(v => v.isSize);
          
          if (allPureNumbers && valuesWithNumbers.length > 0) {
            // 모두 순수 숫자면 숫자 순서로 정렬
            return valuesWithNumbers.sort((a, b) => {
              const numA = a.extractedNumber ?? Infinity;
              const numB = b.extractedNumber ?? Infinity;
              return numA - numB;
            });
          }
          
          if (allSizes) {
            // 모두 사이즈면 사이즈 순서로 정렬
            return valuesWithNumbers.sort((a, b) => {
              return a.sizeOrderIndex - b.sizeOrderIndex;
            });
          }
          
          // 일부라도 숫자가 포함되어 있으면 숫자 우선 정렬
          const hasAnyNumbers = valuesWithNumbers.some(v => v.extractedNumber !== null);
          if (hasAnyNumbers) {
            return valuesWithNumbers.sort((a, b) => {
              // 숫자가 있는 것 우선
              if (a.extractedNumber !== null && b.extractedNumber === null) return -1;
              if (a.extractedNumber === null && b.extractedNumber !== null) return 1;
              // 둘 다 숫자면 숫자 순서
              if (a.extractedNumber !== null && b.extractedNumber !== null) {
                return a.extractedNumber - b.extractedNumber;
              }
              // 둘 다 숫자 없으면 displayOrder
              return (a.displayOrder || 0) - (b.displayOrder || 0);
            });
          }
          
          // 숫자가 전혀 없으면 displayOrder로 정렬
          return valuesWithNumbers.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        };

        // 옵션 타입/값 목록 구성 (활성화 여부는 렌더단에서 조합으로 판단)
        const attributeGroups = [];
        if (type1) {
          const valuesMap = new Map();
          comboMap.forEach(v => {
            const id = v.opt1Id; const name = v.opt1Name;
            if (id && !valuesMap.has(id)) {
              const valueInfo = attributeValuesMap.get(id);
              valuesMap.set(id, { 
                attributeValueId: id, 
                attributeValueName: name, 
                branches: [],
                displayOrder: valueInfo?.displayOrder || 0 // displayOrder 정보 포함
              });
            }
          });
          // 숫자 인식 정렬 적용
          const sortedValues = sortAttributeValues(Array.from(valuesMap.values()));
          attributeGroups.push({ attributeTypeName: type1, values: sortedValues });
        }
        if (type2) {
          const valuesMap = new Map();
          comboMap.forEach(v => {
            const id = v.opt2Id; const name = v.opt2Name;
            if (id && !valuesMap.has(id)) {
              const valueInfo = attributeValuesMap.get(id);
              valuesMap.set(id, { 
                attributeValueId: id, 
                attributeValueName: name, 
                branches: [],
                displayOrder: valueInfo?.displayOrder || 0 // displayOrder 정보 포함
              });
            }
          });
          // 숫자 인식 정렬 적용
          const sortedValues = sortAttributeValues(Array.from(valuesMap.values()));
          attributeGroups.push({ attributeTypeName: type2, values: sortedValues });
        }
        
        // 가격 범위 계산 (모든 상품의 최소/최대 가격)
        const allMinPrices = sameNameProducts.map(p => p.minPrice || 0).filter(p => p > 0);
        const allMaxPrices = sameNameProducts.map(p => p.maxPrice || 0).filter(p => p > 0);
        const minPrice = allMinPrices.length > 0 ? Math.min(...allMinPrices) : (foundProduct.minPrice || 0);
        const maxPrice = allMaxPrices.length > 0 ? Math.max(...allMaxPrices) : (foundProduct.maxPrice || 0);

        // 상품 데이터 매핑 (같은 이름의 모든 상품 통합)
        const mappedProduct = {
          id: foundProduct.productId, // 대표 productId
          productId: foundProduct.productId,
          name: productName.trim() || "상품",
          price: Number(maxPrice || minPrice || 0),
          minPrice: Number(minPrice),
          maxPrice: Number(maxPrice),
          promotionPrice: null,
          discountRate: null,
          imageAlt: foundProduct.productName || "상품 이미지",
          image: foundProduct.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png",
          category: foundProduct.categoryName || "미분류",
          stock: 0,
          safetyStock: 0,
          isOutOfStock: false,
          isLowStock: false,
          brand: "",
          likes: 0,
          reviews: 0,
          pop: 0,
          discount: 0,
          description: foundProduct.description || "상품에 대한 자세한 설명이 없습니다.",
          specifications: [
            { name: "카테고리", value: foundProduct.categoryName || "정보 없음" },
          ],
          images: [foundProduct.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"],
          relatedProducts: [],
          availableBranches: allBranches, // 모든 상품의 브랜치 통합
          availableBranchCount: allBranches.length,
          // 속성별 상품 정보 추가
          attributeGroups: attributeGroups.length > 0 ? attributeGroups : null,
          // 같은 이름의 모든 상품 ID 목록
          productIds: sameNameProducts.map(p => p.productId),
          variants: sameNameProducts,
          optionTypes: [type1, type2].filter(Boolean),
          optionCombos: Array.from(comboMap.values())
        };

        setProduct(mappedProduct);
      } catch (e) {
        console.error('❌ 상품 로딩 실패:', e);
        setError(e?.message || "상품을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleBuyNow = async (product) => {
    const isLoggedIn = customerAuthService.isAuthenticated();
    const currentUser = customerAuthService.getCurrentUser();

    if (!isLoggedIn || !currentUser) {
      alert('구매하려면 로그인이 필요합니다.');
      navigate('/shop/login');
      return;
    }

    const getBranchKey = (branch) => {
      if (!branch) return '';
      if (branch.branchProductId != null) return String(branch.branchProductId);
      const branchIdPart = branch.branchId != null ? branch.branchId : 'no-branch';
      const attrPart = branch.attributeValueId != null ? branch.attributeValueId : (branch.attributeValueName || 'no-attr');
      return `${branchIdPart}-${attrPart}`;
    };

    const branches = product.availableBranches || [];

    let selectedBranch = null;
    if (product.selectedBranchProductId != null) {
      selectedBranch = branches.find(b => String(b.branchProductId) === String(product.selectedBranchProductId));
    }
    if (!selectedBranch && product.selectedBranchKey) {
      selectedBranch = branches.find(b => getBranchKey(b) === product.selectedBranchKey);
    }
    if (!selectedBranch && product.selectedBranchId != null) {
      selectedBranch = branches.find(b => String(b.branchId) === String(product.selectedBranchId));
    }

    if (!selectedBranch) {
      alert('구매 지점을 선택해주세요.');
      return;
    }

    if (!selectedBranch.branchProductId) {
      alert('지점별 상품 정보가 없습니다.');
      return;
    }

    try {
      const orderRequestData = {
        memberId: Number(currentUser?.memberId || 1),
        branchId: Number(selectedBranch.branchId),
        orderType: 'ONLINE',
        orderItems: [{
          branchProductId: Number(selectedBranch.branchProductId),
          quantity: 1
        }],
        couponId: null
      };

      const response = await cartService.createOrder(orderRequestData);
      const created = response?.data?.data || response?.data || response;
      const orderId = created?.orderId;
      const totalAmount = created?.totalAmount ?? selectedBranch.price;

      if (!orderId) {
        alert('주문 생성은 완료되었지만 주문 ID를 받지 못했습니다. 관리자에게 문의해주세요.');
        return;
      }

      // 선택된 옵션 정보 추출
      let attributeName = null;
      let attributeValue = null;
      
      if (product.selectedOptionInfo && Object.keys(product.selectedOptionInfo).length > 0) {
        const optionKeys = Object.keys(product.selectedOptionInfo);
        if (optionKeys.length > 0) {
          const firstOption = product.selectedOptionInfo[optionKeys[0]];
          attributeName = firstOption.attributeTypeName || null;
          attributeValue = firstOption.attributeValueName || null;
          
          // 여러 옵션이 있는 경우 조합 (예: "Hot, Large")
          if (optionKeys.length > 1) {
            const optionValues = optionKeys.map(key => 
              product.selectedOptionInfo[key].attributeValueName
            ).filter(Boolean);
            attributeValue = optionValues.join(', ');
          }
        }
      }

      const immediateOrderData = {
        orderId,
        totalAmount,
        items: [{
          productId: product.productId,
          branchProductId: selectedBranch.branchProductId,
          branchId: selectedBranch.branchId,
          productName: product.name || product.productName,
          price: selectedBranch.price,
          quantity: 1,
          imageUrl: product.image,
          attributeName: attributeName,
          attributeValue: attributeValue,
          selectedAttributes: product.selectedAttributes || {},
          selectedOptionInfo: product.selectedOptionInfo || {}
        }],
        branchId: Number(selectedBranch.branchId),
        createdAt: new Date().toISOString(),
        isSingleOrder: true
      };

      localStorage.setItem('currentOrderData', JSON.stringify(immediateOrderData));
      navigate('/shop/payment', { state: { orderData: immediateOrderData } });
    } catch (error) {
      console.error('❌ 단일 상품 주문 생성 실패:', error);
      const errorMessage = error.response?.data?.status_message || 
                          error.response?.data?.message || 
                          error.message || 
                          '주문 생성에 실패했습니다.';
      alert(`주문 생성 실패: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <div>🔄 상품을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ color: "#ef4444" }}>❌ {error}</div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/shop')}
          style={{ marginTop: "20px" }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <div>상품을 찾을 수 없습니다.</div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/shop')}
          style={{ marginTop: "20px" }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <ProductDetail
      product={product}
      onBack={() => navigate(-1)}
      onBuy={handleBuyNow}
      onAddToCart={handleAddToCart}
    />
  );
}

export default ProductDetailPage;

