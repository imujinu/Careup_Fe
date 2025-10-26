import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/inventory/SummaryCards';
import SearchAndFilter from '../../components/inventory/SearchAndFilter';
import InventoryTable from '../../components/inventory/InventoryTable';
import EditInventoryModal from '../../components/inventory/EditInventoryModal';
import InventoryDetailModal from '../../components/inventory/InventoryDetailModal';
import AddInventoryModal from '../../components/inventory/AddInventoryModal';
import InventoryFlowTable from '../../components/inventory/InventoryFlowTable';
import EditInventoryFlowModal from '../../components/inventory/EditInventoryFlowModal';
import AddInventoryFlowModal from '../../components/inventory/AddInventoryFlowModal';
import { inventoryService } from '../../service/inventoryService';
import { authService } from '../../service/authService';

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

const TabContainer = styled.div`
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const TabList = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    color: #374151;
  }
  
  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
`;

const TabContent = styled.div`
  margin-top: 24px;
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

  // 탭 상태
  const [activeTab, setActiveTab] = useState('inventory');

  // 입출고 기록 관련 상태
  const [inventoryFlowData, setInventoryFlowData] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowCurrentPage, setFlowCurrentPage] = useState(1);
  const [flowPageSize, setFlowPageSize] = useState(10);
  const [isFlowEditModalOpen, setIsFlowEditModalOpen] = useState(false);
  const [isFlowAddModalOpen, setIsFlowAddModalOpen] = useState(false);
  const [selectedFlowItem, setSelectedFlowItem] = useState(null);

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
      
      console.log('🔄 전체 데이터 응답:', data);
      console.log('🔄 첫 번째 아이템:', data[0]);
      
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

  // 입출고 기록 조회
  const fetchInventoryFlowData = async () => {
    try {
      setFlowLoading(true);
      setError(null);
      
      const userInfo = authService.getCurrentUser();
      const data = await inventoryService.getInventoryFlows();
      
      setInventoryFlowData(data);
    } catch (err) {
      console.error('입출고 기록 조회 실패:', err);
      setError('입출고 기록을 불러오는데 실패했습니다.');
    } finally {
      setFlowLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchInventoryData();
    fetchInventoryFlowData();
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
        const productData = {
          name: formData.name,
          description: formData.description || '',
          categoryId: parseInt(formData.category),
          minPrice: formData.minPrice || 0,
          maxPrice: formData.maxPrice || 0,
          supplyPrice: formData.supplyPrice || 0,
          imageUrl: formData.imageUrl || '',
          visibility: formData.visibility || 'ALL'
        };
        
        console.log('상품 등록 데이터:', productData);
        
        const productResponse = await inventoryService.createProduct(productData, null);
        
        console.log('상품 등록 응답:', productResponse);
        
        // 등록된 상품의 ID 추출
        const productId = productResponse?.data?.productId || productResponse?.result?.productId;
        
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
      
      // 재고 정보 업데이트 (안전재고, 단가)
      if (selectedItem?.id) {
        await inventoryService.updateInventoryInfo(
          selectedItem.id,
          formData.safetyStock,
          formData.unitPrice
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

  // 입출고 기록 관련 핸들러들
  const handleFlowAdd = () => {
    setIsFlowAddModalOpen(true);
  };

  const handleFlowCloseAddModal = () => {
    setIsFlowAddModalOpen(false);
  };

  const handleFlowSaveAddModal = async (formData) => {
    try {
      await inventoryService.createInventoryFlow(formData);
      alert('입출고 기록이 성공적으로 등록되었습니다.');
      handleFlowCloseAddModal();
      fetchInventoryFlowData(); // 목록 새로고침
      fetchInventoryData(); // 재고도 새로고침
    } catch (err) {
      console.error('입출고 기록 등록 실패:', err);
      alert('입출고 기록 등록에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowEdit = (item) => {
    setSelectedFlowItem(item);
    setIsFlowEditModalOpen(true);
  };

  const handleFlowCloseEditModal = () => {
    setIsFlowEditModalOpen(false);
    setSelectedFlowItem(null);
  };

  const handleFlowSaveEditModal = async (formData) => {
    try {
      console.log('수정할 아이템:', selectedFlowItem); // 디버깅용
      await inventoryService.updateInventoryFlow(selectedFlowItem.flowId || selectedFlowItem.id, formData);
      alert('입출고 기록이 성공적으로 수정되었습니다.');
      handleFlowCloseEditModal();
      fetchInventoryFlowData(); // 목록 새로고침
      fetchInventoryData(); // 재고도 새로고침
    } catch (err) {
      console.error('입출고 기록 수정 실패:', err);
      alert('입출고 기록 수정에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowDelete = async (item) => {
    try {
      console.log('삭제할 아이템:', item); // 디버깅용
      await inventoryService.deleteInventoryFlow(item.flowId || item.id);
      alert('입출고 기록이 성공적으로 삭제되었습니다.');
      
      // 데이터 새로고침 (순서 중요)
      await fetchInventoryFlowData(); // 입출고 기록 목록 새로고침
      await fetchInventoryData(); // 재고 현황 새로고침
      
      // 페이지 상태 초기화 (삭제 후 빈 페이지가 될 수 있으므로)
      if (flowCurrentPage > 1 && inventoryFlowData.length <= flowPageSize) {
        setFlowCurrentPage(flowCurrentPage - 1);
      }
      
    } catch (err) {
      console.error('입출고 기록 삭제 실패:', err);
      alert('입출고 기록 삭제에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowPageChange = (page) => {
    setFlowCurrentPage(page);
  };

  const handleFlowPageSizeChange = (size) => {
    setFlowPageSize(size);
    setFlowCurrentPage(1);
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

  // 입출고 기록 페이징
  const flowTotalPages = Math.ceil(inventoryFlowData.length / flowPageSize);
  const flowStartIndex = (flowCurrentPage - 1) * flowPageSize;
  const flowEndIndex = flowStartIndex + flowPageSize;
  const flowPaginatedData = inventoryFlowData.slice(flowStartIndex, flowEndIndex);

  // 재고 상품 목록 (입출고 등록용)
  const branchProductsForFlow = inventoryData.map(item => ({
    id: item.id,
    productName: item.product.name,
    branchId: item.branchId
  }));

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(PageTitle, null, '재고관리'),
      React.createElement(PageSubtitle, null, '본사 - 재고 현황을 확인하고 관리하세요')
    ),
    React.createElement(TabContainer, null,
      React.createElement(TabList, null,
        React.createElement(Tab, {
          className: activeTab === 'inventory' ? 'active' : '',
          onClick: () => setActiveTab('inventory')
        }, '재고현황'),
        React.createElement(Tab, {
          className: activeTab === 'flow' ? 'active' : '',
          onClick: () => setActiveTab('flow')
        }, '입출고 기록')
      )
    ),
    React.createElement(TabContent, null,
      activeTab === 'inventory' ? React.createElement(React.Fragment, null,
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
        })
      ) : React.createElement(React.Fragment, null,
        React.createElement('div', { style: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('h3', { style: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' } }, '입출고 기록 관리'),
          React.createElement('button', {
            onClick: handleFlowAdd,
            style: {
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }
          }, '입출고 기록 등록')
        ),
        React.createElement(InventoryFlowTable, {
          data: flowPaginatedData,
          currentPage: flowCurrentPage,
          totalPages: flowTotalPages,
          pageSize: flowPageSize,
          onPageChange: handleFlowPageChange,
          onPageSizeChange: handleFlowPageSizeChange,
          onEdit: handleFlowEdit,
          onDelete: handleFlowDelete
        })
      )
    ),
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
    }),
    React.createElement(EditInventoryFlowModal, {
      isOpen: isFlowEditModalOpen,
      onClose: handleFlowCloseEditModal,
      item: selectedFlowItem,
      onSave: handleFlowSaveEditModal
    }),
    React.createElement(AddInventoryFlowModal, {
      isOpen: isFlowAddModalOpen,
      onClose: handleFlowCloseAddModal,
      onSave: handleFlowSaveAddModal,
      branchProducts: branchProductsForFlow
    })
  );
}

export default InventoryManagement;
