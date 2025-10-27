import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  padding-bottom: 80px;
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

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
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
  const [productStatistics, setProductStatistics] = useState([]);

  // 가맹점용 발주 목록 조회
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [data, productStats] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(branchId),
        purchaseOrderService.getFranchiseProductStatistics(branchId).catch(() => [])
      ]);
      console.log('가맹점 발주 목록 API 응답:', data);
      
      // 데이터 변환 (백엔드 API 응답 필드명에 맞게 수정)
      const formattedData = data.map(item => ({
        id: item.purchaseOrderId,
        orderDate: item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        productCount: item.productCount || 0,
        totalAmount: item.totalPrice || 0, // totalPrice로 수정
        status: item.orderStatus || 'PENDING', // orderStatus로 수정
        deliveryDate: item.deliveryDate || '-'
      }));
      
      // ID 기반 중복 데이터 제거 (더 안전한 방식)
      const uniqueData = formattedData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // 같은 ID면 최신 데이터로 업데이트
          acc[existingIndex] = current;
        }
        return acc;
      }, []);
      
      setPurchaseOrders(uniqueData);
      
      const totalOrders = uniqueData.length;
      const pending = uniqueData.filter(item => item.status === 'PENDING').length;
      const inProgress = uniqueData.filter(item => item.status === 'APPROVED' || item.status === 'PARTIAL' || item.status === 'SHIPPED').length;
      const completed = uniqueData.filter(item => item.status === 'COMPLETED').length;
      
      setSummary({
        totalOrders,
        pending,
        inProgress,
        completed
      });
      
      if (productStats && productStats.length > 0) {
        setProductStatistics(productStats);
      }
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
      React.createElement(HeaderLeft, null,
        React.createElement(PageTitle, null, `발주관리 - ${getBranchName(branchId)}`),
        React.createElement(PageSubtitle, null, '가맹점 발주 내역 조회 및 발주 요청')
      ),
      React.createElement(HeaderRight, null,
        React.createElement(ExportButton, null, '내보내기'),
        React.createElement(ExportButton, null, '엑셀 다운로드')
      )
    ),
    React.createElement(SummaryCards, { summary }),
    productStatistics.length > 0 && React.createElement(ChartCard, null,
      React.createElement(ChartTitle, null, '상품별 발주량 TOP 10'),
      React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
        React.createElement(BarChart, { data: productStatistics.map(stat => ({
          productName: stat.productName,
          totalQuantity: stat.totalQuantity,
          approvedQuantity: stat.approvedQuantity
        })) },
          React.createElement(CartesianGrid, { strokeDasharray: "3 3" }),
          React.createElement(XAxis, { dataKey: "productName", angle: -45, textAnchor: "end", height: 100 } ),
          React.createElement(YAxis),
          React.createElement(Tooltip),
          React.createElement(Legend),
          React.createElement(Bar, { dataKey: "totalQuantity", fill: "#6b46c1", name: "총 발주량" }),
          React.createElement(Bar, { dataKey: "approvedQuantity", fill: "#10b981", name: "승인 수량" })
        )
      )
    ),
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
