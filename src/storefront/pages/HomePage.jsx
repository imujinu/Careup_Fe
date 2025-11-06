import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSlider from '../components/HeroSlider';
import Tabs from '../components/Tabs';
import ProductRanking from '../components/ProductRanking';
import { useShopData } from '../hooks/useShopData';
import { useShopAuth } from '../hooks/useShopAuth';
import { useShopCart } from '../hooks/useShopCart';

function HomePage() {
  const navigate = useNavigate();
  const { categories, products, loadingProducts, productsError, favorites, toggleFavorite, getCategoryIdByName } = useShopData();
  const { currentUser } = useShopAuth();
  const { handleAddToCart } = useShopCart();

  const [activeTab, setActiveTab] = React.useState("전체");

  const handleTabChange = (tabName) => {
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
    navigate(`/shop/products/${product.productId}`);
  };

  const handleCategoryClick = (categoryName) => {
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
          {categories.map((c) => (
            <div
              className="cat-item"
              key={c.name}
              onClick={() => handleCategoryClick(c.name)}
              style={{ cursor: "pointer" }}
            >
              <div className="cat-figure">
                <img 
                  src={c.photo || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80"} 
                  alt={c.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80";
                  }}
                />
              </div>
              <div className="cat-text">{c.name}</div>
            </div>
          ))}
        </section>

        <section className="section">
          <div className="section-title">지금 가장 주목받는 신상</div>
          <Tabs
            active={activeTab}
            onChange={handleTabChange}
            tabs={["전체", ...Array.from(new Set(categories.map((c) => c.name)))]}
          />
          <div className="grid">
            {loadingProducts && (
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
            {!loadingProducts && !productsError && filteredProducts.slice(0, 12).map((p) => (
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
                    src={p.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"}
                    alt={p.imageAlt}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80";
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
                    ) : (
                      <span className="in-stock">재고 있음</span>
                    )}
                  </div>
                  <button 
                    className={`add-to-cart-btn ${p.isOutOfStock ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!p.isOutOfStock) {
                        handleAddToCart(p);
                      }
                    }}
                    disabled={p.isOutOfStock}
                  >
                    {p.isOutOfStock ? '품절' : '장바구니 담기'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-title">🏆 실시간 인기 랭킹</div>
          <ProductRanking 
            memberId={currentUser?.memberId}
            onAddToCart={handleAddToCart}
            onOpenDetail={handleProductClick}
          />
        </div>
      </section>
    </>
  );
}

export default HomePage;

