import React, { useState, useEffect } from "react";
import axios from "axios";
import { customerAuthService } from "../../service/customerAuthService";
import { customerProductService } from "../../service/customerProductService";

const ProductRanking = ({ memberId, onAddToCart, onOpenDetail }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRecentView, setHasRecentView] = useState(false);
  const [lastViewProductName, setLastViewProductName] = useState("");
  const [isRecRequest, setIsRecRequest] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  useEffect(() => {
    const fetchRankingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // userInfo 확인
        const userInfo = customerAuthService.getCurrentUser();
        let endpoint;

        if (memberId && userInfo) {
          // memberId가 있고 userInfo가 있으면 개인화 추천
          endpoint = `/rec/${memberId}`;
          setIsRecRequest(true);
        } else {
          // userInfo가 없으면 일반 인기 상품
          endpoint = '/api/rank';
          setIsRecRequest(false);
        }

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
            // { content: [...] }
            productList = result.content;
          } else if (Array.isArray(result)) {
            // 직접 배열
            productList = result;
          } else if (Array.isArray(res?.data)) {
            // data가 직접 배열
            productList = res.data;
          }
          
          setProducts(Array.isArray(productList) ? productList : []);
          
          // hasRecentView와 lastViewProductName은 /rec/{memberId}에만 있음
          if (endpoint.startsWith('/rec/')) {
            setHasRecentView(result.hasRecentView || false);
            setLastViewProductName(result.lastViewProductName || "");
          } else {
            // /api/rank는 일반 인기 상품이므로 해당 필드 없음
            setHasRecentView(false);
            setLastViewProductName("");
          }
        } else {
          setProducts([]);
          setHasRecentView(false);
          setLastViewProductName("");
        }
      } catch (err) {
        console.error('❌ 인기 랭킹 데이터 로딩 실패:', err);
        setError(err?.response?.data?.message || err?.message || '인기 랭킹을 불러오는데 실패했습니다.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [memberId]);

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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
        🔄 인기 랭킹을 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: "40px 0", 
        color: "#ef4444",
        background: "#fef2f2",
        borderRadius: "8px",
        margin: "20px 0"
      }}>
        ❌ {error}
      </div>
    );
  }

  // rec 요청으로 상품이 없으면 아무것도 표시하지 않음
  if (products.length === 0) {
    if (isRecRequest) {
      return null;
    }
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
        📦 표시할 상품이 없습니다.
      </div>
    );
  }

  return (
    <>
      {hasRecentView && lastViewProductName && (
        <div style={{ 
          marginBottom: "16px", 
          padding: "12px 16px", 
          background: "#f0f9ff", 
          borderRadius: "8px",
          border: "1px solid #bae6fd"
        }}>
          <div style={{ fontSize: "14px", color: "#0369a1", fontWeight: 500 }}>
            💡 "{lastViewProductName}"과(와) 관련된 상품을 찾아보세요
          </div>
        </div>
      )}
      
      <div className="grid ranking-grid">
        {products.slice(0, 5).map((product, i) => (
          <article 
            className="rank-card" 
            key={product.productId || i}
            onClick={() => handleProductClick(product)}
            style={{ cursor: "pointer" }}
          >
            <div className="rank-badge">{i + 1}</div>
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
                  <>
                    <b>{product.price.toLocaleString()}원</b>
                    {product.coPurchaseCount && (
                      <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "8px" }}>
                        (함께 구매 {product.coPurchaseCount}회)
                      </span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#6b7280" }}>가격 정보 없음</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button className="tab">전체보기 ▸</button>
      </div>
    </>
  );
};

export default ProductRanking;

