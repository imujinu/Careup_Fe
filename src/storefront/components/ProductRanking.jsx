import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { customerAuthService } from "../../service/customerAuthService";
import { customerProductService } from "../../service/customerProductService";
import "./ProductRanking.css";

const ProductRanking = ({ memberId, onAddToCart, onOpenDetail }) => {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]); // 전체 상품 데이터 (30개)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRecentView, setHasRecentView] = useState(false);
  const [lastViewProductName, setLastViewProductName] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
  const PAGE_SIZE = 5;
  const INITIAL_FETCH_SIZE = 30; // 초기 요청 시 30개
  const MAX_PAGE = 5; // 최대 페이지 번호 (0~5)

  // 현재 페이지에 표시할 상품들 (5개씩)
  const currentProducts = allProducts.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(allProducts.length / PAGE_SIZE) || 1;

  // 초기 데이터 로딩 (한 번만 실행)
  useEffect(() => {
    const fetchRankingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // userInfo 확인
        const userInfo = customerAuthService.getCurrentUser();
        const custUserInfoRaw = localStorage.getItem('cust_userInfo');
        const custUserInfo = custUserInfoRaw ? JSON.parse(custUserInfoRaw) : null;

        let endpoint;
        let isPersonalizedMode = false;

        if (memberId && custUserInfo) {
          // memberId가 있고 cust_userInfo가 있으면 개인화 추천
          endpoint = `/rec/${memberId}`;
          isPersonalizedMode = true;
          console.log("✅ 개인화 추천 모드 - endpoint:", endpoint);
        } else {
          // cust_userInfo가 없으면 일반 인기 상품
          endpoint = '/api/rank';
          isPersonalizedMode = false;
          console.log("📊 일반 인기 상품 모드 - endpoint:", endpoint, "이유: memberId=", memberId, "custUserInfo=", custUserInfo);
        }

        setIsPersonalized(isPersonalizedMode);

        // 초기 로딩 시 30개 요청
        endpoint = `${endpoint}?page=0&size=${INITIAL_FETCH_SIZE}`;
        console.log("🚀 요청 URL:", endpoint);

        const res = await shopApi.get(endpoint);
        
        // 응답 데이터 구조 처리
        // /rec/{memberId}는 data.result 안에 products.content가 있음
        // /api/rank는 다른 구조일 수 있음
        const result = res?.data?.result || res?.data;
        
        if (result) {
          let productList = [];
          
          // 다양한 응답 구조 처리
          if (result.products?.content) {
            // /rec/{memberId} 형태: { products: { content: [...] } }
            productList = result.products.content;
          } else if (result.products && Array.isArray(result.products)) {
            // { products: [...] }
            productList = result.products;
          } else if (result.content && Array.isArray(result.content)) {
            // { content: [...] } - 페이지네이션 응답
            productList = result.content;
          } else if (Array.isArray(result)) {
            // 직접 배열
            productList = result;
          } else if (Array.isArray(res?.data)) {
            // data가 직접 배열
            productList = res.data;
          }
          
          // 최대 30개까지만 저장 (6페이지 * 5개 = 30개)
          const limitedProducts = Array.isArray(productList) ? productList.slice(0, INITIAL_FETCH_SIZE) : [];
          setAllProducts(limitedProducts);
          
          // hasRecentView와 lastViewProductName은 /rec/{memberId}에만 있음
          if (isPersonalizedMode) {
            setHasRecentView(result.hasRecentView || false);
            setLastViewProductName(result.lastViewProductName || "");
          } else {
            setHasRecentView(false);
            setLastViewProductName("");
          }
        } else {
          setAllProducts([]);
          setHasRecentView(false);
          setLastViewProductName("");
        }
      } catch (err) {
        console.error('❌ 인기 랭킹 데이터 로딩 실패:', err);
        setError(err?.response?.data?.message || err?.message || '인기 랭킹을 불러오는데 실패했습니다.');
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [memberId]); // memberId만 의존성으로 설정 (초기 로딩만)

  const handleProductClick = async (product) => {
    // 상품 클릭 시 조회 API 요청
    const productId = product.productId || product.id;
    if (productId) {
      await customerProductService.recordProductViewClick(productId);
    }
    
    if (onOpenDetail) {
      // 상품 상세 페이지로 이동하기 위한 데이터 변환
      const productDetail = {
        id: product.productId,
        productId: product.productId,
        name: product.productName || product.name,
        price: Number(product.price || 0),
        minPrice: Number(product.price || 0),
        maxPrice: Number(product.price || 0),
        image: product.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png",
        imageAlt: product.productName || "상품 이미지",
        category: product.categoryName || "미분류",
        description: product.description || "상품에 대한 자세한 설명이 없습니다.",
        specifications: [
          { name: "카테고리", value: product.categoryName || "정보 없음" },
        ],
        images: [product.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"],
        availableBranches: [],
        availableBranchCount: 0,
      };
      onOpenDetail(productDetail);
    }
  };

  const handleAddToCartClick = (e, product) => {
    e.stopPropagation();
    if (onAddToCart) {
      const productData = {
        id: product.productId,
        productId: product.productId,
        name: product.productName || product.name,
        price: Number(product.price || 0),
        minPrice: Number(product.price || 0),
        maxPrice: Number(product.price || 0),
        image: product.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png",
        imageAlt: product.productName || "상품 이미지",
        category: product.categoryName || "미분류",
        description: product.description || "상품에 대한 자세한 설명이 없습니다.",
        availableBranches: [],
        availableBranchCount: 0,
      };
      onAddToCart(productData);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentPage(currentPage - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNextPage = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      // 5번 페이지에서 다음을 누르면 0번으로 순환
      if (currentPage >= MAX_PAGE) {
        setCurrentPage(0);
      } else if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handlePageClick = (page) => {
    if (!isTransitioning && page !== currentPage) {
      setIsTransitioning(true);
      setCurrentPage(page);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleViewAll = () => {
    navigate('/shop/products');
  };

  // 페이지에 따른 순위 번호 계산 (페이지 0: 1~5위, 페이지 1: 6~10위 등)
  const getRankNumber = (index) => {
    return currentPage * PAGE_SIZE + index + 1;
  };

  if (loading) {
    return (
      <div className="loading-container">
        🔄 인기 랭킹을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        ❌ {error}
      </div>
    );
  }

  // rec 요청으로 상품이 없으면 아무것도 표시하지 않음
  if (allProducts.length === 0 && !loading) {
    if (isPersonalized) {
      return null;
    }
    return (
      <div className="empty-container">
        📦 표시할 상품이 없습니다.
      </div>
    );
  }


  return (
    <>
      {/* 타이틀 - hasRecentView에 따라 변경 */}
      <div className="section-title">
        {hasRecentView ? "📦 연관 상품" : "🏆 인기 랭킹"}
      </div>

      {hasRecentView && lastViewProductName && (
        <div className="personalized-message">
          <div className="personalized-message-text">
            💡 "{lastViewProductName}"과 관련된 상품을 찾아보세요
          </div>
        </div>
      )}
      
      <div className="product-ranking-container">
        <div className="product-ranking-slider">
          {/* 좌우 화살표 버튼 (페이지가 2개 이상일 때 표시) */}
          {totalPages > 1 && (
            <>
              <button
                aria-label="이전 페이지"
                className={`slider-nav-btn prev ${currentPage === 0 ? 'disabled' : ''}`}
                onClick={handlePrevPage}
                disabled={currentPage === 0}
              >
                ‹
              </button>
              <button
                aria-label="다음 페이지"
                className="slider-nav-btn next"
                onClick={handleNextPage}
              >
                ›
              </button>
            </>
          )}

          <div
            className={`grid ranking-grid ${loading ? 'loading' : ''} ${isTransitioning ? 'transitioning' : ''}`}
          >
            {/* 현재 페이지의 5개 상품 표시 */}
            {currentProducts.map((product, i) => (
              <article
                className={`rank-card ranking-card ${loading ? 'no-animation' : ''} ${isTransitioning ? 'slide-in' : ''}`}
                key={product.productId || `${currentPage}-${i}`}
                onClick={() => handleProductClick(product)}
              >
                <div className="rank-badge">{getRankNumber(i)}</div>
                <div className="rank-img">
                  <img
                    src={product.imageUrl || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png"}
                    alt={product.productName || product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
                    }}
                  />
                </div>
                <button
                  className="deal-cta"
                  onClick={(e) => handleAddToCartClick(e, product)}
                >
                  🛒 담기
                </button>
                <div className="card-body">
                  <div className="name">{product.productName || product.name}</div>
                  <div className="price">
                    {product.price ? (
                      <b>{product.price.toLocaleString()}원</b>
                    ) : (
                      <span style={{ color: "#6b7280" }}>가격 정보 없음</span>
                    )}
                  </div>
                  {product.coPurchaseCount != null && product.coPurchaseCount > 0 && (
                    <div className="co-purchase-count" style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      marginTop: "4px"
                    }}>
                      함께 구매된 횟수 : {product.coPurchaseCount}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* 페이지 인디케이터 (페이지가 2개 이상일 때 표시, 최대 6개) */}
          {totalPages > 1 && (
            <div className="page-indicator-container">
              {Array.from({ length: Math.min(totalPages, MAX_PAGE + 1) }, (_, i) => (
                <span
                  key={i}
                  className={`page-indicator-dot ${i === currentPage ? 'active' : ''}`}
                  onClick={() => handlePageClick(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="view-all-container">
        <button
          className="tab view-all-btn"
          onClick={handleViewAll}
        >
          전체보기 ▸
        </button>
      </div>
    </>
  );
};

export default ProductRanking;

