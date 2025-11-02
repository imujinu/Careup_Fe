import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/inventory/common/SummaryCards';
import SearchAndFilter from '../../components/inventory/common/SearchAndFilter';
import FranchiseInventoryTable from '../../components/inventory/franchise/FranchiseInventoryTable';
import EditInventoryModal from '../../components/inventory/franchise/EditInventoryModal';
import FranchiseInventoryDetailModal from '../../components/inventory/franchise/FranchiseInventoryDetailModal';
import ProductSelectionModal from '../../components/inventory/common/ProductSelectionModal';
import ProductSetupModal from '../../components/inventory/common/ProductSetupModal';
import { inventoryService } from '../../service/inventoryService';
import { authService } from '../../service/authService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 80px;
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
  const branchId = authService.getCurrentUser()?.branchId || 2;
  
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isProductSelectionModalOpen, setIsProductSelectionModalOpen] = useState(false);
  const [isProductSetupModalOpen, setIsProductSetupModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [sort, setSort] = useState(null); // { field, direction }

  // 가맹점: 자신의 지점 재고만 조회
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 2;
      
      const data = await inventoryService.getBranchProducts(branchId);
      
      // 전체 상품 목록 가져오기
      let allProducts = [];
      try {
        const productsResponse = await inventoryService.getAllProducts();
        const pageData = productsResponse.data?.data || productsResponse.data;
        allProducts = pageData?.content || [];
      } catch (err) {
        console.error('getAllProducts 실패:', err);
      }
      
      // 상품 ID로 상품 정보를 빠르게 찾기 위한 Map 생성
      const productMap = new Map();
      allProducts.forEach(product => {
        productMap.set(product.productId, product);
      });
      
      // 데이터 변환
      const formattedData = data.map(item => {
        const product = productMap.get(item.productId);
        const unitPrice = product?.supplyPrice || 0;  // 공급가는 Product.supplyPrice
        const salesPrice = item.price || null;  // 판매가는 BranchProduct.price
        
        return {
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
          unitPrice: unitPrice,
          salesPrice: salesPrice,
          totalValue: (item.stockQuantity || 0) * unitPrice
        };
      });
      
      // 중복 데이터 제거
      const uniqueData = formattedData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.product.id === current.product.id);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // 더 최근 ID를 가진 항목으로 교체
          if (current.id > acc[existingIndex].id) {
            acc[existingIndex] = current;
          }
        }
        return acc;
      }, []);
      
      setInventoryItems(uniqueData);
      
      // Summary 계산
      const totalItems = uniqueData.length;
      const lowStock = uniqueData.filter(item => item.status === 'low').length;
      const totalValue = uniqueData.reduce((sum, item) => sum + item.totalValue, 0);
      
      setSummary({
        totalItems,
        lowStock,
        totalValue
      });
    } catch (err) {
      console.error('재고 조회 실패:', err);
      setError('재고 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const data = await inventoryService.getCategories();
      const categories = Array.isArray(data) ? data : (data?.data || data?.result || []);
      if (categories.length > 0) {
        setCategoryList(categories.map(cat => ({
          id: cat.categoryId || cat.id,
          name: cat.name || cat.categoryName
        })));
      }
    } catch (err) {
      console.error('카테고리 목록 조회 실패:', err);
      setCategoryList([]);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchInventoryData();
    fetchCategories();
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

  const handleViewDetail = (item) => {
    console.log('상세보기 상품 데이터:', item);
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (!item.id) {
      alert('삭제할 상품 정보가 없습니다.');
      return;
    }

    const productName = item.product?.name || '상품';
    const confirmMessage = `정말로 "${productName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await inventoryService.deleteBranchProduct(item.id);
      alert('상품이 삭제되었습니다.');
      await fetchInventoryData();
    } catch (err) {
      console.error('상품 삭제 실패:', err);
      alert('상품 삭제에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleSort = (field, direction) => {
    setSort({ field, direction });
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddProduct = async () => {
    // 모달을 열기 전에 최신 재고 데이터를 가져옴
    await fetchInventoryData();
    setIsProductSelectionModalOpen(true);
  };

  const handleCloseProductSelectionModal = () => {
    setIsProductSelectionModalOpen(false);
  };

  const handleProductSelect = async (products) => {
    // 단일 상품만 설정 모달 표시
    if (products.length === 1) {
      setSelectedProduct(products[0]);
      setIsProductSelectionModalOpen(false);
      setIsProductSetupModalOpen(true);
    } else if (products.length > 1) {
      // 여러 개 선택 시 경고
      alert('상품은 한 번에 하나씩만 등록할 수 있습니다. 하나의 상품만 선택해주세요.');
    }
  };

  const handleCloseProductSetupModal = () => {
    setIsProductSetupModalOpen(false);
    setSelectedProduct(null);
  };

  const handleProductSetup = async (setupData) => {
    if (!selectedProduct) return;
    
    setIsProductSetupModalOpen(false);
    const currentProduct = selectedProduct;
    setSelectedProduct(null);
    
    try {
      await inventoryService.createBranchProduct({
        branchId: branchId,
        productId: currentProduct.productId,
        serialNumber: setupData.serialNumber || `${currentProduct.productId}-${Date.now()}`,
        stockQuantity: setupData.stockQuantity || 0,
        safetyStock: setupData.safetyStock,
        price: setupData.sellingPrice || setupData.price || 0  // 판매가를 price로 매핑
      });
      
      alert('상품이 등록되었습니다.');
      await fetchInventoryData();
    } catch (error) {
      console.error('상품 등록 실패:', error);
      
      const errorMessage = error.response?.data?.status_message || error.response?.data?.message || error.message;
      
      // 중복 등록 에러인 경우
      if (error.response?.data?.status_message?.includes('이미 등록된')) {
        alert('이미 등록된 상품입니다.');
        await fetchInventoryData();
      } else {
        alert('상품 등록에 실패했습니다: ' + errorMessage);
      }
    }
  };



  const handleSaveEdit = async (formData) => {
    try {
      console.log('Saving inventory data:', formData);
      
      // 안전재고와 판매가 업데이트 (공급가는 수정 불가)
      if (selectedItem?.id) {
        await inventoryService.updateInventoryInfo(
          selectedItem.id,
          formData.safetyStock,
          formData.sellingPrice  // 판매가를 unitPrice로 전달 (BranchProduct.price가 판매가)
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
  const filteredData = React.useMemo(() => {
    let filtered = inventoryItems.filter(item => {
      const matchesSearch = !filters.searchTerm || 
        item.product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        item.product.id.toString().includes(filters.searchTerm);
      
      const matchesCategory = !filters.categoryFilter || item.category === filters.categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // 정렬 적용
    if (sort && sort.field) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (sort.field) {
          case 'productName':
            aValue = a.product.name || '';
            bValue = b.product.name || '';
            break;
          case 'category':
            aValue = a.category || '';
            bValue = b.category || '';
            break;
          case 'currentStock':
            aValue = a.currentStock || 0;
            bValue = b.currentStock || 0;
            break;
          case 'safetyStock':
            aValue = a.safetyStock || 0;
            bValue = b.safetyStock || 0;
            break;
          case 'supplyPrice':
            aValue = a.unitPrice || 0;
            bValue = b.unitPrice || 0;
            break;
          case 'salesPrice':
            aValue = a.salesPrice || 0;
            bValue = b.salesPrice || 0;
            break;
          case 'totalValue':
            aValue = a.totalValue || 0;
            bValue = b.totalValue || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventoryItems, filters, sort]);

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
    React.createElement(SummaryCards, { 
      summary,
      userRole: 'BRANCH_MANAGER'
    }),
    React.createElement(SearchAndFilter, {
      filters,
      onFiltersChange: handleFiltersChange,
      onAddProduct: handleAddProduct,
      userRole: 'BRANCH_MANAGER',
      categoryList: categoryList
    }),
    React.createElement(FranchiseInventoryTable, {
      data: paginatedData,
      currentPage,
      totalPages,
      pageSize,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onModify: handleModify,
      onViewDetail: handleViewDetail,
      onDelete: handleDelete,
      onSort: handleSort,
      currentSort: sort
    }),
    React.createElement(EditInventoryModal, {
      isOpen: isEditModalOpen,
      onClose: handleCloseEditModal,
      item: selectedItem,
      onSave: handleSaveEdit
    }),
    React.createElement(FranchiseInventoryDetailModal, {
      isOpen: isDetailModalOpen,
      onClose: handleCloseDetailModal,
      item: selectedItem
    }),
    React.createElement(ProductSelectionModal, {
      isOpen: isProductSelectionModalOpen,
      onClose: handleCloseProductSelectionModal,
      onNext: handleProductSelect,
      existingProducts: inventoryItems
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
