import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

export function useShopSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteTimerRef = useRef(null);
  const searchContainerRef = useRef(null);

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

      const responseData = res?.data?.data ?? res?.data;
      const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
      
      let raw = [];
      if (isPageResponse) {
        raw = responseData.content || [];
      } else if (Array.isArray(responseData)) {
        raw = responseData;
      }

      console.log('🔍 검색 API 응답:', { responseData, raw, rawLength: raw.length });

      const mapped = (Array.isArray(raw) ? raw : [])
        .map((item) => {
          // productId가 다른 필드명으로 올 수 있으므로 여러 가능성 확인
          const productId = item.productId ?? item.id ?? item.product_id;
          
          // productId가 없으면 null 반환하여 필터링
          if (!productId) {
            console.warn('⚠️ productId가 없는 항목 발견:', item);
            return null;
          }
        // 가격 필드 안전하게 추출 (다양한 필드명 지원)
        const minPrice = Number(item.minPrice ?? item.min_price ?? item.priceMin ?? 0);
        const maxPrice = Number(item.maxPrice ?? item.max_price ?? item.priceMax ?? 0);
        const price = Number(item.price ?? item.unitPrice ?? 0);
        
        return {
          id: productId, // productId가 있는 경우만 사용
          productId: productId,
        name: item.name || item.productName || "상품",
          price: minPrice > 0 ? minPrice : (maxPrice > 0 ? maxPrice : price),
          minPrice: minPrice,
          maxPrice: maxPrice,
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
        highlightedName: item.highlightedName || item.name
        };
      })
      .filter((item) => item != null); // null 항목 제거 (productId가 없는 경우)
      
      console.log('✅ 매핑된 검색 결과:', { mappedLength: mapped.length, mapped });
      setSearchResults(mapped);
      
    } catch (e) {
      console.error('❌ 상품 검색 실패:', e);
      setSearchResults([]);
      setSearchError(e?.message || "검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (query) => {
    setSearchQuery(query);
    
    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }
    
    if (query.trim().length >= 1) {
      autocompleteTimerRef.current = setTimeout(() => {
        fetchAutocomplete(query);
      }, 300);
    } else {
      setAutocompleteSuggestions([]);
      setShowAutocomplete(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
    setSearchError(null);
    setAutocompleteSuggestions([]);
    setShowAutocomplete(false);
  };

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

  return {
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
    clearSearch,
    fetchAutocomplete
  };
}

