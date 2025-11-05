import React, { useRef, useState, useEffect } from 'react';
import Icon from '@mdi/react';
import { mdiMagnify, mdiCartOutline } from '@mdi/js';
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
  handleSearchInputChange,
  autocompleteSuggestions = [],
  showAutocomplete = false,
  handleAutocompleteSelect,
  searchContainerRef,
  setShowBranchSelector,
  selectedBranch,
  getCartItemCount,
  handleAdminClick
}) => {
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 자동 완성 목록이 변경될 때마다 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(-1);
  }, [autocompleteSuggestions]);

  const handleInputBlur = (e) => {
    // 드롭다운 클릭 시에는 숨기지 않음
    if (autocompleteRef.current && autocompleteRef.current.contains(e.relatedTarget)) {
      return;
    }
    // 약간의 지연을 두어 클릭 이벤트가 먼저 발생하도록
    setTimeout(() => {
      // handleAutocompleteSelect가 호출되지 않은 경우에만 숨김
      if (handleAutocompleteSelect) {
        // 자동 완성 숨김은 부모 컴포넌트에서 처리
      }
    }, 200);
  };

  const handleKeyDown = (e) => {
    if (!showAutocomplete || autocompleteSuggestions.length === 0) {
      // 자동 완성이 없으면 기본 동작 (Enter로 검색)
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(searchQuery);
      }
      return;
    }

    const maxIndex = Math.min(autocompleteSuggestions.length - 1, 4); // 최대 5개 항목

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev < maxIndex ? prev + 1 : prev;
          // 선택된 항목으로 스크롤
          scrollToItem(nextIndex);
          return nextIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => {
          const nextIndex = prev > 0 ? prev - 1 : -1;
          // 선택된 항목으로 스크롤
          if (nextIndex >= 0) {
            scrollToItem(nextIndex);
          }
          return nextIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          // 선택된 항목으로 검색
          const selectedSuggestion = autocompleteSuggestions[selectedIndex];
          if (handleAutocompleteSelect) {
            handleAutocompleteSelect(selectedSuggestion);
          }
        } else {
          // 선택된 항목이 없으면 현재 입력값으로 검색
          handleSearch(searchQuery);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedIndex(-1);
        // 자동 완성 숨김은 부모 컴포넌트에서 처리
        break;
      default:
        break;
    }
  };

  const scrollToItem = (index) => {
    if (autocompleteRef.current) {
      const items = autocompleteRef.current.querySelectorAll('[data-autocomplete-item]');
      if (items[index]) {
        items[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-top">
          {!isLoggedIn ? (
            <>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof setDetailProduct === 'function') setDetailProduct(null);
                  if (typeof setCheckoutProduct === 'function') setCheckoutProduct(null);
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
                if (typeof setDetailProduct === 'function') setDetailProduct(null);
                if (typeof setCheckoutProduct === 'function') setCheckoutProduct(null);
                setPage("mypage");
              }}
            >
              {currentUser?.nickname || currentUser?.name || '마이페이지'}   
            </a>
          )}
          <a href="#">주문조회</a>
          {isLoggedIn && (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (typeof setDetailProduct === 'function') setDetailProduct(null);
                if (typeof setCheckoutProduct === 'function') setCheckoutProduct(null);
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
                setSearchQuery(""); // 검색어 초기화
                setShowSearch(false); // 검색창 닫기
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
                setSearchQuery(""); // 검색어 초기화
                setShowSearch(false); // 검색창 닫기
                setPage("products");
              }}
            >
              SHOP
            </a>
          </nav>
          <div className="actions" style={{ position: 'relative' }}>
            {showSearch && (
              <div ref={searchContainerRef} className="search-container" style={{ position: 'relative', width: '100%' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="상품명으로 검색해주세요..."
                  value={searchQuery}
                  onChange={(e) => {
                    if (handleSearchInputChange) {
                      handleSearchInputChange(e.target.value);
                    } else {
                      setSearchQuery(e.target.value);
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  onBlur={handleInputBlur}
                  className="search-input"
                  autoFocus
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  className="icon-btn"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  aria-label="검색 닫기"
                  style={{ 
                    position: 'absolute', 
                    right: '8px', 
                    top: '50%', 
                    transform: 'translateY(-50%)' 
                  }}
                >
                  ✕
                </button>
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div 
                    ref={autocompleteRef}
                    className="autocomplete-dropdown"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}
                    onMouseDown={(e) => {
                      // 마우스 다운 이벤트로 input blur 방지
                      e.preventDefault();
                    }}
                  >
                    {autocompleteSuggestions.slice(0, 5).map((suggestion, index) => (
                      <div
                        key={suggestion.id || index}
                        data-autocomplete-item
                        onClick={() => {
                          if (handleAutocompleteSelect) {
                            handleAutocompleteSelect(suggestion);
                          }
                        }}
                        onMouseEnter={() => {
                          // 마우스 호버 시에도 선택 인덱스 업데이트
                          setSelectedIndex(index);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: index < autocompleteSuggestions.slice(0, 5).length - 1 ? '1px solid #f3f4f6' : 'none',
                          transition: 'background-color 0.2s',
                          fontSize: '14px',
                          color: '#374151',
                          backgroundColor: selectedIndex === index ? '#f3f4f6' : '#ffffff',
                          fontWeight: selectedIndex === index ? '600' : '400'
                        }}
                      >
                        {suggestion.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!showSearch && (
              <button
                className="icon-btn"
                aria-label="검색"
                onClick={() => setShowSearch(true)}
              >
                <Icon path={mdiMagnify} size={1} color="#6b7280" />
              </button>
            )}
            <button
              className="icon-btn cart-btn"
              aria-label="장바구니"
              onClick={() => {
                // 상세보기 상태가 우선 렌더링을 가로막지 않도록 초기화 후 이동
                if (typeof setDetailProduct === 'function') setDetailProduct(null);
                if (typeof setCheckoutProduct === 'function') setCheckoutProduct(null);
                setPage("cart");
              }}
              style={{ position: 'relative' }}
            >
              <Icon path={mdiCartOutline} size={1} color="#6b7280" />
              {getCartItemCount && getCartItemCount() > 0 && (
                <span className="cart-badge">{getCartItemCount()}</span>        
              )}
            </button>
            {/* 지점선택 버튼 숨김 */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ShopHeader;
