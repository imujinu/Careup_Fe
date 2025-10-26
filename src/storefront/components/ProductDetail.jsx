import React, { useState } from "react";
import "./ProductDetail.css";

const ProductDetail = ({ product, onBack, onBuy, onAddToCart }) => {
  const [selectedSize, setSelectedSize] = useState("270");
  const [selectedColor, setSelectedColor] = useState("Mushroom/Arid Stone");
  const [activeTab, setActiveTab] = useState("reviews");
  const [isInCart, setIsInCart] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const handleAddToCart = () => {
    if (!selectedBranchId && product?.availableBranches && product.availableBranches.length > 0) {
      alert('구매할 지점을 선택해주세요.');
      return;
    }
    
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
                <span className="price-value">{product?.price?.toLocaleString()}원</span>
              </div>
            </div>

            <div className="product-title">
              <h1>{product?.name || "New Balance 204L Suede Mushroom Arid Stone"}</h1>
              <p className="product-subtitle">
                {product?.description || "뉴발란스 204L 스웨이드 머쉬룸 애리드 스톤"}
              </p>
            </div>

            <div className="rating-section">
              <div className="rating">
                <span className="stars">★4.8</span>
                <span className="review-count">리뷰 {product?.reviews || 638}</span>
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

            {/* 사이즈 선택 */}
            <div className="option-section">
              <label className="option-label">사이즈</label>
              <select
                className="size-select"
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
              >
                <option value="">모든 사이즈</option>
                <option value="240">240</option>
                <option value="250">250</option>
                <option value="260">260</option>
                <option value="270">270</option>
                <option value="280">280</option>
                <option value="290">290</option>
              </select>
            </div>

            {/* 컬러 선택 */}
            <div className="option-section">
              <label className="option-label">컬러</label>
              <select
                className="color-select"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
              >
                <option value="Mushroom/Arid Stone">Mushroom/Arid Stone</option>
                <option value="Black/White">Black/White</option>
                <option value="Navy/White">Navy/White</option>
                <option value="Gray/White">Gray/White</option>
              </select>
            </div>

            {/* 구매 버튼들 */}
            <div className="purchase-buttons">
              <button className="buy-btn" onClick={handleBuy}>
                <div className="btn-price">{product?.price?.toLocaleString()}원</div>
                <div className="btn-label">구매</div>
              </button>
              <button
                className={`cart-btn ${isInCart ? "added" : ""}`}
                onClick={handleAddToCart}
              >
                <div className="btn-price">{product?.price?.toLocaleString()}원</div>
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

        {/* 시세 정보 섹션 */}
        <div className="price-info-section">
          <div className="price-info-grid">
            <div className="price-info-item">
              <span className="info-label">최근 거래가</span>
              <span className="info-value">229,000원</span>
              <span className="price-change up">▲9,000 (+4.1%)</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">발매가</span>
              <span className="info-value">159,000원</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">모델번호</span>
              <span className="info-value">U204LMMA</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">출시일</span>
              <span className="info-value">25/07/03</span>
            </div>
            <div className="price-info-item">
              <span className="info-label">대표 색상</span>
              <span className="info-value">Mushroom/Arid Stone</span>
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
              상품후기 (4)
            </button>
            <button
              className={`tab-btn ${activeTab === "qa" ? "active" : ""}`}
              onClick={() => setActiveTab("qa")}
            >
              상품 Q&A (1)
            </button>
          </div>

          {/* 후기 탭 */}
          {activeTab === "reviews" && (
            <div className="reviews-content">
              {/* 스타일 리뷰 그리드 */}
              <div className="style-reviews">
                <h3>스타일 리뷰 97</h3>
                <div className="style-grid">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="style-item">
                      <div className="style-image">
                        <img src="../public/dummy.png" alt={`스타일 ${item}`} />
                      </div>
                      <div className="style-info">
                        <div className="style-user">_jthe</div>
                        <div className="style-likes">♡ 10</div>
                        <div className="style-tags">
                          #매일크챌 #가을맞이룩 #가을신발 #오오티디
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 후기 작성 섹션 */}
              <div className="review-write-section">
                <div className="review-header">
                  <h3>[설화수] 자음 2종 세트(쇼핑백 증정)</h3>
                  <div className="review-meta">
                    <span>베스트</span>
                    <span>멤버스</span>
                    <span>권**</span>
                  </div>
                </div>

                <div className="review-content">
                  <p>
                    설화수 윤조를 정기적으로 사용하고 있어요 (연 4회 정도)
                    30대인데 설화수 제품이 가장 저렴하고 샘플도 많이 주는 곳이
                    컬리 라방이에요. 기본 스킨케어는 설화수, 컬러 메이크업은
                    헤라로 하고 있어요. 컬리 라방이 가성비가 정말 좋아요. 최근에
                    3세트 구매해서 버킷백도 받았는데 색깔이 예뻐서 봄/여름에 쓸
                    예정이에요. 설날에 어머니, 시어머니께 드릴 세트도 준비했고,
                    저도 하나 남겨둘게요. 설화수에서 새해 복 많이 받으시길
                    바라요. 설화수는 유명하고 성분도 좋고 30대부터 꾸준히
                    사용하고 있어요. 설화수(아모레야) 제발 제 피부 좀
                    챙겨주세요.
                  </p>
                </div>

                <div className="review-images">
                  <div className="image-gallery">
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 1"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 2"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 3"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 4"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 5"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 6"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 7"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=200&q=80"
                      alt="리뷰 이미지 8"
                    />
                  </div>
                </div>

                <button className="product-select-btn">상품 선택</button>
              </div>
            </div>
          )}

          {/* Q&A 탭 */}
          {activeTab === "qa" && (
            <div className="qa-content">
              <div className="qa-header">
                <h3>상품 문의</h3>
                <div className="qa-instructions">
                  <p>
                    • 상품에 대한 문의를 남기는 공간입니다. 해당 게시판의 성격과
                    다른 글은 사전동의 없이 담당 게시판으로 이동될 수 있습니다.
                  </p>
                  <p>
                    • 배송관련, 주문(취소/교환/환불)관련 문의 및 요청사항은
                    마이컬리 내 1:1 문의에 남겨주세요.
                  </p>
                </div>
                <button className="inquiry-btn">문의하기</button>
              </div>

              <div className="qa-table">
                <div className="qa-table-header">
                  <div className="qa-col-title">제목</div>
                  <div className="qa-col-author">작성자</div>
                  <div className="qa-col-date">작성일</div>
                  <div className="qa-col-status">답변상태</div>
                </div>

                <div className="qa-table-body">
                  <div className="qa-row">
                    <div className="qa-col-title">쇼핑백 보내주세요</div>
                    <div className="qa-col-author">이*진</div>
                    <div className="qa-col-date">2025.09.22</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">
                      비밀글입니다.
                      <span className="lock-icon">🔒</span>
                    </div>
                    <div className="qa-col-author">박*회</div>
                    <div className="qa-col-date">2025.09.21</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">
                      비밀글입니다.
                      <span className="lock-icon">🔒</span>
                    </div>
                    <div className="qa-col-author">김*정</div>
                    <div className="qa-col-date">2025.09.18</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">
                      탄력세트 3종 주문시 증정품
                    </div>
                    <div className="qa-col-author">임*원</div>
                    <div className="qa-col-date">2025.09.16</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">
                      비밀글입니다.
                      <span className="lock-icon">🔒</span>
                    </div>
                    <div className="qa-col-author">김*라</div>
                    <div className="qa-col-date">2025.08.23</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">
                      영수증 끊어 계산시 20만이상 30만이상 증정품 관련
                    </div>
                    <div className="qa-col-author">김*정</div>
                    <div className="qa-col-date">2025.08.20</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">
                      비밀글입니다.
                      <span className="lock-icon">🔒</span>
                    </div>
                    <div className="qa-col-author">신*연</div>
                    <div className="qa-col-date">2025.07.26</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>

                  <div className="qa-row">
                    <div className="qa-col-title">샘플</div>
                    <div className="qa-col-author">조*인</div>
                    <div className="qa-col-date">2025.06.26</div>
                    <div className="qa-col-status answered">답변완료</div>
                  </div>
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