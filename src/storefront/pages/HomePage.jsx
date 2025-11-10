import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import Tabs from '../components/Tabs';
import ProductRanking from '../components/ProductRanking';
import { useShopData } from '../hooks/useShopData';
import { useShopCart } from '../hooks/useShopCart';
import { useShopAuth } from '../hooks/useShopAuth';

function HomePage() {
  const navigate = useNavigate();
  const { categories, loadingCategories, categoriesError, products, loadingProducts, productsError, favorites, toggleFavorite, getCategoryIdByName } = useShopData();
  const { handleAddToCart } = useShopCart();
  const { currentUser } = useShopAuth();
  
  // 카테고리가 로딩되기 전에는 카테고리 클릭 무시
  const isCategoryReady = !loadingCategories && categories.length > 0;

  const [activeTab, setActiveTab] = React.useState("전체");

  const handleTabChange = (tabName) => {
    // 카테고리가 아직 로딩 중이면 대기
    if (loadingCategories) {
      console.warn('카테고리가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setActiveTab(tabName);
    const categoryId = getCategoryIdByName(tabName);
    if (categoryId) {
      navigate(`/shop/products?category=${encodeURIComponent(tabName)}`);
    } else {
      navigate('/shop/products');
    }
  };

  const filteredProducts = useMemo(() => {
    if (activeTab === "전체") return products;
    return products.filter((p) => p.category === activeTab);
  }, [activeTab, products]);

  const handleProductClick = async (product) => {
    const { customerProductService } = await import('../../service/customerProductService');
    const productId = product.productId || product.id;
    
    // 상품 클릭 시 조회 API 요청
    if (productId) {
      await customerProductService.recordProductViewClick(productId);
    }
    
    navigate(`/shop/products/${productId}`);
  };

  const handleCategoryClick = (categoryName) => {
    // 카테고리가 준비되지 않았으면 클릭 무시
    if (!isCategoryReady) {
      console.warn('카테고리가 아직 준비되지 않았습니다.');
      return;
    }
    
    setActiveTab(categoryName);
    handleTabChange(categoryName);
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-box">
            <HeroSlider />
          </div>
        </div>
      </section>

      <div className="container">
        <section className="cat-row">
          {loadingCategories ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "20px 0",
              color: "#6b7280"
            }}>
              🔄 카테고리를 불러오는 중...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ 
              gridColumn: "1 / -1", 
              textAlign: "center", 
              padding: "20px 0",
              color: "#6b7280"
            }}>
              📦 카테고리가 없습니다.
            </div>
          ) : (
            categories.map((c) => (
              <div
                className="cat-item"
                key={c.id || c.name}
                onClick={() => handleCategoryClick(c.name)}
                style={{ 
                  cursor: isCategoryReady ? "pointer" : "not-allowed",
                  opacity: isCategoryReady ? 1 : 0.6
                }}
              >
                <div className="cat-text">{c.name}</div>
              </div>
            ))
          )}
        </section>

        <section className="section">
          <div className="section-title">지금 가장 주목받는 신상</div>
          <Tabs
            active={activeTab}
            onChange={handleTabChange}
            tabs={["전체", ...Array.from(new Set(categories.map((c) => c.name)))]}
          />
          <div className="grid" style={{ position: 'relative' }}>
            {loadingProducts && products.length === 0 && (
              <div style={{ 
                gridColumn: "1 / -1", 
                textAlign: "center", 
                padding: "40px 0",
                color: "#6b7280"
              }}>
                🔄 상품을 불러오는 중...
              </div>
            )}
            {!loadingProducts && productsError && (
              <div style={{ 
                gridColumn: "1 / -1", 
                textAlign: "center", 
                padding: "40px 0",
                color: "#ef4444",
                background: "#fef2f2",
                borderRadius: "8px",
                margin: "20px 0"
              }}>
                ❌ {productsError}
              </div>
            )}
            {!loadingProducts && !productsError && filteredProducts.length === 0 && (
              <div style={{ 
                gridColumn: "1 / -1", 
                textAlign: "center", 
                padding: "40px 0",
                color: "#6b7280"
              }}>
                📦 등록된 상품이 없습니다.
              </div>
            )}
            <div style={{ 
              opacity: loadingProducts && products.length > 0 ? 0.5 : 1,
              transition: 'opacity 0.2s ease',
              pointerEvents: loadingProducts && products.length > 0 ? 'none' : 'auto',
              width: '100%',
              gridColumn: "1 / -1",
              display: 'grid',
              gridTemplateColumns: 'inherit',
              gap: 'inherit'
            }}>
              {filteredProducts.slice(0, 12).map((p) => (
              <article className="card" key={p.id} onClick={() => handleProductClick(p)} style={{ cursor: "pointer" }}>
                <button
                  className={`fav-btn${favorites.has(p.id) ? " active" : ""}`}
                  aria-pressed={favorites.has(p.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(p.id);
                  }}
                  title="관심 상품"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21s-6.716-4.21-9.193-7.44C.502 10.781 2.117 7 5.6 7c2.098 0 3.342 1.27 4.4 2.6C11.058 8.27 12.302 7 14.4 7c3.483 0 5.098 3.781 2.793 6.56C18.716 16.79 12 21 12 21z"
                      fill={favorites.has(p.id) ? "#ef4444" : "rgba(0,0,0,0.0)"}
                      stroke={favorites.has(p.id) ? "#ef4444" : "rgba(0,0,0,0.35)"}
                      strokeWidth="1.6"
                    />
                  </svg>
                </button>
                <div className="card-img">
                  <img
                    src={p.image || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"}
                    alt={p.imageAlt}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div className="card-body">
                  <div className="badge-row">
                    <span className="badge">{p.category}</span>
                  </div>
                  <div className="brand">{p.brand}</div>
                  <div className="name">{p.name}</div>
                  <div className="price-section">
                    {p.promotionPrice && p.discountRate ? (
                      <>
                        <div className="promotion-price">
                          {p.promotionPrice.toLocaleString()}원
                        </div>
                        <div className="original-price">
                          {p.price.toLocaleString()}원
                        </div>
                        <div className="discount-badge">
                          {p.discountRate}% 할인
                        </div>
                      </>
                    ) : (
                      <div className="price">
                        {(p.maxPrice ?? p.price ?? 0).toLocaleString()}원
                      </div>
                    )}
                  </div>
                  <div className="stock-status">
                    {p.isOutOfStock ? (
                      <span className="out-of-stock">품절</span>
                    ) : p.isLowStock ? (
                      <span className="low-stock">재고 부족</span>
                    ) : null}
                  </div>
                </div>
              </article>
              ))}
            </div>
            {loadingProducts && products.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '12px 24px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                color: "#6b7280",
                fontSize: '14px',
                zIndex: 10
              }}>
                🔄 업데이트 중...
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="container">
            <ProductRanking 
              memberId={currentUser?.memberId}
              onAddToCart={handleAddToCart}
              onOpenDetail={handleProductClick}
            />
          </div>
        </section>
      </div>
    </>
  );
}

export default HomePage;

