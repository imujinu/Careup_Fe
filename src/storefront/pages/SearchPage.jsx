import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SearchResultsPage from '../components/SearchResultsPage';
import { useShopSearch } from '../hooks/useShopSearch';
import { useShopData } from '../hooks/useShopData';
import { useShopCart } from '../hooks/useShopCart';

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { searchQuery, setSearchQuery, searchResults, isSearching, searchError, searchProducts, clearSearch } = useShopSearch();
  const { favorites, toggleFavorite } = useShopData();
  const { handleAddToCart, handleProductClick } = useShopCart();
  
  // 함수들을 ref로 저장하여 의존성 배열 문제 해결
  const searchProductsRef = useRef(searchProducts);
  const clearSearchRef = useRef(clearSearch);
  const setSearchQueryRef = useRef(setSearchQuery);
  
  // ref 업데이트
  useEffect(() => {
    searchProductsRef.current = searchProducts;
    clearSearchRef.current = clearSearch;
    setSearchQueryRef.current = setSearchQuery;
  }, [searchProducts, clearSearch, setSearchQuery]);

  // URL에서 검색어 가져오기
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQueryRef.current(query);
      searchProductsRef.current(query);
    } else {
      clearSearchRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleToggleFavorite = (id) => {
    toggleFavorite(id);
  };

  return (
    <SearchResultsPage
      searchQuery={searchQuery}
      searchResults={searchResults}
      isSearching={isSearching}
      searchError={searchError}
      favorites={favorites || new Set()}
      onToggleFavorite={handleToggleFavorite}
      onOpenDetail={handleProductClick}
      onAddToCart={handleAddToCart}
      onBack={() => {
        clearSearch();
        navigate('/shop');
      }}
    />
  );
}

export default SearchPage;

