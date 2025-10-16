import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../components/inventory/SummaryCards';
import SearchAndFilter from '../components/inventory/SearchAndFilter';
import InventoryTable from '../components/inventory/InventoryTable';
import EditInventoryModal from '../components/inventory/EditInventoryModal';
import InventoryDetailModal from '../components/inventory/InventoryDetailModal';
import AddInventoryModal from '../components/inventory/AddInventoryModal';
import { inventoryService } from '../service/inventoryService';
import { authService } from '../service/authService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const PageSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

function InventoryManagement() {
  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalBranches: 0,
    totalValue: 0
  });

  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryFilter: '',
    branchFilter: '',
    statusFilter: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 본사: 전체 지점 재고 조회
  const fetchInventoryData = async (branchId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // 본사는 여러 지점의 데이터를 조회해야 하므로 지점별로 조회
      // TODO: 백엔드에 전체 지점 재고 조회 API 추가 필요
      const userInfo = authService.getCurrentUser();
      const targetBranchId = branchId || userInfo?.branchId || 1;
      
      const data = await inventoryService.getBranchProducts(targetBranchId);
      
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
      
      setInventoryData(formattedData);
      
      // Summary 계산
      const totalItems = formattedData.length;
      const lowStockItems = formattedData.filter(item => item.status === 'low').length;
      const totalValue = formattedData.reduce((sum, item) => sum + item.totalValue, 0);
      const branches = [...new Set(formattedData.map(item => item.branch))];
      
      setSummary({
        totalItems,
        lowStockItems,
        totalBranches: branches.length,
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

  const handleAddInventory = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveAddModal = async (formData) => {
    try {
      console.log('Saving data:', formData);
      
      const userInfo = authService.getCurrentUser();
      const userRole = userInfo?.role;
      
      if (userRole === 'HQ_ADMIN') {
        // 유효성 검사
        if (!formData.name || !formData.category) {
          alert('상품명과 카테고리는 필수 입력 항목입니다.');
          return;
        }
        
        // 본사 관리자: 상품 마스터 등록
        const productResponse = await inventoryService.createProduct({
          name: formData.name,
          description: formData.description,
          categoryId: parseInt(formData.category),
          minPrice: formData.minPrice,
          maxPrice: formData.maxPrice,
          supplyPrice: formData.supplyPrice,
          imageUrl: formData.imageUrl,
          visibility: formData.visibility
        });
        
        console.log('상품 등록 응답:', productResponse);
        
        // 등록된 상품의 ID 추출
        const productId = productResponse.data?.productId || productResponse.productId;
        
        if (productId) {
          // 본사 지점에 재고 추가 (초기 재고 0)
          await inventoryService.createBranchProduct({
            productId: productId,
            branchId: userInfo.branchId || 1, // 본사 branchId
            serialNumber: `HQ-${productId}-${Date.now()}`,
            stockQuantity: 0,
            safetyStock: 0,
            price: formData.supplyPrice
          });
        }
        
        alert('상품이 성공적으로 등록되었습니다.');
        
        // 재고 목록 새로고침
        await fetchInventoryData();
      } else {
        // 지점 관리자: 지점별 상품 추가 (추후 구현)
        alert('지점별 상품 추가 기능은 추후 구현 예정입니다.');
        return;
      }
      
      handleCloseAddModal();
      
      // 데이터 새로고침
      fetchInventoryData();
    } catch (err) {
      console.error('등록 실패:', err);
      alert('등록에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleModify = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveModal = async (formData) => {
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


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = filters.searchTerm === '' || 
      item.product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (item.product.id && item.product.id.toString().includes(filters.searchTerm));
    
    const matchesCategory = filters.categoryFilter === '' ||
      (item.category && item.category.includes(filters.categoryFilter));
    
    const matchesBranch = filters.branchFilter === '' || 
      item.branch === filters.branchFilter;
    
    const matchesStatus = filters.statusFilter === '' || 
      item.status === filters.statusFilter;
    
    return matchesSearch && matchesCategory && matchesBranch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(PageTitle, null, '재고관리'),
      React.createElement(PageSubtitle, null, '본사 - 재고 현황을 확인하고 관리하세요')
    ),
    React.createElement(SummaryCards, { summary }),
    React.createElement(SearchAndFilter, {
      filters,
      onFiltersChange: handleFiltersChange,
      onAddInventory: handleAddInventory,
      userRole: authService.getCurrentUser()?.role
    }),
    React.createElement(InventoryTable, {
      data: paginatedData,
      currentPage,
      totalPages,
      pageSize,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onModify: handleModify,
      onDetail: handleDetail
    }),
    React.createElement(EditInventoryModal, {
      isOpen: isEditModalOpen,
      onClose: handleCloseEditModal,
      item: selectedItem,
      onSave: handleSaveModal
    }),
    React.createElement(InventoryDetailModal, {
      isOpen: isDetailModalOpen,
      onClose: handleCloseDetailModal,
      item: selectedItem
    }),
    React.createElement(AddInventoryModal, {
      isOpen: isAddModalOpen,
      onClose: handleCloseAddModal,
      onSave: handleSaveAddModal
    })
  );
}

export default InventoryManagement;
