import React from "react";

function SearchResultsPage({ searchQuery, searchResults, isSearching, searchError, favorites, onToggleFavorite, onOpenDetail, onAddToCart, onBack }) {
  return (
    <div className="container search-results-page">
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>← 뒤로가기</button>
        <h2 className="search-title">"{searchQuery}" 검색 결과</h2>
      </div>
      {isSearching ? (
        <div className="search-loading"><div className="loading-spinner">검색 중...</div></div>
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
          <div className="products-grid">
            {searchResults.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-container">
                  <img src={product.image} alt={product.imageAlt || product.name} className="product-image" />
                  {product.isOutOfStock && <div className="out-of-stock-overlay"><span>품절</span></div>}
                  {product.isLowStock && !product.isOutOfStock && <div className="low-stock-overlay"><span>재고부족</span></div>}
                  <button className={`favorite-btn ${favorites.has(product.id) ? 'active' : ''}`} onClick={() => onToggleFavorite(product.id)}>♥</button>
                </div>
                <div className="product-info">
                  <div className="product-category">{product.category}</div>
                  <h3 className="product-name">
                    {product.highlightedName ? (
                      <span dangerouslySetInnerHTML={{ __html: product.highlightedName }} />
                    ) : (
                      product.name
                    )}
                  </h3>
                  <div className="product-brand">{product.brand}</div>
                  <div className="product-price">
                    {product.promotionPrice && product.discountRate ? (
                      <>
                        <span className="promotion-price">{product.promotionPrice.toLocaleString()}원</span>
                        <span className="original-price">{product.price.toLocaleString()}원</span>
                        <span className="discount-badge">{product.discountRate}% 할인</span>
                      </>
                    ) : (
                      <span className="price">{product.price.toLocaleString()}원</span>
                    )}
                  </div>
                  <div className="product-meta">
                    <span className="likes">관심 {product.likes}</span>
                    <span className="reviews">리뷰 {product.reviews}</span>
                  </div>
                  <div className="product-actions">
                    <button className="detail-btn" onClick={() => onOpenDetail(product)}>상세보기</button>
                    <button className={`add-to-cart-btn ${product.isOutOfStock ? 'disabled' : ''}`} onClick={() => !product.isOutOfStock && onAddToCart(product)} disabled={product.isOutOfStock}>{product.isOutOfStock ? '품절' : '장바구니 담기'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;

