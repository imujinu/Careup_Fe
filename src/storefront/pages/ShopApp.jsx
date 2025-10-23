import React, { useMemo, useState, useEffect } from "react";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "../../store";
import SharkLogo from "../components/SharkLogo";
import HeroSlider from "../components/HeroSlider";
import MyPage from "../components/MyPage";
import ProductsPage from "../components/ProductsPage";
import CartPage from "./CartPage";
import OrderPage from "./OrderPage";
import PaymentPage from "./PaymentPage";
import OrderCompletePage from "./OrderCompletePage";
import BranchSelector from "../components/BranchSelector";
import ChatBot from "../components/ChatBot";
import CustomerLogin from "../../pages/auth/CustomerLogin";
import "../styles/shop.css";
import axios from "axios";
import { authService } from "../../service/authService";
import { addToCart, clearCart } from "../../store/slices/cartSlice";
import { setSelectedBranch } from "../../store/slices/branchSlice";
import { cartService } from "../../service/cartService";
import { customerAuthService } from "../../service/customerAuthService";

function ShopApp() {
  return (
    <Provider store={store}>
      <ShopLayout />
    </Provider>
  );
}

function ShopLayout() {
  const dispatch = useDispatch();
  const { items: cartItems, branchId } = useSelector(state => state.cart);
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  const [activeTab, setActiveTab] = useState("전체");
  const [page, setPage] = useState("home"); // home | category | products | login | mypage | cart | order | payment | order-complete
  const [activeCategoryPage, setActiveCategoryPage] = useState("의류");
  const [favorites, setFavorites] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(customerAuthService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(customerAuthService.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  useEffect(() => {
    const categoryImageMap = {
      "신발": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
      "의류": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
      "가방": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
      "모자": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
      "액세서리": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
      "러닝": "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=600&q=80",
      "트레이닝": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=600&q=80",
      "아웃도어": "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=600&auto=format&fit=crop",
      "축구": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop",
      "농구": "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600&auto=format&fit=crop",
      "요가": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=600&auto=format&fit=crop",
      "골프": "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?q=80&w=600&auto=format&fit=crop",
    };

    async function loadCategories() {
      try {
        const res = await shopApi.get('/api/categories');
        const data = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((c) => ({
          name: c.name || c.categoryName || c.title || "기타",
          photo: categoryImageMap[c.name || c.categoryName || c.title] || categoryImageMap["의류"],
        }));
        if (mapped.length > 0) {
          setCategories(mapped);
          if (!mapped.find((c) => c.name === activeCategoryPage)) {
            setActiveCategoryPage(mapped[0].name);
          }
        } else {
          setCategories(
            Object.keys(categoryImageMap).map((name) => ({ name, photo: categoryImageMap[name] }))
          );
        }
      } catch (e) {
        setCategories([
          { name: "신발", photo: categoryImageMap["신발"] },
          { name: "의류", photo: categoryImageMap["의류"] },
          { name: "가방", photo: categoryImageMap["가방"] },
          { name: "모자", photo: categoryImageMap["모자"] },
          { name: "액세서리", photo: categoryImageMap["액세서리"] },
          { name: "러닝", photo: categoryImageMap["러닝"] },
          { name: "트레이닝", photo: categoryImageMap["트레이닝"] },
          { name: "아웃도어", photo: categoryImageMap["아웃도어"] },
        ]);
      }
    }

    loadCategories();
  }, []);

  // 지점 변경 시 장바구니 초기화
  useEffect(() => {
    const currentBranchId = selectedBranch?.branchId;
    const cartBranchId = branchId;
    
    if (currentBranchId && cartBranchId && currentBranchId !== cartBranchId) {
      dispatch(clearCart());
    }
  }, [selectedBranch, branchId, dispatch]);

  useEffect(() => {
    async function loadBranchProducts() {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        
        // 선택된 지점이 없으면 상품을 로드하지 않음
        if (!selectedBranch?.branchId) {
          setProducts([]);
          setLoadingProducts(false);
          return;
        }
        
        const branchId = selectedBranch.branchId;
        console.log('🔍 상품 로딩 시작:', { selectedBranch, branchId });
        
        // 새로운 API 엔드포인트 사용
        const res = await shopApi.get(`/inventory/branch-products/branch/${branchId}`);
        console.log('📡 API 응답:', res);
        
        const raw = res?.data?.data ?? res?.data ?? [];
        console.log('📦 원본 데이터:', raw);
        
        const mapped = (Array.isArray(raw) ? raw : []).map((item) => ({
          id: item.branchProductId ?? item.productId ?? Math.random(),
          productId: item.productId,
          branchProductId: item.branchProductId,
          name: item.productName || "상품",
          price: Number(item.price || 0),
          promotionPrice: item.promotionPrice ? Number(item.promotionPrice) : null,
          discountRate: item.discountRate ? Number(item.discountRate) : null,
          imageAlt: item.productName || "상품 이미지",
          image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
          category: item.categoryName || item.category || "미분류",
          stock: Number(item.stockQuantity || 0),
          safetyStock: Number(item.safetyStock || 0),
          isOutOfStock: Number(item.stockQuantity || 0) <= 0,
          isLowStock: Number(item.stockQuantity || 0) <= Number(item.safetyStock || 0),
          // 기존 필드들 (호환성 유지)
          brand: item.brand || item.manufacturer || "",
          likes: Number(item.likes || 0),
          reviews: Number(item.reviews || 0),
          pop: Number(item.pop || 0),
          discount: item.discountRate ? Number(item.discountRate) : 0,
        }));
        
        console.log('✅ 매핑된 상품:', mapped);
        setProducts(mapped);
      } catch (e) {
        console.error('❌ 상품 로딩 실패:', e);
        console.error('❌ 에러 상세:', {
          message: e.message,
          status: e.response?.status,
          data: e.response?.data,
          url: e.config?.url
        });
        
        // API가 준비되지 않았을 경우 테스트 데이터 사용
        if (e.response?.status === 404 || e.code === 'ERR_NETWORK') {
          console.log('🧪 테스트 데이터 사용');
          const testProducts = [
            {
              id: 1,
              productId: 100,
              branchProductId: 1,
              name: "테스트 상품 1",
              price: 15000,
              promotionPrice: 12000,
              discountRate: 20,
              image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
              imageAlt: "테스트 상품 1",
              category: "의류",
              stock: 10,
              safetyStock: 5,
              isOutOfStock: false,
              isLowStock: false,
              brand: "테스트 브랜드",
              likes: 25,
              reviews: 8,
              pop: 100,
              discount: 20,
            },
            {
              id: 2,
              productId: 101,
              branchProductId: 2,
              name: "테스트 상품 2",
              price: 25000,
              promotionPrice: null,
              discountRate: null,
              image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
              imageAlt: "테스트 상품 2",
              category: "신발",
              stock: 0,
              safetyStock: 3,
              isOutOfStock: true,
              isLowStock: false,
              brand: "테스트 브랜드",
              likes: 15,
              reviews: 5,
              pop: 80,
              discount: 0,
            },
            {
              id: 3,
              productId: 102,
              branchProductId: 3,
              name: "테스트 상품 3",
              price: 30000,
              promotionPrice: 24000,
              discountRate: 20,
              image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=900&q=80",
              imageAlt: "테스트 상품 3",
              category: "액세서리",
              stock: 2,
              safetyStock: 5,
              isOutOfStock: false,
              isLowStock: true,
              brand: "테스트 브랜드",
              likes: 30,
              reviews: 12,
              pop: 150,
              discount: 20,
            }
          ];
          setProducts(testProducts);
          setProductsError(null);
        } else {
          setProductsError(e?.message || "상품을 불러오지 못했습니다.");
          setProducts([]);
        }
      } finally {
        setLoadingProducts(false);
      }
    }
    loadBranchProducts();
  }, [selectedBranch]);
  
  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddToCart = async (product) => {
    // 로그인 체크
    if (!isLoggedIn || !currentUser) {
      alert('장바구니를 사용하려면 로그인이 필요합니다.');
      setPage("login");
      return;
    }

    try {
      // 백엔드 API를 통한 장바구니 추가
      const cartData = {
        memberId: currentUser.memberId,
        branchProductId: product.branchProductId || product.id,
        quantity: 1,
        attributeName: null,
        attributeValue: null
      };

      await cartService.addToCart(cartData);
      
      // Redux 상태 업데이트
      dispatch(addToCart({
        branchProductId: product.branchProductId || product.id,
        branchId: 1, // 임시로 1번 지점 사용
        productName: product.name,
        price: product.promotionPrice || product.price,
        quantity: 1,
        imageUrl: product.image
      }));
      
      alert(`${product.name}이(가) 장바구니에 추가되었습니다.`);
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert(error.response?.data?.message || error.message || '장바구니 추가에 실패했습니다.');
    }
  };


  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };


  const handleLogout = async () => {
    try {
      await customerAuthService.logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
      dispatch(clearCart()); // 로그아웃 시 장바구니 비우기
      setPage("home");
      alert('로그아웃되었습니다.');
    } catch (error) {
      console.error('로그아웃 실패:', error);
      // 에러가 있어도 로컬 상태는 초기화
      setIsLoggedIn(false);
      setCurrentUser(null);
      dispatch(clearCart());
      setPage("home");
    }
  };

  // 주문 페이지로 이동
  const handleProceedToOrder = () => {
    setPage("order");
  };

  // 결제 페이지로 이동
  const handleProceedToPayment = (order) => {
    setOrderData(order);
    setPage("payment");
  };

  // 주문 완료 페이지로 이동
  const handlePaymentSuccess = (payment) => {
    setPaymentData(payment);
    setPage("order-complete");
  };

  // 홈으로 돌아가기
  const handleBackToHome = () => {
    setOrderData(null);
    setPaymentData(null);
    setPage("home");
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        setLoadingProducts(true);
        const res = await shopApi.get(`/inventory/branch-products/search?keyword=${encodeURIComponent(query)}`);
        const raw = res?.data?.data ?? res?.data ?? [];
        
        const mapped = (Array.isArray(raw) ? raw : []).map((item) => ({
          id: item.branchProductId ?? item.productId ?? Math.random(),
          productId: item.productId,
          branchProductId: item.branchProductId,
          name: item.productName || "상품",
          price: Number(item.price || 0),
          promotionPrice: item.promotionPrice ? Number(item.promotionPrice) : null,
          discountRate: item.discountRate ? Number(item.discountRate) : null,
          imageAlt: item.productName || "상품 이미지",
          image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
          category: item.categoryName || item.category || "미분류",
          stock: Number(item.stockQuantity || 0),
          safetyStock: Number(item.safetyStock || 0),
          isOutOfStock: Number(item.stockQuantity || 0) <= 0,
          isLowStock: Number(item.stockQuantity || 0) <= Number(item.safetyStock || 0),
          brand: item.brand || item.manufacturer || "",
          likes: Number(item.likes || 0),
          reviews: Number(item.reviews || 0),
          pop: Number(item.pop || 0),
          discount: item.discountRate ? Number(item.discountRate) : 0,
        }));
        
        setProducts(mapped);
        setPage("products");
      } catch (e) {
        console.error('검색 실패:', e);
        setProductsError(e?.message || "검색에 실패했습니다.");
      } finally {
        setLoadingProducts(false);
      }
    } else {
      // 검색어가 비어있으면 전체 상품 다시 로드
      const user = authService?.getCurrentUser?.();
      const branchId = user?.branchId || 1;
      const res = await shopApi.get(`/inventory/branch-products/branch/${branchId}`);
      const raw = res?.data?.data ?? res?.data ?? [];
      
      const mapped = (Array.isArray(raw) ? raw : []).map((item) => ({
        id: item.branchProductId ?? item.productId ?? Math.random(),
        productId: item.productId,
        branchProductId: item.branchProductId,
        name: item.productName || "상품",
        price: Number(item.price || 0),
        promotionPrice: item.promotionPrice ? Number(item.promotionPrice) : null,
        discountRate: item.discountRate ? Number(item.discountRate) : null,
        imageAlt: item.productName || "상품 이미지",
        image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        category: item.categoryName || item.category || "미분류",
        stock: Number(item.stockQuantity || 0),
        safetyStock: Number(item.safetyStock || 0),
        isOutOfStock: Number(item.stockQuantity || 0) <= 0,
        isLowStock: Number(item.stockQuantity || 0) <= Number(item.safetyStock || 0),
        brand: item.brand || item.manufacturer || "",
        likes: Number(item.likes || 0),
        reviews: Number(item.reviews || 0),
        pop: Number(item.pop || 0),
        discount: item.discountRate ? Number(item.discountRate) : 0,
      }));
      
      setProducts(mapped);
    }
  };
  
  const filteredProducts = useMemo(() => {
    if (activeTab === "전체") return products;
    return products.filter((p) => p.category === activeTab);
  }, [activeTab, products]);
  
  return (
    <div>
      <header className="header">
        <div className="container">
          <div className="header-top">
            <a href="#">고객센터</a>
          {!isLoggedIn ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage("login");
              }}
            >
              로그인
            </a>
          ) : (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setPage("mypage");
              }}
            >
              {currentUser?.nickname || currentUser?.name || '마이페이지'}
            </a>
          )}
          <a href="#">관심</a>
          {isLoggedIn && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              로그아웃
            </a>
          )}
          </div>
          <div className="header-main">
            <div
              className="logo"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
              onClick={() => {
                setDetailProduct(null);
                setCheckoutProduct(null);
                setPage("home");
              }}
            >
              <SharkLogo size={26} />
              <span>Shark</span>
            </div>
            <nav className="nav">
              <a
                href="#"
                className={page === "home" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  setDetailProduct(null);
                  setCheckoutProduct(null);
                  setPage("home");
                }}
              >
                HOME
              </a>
              <a
                href="#"
                className={page === "products" ? "active" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  setDetailProduct(null);
                  setCheckoutProduct(null);
                  setPage("products");
                }}
              >
                SHOP
              </a>
              <button
                className="branch-select-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowBranchSelector(true);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                {selectedBranch?.branchName || '지점 선택'}
              </button>
              
            </nav>
            <div className="actions">
              {showSearch && (
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="상품을 검색하세요..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                    className="search-input"
                    autoFocus
                  />
                  <button
                    className="icon-btn"
                    onClick={() => setShowSearch(false)}
                    aria-label="검색 닫기"
                  >
                    ✕
                  </button>
                </div>
              )}
              {!showSearch && (
                <button 
                  className="icon-btn" 
                  aria-label="검색"
                  onClick={() => setShowSearch(true)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0-2C6.582 2 3 5.582 3 10s3.582 8 8 8a7.96 7.96 0 0 0 4.9-1.692l4.396 4.396a1 1 0 0 0 1.414-1.414l-4.396-4.396A7.96 7.96 0 0 0 19 10c0-4.418-3.582-8-8-8Z" />
                  </svg>
                </button>
              )}
               <button 
                 className="icon-btn cart-btn" 
                 aria-label="장바구니"
                 onClick={() => {
                   setPage("cart");
                 }}
               >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M7 6h10l1.8 9.1A2 2 0 0 1 16.84 18H7.16a2 2 0 0 1-1.96-2.9L7 6Zm.5-4a1 1 0 0 1 1 1V4h7V3a1 1 0 1 1 2 0v1h1a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2h1V3a1 1 0 0 1 1-1Z" />
                </svg>
                {getCartItemCount() > 0 && (
                  <span className="cart-badge">{getCartItemCount()}</span>
                )}
              </button>
              <button className="icon-btn" aria-label="메뉴">
                ☰
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {checkoutProduct ? (
          <Checkout
            product={checkoutProduct}
            onBack={() => setCheckoutProduct(null)}
          />
        ) : detailProduct ? (
          <ProductDetail
            product={detailProduct}
            onBack={() => setDetailProduct(null)}
            onBuy={() => setCheckoutProduct(detailProduct)}
          />
         ) : page === "login" ? (
           <CustomerLogin />
        ) : page === "mypage" ? (
          <MyPage onBack={() => setPage("home")} />
         ) : page === "products" ? (
           <ProductsPage
             favorites={favorites}
             onToggleFavorite={toggleFavorite}
             onOpenDetail={(p) => setDetailProduct(p)}
             onAddToCart={handleAddToCart}
             products={products}
             searchQuery={searchQuery}
           />
         ) : page === "cart" ? (
           !isLoggedIn ? (
             <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
               <h2>로그인이 필요합니다</h2>
               <p>장바구니를 사용하려면 로그인해주세요.</p>
               <button 
                 className="btn-primary"
                 onClick={() => setPage("login")}
                 style={{ marginTop: "20px" }}
               >
                 로그인하기
               </button>
             </div>
           ) : (
             <CartPage onBack={() => setPage("home")} currentUser={currentUser} onProceedToOrder={handleProceedToOrder} />
           )
         ) : page === "order" ? (
           !isLoggedIn ? (
             <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
               <h2>로그인이 필요합니다</h2>
               <p>주문을 하려면 로그인해주세요.</p>
               <button 
                 className="btn-primary"
                 onClick={() => setPage("login")}
                 style={{ marginTop: "20px" }}
               >
                 로그인하기
               </button>
             </div>
           ) : (
             <OrderPage 
               onBack={() => setPage("cart")} 
               onProceedToPayment={handleProceedToPayment}
               currentUser={currentUser}
             />
           )
         ) : page === "payment" ? (
           !isLoggedIn ? (
             <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
               <h2>로그인이 필요합니다</h2>
               <p>결제를 하려면 로그인해주세요.</p>
               <button 
                 className="btn-primary"
                 onClick={() => setPage("login")}
                 style={{ marginTop: "20px" }}
               >
                 로그인하기
               </button>
             </div>
           ) : (
             <PaymentPage 
               orderData={orderData}
               onBack={() => setPage("order")} 
               onPaymentSuccess={handlePaymentSuccess}
               currentUser={currentUser}
             />
           )
         ) : page === "order-complete" ? (
           <OrderCompletePage 
             orderData={orderData}
             paymentData={paymentData}
             onBackToHome={handleBackToHome}
           />
         ) : page === "category" ? (
           <CategoryPage
             active={activeCategoryPage}
             onChangeCategory={(c) => setActiveCategoryPage(c)}
             favorites={favorites}
             onToggleFavorite={toggleFavorite}
             onOpenDetail={(p) => setDetailProduct(p)}
             products={products}
           />
         ) : (
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
                    onClick={() => {
                      setActiveCategoryPage(c.name);
                      setPage("category");
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="cat-figure">
                      <img src={c.photo} alt={c.name} />
                    </div>
                    <div className="cat-text">{c.name}</div>
                  </div>
                ))}
              </section>

              <section className="section">
                <div className="section-title">지금 가장 주목받는 신상</div>
                <Tabs
                  active={activeTab}
                  onChange={setActiveTab}
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
                      <div style={{ marginTop: "16px", fontSize: "14px", color: "#6b7280" }}>
                        브라우저 개발자 도구 콘솔에서 자세한 오류를 확인하세요.
                      </div>
                    </div>
                  )}
                  {!loadingProducts && !productsError && products.length === 0 && (
                    <div style={{ 
                      gridColumn: "1 / -1", 
                      textAlign: "center", 
                      padding: "40px 0",
                      color: "#6b7280"
                    }}>
                      📦 등록된 상품이 없습니다.
                      <div style={{ marginTop: "8px", fontSize: "14px" }}>
                        관리자에게 문의하거나 상품을 등록해주세요.
                      </div>
                    </div>
                  )}
                  {!loadingProducts && !productsError && filteredProducts.slice(0, 12).map((p) => (
                    <article className="card" key={p.id}>
                      <button
                        className={`fav-btn${
                          favorites.has(p.id) ? " active" : ""
                        }`}
                        aria-pressed={favorites.has(p.id)}
                        onClick={() => toggleFavorite(p.id)}
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
                            fill={
                              favorites.has(p.id)
                                ? "#ef4444"
                                : "rgba(0,0,0,0.0)"
                            }
                            stroke={
                              favorites.has(p.id)
                                ? "#ef4444"
                                : "rgba(0,0,0,0.35)"
                            }
                            strokeWidth="1.6"
                          />
                        </svg>
                      </button>
                      <div className="card-img">
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
                              {p.price.toLocaleString()}원
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
                        <div className="meta-row">
                          <span>관심 {p.likes}</span>
                          <span>리뷰 {p.reviews}</span>
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
                <Ranking />
              </div>
            </section>

            <section className="section pre-footer-gap">
              <div className="container">
                <div className="section-title">선물특가</div>
                <Deals />
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button className="tab">전체보기 ▸</button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <h4>이용안내</h4>
            <ul>
              <li>검수기준</li>
              <li>이용정책</li>
              <li>패널티 정책</li>
              <li>커뮤니티 가이드라인</li>
            </ul>
          </div>
          <div>
            <h4>고객지원</h4>
            <ul>
              <li>공지사항</li>
              <li>서비스 소개</li>
              <li>스토어 안내</li>
              <li>판매자 방문접수</li>
            </ul>
          </div>
          <div>
            <h4>ABOUT 샤크</h4>
            <ul>
              <li>회사소개</li>
              <li>인재채용</li>
              <li>제휴문의</li>
            </ul>
          </div>
          <div>
            <h4>고객센터 1588-7813</h4>
            <div>운영시간 평일 10:00 - 18:00</div>
            <div>점심시간 평일 13:00 - 14:00</div>
            <div>1:1 문의하기는 앱에서만 가능합니다.</div>
          </div>
        </div>
      </footer>
      
      {showBranchSelector && (
        <BranchSelector
          onClose={() => setShowBranchSelector(false)}
          onBranchSelected={(branch) => {
            dispatch(setSelectedBranch({
              branchId: branch.branchId,
              branchName: branch.branchName,
              address: branch.address,
              addressDetail: branch.addressDetail,
              phone: branch.phone,
              email: branch.email,
              latitude: branch.latitude,
              longitude: branch.longitude,
              isOpen: branch.isOpen
            }));
            setShowBranchSelector(false);
          }}
        />
      )}
    </div>
  );
}

function Deals() {
  const end = new Date(Date.now() + 1000 * 60 * 60 * 13 + 1000 * 60 * 41);
  const [now, setNow] = useState(Date.now());
  const remain = Math.max(0, end.getTime() - now);
  const hh = String(Math.floor(remain / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((remain % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="deals">
      <div className="deals-aside">
        <div className="deals-title">🎁 선물특가</div>
        <div className="deals-timer">
          {hh}:{mm}:{ss}
        </div>
        <div className="deals-sub">망설이면 늦어요!</div>
      </div>
      <div className="deals-card">
        <img
          src="https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80"
          alt="스포츠웨어 특가"
        />
        <button className="deal-cta">🛒 담기</button>
        <div className="deal-meta">
          <div className="deal-name">[선물특가] 런닝/트레이닝 웨어 세트</div>
          <div className="deal-price">
            <b>30%</b> 39,900원 <span className="strike">57,000원</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ranking() {
  const items = rankingItems;
  return (
    <>
      <div className="grid ranking-grid">
        {items.slice(0, 5).map((it, i) => (
          <article className="rank-card" key={i}>
            <div className="rank-badge">{i + 1}</div>
            <div className="rank-img">
              <img src={it.image} alt={it.name} />
              {it.sticker && <span className="rank-sticker">{it.sticker}</span>}
            </div>
            <button className="deal-cta">🛒 담기</button>
            <div className="card-body">
              <div className="name">{it.name}</div>
              <div className="price">
                <b>{it.sale}%</b> {it.price.toLocaleString()}원
                <span className="strike"> {it.origin.toLocaleString()}원</span>
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
}

function ProductDetail({ product, onBack, onBuy }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product?.branchProductId) {
      loadProductDetail(product.branchProductId);
    } else {
      setSelectedProduct(product);
    }
  }, [product]);

  const loadProductDetail = async (branchProductId) => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
      
      const res = await shopApi.get(`/inventory/branch-products/${branchProductId}`);
      const item = res?.data?.data ?? res?.data;
      
      if (item) {
        const mapped = {
          id: item.branchProductId ?? item.productId ?? Math.random(),
          productId: item.productId,
          branchProductId: item.branchProductId,
          name: item.productName || "상품",
          price: Number(item.price || 0),
          promotionPrice: item.promotionPrice ? Number(item.promotionPrice) : null,
          discountRate: item.discountRate ? Number(item.discountRate) : null,
          imageAlt: item.productName || "상품 이미지",
          image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
          category: item.categoryName || item.category || "미분류",
          stock: Number(item.stockQuantity || 0),
          safetyStock: Number(item.safetyStock || 0),
          isOutOfStock: Number(item.stockQuantity || 0) <= 0,
          isLowStock: Number(item.stockQuantity || 0) <= Number(item.safetyStock || 0),
          brand: item.brand || item.manufacturer || "",
          likes: Number(item.likes || 0),
          reviews: Number(item.reviews || 0),
          pop: Number(item.pop || 0),
          discount: item.discountRate ? Number(item.discountRate) : 0,
          description: item.description || "상품 설명이 없습니다.",
        };
        setSelectedProduct(mapped);
      }
    } catch (e) {
      console.error('상품 상세 로딩 실패:', e);
      setSelectedProduct(product); // 실패시 기존 데이터 사용
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <div>상품 정보를 불러오는 중...</div>
      </div>
    );
  }

  if (!selectedProduct) {
    return (
      <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
        <div>상품을 찾을 수 없습니다.</div>
        <button className="tab" onClick={onBack} style={{ marginTop: "16px" }}>
          ← 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="container product-detail-page">
      <button className="tab" onClick={onBack}>
        ← 돌아가기
      </button>
      
      <div className="product-detail-grid">
        <div className="product-image">
          <img
            src={selectedProduct.image}
            alt={selectedProduct.imageAlt}
            style={{ width: "100%", height: "auto", borderRadius: "8px" }}
          />
        </div>
        
        <div className="product-info">
          <div className="product-category">{selectedProduct.category}</div>
          <h1 className="product-name">{selectedProduct.name}</h1>
          <div className="product-brand">{selectedProduct.brand}</div>
          
          <div className="product-price-section">
            {selectedProduct.promotionPrice && selectedProduct.discountRate ? (
              <>
                <div className="promotion-price-large">
                  {selectedProduct.promotionPrice.toLocaleString()}원
                </div>
                <div className="original-price-large">
                  {selectedProduct.price.toLocaleString()}원
                </div>
                <div className="discount-badge-large">
                  {selectedProduct.discountRate}% 할인
                </div>
              </>
            ) : (
              <div className="price-large">
                {selectedProduct.price.toLocaleString()}원
              </div>
            )}
          </div>
          
          <div className="product-stock-section">
            <div className="stock-info">
              <span className="stock-label">재고:</span>
              <span className={`stock-value ${selectedProduct.isOutOfStock ? 'out-of-stock' : selectedProduct.isLowStock ? 'low-stock' : 'in-stock'}`}>
                {selectedProduct.isOutOfStock ? '품절' : `${selectedProduct.stock}개`}
              </span>
            </div>
            {selectedProduct.isLowStock && !selectedProduct.isOutOfStock && (
              <div className="safety-stock-info">
                안전재고: {selectedProduct.safetyStock}개
              </div>
            )}
          </div>
          
          <div className="product-description">
            <h3>상품 설명</h3>
            <p>{selectedProduct.description}</p>
          </div>
          
          <div className="product-actions">
            <button
              className={`buy-btn ${selectedProduct.isOutOfStock ? 'disabled' : ''}`}
              onClick={() => !selectedProduct.isOutOfStock && onBuy(selectedProduct)}
              disabled={selectedProduct.isOutOfStock}
            >
              {selectedProduct.isOutOfStock ? '품절' : '구매하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tabs({ active, onChange, tabs }) {
  const defaultTabs = ["전체", "의류", "신발", "액세서리", "러닝", "트레이닝"];
  const list = Array.isArray(tabs) && tabs.length > 0 ? tabs : defaultTabs;
  return (
    <div className="tabs">
      {list.map((t) => (
        <button
          key={t}
          className={`tab${active === t ? " active" : ""}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function CategoryPage({
  active,
  onChangeCategory,
  favorites,
  onToggleFavorite,
  onOpenDetail,
  products,
}) {
  const categoriesOnly = categories.map((c) => c.name);
  const [sort, setSort] = useState("인기순");
  const [open, setOpen] = useState(false);
  const sorted = useMemo(() => {
    let list = products.filter((p) => p.category === active);
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
  }, [active, sort]);
  return (
    <div className="container category-page">
      <div className="category-top">
        <div className="category-list">
          {categoriesOnly.map((c) => (
            <button
              key={c}
              className={`tab${active === c ? " active" : ""}`}
              onClick={() => onChangeCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="sort-select">
          <button className="sort-trigger" onClick={() => setOpen((v) => !v)}>
            <span>{sort}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 9l5-5 5 5"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 15l-5 5-5-5"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {open && (
            <div className="sort-menu">
              {["인기순", "리뷰많은순", "등록일순", "할인순"].map((s) => (
                <div
                  key={s}
                  className={`sort-item${sort === s ? " active" : ""}`}
                  onClick={() => {
                    setSort(s);
                    setOpen(false);
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="grid">
        {sorted.slice(0, 30).map((p) => (
          <article
            className="card"
            key={`cat-${p.id}`}
            onClick={() => onOpenDetail(p)}
            style={{ cursor: "pointer" }}
          >
            <button
              className={`fav-btn${favorites.has(p.id) ? " active" : ""}`}
              aria-pressed={favorites.has(p.id)}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(p.id);
              }}
              title="관심 상품"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id="halfRed"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="50%" stopColor="#ef4444" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 21s-6.716-4.21-9.193-7.44C.502 10.781 2.117 7 5.6 7c2.098 0 3.342 1.27 4.4 2.6C11.058 8.27 12.302 7 14.4 7c3.483 0 5.098 3.781 2.793 6.56C18.716 16.79 12 21 12 21z"
                  fill={favorites.has(p.id) ? "#ef4444" : "url(#halfRed)"}
                  stroke="#ef4444"
                  strokeWidth="1"
                />
              </svg>
            </button>
            <div className="card-img">
              <img
                src={p.image}
                alt={p.imageAlt}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="card-body">
              <div className="brand">{p.brand}</div>
              <div className="name">{p.name}</div>
              <div className="price">{p.price.toLocaleString()}원</div>
              <div className="meta-row">
                <span>관심 {p.likes}</span>
                <span>리뷰 {p.reviews}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Checkout({ product, onBack }) {
  return (
    <div className="container checkout-page">
      <button className="tab" onClick={onBack}>
        ← 돌아가기
      </button>
      <div className="checkout-grid">
        <div className="checkout-left">
          <section className="ck-section">
            <h3>상품정보</h3>
            <div className="ck-item">
              <img src={product.image} alt={product.name} />
              <div>
                <div className="name">{product.name}</div>
                <div className="price">{product.price.toLocaleString()}원</div>
              </div>
            </div>
          </section>
          <section className="ck-section">
            <h3>주문 고객정보</h3>
            <div className="form-grid">
              <input placeholder="이름" />
              <input placeholder="휴대폰 번호" />
              <input placeholder="이메일" />
            </div>
          </section>
          <section className="ck-section">
            <h3>배송정보</h3>
            <div className="ship-tabs">
              <button className="tab active">일반 택배</button>
              <button className="tab">매장 픽업</button>
            </div>
            <div className="form-grid">
              <input placeholder="우편번호" />
              <input placeholder="주소" />
              <input placeholder="상세 주소" />
            </div>
          </section>
        </div>
        <aside className="checkout-summary">
          <h3>결제정보</h3>
          <div className="sum-row">
            <span>총 상품금액</span>
            <b>{product.price.toLocaleString()}원</b>
          </div>
          <div className="sum-row">
            <span>배송비</span>
            <b>0원</b>
          </div>
          <div className="sum-row total">
            <span>총 결제예정금액</span>
            <b>{product.price.toLocaleString()}원</b>
          </div>
          <button className="buy-btn" style={{ width: "100%" }}>
            결제하기
          </button>
        </aside>
      </div>
    </div>
  );
}

function CollectionTabs({ products }) {
  const groups = ["러닝", "트레이닝", "아웃도어"];
  const [active, setActive] = useState(groups[0]);
  const list = useMemo(() => {
    return products.filter((p) => p.category === active).slice(0, 6);
  }, [active, products]);
  return (
    <>
      <div className="tabs">
        {groups.map((g) => (
          <button
            key={g}
            className={`tab${active === g ? " active" : ""}`}
            onClick={() => setActive(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="grid">
        {list.map((p) => (
          <article className="card" key={`collection-${p.id}`}>
            <div className="card-img">
              <img
                src={p.image}
                alt={p.imageAlt}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="card-body">
              <div className="brand">{p.brand}</div>
              <div className="name">{p.name}</div>
              <div className="price">{p.price.toLocaleString()}원</div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

// 상품은 브랜치별 API에서 로드됨 (상단 useEffect 참조)

// 카테고리는 백엔드 연동으로 로드됨 (상단 useEffect에서 설정)

const rankingItems = [
  {
    name: "러닝화 경량 모델",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    sale: 20,
    price: 89000,
    origin: 112000,
    sticker: "FESTA DEAL",
  },
  {
    name: "트레이닝 조거 팬츠",
    image:
      "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?auto=format&fit=crop&w=900&q=80",
    sale: 18,
    price: 36000,
    origin: 44000,
    sticker: "멤버특가",
  },
  {
    name: "퍼포먼스 드라이 티셔츠",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    sale: 15,
    price: 18900,
    origin: 22900,
    sticker: "+10% 쿠폰",
  },
  {
    name: "아웃도어 트레일 자켓",
    image:
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=900&q=80",
    sale: 22,
    price: 129000,
    origin: 165000,
    sticker: "HOT",
  },
  {
    name: "컴프레션 레깅스",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    sale: 28,
    price: 24900,
    origin: 34900,
    sticker: "쿠폰",
  },
];

export default ShopApp;
