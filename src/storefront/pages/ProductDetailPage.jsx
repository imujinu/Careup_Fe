import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductDetail from '../components/ProductDetail';
import { useShopCart } from '../hooks/useShopCart';
import { customerProductService } from '../../service/customerProductService';
import { cartService } from '../../service/cartService';
import { customerAuthService } from '../../service/customerAuthService';

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
        const optionTypeOrder = [];
        const comboMap = new Map(); // key: `${opt1Id}-${opt2Id}` -> variant info
        sameNameProducts.forEach(p => {
          const attrs = Array.isArray(p.attributeValues) ? p.attributeValues : [];
          // 타입 순서 수집(최대 2개)
          attrs.forEach(a => {
            const tName = a.attributeTypeName;
            if (tName && !optionTypeOrder.includes(tName)) optionTypeOrder.push(tName);
          });
        });
        // 최대 2개로 제한
        const type1 = optionTypeOrder[0];
        const type2 = optionTypeOrder[1];

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

        // 옵션 타입/값 목록 구성 (활성화 여부는 렌더단에서 조합으로 판단)
        const attributeGroups = [];
        if (type1) {
          const valuesMap = new Map();
          comboMap.forEach(v => {
            const id = v.opt1Id; const name = v.opt1Name;
            if (id && !valuesMap.has(id)) valuesMap.set(id, { attributeValueId: id, attributeValueName: name, branches: [] });
          });
          attributeGroups.push({ attributeTypeName: type1, values: Array.from(valuesMap.values()) });
        }
        if (type2) {
          const valuesMap = new Map();
          comboMap.forEach(v => {
            const id = v.opt2Id; const name = v.opt2Name;
            if (id && !valuesMap.has(id)) valuesMap.set(id, { attributeValueId: id, attributeValueName: name, branches: [] });
          });
          attributeGroups.push({ attributeTypeName: type2, values: Array.from(valuesMap.values()) });
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
          image: foundProduct.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
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
          images: [foundProduct.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"],
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
          imageUrl: product.image
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

