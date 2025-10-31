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
import PaymentSuccessPage from "./PaymentSuccessPage";
import BranchSelector from "../components/BranchSelector";
import ChatBot from "../components/ChatBot";
import CustomerLogin from "../../pages/auth/CustomerLogin";
import ProductDetail from "../components/ProductDetail";
import Tabs from "../components/Tabs";
import Checkout from "../components/Checkout";
import SearchResultsPage from "../components/SearchResultsPage";
import ProductInquiryModal from "../components/ProductInquiryModal";
import ShopHeader from "../components/ShopHeader";
import ShopFooter from "../components/ShopFooter";
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
  
  // 카테고리 ID 매핑 (이름 -> ID)
  const getCategoryIdByName = (categoryName) => {
    if (!categoryName || categoryName === '전체') return null;
    const category = categories.find(c => c.name === categoryName);
    return category?.id || null;
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSelectedCategoryId(getCategoryIdByName(tabName));
    setCurrentPage(0); // 탭 변경 시 첫 페이지로 리셋
  };
  const [page, setPage] = useState("home"); // home | category | products | login | mypage | cart | order | payment | payment-success | order-complete | search
  const [activeCategoryPage, setActiveCategoryPage] = useState("의류");
  const [favorites, setFavorites] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [detailProduct, setDetailProduct] = useState(null);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(customerAuthService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(customerAuthService.getCurrentUser());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null); // 선택된 카테고리 ID
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  // URL 체크 및 결제 완료 처리
  useEffect(() => {
    let processed = false;

    const checkAndNavigate = () => {
      if (processed) return;

      if (window.location.pathname.includes('/shop/payment-success')) {
        processed = true;
        setPage('payment-success');
        return;
      }

      if (window.location.pathname.includes('/shop/order-complete')) {
        const paymentCompleted = localStorage.getItem('paymentCompleted');
        if (paymentCompleted) {
          try {
            processed = true;
            const data = JSON.parse(paymentCompleted);
            setOrderData(data.orderData);
            setPaymentData(data.paymentData);
            setPage('order-complete');
            return;
          } catch (error) {
            console.error('결제 완료 정보 파싱 실패:', error);
          }
        } else {
          setTimeout(() => {
            window.location.href = `${window.location.origin}/shop`;
          }, 3000);
        }
      }
    };

    checkAndNavigate();

    const interval = setInterval(() => {
      checkAndNavigate();
      if (processed) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
        // 인증 없이 접근 가능한 엔드포인트 사용
        const res = await axios.get(`${API_BASE_URL}/api/categories`);
        
        // 백엔드 응답 구조: ResponseDto<List<CategoryResponseDto>>
        const data = res?.data?.data ?? res?.data ?? [];
        
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((c) => ({
          id: c.id || c.categoryId, // 카테고리 ID 추가
          name: c.name || "기타",
          photo: categoryImageMap[c.name] || categoryImageMap["의류"],
          description: c.description || ""
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
        console.error('❌ 카테고리 로딩 실패:', e);
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

  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      
      // 고객용 검색 API 사용
      const res = await shopApi.get('/api/public/products/search', {
        params: { 
          keyword: query,
          page: 0, 
          size: 20 
        }
      });

      const raw = res?.data?.data?.content ?? res?.data?.data ?? res?.data ?? [];

      const mapped = (Array.isArray(raw) ? raw : []).map((item) => ({
        id: item.productId ?? Math.random(),
        productId: item.productId,
        name: item.name || item.productName || "상품",
        price: Number(item.maxPrice || item.minPrice || 0),
        minPrice: Number(item.minPrice || 0),
        maxPrice: Number(item.maxPrice || 0),
        promotionPrice: null,
        discountRate: null,
        imageAlt: item.productName || "상품 이미지",
        image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
        category: item.categoryName || "미분류",
        stock: 0,
        safetyStock: 0,
        isOutOfStock: false,
        isLowStock: false,
        brand: "",
        likes: 0,
        reviews: 0,
        pop: 0,
        discount: 0,
        description: item.description || "상품에 대한 자세한 설명이 없습니다.",
        specifications: [
          { name: "카테고리", value: item.categoryName || "정보 없음" },
        ],
        images: [item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"],
        relatedProducts: [],
        availableBranches: [],
        availableBranchCount: 0
      }));
      
      // 검색 결과는 모든 상품 표시
      const filteredMapped = mapped;

      setSearchResults(filteredMapped);
      
    } catch (e) {
      console.error('❌ 상품 검색 실패:', e);
      console.error('❌ 에러 상세:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        url: e.config?.url
      });

      // 검색 실패 시 현재 지점의 상품에서 클라이언트 사이드 검색
      const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(filteredProducts);
      setSearchError(e?.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchProducts(query);
      setShowSearch(false);
      setPage("search");
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
    setSearchError(null);
  };

  const handleOpenInquiry = (product) => {
    setInquiryProduct(product);
    setShowInquiryModal(true);
  };

  const handleCloseInquiry = () => {
    setShowInquiryModal(false);
    setInquiryProduct(null);
  };

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
        
        const page = currentPage;
        const size = 12; // 한 페이지에 12개
        
        // 카테고리 필터 파라미터 구성
        const params = {
          page: page,
          size: size
        };
        
        // 카테고리 ID가 있으면 추가
        if (selectedCategoryId) {
          params.categoryId = selectedCategoryId;
        }
        
        const res = await shopApi.get('/api/public/products/with-branches', {
          params: params
        });
        
        // 페이지네이션 응답 처리
        const responseData = res?.data?.data;
        const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
        
        if (isPageResponse) {
          // Page 형식 응답
          setTotalPages(responseData.totalPages || 0);
          setTotalElements(responseData.totalElements || 0);
          const raw = responseData.content || [];
          
          const mapProduct = (item) => ({
            id: item.productId ?? Math.random(),
            productId: item.productId,
            name: item.productName || "상품",
            price: Number(item.maxPrice || item.minPrice || 0),
            minPrice: Number(item.minPrice || 0),  // 권장 최소 판매가
            maxPrice: Number(item.maxPrice || 0),  // 권장 최대 판매가
            promotionPrice: null,
            discountRate: null,
            imageAlt: item.productName || "상품 이미지",
            image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
            category: item.categoryName || "미분류",
            stock: 0,
            safetyStock: 0,
            isOutOfStock: false,
            isLowStock: false,
            brand: "",
            likes: 0,
            reviews: 0,
            pop: 0,
            discount: 0,
            description: item.description || "상품에 대한 자세한 설명이 없습니다.",
            specifications: [
              { name: "카테고리", value: item.categoryName || "정보 없음" },
            ],
            images: [item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"],
            relatedProducts: [],
            // 백엔드에서 제공하는 지점 정보
            availableBranches: item.availableBranches || [],
            availableBranchCount: item.availableBranchCount || 0
          });

          const mapped = (Array.isArray(raw) ? raw : []).map(mapProduct);
        
          // 재고가 있는 상품만 필터링 (백엔드에서 이미 필터링되어 오지만 이중 체크)
          const filteredMapped = mapped.filter(item => {
            // availableBranchCount가 0보다 크고, 실제로 지점 정보가 있는 경우만 표시
            return item.availableBranchCount > 0 && item.availableBranches && item.availableBranches.length > 0;
          });
        
          setProducts(filteredMapped);
        } else {
          // 기존 방식 (List 응답) - 하위 호환성
          const raw = responseData || [];
          
          const mapped = (Array.isArray(raw) ? raw : []).map(mapProduct);
          
          const filteredMapped = mapped.filter(item => {
            return item.availableBranchCount > 0 && item.availableBranches && item.availableBranches.length > 0;
          });
          
          setProducts(filteredMapped);
          setTotalPages(0);
          setTotalElements(filteredMapped.length);
        }
      } catch (e) {
        console.error('❌ 상품 로딩 실패:', e);
        console.error('❌ 에러 상세:', {
          message: e.message,
          status: e.response?.status,
          data: e.response?.data,
          url: e.config?.url
        });
        
        setProductsError(e?.message || "상품을 불러오지 못했습니다.");
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadBranchProducts();
  }, [currentPage, selectedCategoryId]); // currentPage나 selectedCategoryId가 변경될 때마다 로드
  
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
      // branchProductId 및 branchId 결정 (선택 지점 우선)
      let resolvedBranchProductId = product.branchProductId || product.id;
      let resolvedBranchId = product.selectedBranchId || null;

      if (product.availableBranches && product.availableBranches.length > 0) {
        if (product.selectedBranchId != null) {
          const selectedBranch = product.availableBranches.find(
            (b) => String(b.branchId) === String(product.selectedBranchId)
          );
          if (selectedBranch) {
            resolvedBranchProductId = selectedBranch.branchProductId || resolvedBranchProductId;
            resolvedBranchId = selectedBranch.branchId;
          }
        } else {
          const firstBranch = product.availableBranches[0];
          if (firstBranch) {
            resolvedBranchProductId = firstBranch.branchProductId || resolvedBranchProductId;
            resolvedBranchId = firstBranch.branchId;
          }
        }
      }

      // 백엔드 API를 통한 장바구니 추가
      const cartData = {
        memberId: currentUser.memberId,
        branchProductId: resolvedBranchProductId,
        quantity: 1,
        attributeName: null,
        attributeValue: null
      };

      await cartService.addToCart(cartData);

      // Redux 상태 업데이트 (API에 사용된 동일 값 사용)
      dispatch(addToCart({
        productId: product.productId,
        branchProductId: resolvedBranchProductId,
        branchId: resolvedBranchId || 1,
        productName: product.name,
        price: product.promotionPrice || product.price,
        quantity: 1,
        imageUrl: product.image
      }));

      // 장바구니 페이지로 이동
      setPage("cart");
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

  // 관리자 페이지로 이동
  const handleAdminClick = (e) => {
    e.preventDefault();
    try {
      const staffAuthed = authService?.isAuthenticated?.();
      window.location.href = staffAuthed ? "/dashboard" : "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // 장바구니에서 주문 생성 후 바로 결제 페이지로 이동
  const handleProceedToOrder = (order) => {
    setOrderData(order);
    if (order) {
      localStorage.setItem('currentOrderData', JSON.stringify(order));
    }
    setPage("payment");
  };

  // 결제 페이지로 이동
  const handleProceedToPayment = (order) => {
    setOrderData(order);
    // localStorage에 저장 (리다이렉트 후 복원을 위해)
    if (order) {
      localStorage.setItem('currentOrderData', JSON.stringify(order));
    }
    setPage("payment");
  };

  // 주문 완료 페이지로 이동
  const handlePaymentSuccess = (payment) => {
    // 장바구니 비우기
    dispatch(clearCart());
    
    setPaymentData(payment);
    setPage("order-complete");
  };

  // 홈으로 돌아가기
  const handleBackToHome = () => {
    setOrderData(null);
    setPaymentData(null);
    setPage("home");
  };

  
  const filteredProducts = useMemo(() => {
    if (activeTab === "전체") return products;
    return products.filter((p) => p.category === activeTab);
  }, [activeTab, products]);
  
  return (
    <div>
      <ShopHeader
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        page={page}
        setPage={setPage}
        setDetailProduct={setDetailProduct}
        setCheckoutProduct={setCheckoutProduct}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        cartItems={cartItems}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        setShowBranchSelector={setShowBranchSelector}
        selectedBranch={selectedBranch}
        getCartItemCount={getCartItemCount}
        handleAdminClick={handleAdminClick}
      />

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
            onAddToCart={handleAddToCart}
          />
         ) : page === "login" ? (
           <CustomerLogin />
        ) : page === "mypage" ? (
          <MyPage onBack={() => setPage("home")} currentUser={currentUser} />
        ) : page === "products" ? (
           <ProductsPage
             favorites={favorites}
             onToggleFavorite={toggleFavorite}
             onOpenDetail={(p) => setDetailProduct(p)}
             onAddToCart={handleAddToCart}
             products={products}
             searchQuery={searchQuery}
             categories={categories}
             activeTab={activeTab}
             onTabChange={handleTabChange}
             currentPage={currentPage}
             setCurrentPage={setCurrentPage}
             totalPages={totalPages}
           />
         ) : page === "search" ? (
           <SearchResultsPage
             searchQuery={searchQuery}
             searchResults={searchResults}
             isSearching={isSearching}
             searchError={searchError}
             favorites={favorites}
             onToggleFavorite={toggleFavorite}
             onOpenDetail={(p) => setDetailProduct(p)}
             onAddToCart={handleAddToCart}
             onBack={() => {
               clearSearch();
               setPage("home");
             }}
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
               orderData={orderData}
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
         ) : page === "payment-success" ? (
           <PaymentSuccessPage />
         ) : page === "order-complete" ? (
           <OrderCompletePage 
             orderData={orderData}
             paymentData={paymentData}
             onBackToHome={handleBackToHome}
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
                    handleTabChange(c.name); // 카테고리 선택 시 탭 변경 핸들러 사용
                    setPage("products");  // category 대신 products 페이지로 이동
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
                  onChange={handleTabChange}
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
                  {!loadingProducts && !productsError && filteredProducts.map((p) => (
                    <article className="card" key={p.id} onClick={() => setDetailProduct(p)} style={{ cursor: "pointer" }}>
                      <button
                        className={`fav-btn${
                          favorites.has(p.id) ? " active" : ""
                        }`}
                        aria-pressed={favorites.has(p.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(p.id);
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
                          src={p.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"}
                          alt={p.imageAlt}
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

      <ShopFooter />
      
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

      {showInquiryModal && inquiryProduct && (
        <ProductInquiryModal
          product={inquiryProduct}
          isOpen={showInquiryModal}
          onClose={handleCloseInquiry}
          onSubmit={() => {}}
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

const rankingItems = [
  {
    name: "러닝화 경량 모델",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    sale: 20,
    price: 89000,
    origin: 112000,
    sticker: "FESTA DEAL",
  },
  {
    name: "트레이닝 조거 팬츠",
    image: "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?auto=format&fit=crop&w=900&q=80",
    sale: 18,
    price: 36000,
    origin: 44000,
    sticker: "멤버특가",
  },
  {
    name: "퍼포먼스 드라이 티셔츠",
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
    sale: 15,
    price: 18900,
    origin: 22900,
    sticker: "+10% 쿠폰",
  },
  {
    name: "아웃도어 트레일 자켓",
    image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?auto=format&fit=crop&w=900&q=80",
    sale: 22,
    price: 129000,
    origin: 165000,
    sticker: "HOT",
  },
  {
    name: "컴프레션 레깅스",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    sale: 28,
    price: 24900,
    origin: 34900,
    sticker: "쿠폰",
  },
];

export default ShopApp;
