import React, { useMemo, useState, useEffect, useRef } from "react";
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
  const [myPageTab, setMyPageTab] = useState("profile"); // 마이페이지 활성 탭 (profile | purchase | favorites | reviews | inquiries)
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
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  // 페이지 변경 디버깅
  useEffect(() => {
    console.log('📄 페이지 변경:', page);
    if (page === 'payment') {
      console.log('💳 결제 페이지 orderData:', orderData);
    }
  }, [page, orderData]);

  // URL 체크 및 결제 완료 처리
  useEffect(() => {
    let processed = false;

    const checkAndNavigate = () => {
      if (processed) return;

      // URL 파라미터 체크 (장바구니로 리다이렉트)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('page') === 'cart') {
        processed = true;
        setPage('cart');
        // URL 파라미터 제거
        window.history.replaceState({}, '', '/shop');
        return;
      }

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
            // 파싱 실패 시 localStorage 정리
            localStorage.removeItem('paymentCompleted');
          }
        } else {
          // paymentCompleted가 없으면 쇼핑몰로 리다이렉트 (타임아웃 없이 즉시)
          window.location.href = `${window.location.origin}/shop`;
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

  // 자동 완성 API 호출
  const fetchAutocomplete = async (keyword) => {
    if (!keyword || keyword.trim().length < 1) {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    try {
      const res = await shopApi.get('/products/es-search/autocomplete', {
        params: { keyword: keyword.trim() }
      });

      const suggestions = res?.data?.data ?? res?.data ?? [];
      setAutocompleteSuggestions(Array.isArray(suggestions) ? suggestions : []);
      setShowAutocomplete(suggestions.length > 0);
    } catch (e) {
      console.error('❌ 자동 완성 실패:', e);
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  };

  const searchProducts = async (query, categoryId = null, minPrice = null, maxPrice = null, page = 0) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      
      // 새로운 Elasticsearch 기반 검색 API 사용
      const params = {
        keyword: query.trim(),
        page: page,
        size: 10
      };

      if (categoryId) {
        params.categoryId = categoryId;
      }
      if (minPrice !== null) {
        params.minPrice = minPrice;
      }
      if (maxPrice !== null) {
        params.maxPrice = maxPrice;
      }

      const res = await shopApi.get('/products/es-search', { params });

      // Page 형식 응답 처리
      const responseData = res?.data?.data ?? res?.data;
      const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
      
      let raw = [];
      if (isPageResponse) {
        raw = responseData.content || [];
      } else if (Array.isArray(responseData)) {
        raw = responseData;
      }

      const mapped = (Array.isArray(raw) ? raw : []).map((item) => ({
        id: item.productId ?? Math.random(),
        productId: item.productId,
        name: item.name || item.productName || "상품",
        price: Number(item.minPrice || item.maxPrice || 0),
        minPrice: Number(item.minPrice || 0),
        maxPrice: Number(item.maxPrice || 0),
        promotionPrice: null,
        discountRate: null,
        imageAlt: item.name || "상품 이미지",
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
        availableBranchCount: 0,
        // 하이라이팅된 상품명 (HTML 태그 포함)
        highlightedName: item.highlightedName || item.name
      }));
      
      setSearchResults(mapped);
      
    } catch (e) {
      console.error('❌ 상품 검색 실패:', e);
      console.error('❌ 에러 상세:', {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        url: e.config?.url
      });

      setSearchResults([]);
      setSearchError(e?.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowAutocomplete(false);
    if (query.trim()) {
      searchProducts(query);
      setShowSearch(false);
      setPage("search");
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  // 디바운싱을 위한 ref
  const autocompleteTimerRef = useRef(null);
  const searchContainerRef = useRef(null);

  // 외부 클릭 시 자동 완성 숨기기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowAutocomplete(false);
      }
    };

    if (showSearch && showAutocomplete) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSearch, showAutocomplete]);

  const handleSearchInputChange = (query) => {
    setSearchQuery(query);
    
    // 이전 타이머 취소
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }
    
    // 자동 완성 호출 (디바운싱)
    if (query.trim().length >= 1) {
      autocompleteTimerRef.current = setTimeout(() => {
        fetchAutocomplete(query);
      }, 300);
    } else {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  };

  const handleAutocompleteSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowAutocomplete(false);
    handleSearch(suggestion.name);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
    setSearchError(null);
    setAutocompleteSuggestions([]);
    setShowAutocomplete(false);
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
            price: Number(item.minPrice || item.maxPrice || 0),
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

      // 선택 지점 가격 결정 (선택 지점 우선, 없으면 최소가 사용)
      let resolvedPrice = product?.minPrice || product?.price || 0;
      if (product.availableBranches && product.availableBranches.length > 0) {
        const selected = product.selectedBranchId != null
          ? product.availableBranches.find((b) => String(b.branchId) === String(product.selectedBranchId))
          : product.availableBranches[0];
        if (selected && selected.price) {
          resolvedPrice = Number(selected.price);
        }
      }

      // Redux 상태 업데이트 (API에 사용된 동일 값 사용)
      dispatch(addToCart({
        productId: product.productId,
        branchProductId: resolvedBranchProductId,
        branchId: resolvedBranchId || 1,
        productName: product.name,
        price: resolvedPrice,
        quantity: 1,
        imageUrl: product.image
      }));

      alert(`${product.name}이(가) 장바구니에 추가되었습니다.`);
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        alert('장바구니를 사용하려면 로그인이 필요합니다.');
        setPage("login");
        return;
      }
      const errorMessage =
        error?.response?.data?.status_message ||
        error?.response?.data?.message ||
        '장바구니 추가에 실패했습니다.';
      alert(errorMessage);
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

  // 상품 상세에서 바로 구매 (단일 주문) → 주문 생성 후 결제 페이지로 바로 이동
  const handleBuyNow = async (product) => {
    // 로그인 체크
    if (!isLoggedIn || !currentUser) {
      alert('구매하려면 로그인이 필요합니다.');
      setPage("login");
      return;
    }

    // 지점 선택 확인 (자동 선택 제거 - 반드시 사용자가 선택해야 함)
    let selectedBranchId = product.selectedBranchId;
    if (!selectedBranchId) {
      alert('구매 지점을 선택해주세요.');
      return;
    }

    // 선택된 지점 정보 찾기
    const selectedBranch = product.availableBranches?.find(
      (b) => String(b.branchId) === String(selectedBranchId)
    );

    if (!selectedBranch) {
      alert('선택한 지점 정보를 찾을 수 없습니다.');
      return;
    }

    if (!selectedBranch.branchProductId) {
      alert('지점별 상품 정보가 없습니다.');
      return;
    }

    // 주문을 즉시 생성하고 결제 페이지로 이동
    try {
      console.log('🛒 구매하기 시작:', { product, selectedBranch });
      
      const orderRequestData = {
        memberId: Number(currentUser?.memberId || 1),
        branchId: Number(selectedBranch.branchId),
        orderType: 'ONLINE',
        orderItems: [{
          branchProductId: Number(selectedBranch.branchProductId),
          quantity: 1
        }],
        couponId: null
      };

      console.log('📝 주문 생성 요청:', orderRequestData);

      const response = await cartService.createOrder(orderRequestData);
      console.log('✅ 주문 생성 응답:', response);
      
      const created = response?.data?.data || response?.data || response;
      const orderId = created?.orderId;
      const totalAmount = created?.totalAmount ?? selectedBranch.price;

      console.log('📦 주문 정보:', { orderId, totalAmount, created });

      if (!orderId) {
        console.error('❌ 주문 ID가 없습니다:', created);
        alert('주문 생성은 완료되었지만 주문 ID를 받지 못했습니다. 관리자에게 문의해주세요.');
        return;
      }

      const immediateOrderData = {
        orderId,
        totalAmount,
        items: [{
          productId: product.productId,
          branchProductId: selectedBranch.branchProductId,
          branchId: selectedBranch.branchId,
          productName: product.name || product.productName,
          price: selectedBranch.price,
          quantity: 1,
          imageUrl: product.image
        }],
        branchId: Number(selectedBranch.branchId),
        createdAt: new Date().toISOString(),
        isSingleOrder: true // 단일 주문 표시
      };

      console.log('💾 orderData 설정:', immediateOrderData);
      
      setOrderData(immediateOrderData);
      localStorage.setItem('currentOrderData', JSON.stringify(immediateOrderData));
      
      console.log('💳 결제 페이지로 이동');
      // 페이지를 먼저 변경한 후 detailProduct는 조건부 렌더링에서 처리됨
      setPage("payment");
      console.log('✅ 페이지 전환 완료: payment');
    } catch (error) {
      console.error('❌ 단일 상품 주문 생성 실패:', error);
      const errorMessage = error.response?.data?.status_message || 
                          error.response?.data?.message || 
                          error.message || 
                          '주문 생성에 실패했습니다.';
      alert(`주문 생성 실패: ${errorMessage}`);
    }
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
    // 주문 완료 정보 삭제 (새로고침 시 주문 완료 페이지가 다시 나타나지 않도록)
    localStorage.removeItem('paymentCompleted');
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
        handleSearchInputChange={handleSearchInputChange}
        autocompleteSuggestions={autocompleteSuggestions}
        showAutocomplete={showAutocomplete}
        handleAutocompleteSelect={handleAutocompleteSelect}
        searchContainerRef={searchContainerRef}
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
        ) : detailProduct && page !== "payment" ? (
          <ProductDetail
            product={detailProduct}
            onBack={() => setDetailProduct(null)}
            onBuy={handleBuyNow}
            onAddToCart={handleAddToCart}
          />
         ) : page === "login" ? (
           <CustomerLogin />
        ) : page === "mypage" ? (
          <MyPage 
            onBack={() => setPage("home")} 
            currentUser={currentUser}
            initialTab={myPageTab}
          />
        ) : page === "products" ? (
           <ProductsPage
             favorites={favorites}
             onToggleFavorite={toggleFavorite}
             onOpenDetail={(p) => setDetailProduct(p)}
             onAddToCart={handleAddToCart}
             products={products}
             searchQuery="" // shop 페이지에서는 검색어 필터링 안 함
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
            <CartPage 
              onBack={() => {
                setDetailProduct(null);
                setCheckoutProduct(null);
                setActiveTab("전체");
                setPage("products"); // SHOP으로 이동
              }} 
              currentUser={currentUser} 
              onProceedToOrder={handleProceedToOrder} 
            />
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
               onBack={() => {
                 // 단일 주문인 경우 상품 상세로, 아닌 경우 주문 페이지로
                 if (orderData?.isSingleOrder) {
                   setPage("detail");
                 } else {
                   setPage("order");
                 }
               }}
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
             onViewOrders={() => {
               setMyPageTab("purchase");
               setPage("mypage");
             }}
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
                      <img 
                        src={c.photo || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80"} 
                        alt={c.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=300&q=80";
                        }}
                      />
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
                              {(p.maxPrice ?? p.price ?? 0).toLocaleString()}원
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

            {/* 실시간 인기 랭킹 및 선물특가 섹션 제거 */}
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

// (실시간 인기 랭킹 및 선물특가 관련 컴포넌트/데이터 제거됨)

export default ShopApp;
