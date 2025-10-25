import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/purchaseOrder/franchise/SummaryCards';
import SearchAndFilter from '../../components/purchaseOrder/franchise/SearchAndFilter';
import PurchaseOrderTable from '../../components/purchaseOrder/franchise/PurchaseOrderTable';
import FranchisePurchaseOrderDetailModal from '../../components/purchaseOrder/franchise/FranchisePurchaseOrderDetailModal';
import OrderRequestModal from '../../components/purchaseOrder/franchise/OrderRequestModal';
import OrderRecommendationModal from '../../components/purchaseOrder/franchise/OrderRecommendationModal';
import OrderAutomationModal from '../../components/purchaseOrder/franchise/OrderAutomationModal';
import { purchaseOrderService } from '../../service/purchaseOrderService';
import { authService } from '../../service/authService';
import { getBranchName } from '../../utils/branchUtils';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
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

const ExportButton = styled.button`
  height: 40px;
  padding: 0 16px;
  background: #6b46c1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  
  &:hover {
    background: #553c9a;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function FranchisePurchaseOrderManagement() {
  const branchId = authService.getCurrentUser()?.branchId || 2;
  
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    statusFilter: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isOrderRequestModalOpen, setIsOrderRequestModalOpen] = useState(false);
  const [isOrderRecommendationModalOpen, setIsOrderRecommendationModalOpen] = useState(false);
  const [isOrderAutomationModalOpen, setIsOrderAutomationModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 가맹점용 발주 목록 조회
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await purchaseOrderService.getPurchaseOrders(branchId);
      console.log('가맹점 발주 목록 API 응답:', data);
      
      // 데이터 변환
      const formattedData = data.map(item => ({
        id: item.purchaseOrderId,
        orderDate: item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        productCount: item.productCount || 0,
        totalAmount: item.totalPrice || 0,
        status: item.orderStatus || 'pending',
        deliveryDate: '-'
      }));
      
      // ID별로 고유하게 유지 (중복 제거 로직 제거)
      const uniqueData = formattedData;
      
      setPurchaseOrders(uniqueData);
      
      const totalOrders = uniqueData.length;
      const pending = uniqueData.filter(item => (item.status || '').toLowerCase() === 'pending').length;
      const inProgress = uniqueData.filter(item => {
        const status = (item.status || '').toLowerCase();
        return status === 'approved' || status === 'shipped' || status === 'partial';
      }).length;
      const completed = uniqueData.filter(item => (item.status || '').toLowerCase() === 'completed').length;
      
      setSummary({
        totalOrders,
        pending,
        inProgress,
        completed
      });
    } catch (err) {
      console.error('가맹점 발주 목록 조회 실패:', err);
      setError('발주 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
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

  const handleDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
    // 모달 닫힐 때 목록 새로고침
    fetchPurchaseOrders();
  };

  const handleOrderRequest = () => {
    setIsOrderRequestModalOpen(true);
  };

  const handleCloseOrderRequestModal = () => {
    setIsOrderRequestModalOpen(false);
  };

  const handleSubmitOrderRequest = (orderItems) => {
    console.log('Order request submitted:', orderItems);
    // 발주 생성 후 목록 새로고침
    fetchPurchaseOrders();
    handleCloseOrderRequestModal();
  };

  const handleOrderRecommendation = () => {
    setIsOrderRecommendationModalOpen(true);
  };

  const handleCloseOrderRecommendationModal = () => {
    setIsOrderRecommendationModalOpen(false);
  };

  const handleApplyRecommendation = (recommendedItems) => {
    console.log('추천 발주 적용:', recommendedItems);
    // TODO: 추천 발주를 실제 발주로 변환하는 로직 구현
  };

  const handleOrderAutomation = () => {
    setIsOrderAutomationModalOpen(true);
  };

  const handleCloseOrderAutomationModal = () => {
    setIsOrderAutomationModalOpen(false);
  };

  const handleSaveAutomationSettings = (settings) => {
    console.log('자동화 설정 저장:', settings);
    // TODO: 자동화 설정 저장 로직 구현
  };

  // 전체 엑셀 다운로드
  const handleExportAll = async () => {
    try {
      await purchaseOrderService.exportToExcel(branchId);
      alert('전체 발주 내역 엑셀 다운로드가 완료되었습니다.');
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  // 필터링된 데이터
  const filteredData = purchaseOrders.filter(item => {
    const matchesSearch = !filters.searchTerm || 
      String(item.id).toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesStatus = !filters.statusFilter || (item.status || '').toLowerCase() === filters.statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(HeaderLeft, null,
        React.createElement(PageTitle, null, `발주관리 - ${getBranchName(branchId)}`),
        React.createElement(PageSubtitle, null, '가맹점 발주 내역 조회 및 발주 요청')
      ),
      React.createElement(HeaderRight, null,
        React.createElement(ExportButton, { onClick: handleExportAll },
          React.createElement('span', null, '📥'),
          '전체 엑셀 다운로드'
        )
      )
    ),
    React.createElement(SummaryCards, { summary }),
    React.createElement(SearchAndFilter, {
      filters,
      onFiltersChange: handleFiltersChange,
      onOrderRequest: handleOrderRequest,
      onOrderRecommendation: handleOrderRecommendation,
      onOrderAutomation: handleOrderAutomation
    }),
    React.createElement(PurchaseOrderTable, {
      data: paginatedData,
      currentPage,
      totalPages,
      pageSize,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange,
      onDetail: handleDetail
    }),
    React.createElement(FranchisePurchaseOrderDetailModal, {
      isOpen: isDetailModalOpen,
      onClose: handleCloseDetailModal,
      item: selectedItem
    }),
    React.createElement(OrderRequestModal, {
      isOpen: isOrderRequestModalOpen,
      onClose: handleCloseOrderRequestModal,
      onSubmitOrderRequest: handleSubmitOrderRequest
    }),
    React.createElement(OrderRecommendationModal, {
      isOpen: isOrderRecommendationModalOpen,
      onClose: handleCloseOrderRecommendationModal,
      onApplyRecommendation: handleApplyRecommendation
    }),
    React.createElement(OrderAutomationModal, {
      isOpen: isOrderAutomationModalOpen,
      onClose: handleCloseOrderAutomationModal,
      onSaveSettings: handleSaveAutomationSettings
    })
  );
}

export default FranchisePurchaseOrderManagement;
