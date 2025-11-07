import React, { useMemo } from "react";

function SearchResultsPage({ searchQuery, searchResults, isSearching, searchError, favorites, onToggleFavorite, onOpenDetail, onAddToCart, onBack }) {
  // favorites가 없거나 Set이 아닌 경우를 대비한 안전 처리 (메모이제이션)
  const favoritesSet = useMemo(() => {
    if (favorites instanceof Set) {
      return favorites;
    }
    return new Set();
  }, [favorites]);

  // 가격 표시 함수
  const renderPrice = (product) => {
    if (product.promotionPrice && product.discountRate) {
      return (
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
      );
    }

    const minPrice = product.minPrice || 0;
    const maxPrice = product.maxPrice || 0;
    const price = product.price || 0;

    // minPrice와 maxPrice가 모두 있고 다른 경우 가격 범위 표시
    if (minPrice > 0 && maxPrice > 0 && minPrice !== maxPrice) {
      return (
        <div className="price">
          {minPrice.toLocaleString()}원 ~ {maxPrice.toLocaleString()}원
        </div>
      );
    }
    
    // maxPrice가 있으면 표시
    if (maxPrice > 0) {
      return (
        <div className="price">
          {maxPrice.toLocaleString()}원
        </div>
      );
    }
    
    // price가 있으면 표시
    if (price > 0) {
      return (
        <div className="price">
          {price.toLocaleString()}원
        </div>
      );
    }
    
    // 가격이 없으면 "가격 문의" 표시
    return (
      <div className="price" style={{ color: '#6b7280' }}>
        가격 문의
      </div>
    );
  };
  
  return (
    <div className="container search-results-page">
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>← 뒤로가기</button>
        <h2 className="search-title">"{searchQuery}" 검색 결과</h2>
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
          <p>다른 검색어로 다시 시도해주세요.</p>
        </div>
      ) : (
        <div className="search-results">
          <div className="results-summary">총 {searchResults.length}개의 상품을 찾았습니다</div>
          <div className="grid">
            {searchResults.map((product) => (
              <article className="card" key={product.id} onClick={() => onOpenDetail(product)} style={{ cursor: "pointer" }}>
                <button
                  className={`fav-btn${favoritesSet.has(product.id) ? " active" : ""}`}
                  aria-pressed={favoritesSet.has(product.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(product.id);
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
                      fill={favoritesSet.has(product.id) ? "#ef4444" : "rgba(0,0,0,0.0)"}
                      stroke={favoritesSet.has(product.id) ? "#ef4444" : "rgba(0,0,0,0.35)"}
                      strokeWidth="1.6"
                    />
                  </svg>
                </button>
                <div className="card-img">
                  <img
                    src={product.image || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"}
                    alt={product.imageAlt || product.name}
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
                  <div className="name">
                    {product.highlightedName ? (
                      <span dangerouslySetInnerHTML={{ __html: product.highlightedName }} />
                    ) : (
                      product.name
                    )}
                  </div>
                  <div className="price-section">
                    {renderPrice(product)}
                  </div>
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

