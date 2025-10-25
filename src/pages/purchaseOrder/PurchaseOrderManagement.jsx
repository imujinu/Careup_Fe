import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/purchaseOrder/common/SummaryCards';
import SearchAndFilter from '../../components/purchaseOrder/common/SearchAndFilter';
import PurchaseOrderTable from '../../components/purchaseOrder/common/PurchaseOrderTable';
import PurchaseOrderDetailModal from '../../components/purchaseOrder/common/PurchaseOrderDetailModal';
import { purchaseOrderService } from '../../service/purchaseOrderService';
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

function PurchaseOrderManagement() {
  const [summary, setSummary] = useState({
    totalOrders: 0,
    pending: 0,
    completed: 0,
    totalAmount: 0
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    branchFilter: '',
    statusFilter: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 본사용 발주 목록 조회 (모든 지점)
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 본사는 모든 지점의 발주를 조회해야 하므로 각 지점별로 조회
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 1; // 본사 ID
      
      const data = await purchaseOrderService.getPurchaseOrders(branchId);
      
      // 데이터 변환
      const formattedData = data.map(item => ({
        id: item.purchaseOrderId,
        branch: item.branchName || `지점-${item.branchId}`,
        orderDate: item.orderDate || new Date().toISOString().split('T')[0],
        productCount: item.productCount || 0,
        totalAmount: item.totalAmount || 0,
        status: item.orderStatus || item.status || 'pending',
        orderStatus: item.orderStatus,
        deliveryDate: item.deliveryDate || '-'
      }));
      
      setPurchaseOrders(formattedData);
      
      const totalOrders = formattedData.length;
      const pending = formattedData.filter(item => (item.status || '').toLowerCase() === 'pending').length;
      const completed = formattedData.filter(item => (item.status || '').toLowerCase() === 'completed').length;
      const totalAmount = formattedData.reduce((sum, item) => sum + item.totalAmount, 0);
      
      setSummary({
        totalOrders,
        pending,
        completed,
        totalAmount
      });
    } catch (err) {
      console.error('발주 목록 조회 실패:', err);
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

  // 필터링된 데이터
  const filteredData = purchaseOrders.filter(item => {
    const matchesSearch = !filters.searchTerm || 
      String(item.id).toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      item.branch.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesBranch = !filters.branchFilter || item.branch === filters.branchFilter;
    const matchesStatus = !filters.statusFilter || (item.status || '').toLowerCase() === filters.statusFilter.toLowerCase();
    
    return matchesSearch && matchesBranch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(PageTitle, null, '발주관리'),
      React.createElement(PageSubtitle, null, '본사 - 발주 현황을 확인하고 관리하세요')
    ),
    React.createElement(SummaryCards, { summary }),
    React.createElement(SearchAndFilter, {
      filters,
      onFiltersChange: handleFiltersChange
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
    React.createElement(PurchaseOrderDetailModal, {
      isOpen: isDetailModalOpen,
      onClose: handleCloseDetailModal,
      item: selectedItem
    })
  );
}

export default PurchaseOrderManagement;
