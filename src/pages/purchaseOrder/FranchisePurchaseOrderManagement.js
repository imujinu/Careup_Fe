import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/franchise/purchaseOrder/SummaryCards';
import SearchAndFilter from '../../components/franchise/purchaseOrder/SearchAndFilter';
import PurchaseOrderTable from '../../components/franchise/purchaseOrder/PurchaseOrderTable';
import FranchisePurchaseOrderDetailModal from '../../components/franchise/purchaseOrder/FranchisePurchaseOrderDetailModal';
import OrderRequestModal from '../../components/franchise/purchaseOrder/OrderRequestModal';
import OrderRecommendationModal from '../../components/franchise/purchaseOrder/OrderRecommendationModal';
import OrderAutomationModal from '../../components/franchise/purchaseOrder/OrderAutomationModal';
import { authService } from '../../service/authService';
import { getBranchName } from '../../utils/branchUtils';

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

function FranchisePurchaseOrderManagement() {
  const branchId = authService.getCurrentUser()?.branchId || 2;
  
  const [summary, setSummary] = useState({
    totalOrders: 3,
    pending: 1,
    inProgress: 1,
    completed: 1
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

  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 'ORD-2025-001',
      orderDate: '2025.09.18',
      productCount: 15,
      totalAmount: 150000,
      status: 'pending',
      deliveryDate: '2025.09.22'
    },
    {
      id: 'ORD-2025-002',
      orderDate: '2025.09.17',
      productCount: 12,
      totalAmount: 650000,
      status: 'inProgress',
      deliveryDate: '2025.09.21'
    },
    {
      id: 'ORD-2025-003',
      orderDate: '2025.09.16',
      productCount: 18,
      totalAmount: 1200000,
      status: 'completed',
      deliveryDate: '2025.09.20'
    }
  ]);

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
  };

  const handleOrderRequest = () => {
    setIsOrderRequestModalOpen(true);
  };

  const handleCloseOrderRequestModal = () => {
    setIsOrderRequestModalOpen(false);
  };

  const handleSubmitOrderRequest = (orderItems) => {
    console.log('Order request submitted:', orderItems);
    // 여기에 실제 발주 요청 로직을 구현
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



  // 필터링된 데이터
  const filteredData = purchaseOrders.filter(item => {
    const matchesSearch = !filters.searchTerm || 
      item.id.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesStatus = !filters.statusFilter || item.status === filters.statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(PageTitle, null, `발주관리 - ${getBranchName(branchId)}`),
      React.createElement(PageSubtitle, null, '가맹점 발주 내역 조회 및 발주 요청')
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
      onOrderRequest: handleSubmitOrderRequest
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
