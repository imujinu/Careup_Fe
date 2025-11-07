import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductsPage from '../components/ProductsPage';
import { useShopData } from '../hooks/useShopData';
import { useShopCart } from '../hooks/useShopCart';

function ProductsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, loadingCategories, products, loadingProducts, productsError, currentPage, setCurrentPage, totalPages, selectedCategoryId, setSelectedCategoryId, favorites, toggleFavorite, getCategoryIdByName } = useShopData();
  const { handleAddToCart, handleProductClick } = useShopCart();
  
  const [activeTab, setActiveTab] = useState("전체");

  // URL 파라미터에서 카테고리 가져오기 (카테고리가 로딩된 후에만 실행)
  useEffect(() => {
    // 카테고리가 아직 로딩 중이면 대기
    if (loadingCategories) return;
    
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveTab(categoryParam);
      const categoryId = getCategoryIdByName(categoryParam);
      if (categoryId) {
        setSelectedCategoryId(categoryId);
      } else {
        // 카테고리를 찾지 못한 경우 (카테고리 이름이 다를 수 있음)
        console.warn(`카테고리를 찾을 수 없습니다: ${categoryParam}`);
        // URL에서 카테고리 파라미터 제거
        navigate('/shop/products', { replace: true });
        setActiveTab("전체");
        setSelectedCategoryId(null);
      }
    } else {
      setActiveTab("전체");
      setSelectedCategoryId(null);
    }
  }, [searchParams, categories, loadingCategories, getCategoryIdByName, setSelectedCategoryId, navigate]);

  const handleTabChange = (tabName) => {
    // 카테고리가 아직 로딩 중이면 대기
    if (loadingCategories) {
      console.warn('카테고리가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setActiveTab(tabName);
    const categoryId = getCategoryIdByName(tabName);
    setSelectedCategoryId(categoryId);
    setCurrentPage(0);
    
    // URL 업데이트
    if (categoryId) {
      navigate(`/shop/products?category=${encodeURIComponent(tabName)}`);
    } else {
      navigate('/shop/products');
    }
  };

  return (
    <ProductsPage
      favorites={favorites}
      onToggleFavorite={toggleFavorite}
      onOpenDetail={handleProductClick}
      onAddToCart={handleAddToCart}
      products={products}
      searchQuery=""
      categories={categories}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
    />
  );
}

export default ProductsListPage;


