import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { setSelectedBranch } from '../../store/slices/branchSlice';
import { clearCart } from '../../store/slices/cartSlice';
import ShopHeader from '../components/ShopHeader';
import ShopFooter from '../components/ShopFooter';
import BranchSelector from '../components/BranchSelector';
import ProductInquiryModal from '../components/ProductInquiryModal';
import { useShopAuth } from '../hooks/useShopAuth';
import { useShopSearch } from '../hooks/useShopSearch';
import { useShopData } from '../hooks/useShopData';
import '../styles/shop.css';

function ShopLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { items: cartItems } = useSelector(state => state.cart);
  const selectedBranch = useSelector(state => state.branch.selectedBranch);
  
  const { isLoggedIn, currentUser, handleLogout } = useShopAuth();
  const { 
    searchQuery, 
    setSearchQuery, 
    showSearch, 
    setShowSearch, 
    searchResults, 
    isSearching, 
    searchError,
    autocompleteSuggestions,
    showAutocomplete,
    searchContainerRef,
    handleSearchInputChange,
    searchProducts,
    clearSearch
  } = useShopSearch();
  
  const { favorites, toggleFavorite } = useShopData();
  
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryProduct, setInquiryProduct] = useState(null);
  const [myPageTab, setMyPageTab] = useState("profile");

  // 지점 변경 시 장바구니 초기화
  useEffect(() => {
    const currentBranchId = selectedBranch?.branchId;
    const cartBranchId = cartItems.length > 0 ? cartItems[0]?.branchId : null;
    
    if (currentBranchId && cartBranchId && currentBranchId !== cartBranchId) {
      dispatch(clearCart());
    }
  }, [selectedBranch, cartItems, dispatch]);

  // 관리자 페이지로 이동
  const handleAdminClick = (e) => {
    e.preventDefault();
    try {
      const authService = require('../../../service/authService').authService;
      const staffAuthed = authService?.isAuthenticated?.();
      window.location.href = staffAuthed ? "/dashboard" : "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchProducts(query);
      setShowSearch(false);
      navigate(`/shop/search?q=${encodeURIComponent(query)}`);
    } else {
      clearSearch();
      setShowSearch(false);
    }
  };

  const handleAutocompleteSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    handleSearch(suggestion.name);
  };

  const handleLogoutWrapper = async () => {
    const success = await handleLogout();
    if (success) {
      dispatch(clearCart());
      navigate('/shop');
      alert('로그아웃되었습니다.');
    }
  };

  const handleOpenInquiry = (product) => {
    setInquiryProduct(product);
    setShowInquiryModal(true);
  };

  const handleCloseInquiry = () => {
    setShowInquiryModal(false);
    setInquiryProduct(null);
  };

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/shop' || path === '/shop/') return 'home';
    if (path.includes('/products/')) return 'product-detail';
    if (path.includes('/search')) return 'search';
    if (path.includes('/login')) return 'login';
    if (path.includes('/mypage')) return 'mypage';
    if (path.includes('/cart')) return 'cart';
    if (path.includes('/order')) return 'order';
    if (path.includes('/payment')) return 'payment';
    if (path.includes('/payment-success')) return 'payment-success';
    if (path.includes('/order-complete')) return 'order-complete';
    return 'home';
  };

  return (
    <div>
      <ShopHeader
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        page={getCurrentPage()}
        setPage={(page) => {
          // 페이지별 라우팅 처리
          if (page === 'home') navigate('/shop');
          else if (page === 'products') navigate('/shop/products');
          else if (page === 'login') navigate('/shop/login');
          else if (page === 'mypage') navigate('/shop/mypage');
          else if (page === 'cart') navigate('/shop/cart');
          else if (page === 'order') navigate('/shop/order');
          else if (page === 'payment') navigate('/shop/payment');
          else if (page === 'search') navigate('/shop/search');
        }}
        setDetailProduct={(product) => {
          if (product) {
            navigate(`/shop/products/${product.productId}`);
          }
        }}
        setCheckoutProduct={() => {}}
        setActiveTab={() => {}}
        handleLogout={handleLogoutWrapper}
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
        {children || <Outlet />}
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

export default ShopLayout;

