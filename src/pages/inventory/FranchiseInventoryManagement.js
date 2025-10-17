import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/franchise/SummaryCards';
import SearchAndFilter from '../../components/franchise/SearchAndFilter';
import FranchiseInventoryTable from '../../components/inventory/FranchiseInventoryTable';
import EditInventoryModal from '../../components/franchise/EditInventoryModal';
import ProductSelectionModal from '../../components/inventory/ProductSelectionModal';
import ProductSetupModal from '../../components/inventory/ProductSetupModal';
import { inventoryService } from '../../service/inventoryService';
import { authService } from '../../service/authService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
`;

function FranchiseInventoryManagement() {
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStock: 0,
    categories: 0,
    totalValue: 0
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryFilter: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
  const [isProductSetupModalOpen, setIsProductSetupModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 가맹점: 자신의 지점 재고만 조회
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 2;
      
      const data = await inventoryService.getBranchProducts(branchId);
      
      // 데이터 변환
      const formattedData = data.map(item => ({
        id: item.branchProductId,
        product: { 
          name: item.productName || '알 수 없음', 
          id: item.productId || 'N/A'
        },
        category: item.categoryName || '미분류',
        branchId: item.branchId,
        branch: item.branchId === 1 ? '본사' : `지점-${item.branchId}`,
        currentStock: item.stockQuantity || 0,
        safetyStock: item.safetyStock || 0,
        status: (item.stockQuantity || 0) < (item.safetyStock || 0) ? 'low' : 'normal',
        unitPrice: item.price || 0,
        totalValue: (item.stockQuantity || 0) * (item.price || 0)
      }));
      
      setInventoryItems(formattedData);
      
      // Summary 계산
      const totalItems = formattedData.length;
      const lowStock = formattedData.filter(item => item.status === 'low').length;
      const totalValue = formattedData.reduce((sum, item) => sum + item.totalValue, 0);
      const categories = [...new Set(formattedData.map(item => item.category))];
      
      setSummary({
        totalItems,
        lowStock,
        categories: categories.length,
        totalValue
      });
    } catch (err) {
      console.error('재고 조회 실패:', err);
      setError('재고 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleModify = (item) => {
    console.log('수정할 상품 데이터:', item); // 디버깅용
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddProduct = () => {
    setIsProductSelectionModalOpen(true);
  };

  const handleCloseProductSelectionModal = () => {
    setIsProductSelectionModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setIsProductSelectionModalOpen(false);
    setIsProductSetupModalOpen(true);
  };

  const handleCloseProductSetupModal = () => {
    setIsProductSetupModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductSetup = async (setupData) => {
    try {
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 2;

      await inventoryService.createBranchProduct({
        productId: setupData.productId,
        branchId: branchId,
        serialNumber: setupData.serialNumber,
        stockQuantity: setupData.stockQuantity,
        safetyStock: setupData.safetyStock,
        price: setupData.price
      });

      alert('상품이 성공적으로 추가되었습니다.');
      handleCloseProductSetupModal();
      fetchInventoryData(); // 목록 새로고침
    } catch (error) {
      console.error('상품 추가 실패:', error);
      alert('상품 추가에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
    }
  };

  const handleSaveEdit = async (formData) => {
    try {
      console.log('Saving inventory data:', formData);
      
      // 안전재고 업데이트
      if (selectedItem?.id) {
        await inventoryService.updateSafetyStock(
          selectedItem.id,
          formData.safetyStock
        );
        
        alert('재고 정보가 성공적으로 수정되었습니다.');
        handleCloseEditModal();
        
        // 데이터 새로고침
        fetchInventoryData();
      }
    } catch (err) {
      console.error('재고 수정 실패:', err);
      alert('재고 수정에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };


  // 필터링된 데이터
  const filteredData = inventoryItems.filter(item => {
    const matchesSearch = !filters.searchTerm || 
      item.product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      item.product.id.toString().includes(filters.searchTerm);
    
    const matchesCategory = !filters.categoryFilter || item.category === filters.categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(PageTitle, null, '재고관리'),
      React.createElement(PageSubtitle, null, '가맹점 재고 조회, 수정 및 발주 추천')
    ),
    React.createElement(SummaryCards, { summary }),
    React.createElement(SearchAndFilter, {
      filters,
      onFiltersChange: handleFiltersChange,
      onAddProduct: handleAddProduct
    }),
    React.createElement(FranchiseInventoryTable, {
      data: paginatedData,
      currentPage,
      totalPages,
      pageSize,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onModify: handleModify
    }),
    React.createElement(EditInventoryModal, {
      isOpen: isEditModalOpen,
      onClose: handleCloseEditModal,
      item: selectedItem,
      onSave: handleSaveEdit
    }),
    React.createElement(ProductSelectionModal, {
      isOpen: isProductSelectionModalOpen,
      onClose: handleCloseProductSelectionModal,
      onNext: handleProductSelect
    }),
    React.createElement(ProductSetupModal, {
      isOpen: isProductSetupModalOpen,
      onClose: handleCloseProductSetupModal,
      product: selectedProduct,
      onSave: handleProductSetup
    })
  );
}

export default FranchiseInventoryManagement;
