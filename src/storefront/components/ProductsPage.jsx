import React, { useState, useMemo, useEffect } from "react";

const ProductsPage = ({ favorites, onToggleFavorite, onOpenDetail, onAddToCart, products, searchQuery, categories, activeTab: externalActiveTab, onTabChange, currentPage, setCurrentPage, totalPages, loadingProducts }) => {
  const [activeTab, setActiveTab] = useState(externalActiveTab || "전체");
  const [sort, setSort] = useState("인기순");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [showFilters, setShowFilters] = useState(false);

  // 외부에서 activeTab이 변경될 때 내부 상태도 업데이트
  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  const tabs = ["전체", ...(categories ? categories.map(c => c.name) : [])];

  const filteredProducts = useMemo(() => {
    // 로딩 중이고 products가 비어있으면 이전 필터링 결과 유지 (깜빡임 방지)
    if (loadingProducts && products.length === 0) {
      return [];
    }
    
    let productList = products;
    
    // 검색어 필터링
    if (searchQuery && searchQuery.trim()) {
      productList = productList.filter((p) => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // 카테고리 필터링
    if (activeTab && activeTab !== "전체") {
      productList = productList.filter((p) => {
        const match = p.category === activeTab || p.category?.toLowerCase() === activeTab?.toLowerCase();
        return match;
      });
    }

    // 가격 범위 필터링
    productList = productList.filter((p) => {
      const price = p.promotionPrice || p.price;
      return price >= priceRange.min && price <= priceRange.max;
    });
    
    return productList;
  }, [activeTab, searchQuery, products, priceRange, loadingProducts]);

  const sortedProducts = useMemo(() => {
    let list = [...filteredProducts];
    switch (sort) {
      case "리뷰많은순":
        return list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      case "등록일순":
        return list.sort((a, b) => (b.id || 0) - (a.id || 0));
      case "할인순":
        return list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      case "가격낮은순":
        return list.sort((a, b) => {
          const priceA = a.promotionPrice || a.price;
          const priceB = b.promotionPrice || b.price;
          return priceA - priceB;
        });
      case "가격높은순":
        return list.sort((a, b) => {
          const priceA = a.promotionPrice || a.price;
          const priceB = b.promotionPrice || b.price;
          return priceB - priceA;
        });
      default:
        return list.sort((a, b) => (b.pop || 0) - (a.pop || 0));
    }
  }, [filteredProducts, sort]);

  const handlePriceRangeChange = (field, value) => {
    setPriceRange(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const resetFilters = () => {
    setPriceRange({ min: 0, max: 1000000 });
    setActiveTab("전체");
    setSort("인기순");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <div className="container products-page">
      <div className="products-header">
        <h1>전체 상품</h1>
        <div className="products-controls">
          <div className="tabs">
            {tabs.map((t) => (
              <button
                key={t}
                className={`tab${activeTab === t ? " active" : ""}`}
                onClick={() => handleTabChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="sort-select">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="sort-dropdown"
            >
              <option value="인기순">인기순</option>
              <option value="리뷰많은순">리뷰많은순</option>
              <option value="등록일순">등록일순</option>
              <option value="할인순">할인순</option>
              <option value="가격낮은순">가격낮은순</option>
              <option value="가격높은순">가격높은순</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid" style={{ position: 'relative' }}>
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
          {sortedProducts.map((p) => (
          <article className="card" key={p.id}>
            <button
              className={`fav-btn${favorites.has(p.id) ? " active" : ""}`}
              aria-pressed={favorites.has(p.id)}
              onClick={() => onToggleFavorite(p.id)}
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
            <div
              className="card-img"
              onClick={() => onOpenDetail(p)}
              style={{ cursor: "pointer" }}
            >
              <img
                src={p.image}
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
              <div className="price">{p.price.toLocaleString()}원</div>
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

      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <button 
            className="btn-secondary"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{ padding: '8px 16px' }}
          >
            이전
          </button>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 1, Math.floor(currentPage / 5) * 5 + i));
              return (
                <button
                  key={pageNum}
                  className={currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{ padding: '8px 12px', minWidth: '44px' }}
                >
                  {pageNum + 1}
                </button>
              );
            })}
          </div>
          
          <button 
            className="btn-secondary"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
            style={{ padding: '8px 16px' }}
          >
            다음
          </button>
          
          <span style={{ marginLeft: '16px', color: '#666' }}>
            {currentPage + 1} / {totalPages} 페이지
          </span>
        </div>
      )}
    </div>
  );
};

// 상품 데이터는 ShopApp에서 가져옴

export default ProductsPage;
