import React from "react";

function SearchResultsPage({ searchQuery, searchResults, isSearching, searchError, favorites, onToggleFavorite, onOpenDetail, onAddToCart, onBack }) {
  return (
    <div className="container search-results-page">
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>← 돌아가기</button>
        <h2 className="search-title">"{searchQuery}" 검색 결과</h2>
        {searchResults.length > 0 && (
          <div className="results-summary">총 {searchResults.length}개의 상품을 찾았습니다.</div>
        )}
      </div>
      {isSearching ? (
        <div className="search-loading">
          <div className="loading-spinner">검색 중...</div>
        </div>
      ) : searchError ? (
        <div className="search-error">
          <p>검색 중 오류가 발생했습니다: {searchError}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>다시 시도</button>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="no-results">
          <h3>검색 결과가 없습니다</h3>
          <p>다른 검색어로 시도해보세요.</p>
        </div>
      ) : (
        <div className="search-results">
          <div className="grid">
            {searchResults.map((product) => (
              <article className="card" key={product.id}>
                <button
                  className={`fav-btn${favorites.has(product.id) ? " active" : ""}`}
                  aria-pressed={favorites.has(product.id)}
                  onClick={() => onToggleFavorite(product.id)}
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
                      fill={favorites.has(product.id) ? "#ef4444" : "rgba(0,0,0,0.0)"}
                      stroke={favorites.has(product.id) ? "#ef4444" : "rgba(0,0,0,0.35)"}
                      strokeWidth="1.6"
                    />
                  </svg>
                </button>
                <div
                  className="card-img"
                  onClick={() => onOpenDetail(product)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={product.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"}
                    alt={product.imageAlt || product.name}
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
                  {product.isOutOfStock && (
                    <div className="out-of-stock-overlay">
                      <span>품절</span>
                    </div>
                  )}
                  {product.isLowStock && !product.isOutOfStock && (
                    <div className="low-stock-overlay">
                      <span>재고부족</span>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  <div className="badge-row">
                    <span className="badge">{product.category}</span>
                  </div>
                  <div className="brand">{product.brand}</div>
                  <div className="name">{product.name}</div>
                  <div className="price-section">
                    {product.promotionPrice && product.discountRate ? (
                      <>
                        <div className="promotion-price">
                          {product.promotionPrice.toLocaleString()}원
                        </div>
                        <div className="original-price">
                          {product.price.toLocaleString()}원
                        </div>
                        <div className="discount-badge">
                          {product.discountRate}% 할인
                        </div>
                      </>
                    ) : (
                      <div className="price">
                        {product.price.toLocaleString()}원
                      </div>
                    )}
                  </div>
                  <div className="stock-status">
                    {product.isOutOfStock ? (
                      <span className="out-of-stock">품절</span>
                    ) : product.isLowStock ? (
                      <span className="low-stock">재고 부족</span>
                    ) : (
                      <span className="in-stock">재고 있음</span>
                    )}
                  </div>
                  <div className="meta-row">
                    <span>관심 {product.likes}</span>
                    <span>리뷰 {product.reviews}</span>
                  </div>
                  <button 
                    className={`add-to-cart-btn ${product.isOutOfStock ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!product.isOutOfStock) {
                        onAddToCart(product);
                      }
                    }}
                    disabled={product.isOutOfStock}
                  >
                    {product.isOutOfStock ? '품절' : '장바구니 담기'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;

