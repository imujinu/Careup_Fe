import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import SummaryCards from '../../components/inventory/common/SummaryCards';
import SearchAndFilter from '../../components/inventory/common/SearchAndFilter';
import InventoryTable from '../../components/inventory/common/InventoryTable';
import EditInventoryModal from '../../components/inventory/common/EditInventoryModal';
import InventoryDetailModal from '../../components/inventory/common/InventoryDetailModal';
import AddInventoryModal from '../../components/inventory/common/AddInventoryModal';
import InventoryFlowTable from '../../components/inventory/headquarters/InventoryFlowTable';
import EditInventoryFlowModal from '../../components/inventory/headquarters/EditInventoryFlowModal';
import AddInventoryFlowModal from '../../components/inventory/headquarters/AddInventoryFlowModal';
import InventoryFlowFilter from '../../components/inventory/headquarters/InventoryFlowFilter';
import { inventoryService } from '../../service/inventoryService';
import { authService } from '../../service/authService';
import { purchaseOrderService } from '../../service/purchaseOrderService';
import { branchService } from '../../service/branchService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 80px;
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL 쿼리 파라미터에서 탭 상태 읽기 (기본값: 'inventory')
  const activeTabFromUrl = searchParams.get('tab') || 'inventory';
  const [activeTab, setActiveTab] = useState(activeTabFromUrl);

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

  // 입출고 기록 관련 상태
  const [inventoryFlowData, setInventoryFlowData] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowCurrentPage, setFlowCurrentPage] = useState(1);
  const [flowPageSize, setFlowPageSize] = useState(10);
  const [isFlowEditModalOpen, setIsFlowEditModalOpen] = useState(false);
  const [isFlowAddModalOpen, setIsFlowAddModalOpen] = useState(false);
  const [selectedFlowItem, setSelectedFlowItem] = useState(null);
  const [branchProducts, setBranchProducts] = useState([]);
  const [flowFilters, setFlowFilters] = useState({
    searchTerm: '',
    startDate: '',
    endDate: '',
    branchFilter: '',
    typeFilter: ''
  });
  const [branchList, setBranchList] = useState([]);

  // 본사: 전체 지점 재고 조회
  const fetchInventoryData = async (branchId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      // 본사는 여러 지점의 데이터를 조회해야 하므로 지점별로 조회
      // TODO: 백엔드에 전체 지점 재고 조회 API 추가 필요
      const userInfo = authService.getCurrentUser();
      const targetBranchId = branchId || userInfo?.branchId || 1;
      
      // 본사 재고 조회 (BranchProduct 데이터 가져오기)
      const branchProducts = await inventoryService.getBranchProducts(1);
      console.log('본사 BranchProduct 데이터:', branchProducts);
      
      // 본사가 본사 재고 관리 탭인 경우, 본사에 BranchProduct가 없는 상품도 표시
      let allProducts = [];
      try {
        const productsResponse = await inventoryService.getAllProducts();
        console.log('본사 전체 상품 API 응답:', productsResponse);
        
        const pageData = productsResponse.data?.data || productsResponse.data;
        allProducts = pageData?.content || [];
        
        console.log('본사 전체 상품 데이터 (content):', allProducts);
      } catch (err) {
        console.error('getAllProducts 실패 (서버가 꺼져있거나 엔드포인트 없음):', err);
        // 일단 빈 배열로 진행
      }
      
      // BranchProduct가 있는 상품
      const productsWithStock = branchProducts.map(item => {
        const currentStock = item.stockQuantity || 0;
        const safetyStock = item.safetyStock || 0;
        const unitPrice = item.price || 0;
        const status = currentStock < safetyStock ? 'low' : 'normal';
        
        return {
          id: item.branchProductId,
          branchProductId: item.branchProductId,
          product: { 
            name: item.productName || '알 수 없음', 
            id: item.productId || 'N/A'
          },
          category: item.categoryName || '미분류',
          branchId: item.branchId,
          branch: '본사',
          currentStock: currentStock,
          safetyStock: safetyStock,
          status: status,
          unitPrice: unitPrice,
          totalValue: currentStock * unitPrice
        };
      });
      
      // BranchProduct가 없는 상품 찾기
      const branchProductIds = new Set(branchProducts.map(bp => bp.productId));
      const productsWithoutStock = allProducts
        .filter(product => !branchProductIds.has(product.productId))
        .map(product => ({
          id: `product-${product.productId}`, // 임시 ID
          branchProductId: null,
          product: { 
            name: product.name || '알 수 없음', 
            id: product.productId || 'N/A'
          },
          category: product.categoryName || '미분류',
          branchId: 1,
          branch: '본사',
          currentStock: 0,
          safetyStock: 0,
          status: 'normal',
          unitPrice: product.supplyPrice || 0,
          totalValue: 0
        }));
      
      // 전체 데이터 합치기
      const formattedData = [...productsWithStock, ...productsWithoutStock];
      
      
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
      
      // 입출고 기록을 불러온 후 지점 목록 갱신
      if (data && data.length > 0) {
        await fetchBranchListWithFlowData(data);
      }
    } catch (err) {
      console.error('입출고 기록 조회 실패:', err);
      setError('입출고 기록을 불러오는데 실패했습니다.');
    } finally {
      setFlowLoading(false);
    }
  };

  // 지점 목록 조회
  const fetchBranchListWithFlowData = async (flowData = null) => {
    const dataToUse = flowData || inventoryFlowData;
    
    try {
      let branches = null;
      try {
        const branchResponse = await branchService.fetchBranches({ page: 0, size: 100 });
        console.log('branchService.fetchBranches 응답:', branchResponse);
        
        if (branchResponse?.data && Array.isArray(branchResponse.data)) {
          branches = branchResponse.data;
        } else if (branchResponse?.content && Array.isArray(branchResponse.content)) {
          branches = branchResponse.content;
        } else if (Array.isArray(branchResponse)) {
          branches = branchResponse;
        }
      } catch (err) {
        console.warn('branchService.fetchBranches 실패, purchaseOrderService.getBranchList 시도:', err);
        branches = await purchaseOrderService.getBranchList().catch((err) => {
          console.error('지점 목록 API 호출 실패:', err);
          return null;
        });
      }
      
      console.log('지점 목록 API 응답:', branches);
      
      // API 응답이 배열이 아닌 경우 처리
      let branchArray = null;
      if (branches === null || branches === undefined) {
        branchArray = null;
      } else if (Array.isArray(branches)) {
        branchArray = branches;
      } else if (branches.data && Array.isArray(branches.data)) {
        branchArray = branches.data;
      } else if (branches.result && Array.isArray(branches.result)) {
        branchArray = branches.result;
      } else if (branches.result?.data && Array.isArray(branches.result.data)) {
        branchArray = branches.result.data;
      }
      
      if (branchArray && branchArray.length > 0) {
        // 응답 데이터 형태 정규화
        const normalizedBranches = branchArray.map(branch => {
          if (typeof branch === 'string') {
            return { id: branch, name: branch };
          }
          return {
            id: branch.id || branch.branchId || branch.name,
            name: branch.name || branch.branchName || String(branch.id || branch.branchId)
          };
        });
        console.log('정규화된 지점 목록:', normalizedBranches);
        setBranchList(normalizedBranches);
        return;
      }
      
      // API 실패 시 발주 목록에서 지점명 찾기
      console.warn('지점 목록 API가 실패했습니다. 발주 목록에서 지점명을 찾습니다.');
      
      // 입출고 기록의 모든 지점 ID 수집
      const branchIds = new Set();
      if (dataToUse && dataToUse.length > 0) {
        dataToUse.forEach(item => {
          if (item.branchId) {
            branchIds.add(item.branchId);
          }
        });
      }
      
      // 발주 목록에서 지점명 매핑 생성
      const branchNameMap = {};
      try {
        // 본사(branchId=1)의 발주 목록을 가져오면 모든 지점의 발주가 포함될 수 있음
        const orders = await purchaseOrderService.getPurchaseOrders(1);
        if (orders && Array.isArray(orders)) {
          orders.forEach(order => {
            if (order.branchId && order.branchName) {
              branchNameMap[order.branchId] = order.branchName;
            }
          });
        }
        console.log('발주 목록에서 찾은 지점명 매핑:', branchNameMap);
      } catch (err) {
        console.error('발주 목록 조회 실패:', err);
      }
      
      // 최종 지점 목록 생성
      const uniqueBranches = {};
      if (dataToUse && dataToUse.length > 0) {
        dataToUse.forEach(item => {
          const branchId = item.branchId;
          if (!uniqueBranches[branchId]) {
            // 우선순위: 1) item.branchName, 2) 발주 목록의 branchName, 3) fallback
            const branchName = item.branchName || branchNameMap[branchId] || 
              (branchId === 1 ? '본사' : `지점-${branchId}`);
            uniqueBranches[branchId] = {
              id: branchId,
              name: branchName
            };
          }
        });
      }
      
      const extractedBranches = Object.values(uniqueBranches);
      console.log('입출고 기록에서 추출한 지점 목록:', extractedBranches);
      if (extractedBranches.length > 0) {
        setBranchList(extractedBranches);
      } else {
        setBranchList([{ id: 1, name: '본사' }]);
      }
    } catch (err) {
      console.error('지점 목록 조회 실패:', err);
      setBranchList([{ id: 1, name: '본사' }]);
    }
  };

  // 지점 목록 조회
  const fetchBranchList = async () => {
    await fetchBranchListWithFlowData();
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'inventory';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchInventoryData();
    fetchInventoryFlowData();
    fetchBranchList();
  }, []);
  
  useEffect(() => {
    if (inventoryFlowData.length > 0 && branchList.length <= 1) {
      // API에서 지점 목록을 가져오지 못한 경우에만 발주 목록에서 추출
      const uniqueBranches = {};
      inventoryFlowData.forEach(item => {
        const branchName = item.branchId === 1 ? '본사' : `지점-${item.branchId}`;
        if (!uniqueBranches[branchName]) {
          uniqueBranches[branchName] = {
            id: item.branchId,
            name: branchName
          };
        }
      });
      
      const extractedBranches = Object.values(uniqueBranches);
      if (extractedBranches.length > branchList.length) {
        setBranchList(extractedBranches);
      }
    }
  }, [inventoryFlowData]);

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
        
        // 등록된 상품의 ID 추출 (ResponseDto 구조 고려)
        const responseData = productResponse.data?.data || productResponse.data;
        const productId = responseData?.productId;
        
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
        
        // 성공 시에만 모달 닫기
        handleCloseAddModal();
      } else {
        // 지점 관리자: 지점별 상품 추가 (추후 구현)
        alert('지점별 상품 추가 기능은 추후 구현 예정입니다.');
        return;
      }
      
      // 데이터 새로고침 (이미 위에서 fetchInventoryData 호출됨)
    } catch (err) {
      console.error('등록 실패:', err);
      // API 에러 시에만 alert 표시 (유효성 검사는 이미 처리됨)
      if (err.response) {
        alert('등록에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
      }
      // 에러 발생 시 모달은 닫지 않고 그대로 유지
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

  const handleDelete = async (item) => {
    if (window.confirm(`'${item.product.name}' 상품을 삭제하시겠습니까?\n\n주의: 삭제된 상품은 복구할 수 없습니다.`)) {
      try {
        console.log('삭제할 상품:', item);
        console.log('상품 ID:', item.product.id);
        
        // 상품 삭제 API 호출
        const response = await inventoryService.deleteProduct(item.product.id);
        console.log('삭제 API 응답:', response);
        
        alert('상품이 성공적으로 삭제되었습니다.');
        
        // 데이터 새로고침
        await fetchInventoryData();
      } catch (err) {
        console.error('상품 삭제 실패:', err);
        console.error('에러 상세:', err.response);
        
        let errorMessage = '상품 삭제에 실패했습니다.';
        if (err.response?.data?.status_message) {
          errorMessage += '\n' + err.response.data.status_message;
        } else if (err.message) {
          errorMessage += '\n' + err.message;
        }
        
        alert(errorMessage);
      }
    }
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
      
      const productId = formData.productId || selectedItem?.product?.id;
      const branchProductId = selectedItem?.branchProductId || selectedItem?.id;
      
      // 상품 정보 수정 (이름, 이미지)
      if (productId && (formData.productName || formData.imageFile || formData.removeImage)) {
        try {
          // 기존 상품 정보 가져오기
          const productResponse = await inventoryService.getProduct(productId);
          const existingProduct = productResponse.data?.data || productResponse.data;
          
          // 이미지 제거인 경우
          const imageFileToSend = formData.removeImage ? null : formData.imageFile || null;
          const imageUrlToSend = formData.removeImage ? "" : (formData.imageFile ? undefined : existingProduct.imageUrl);
          
          // 상품 수정 API 호출
          await inventoryService.updateProduct(productId, {
            name: formData.productName || existingProduct.name,
            description: existingProduct.description || '',
            categoryId: existingProduct.categoryId || existingProduct.category?.categoryId,
            minPrice: existingProduct.minPrice || 0,
            maxPrice: existingProduct.maxPrice || 0,
            supplyPrice: existingProduct.supplyPrice || 0,
            visibility: existingProduct.visibility || 'ALL',
            imageFile: imageFileToSend,
            imageUrl: imageUrlToSend
          });
          
          console.log('상품 정보가 성공적으로 수정되었습니다.');
        } catch (err) {
          console.error('상품 정보 수정 실패:', err);
          alert('상품 정보 수정에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
          return;
        }
      }
      
      // 재고 정보 업데이트 (안전재고, 단가)
      if (branchProductId) {
        await inventoryService.updateInventoryInfo(
          branchProductId,
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
  const handleFlowAdd = async () => {
    try {
      // inventoryData에서 branchProductId가 있는 항목만 필터링
      const productsWithBranchProduct = inventoryData.filter(item => item.branchProductId != null);
      
      // BranchProduct 데이터를 모달에서 사용할 수 있도록 변환
      const formattedBranchProducts = productsWithBranchProduct.map(item => ({
        id: item.branchProductId,
        productName: item.product.name,
        branchId: item.branchId
      }));
      
      setBranchProducts(formattedBranchProducts);
      setIsFlowAddModalOpen(true);
    } catch (err) {
      console.error('상품 목록 조회 실패:', err);
      alert('상품 목록을 불러오는데 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
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

  // 입출고 기록 필터링
  const getBranchNameFromId = (branchId, itemBranchName) => {
    // API 응답에 branchName이 포함되어 있으면 우선 사용
    if (itemBranchName) {
      return itemBranchName;
    }
    
    if (branchId === 1) {
      return '본사';
    }
    
    // branchList에서 지점명 찾기
    const branch = branchList.find(b => b.id === branchId || String(b.id) === String(branchId));
    if (branch && branch.name) {
      return branch.name;
    }
    
    // 찾지 못한 경우 fallback
    return `지점-${branchId}`;
  };

  const filteredFlowData = inventoryFlowData.filter(item => {
    // 상품명 검색
    const matchesSearch = !flowFilters.searchTerm || 
      (item.productName || '').toLowerCase().includes(flowFilters.searchTerm.toLowerCase());
    
    // 날짜 범위 필터
    const matchesStartDate = !flowFilters.startDate || 
      (item.createdAt && new Date(item.createdAt) >= new Date(flowFilters.startDate));
    const matchesEndDate = !flowFilters.endDate || 
      (item.createdAt && new Date(item.createdAt) <= new Date(flowFilters.endDate + 'T23:59:59'));
    
    // 지점 필터
    const branchName = getBranchNameFromId(item.branchId, item.branchName);
    const matchesBranch = !flowFilters.branchFilter || 
      branchName === flowFilters.branchFilter ||
      String(item.branchId) === flowFilters.branchFilter;
    
    // 구분 필터 (입고/출고)
    const matchesType = !flowFilters.typeFilter || 
      (flowFilters.typeFilter === 'in' && (item.inQuantity || 0) > 0 && (item.outQuantity || 0) === 0) ||
      (flowFilters.typeFilter === 'out' && (item.outQuantity || 0) > 0 && (item.inQuantity || 0) === 0);
    
    return matchesSearch && matchesStartDate && matchesEndDate && matchesBranch && matchesType;
  });

  // 입출고 기록 페이징
  const flowTotalPages = Math.ceil(filteredFlowData.length / flowPageSize);
  const flowStartIndex = (flowCurrentPage - 1) * flowPageSize;
  const flowEndIndex = flowStartIndex + flowPageSize;
  const flowPaginatedData = filteredFlowData.slice(flowStartIndex, flowEndIndex);

  const handleFlowFiltersChange = (newFilters) => {
    setFlowFilters(newFilters);
    setFlowCurrentPage(1);
  };

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
          onClick: () => {
            setActiveTab('inventory');
            setSearchParams({ tab: 'inventory' });
          }
        }, '재고현황'),
        React.createElement(Tab, {
          className: activeTab === 'flow' ? 'active' : '',
          onClick: () => {
            setActiveTab('flow');
            setSearchParams({ tab: 'flow' });
          }
        }, '입출고 기록')
      )
    ),
    React.createElement(TabContent, null,
      activeTab === 'inventory' ? React.createElement(React.Fragment, null,
        React.createElement(SummaryCards, { 
          summary,
          userRole: authService.getCurrentUser()?.role
        }),
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
          onDetail: handleDetail,
          onDelete: handleDelete
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
        React.createElement(InventoryFlowFilter, {
          filters: flowFilters,
          onFiltersChange: handleFlowFiltersChange,
          branchList: branchList
        }),
        React.createElement(InventoryFlowTable, {
          data: flowPaginatedData,
          currentPage: flowCurrentPage,
          totalPages: flowTotalPages,
          pageSize: flowPageSize,
          totalCount: filteredFlowData.length,
          branchList: branchList,
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
      branchProducts: branchProducts
    })
  );
}

export default InventoryManagement;
