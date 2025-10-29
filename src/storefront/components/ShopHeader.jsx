import React from 'react';
import SharkLogo from './SharkLogo';

const ShopHeader = ({ 
  isLoggedIn, 
  currentUser, 
  page, 
  setPage, 
  setDetailProduct, 
  setCheckoutProduct, 
  setActiveTab,
  handleLogout,
  cartItems,
  showSearch,
  setShowSearch,
  searchQuery,
  setSearchQuery,
  handleSearch,
  setShowBranchSelector,
  selectedBranch,
  getCartItemCount,
  handleAdminClick
}) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-top">
          <a href="#">고객센터</a>
          {!isLoggedIn ? (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage("login");
                }}
              >
                로그인
              </a>
              <a
                href="#"
                style={{ marginLeft: 2 }}
                onClick={(e) => {
                  e.preventDefault();
                  if (handleAdminClick) {
                    handleAdminClick(e);
                  } else {
                    window.location.href = "/login";
                  }
                }}
              >
                관리자
              </a>
            </>
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
                setActiveTab("전체");
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
                setActiveTab("전체");
                setPage("products");
              }}
            >
              SHOP
            </a>
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
              style={{ position: 'relative' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
              {getCartItemCount && getCartItemCount() > 0 && (
                <span className="cart-badge">{getCartItemCount()}</span>
              )}
            </button>
            {/* 지점 선택 버튼 제거 */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
