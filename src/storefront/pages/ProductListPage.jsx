import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import { addToCart, changeBranch } from '../../store/slices/cartSlice';
import { clearSelectedBranch } from '../../store/slices/branchSlice';
import axios from 'axios';

const ProductListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedBranch } = useSelector(state => state.branch);
  const { items: cartItems, branchId: cartBranchId } = useSelector(state => state.cart);
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  // 지점이 선택되지 않았으면 지점 선택 페이지로 리다이렉트
  if (!selectedBranch) {
    return <Navigate to="/shop/select-branch" replace />;
  }

  useEffect(() => {
    loadProducts();
  }, [selectedBranch.branchId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 상품 로딩 시작:', selectedBranch.branchId);
      
      const res = await shopApi.get(`/inventory/branch-products/branch/${selectedBranch.branchId}`);
      console.log('📡 API 응답:', res);
      
      const raw = res?.data?.data ?? res?.data ?? [];
      console.log('📦 원본 데이터:', raw);
      
      const mapped = (Array.isArray(raw) ? raw : [])
        .filter((item) => item.branchProductId != null || item.productId != null) // ID가 없는 항목 제외
        .map((item) => ({
        id: item.branchProductId ?? item.productId, // ID가 있는 경우만 사용
        productId: item.productId,
        branchProductId: item.branchProductId,
        branchId: item.branchId,
        name: item.productName || "상품",
        price: Number(item.price || 0),
        promotionPrice: item.promotionPrice ? Number(item.promotionPrice) : null,
        discountRate: item.discountRate ? Number(item.discountRate) : null,
        imageAlt: item.productName || "상품 이미지",
        image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        category: item.categoryName || item.category || "미분류",
        stock: Number(item.stockQuantity || 0),
        safetyStock: Number(item.safetyStock || 0),
        isOutOfStock: Number(item.stockQuantity || 0) <= 0,
        isLowStock: Number(item.stockQuantity || 0) <= Number(item.safetyStock || 0),
        brand: item.brand || item.manufacturer || "",
        likes: Number(item.likes || 0),
        reviews: Number(item.reviews || 0),
        pop: Number(item.pop || 0),
        discount: item.discountRate ? Number(item.discountRate) : 0,
      }));
      
      console.log('✅ 매핑된 상품:', mapped);
      setProducts(mapped);
    } catch (e) {
      console.error('❌ 상품 로딩 실패:', e);
      console.error('❌ 에러 상세:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        url: e.config?.url
      });
      
      // API가 준비되지 않았을 경우 테스트 데이터 사용
      if (e.response?.status === 404 || e.code === 'ERR_NETWORK') {
        console.log('🧪 테스트 데이터 사용');
        const testProducts = [
          {
            id: 1,
            productId: 100,
            branchProductId: 1,
            branchId: selectedBranch.branchId,
            name: "테스트 상품 1",
            price: 15000,
            promotionPrice: 12000,
            discountRate: 20,
            image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
            imageAlt: "테스트 상품 1",
            category: "의류",
            stock: 10,
            safetyStock: 5,
            isOutOfStock: false,
            isLowStock: false,
            brand: "테스트 브랜드",
            likes: 25,
            reviews: 8,
            pop: 100,
            discount: 20,
          },
          {
            id: 2,
            productId: 101,
            branchProductId: 2,
            branchId: selectedBranch.branchId,
            name: "테스트 상품 2",
            price: 25000,
            promotionPrice: null,
            discountRate: null,
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
            imageAlt: "테스트 상품 2",
            category: "신발",
            stock: 0,
            safetyStock: 3,
            isOutOfStock: true,
            isLowStock: false,
            brand: "테스트 브랜드",
            likes: 15,
            reviews: 5,
            pop: 80,
            discount: 0,
          },
          {
            id: 3,
            productId: 102,
            branchProductId: 3,
            branchId: selectedBranch.branchId,
            name: "테스트 상품 3",
            price: 30000,
            promotionPrice: 24000,
            discountRate: 20,
            image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
            imageAlt: "테스트 상품 3",
            category: "액세서리",
            stock: 2,
            safetyStock: 5,
            isOutOfStock: false,
            isLowStock: true,
            brand: "테스트 브랜드",
            likes: 30,
            reviews: 12,
            pop: 150,
            discount: 20,
          }
        ];
        setProducts(testProducts);
        setError(null);
      } else {
        setError(e?.message || "상품을 불러오지 못했습니다.");
        setProducts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    try {
      dispatch(addToCart({
        branchProductId: product.branchProductId,
        branchId: product.branchId,
        productName: product.name,
        price: product.promotionPrice || product.price,
        quantity: 1
      }));
      
      // 성공 메시지 (선택사항)
      console.log('장바구니에 추가됨:', product.name);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleChangeBranch = () => {
    if (cartItems.length > 0) {
      const confirmChange = window.confirm(
        '장바구니에 상품이 있습니다. 지점을 변경하면 장바구니가 비워집니다. 계속하시겠습니까?'
      );
      if (!confirmChange) return;
    }
    
    dispatch(clearSelectedBranch());
    navigate('/shop/select-branch');
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === '전체' || product.category === activeCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['전체', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      {/* 헤더 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: '#f9fafb',
        borderRadius: '12px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            🏪 {selectedBranch.branchName}
          </h1>
          <p style={{ color: '#6b7280', margin: '0', fontSize: '14px' }}>
            📍 {selectedBranch.address}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleChangeBranch}
            style={{
              padding: '8px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            지점 변경
          </button>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            장바구니: {cartItems.length}개
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="상품명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          />
        </div>
        
        {/* 카테고리 탭 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              style={{
                padding: '8px 16px',
                background: activeCategory === category ? '#111' : '#f3f4f6',
                color: activeCategory === category ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: activeCategory === category ? 'bold' : 'normal',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          ❌ {error}
        </div>
      )}

      {/* 상품 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>
            🔄 상품을 불러오는 중...
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
        }}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* 상품 이미지 */}
              <div style={{ position: 'relative' }}>
                <img
                  src={product.image}
                  alt={product.imageAlt}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                  }}
                />
                {product.isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ef4444',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    품절
                  </div>
                )}
                {product.isLowStock && !product.isOutOfStock && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#f59e0b',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    재고부족
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    {product.category}
                  </span>
                </div>
                
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: '0 0 4px 0',
                  color: '#111',
                }}>
                  {product.name}
                </h3>
                
                <p style={{
                  color: '#6b7280',
                  fontSize: '14px',
                  margin: '0 0 12px 0',
                }}>
                  {product.brand}
                </p>

                {/* 가격 */}
                <div style={{ marginBottom: '12px' }}>
                  {product.promotionPrice && product.discountRate ? (
                    <>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#ef4444',
                        marginBottom: '4px',
                      }}>
                        {product.promotionPrice.toLocaleString()}원
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        textDecoration: 'line-through',
                        marginBottom: '4px',
                      }}>
                        {product.price.toLocaleString()}원
                      </div>
                      <div style={{
                        display: 'inline-block',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {product.discountRate}% 할인
                      </div>
                    </>
                  ) : (
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#111',
                    }}>
                      {product.price.toLocaleString()}원
                    </div>
                  )}
                </div>

                {/* 재고 상태 */}
                <div style={{ marginBottom: '12px', fontSize: '12px' }}>
                  {product.isOutOfStock ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>품절</span>
                  ) : product.isLowStock ? (
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      재고 {product.stock}개 (부족)
                    </span>
                  ) : (
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      재고 {product.stock}개
                    </span>
                  )}
                </div>

                {/* 장바구니 버튼 */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.isOutOfStock}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: product.isOutOfStock ? '#ccc' : '#111',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: product.isOutOfStock ? 'not-allowed' : 'pointer',
                    opacity: product.isOutOfStock ? 0.6 : 1,
                  }}
                >
                  {product.isOutOfStock ? '품절' : '장바구니 담기'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>
            📦 해당 조건의 상품이 없습니다
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
