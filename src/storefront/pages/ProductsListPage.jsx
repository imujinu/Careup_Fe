import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductsPage from '../components/ProductsPage';
import { useShopData } from '../hooks/useShopData';
import { useShopCart } from '../hooks/useShopCart';

function ProductsListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, products, loadingProducts, productsError, currentPage, setCurrentPage, totalPages, selectedCategoryId, setSelectedCategoryId, favorites, toggleFavorite, getCategoryIdByName } = useShopData();
  const { handleAddToCart, handleProductClick } = useShopCart();
  
  const [activeTab, setActiveTab] = useState("전체");

  // URL 파라미터에서 카테고리 가져오기
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setActiveTab(categoryParam);
      const categoryId = getCategoryIdByName(categoryParam);
      if (categoryId) {
        setSelectedCategoryId(categoryId);
      }
    } else {
      setActiveTab("전체");
      setSelectedCategoryId(null);
    }
  }, [searchParams, getCategoryIdByName, setSelectedCategoryId]);

  const handleTabChange = (tabName) => {
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

