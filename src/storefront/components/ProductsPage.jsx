import React, { useState, useMemo } from "react";

const ProductsPage = ({ favorites, onToggleFavorite, onOpenDetail, onAddToCart, products, searchQuery }) => {
  const [activeTab, setActiveTab] = useState("전체");
  const [sort, setSort] = useState("인기순");

  const tabs = ["전체", "의류", "신발", "액세서리", "러닝", "트레이닝"];

  const filteredProducts = useMemo(() => {
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
    if (activeTab !== "전체") {
      productList = productList.filter((p) => p.category === activeTab);
    }
    
    return productList;
  }, [activeTab, searchQuery, products]);

  const sortedProducts = useMemo(() => {
    let list = [...filteredProducts];
    switch (sort) {
      case "리뷰많은순":
        return list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      case "등록일순":
        return list.sort((a, b) => (b.id || 0) - (a.id || 0));
      case "할인순":
        return list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      default:
        return list.sort((a, b) => (b.pop || 0) - (a.pop || 0));
    }
  }, [filteredProducts, sort]);

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
                onClick={() => setActiveTab(t)}
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
            </select>
          </div>
        </div>
      </div>

      <div className="grid">
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
              <div className="meta-row">
                <span>관심 {p.likes}</span>
                <span>리뷰 {p.reviews}</span>
              </div>
              <button 
                className="add-to-cart-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(p);
                }}
              >
                장바구니 담기
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

// 상품 데이터는 ShopApp에서 가져옴

export default ProductsPage;
