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

        // 속성별로 상품을 그룹화하기 위해 availableBranches를 속성 타입별로 분류
        const branchesByAttributeType = {};
        
        if (foundProduct.availableBranches && foundProduct.availableBranches.length > 0) {
          foundProduct.availableBranches.forEach(branch => {
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
            if (!branchesByAttributeType[attributeTypeName].values[valueName]) {
              branchesByAttributeType[attributeTypeName].values[valueName] = {
                attributeValueId: branch.attributeValueId,
                attributeValueName: branch.attributeValueName,
                branches: []
              };
            }
            branchesByAttributeType[attributeTypeName].values[valueName].branches.push(branch);
          });
        }
        
        // 속성 그룹을 배열로 변환
        const attributeGroups = Object.values(branchesByAttributeType).map(typeGroup => ({
          attributeTypeName: typeGroup.attributeTypeName,
          values: Object.values(typeGroup.values)
        }));

        // 상품 데이터 매핑
        const mappedProduct = {
          id: foundProduct.productId, // productId가 항상 있음
          productId: foundProduct.productId,
          name: foundProduct.productName || "상품",
          price: Number(foundProduct.minPrice || foundProduct.maxPrice || 0),
          minPrice: Number(foundProduct.minPrice || 0),
          maxPrice: Number(foundProduct.maxPrice || 0),
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
          availableBranches: foundProduct.availableBranches || [],
          availableBranchCount: foundProduct.availableBranchCount || 0,
          // 속성별 상품 정보 추가
          attributeGroups: attributeGroups.length > 0 ? attributeGroups : null
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

    let selectedBranchId = product.selectedBranchId;
    if (!selectedBranchId) {
      alert('구매 지점을 선택해주세요.');
      return;
    }

    const selectedBranch = product.availableBranches?.find(
      (b) => String(b.branchId) === String(selectedBranchId)
    );

    if (!selectedBranch) {
      alert('선택한 지점 정보를 찾을 수 없습니다.');
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

