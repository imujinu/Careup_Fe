import React, { useState } from "react";
import "./ProductDetail.css";

const ProductDetail = ({ product, onBack, onBuy, onAddToCart }) => {
  const [activeTab, setActiveTab] = useState("reviews");
  const [isInCart, setIsInCart] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const handleAddToCart = () => {
    // 지점 선택 강제 검사 제거 - 장바구니 담을 때는 지점 확인 불필요
    setIsInCart(true);
    if (onAddToCart) {
      const productWithBranch = {
        ...product,
        selectedBranchId: selectedBranchId
      };
      onAddToCart(productWithBranch);
    }
  };

  const handleBuy = () => {
    onBuy();
  };

  return (
    <div className="product-detail">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          ← 목록으로
        </button>

        {/* 메인 상품 정보 섹션 */}
        <div className="product-main">
          {/* 왼쪽: 상품 이미지 */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"}
                alt={product?.name || "New Balance 204L Suede Mushroom Arid Stone"}
              />
              <div className="image-nav">
                <button className="nav-btn prev">‹</button>
                <button className="nav-btn next">›</button>
              </div>
            </div>
            <div className="image-indicator">
              <div className="indicator-dot active"></div>
              <div className="indicator-dot"></div>
              <div className="indicator-dot"></div>
              <div className="indicator-dot"></div>
              <div className="indicator-dot"></div>
            </div>
            <div className="thumbnail-gallery">
              <div className="thumbnail active">
                <img
                  src={product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                  alt="thumb1"
                />
              </div>
              <div className="thumbnail">
                <img
                  src={product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                  alt="thumb2"
                />
              </div>
              <div className="thumbnail">
                <img
                  src={product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                  alt="thumb3"
                />
              </div>
              <div className="thumbnail">
                <img
                  src={product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                  alt="thumb4"
                />
              </div>
              <div className="thumbnail">
                <img
                  src={product?.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=150&q=80"}
                  alt="thumb5"
                />
              </div>
            </div>
          </div>

          {/* 오른쪽: 상품 정보 및 구매 */}
          <div className="product-info">
            <div className="price-section">
              <div className="instant-price">
                <span className="price-label">즉시 구매가</span>
                <span className="price-value">
                  {product?.minPrice ? `₩${product.minPrice?.toLocaleString()} ~ ₩${product.maxPrice?.toLocaleString()}` : 
                   product?.availableBranches?.[0]?.price ? `${product.availableBranches[0].price.toLocaleString()}원` : 
                   '가격 문의'}
                </span>
              </div>
            </div>

            <div className="product-title">
              <h1>{product?.name || product?.productName || "상품명"}</h1>
              <p className="product-subtitle">
                {product?.description || product?.productDescription || "상품 설명이 없습니다."}
              </p>
            </div>

            <div className="rating-section">
              <div className="rating">
                <span className="stars">★4.8</span>
                <span className="review-count">리뷰 {product?.reviewCount || 0}</span>
              </div>
            </div>

            {/* 구매 가능한 지점 선택 */}
            {product?.availableBranches && product.availableBranches.length > 0 && (
              <div className="option-section">
                <label className="option-label">구매 지점</label>
                <select
                  className="size-select branch-select"
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                >
                  <option value="">구매할 지점을 선택하세요</option>
                  {product.availableBranches.map(branch => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.branchName || `지점 ${branch.branchId}`} (재고: {branch.stockQuantity}개, 가격: {branch.price?.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 상품 정보 */}
            <div className="product-specs">
              {product?.category && (
                <div className="spec-item">
                  <span className="spec-label">카테고리</span>
                  <span className="spec-value">{product.category.categoryName || product.category}</span>
                </div>
              )}
              {product?.supplyPrice && (
                <div className="spec-item">
                  <span className="spec-label">공급가</span>
                  <span className="spec-value">{product.supplyPrice.toLocaleString()}원</span>
                </div>
              )}
              {product?.status && (
                <div className="spec-item">
                  <span className="spec-label">상태</span>
                  <span className="spec-value">{product.status === 'ACTIVE' ? '판매중' : '판매중지'}</span>
                </div>
              )}
            </div>

            {/* 구매 버튼들 */}
            <div className="purchase-buttons">
              <button className="buy-btn" onClick={handleBuy}>
                <div className="btn-price">
                  {selectedBranchId && product?.availableBranches?.[selectedBranchId]?.price 
                    ? `${product.availableBranches[selectedBranchId].price.toLocaleString()}원`
                    : product?.minPrice 
                    ? `₩${product.minPrice.toLocaleString()}원~`
                    : '구매하기'}
                </div>
                <div className="btn-label">구매</div>
              </button>
              <button
                className={`cart-btn ${isInCart ? "added" : ""}`}
                onClick={handleAddToCart}
              >
                <div className="btn-price">
                  {selectedBranchId && product?.availableBranches?.[selectedBranchId]?.price 
                    ? `${product.availableBranches[selectedBranchId].price.toLocaleString()}원`
                    : product?.minPrice 
                    ? `₩${product.minPrice.toLocaleString()}원~`
                    : '가격보기'}
                </div>
                <div className="btn-label">
                  {isInCart ? "장바구니 담김" : "장바구니"}
                </div>
              </button>
            </div>

            {/* 관심상품 */}
            <div className="interest-section">
              <div className="interest-item">
                <span className="interest-icon">♡</span>
                <span className="interest-text">관심상품 2.6만</span>
              </div>
            </div>

            {/* 추가 혜택 */}
            <div className="benefits-section">
              <h3>추가 혜택</h3>
              <div className="benefit-item">
                <span className="benefit-label">포인트</span>
                <span className="benefit-text">계좌 간편결제 시 1% 적립</span>
              </div>
              <div className="benefit-item">
                <span className="benefit-label">결제</span>
                <span className="benefit-text">
                  크림카드 최대 20만원 상당 혜택 외 7건
                </span>
              </div>
              <button className="more-benefits">더보기</button>
            </div>
          </div>
        </div>

        {/* 상품 정보 섹션 */}
        <div className="price-info-section">
          <div className="price-info-grid">
            <div className="price-info-item">
              <span className="info-label">판매가격</span>
              <span className="info-value">
                {product?.minPrice && product?.maxPrice 
                  ? `₩${product.minPrice.toLocaleString()} ~ ₩${product.maxPrice.toLocaleString()}`
                  : product?.availableBranches?.[0]?.price 
                  ? `${product.availableBranches[0].price.toLocaleString()}원`
                  : '가격 문의'}
              </span>
            </div>
            <div className="price-info-item">
              <span className="info-label">공급가격</span>
              <span className="info-value">{product?.supplyPrice?.toLocaleString() || '-'}원</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">상품ID</span>
              <span className="info-value">{product?.productId || '-'}</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">카테고리</span>
              <span className="info-value">{product?.category?.categoryName || product?.category || '-'}</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">재고상태</span>
              <span className="info-value">
                {product?.status === 'ACTIVE' ? '판매중' : 
                 product?.status === 'INACTIVE' ? '판매중지' : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="tabs-section">
          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              상품설명
            </button>
            <button
              className={`tab-btn ${activeTab === "qa" ? "active" : ""}`}
              onClick={() => setActiveTab("qa")}
            >
              구매정보
            </button>
          </div>

          {/* 상품 설명 탭 */}
          {activeTab === "reviews" && (
            <div className="reviews-content">
              <div className="product-description">
                <h3>상품 상세 정보</h3>
                <div className="description-text">
                  {product?.description || product?.productDescription || "상품 설명이 없습니다."}
                </div>
                {product?.image && (
                  <div className="product-detail-image">
                    <img src={product.image} alt={product.name || product.productName} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 구매정보 탭 */}
          {activeTab === "qa" && (
            <div className="qa-content">
              <div className="purchase-info">
                <h3>구매 안내</h3>
                <div className="info-section">
                  <h4>배송 정보</h4>
                  <p>• 배송비: 무료 배송</p>
                  <p>• 배송 소요일: 1-3일</p>
                </div>
                <div className="info-section">
                  <h4>교환/환불 안내</h4>
                  <p>• 제품 하자 또는 오배송 시 100% 재발송 또는 환불 처리</p>
                  <p>• 고객 단순 변심 시 7일 이내 교환/환불 가능</p>
                </div>
                <div className="info-section">
                  <h4>결제 안내</h4>
                  <p>• 무통장입금 / 카드결제 / 휴대폰결제</p>
                  <p>• 할부 결제 가능 (3개월 무이자)</p>
                </div>
                <div className="info-section">
                  <h4>포인트 적립</h4>
                  <p>• 구매금액의 1% 포인트 적립</p>
                  <p>• 다음 결제 시 사용 가능</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;