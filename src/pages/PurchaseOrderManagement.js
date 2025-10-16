import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../components/purchaseOrder/SummaryCards';
import SearchAndFilter from '../components/purchaseOrder/SearchAndFilter';
import PurchaseOrderTable from '../components/purchaseOrder/PurchaseOrderTable';
import PurchaseOrderDetailModal from '../components/purchaseOrder/PurchaseOrderDetailModal';

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
    totalOrders: 24,
    pending: 8,
    completed: 16,
    totalAmount: 250000000
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

  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 'ORD-2025-001',
      branch: '강남점',
      orderDate: '2025.09.18',
      productCount: 15,
      totalAmount: 850000,
      status: 'pending',
      deliveryDate: '2025.09.22'
    },
    {
      id: 'ORD-2025-002',
      branch: '신촌점',
      orderDate: '2025.09.17',
      productCount: 12,
      totalAmount: 630000,
      status: 'cancelled',
      deliveryDate: '2025.09.21'
    },
    {
      id: 'ORD-2025-003',
      branch: '홍대점',
      orderDate: '2025.09.16',
      productCount: 18,
      totalAmount: 1200000,
      status: 'completed',
      deliveryDate: '2025.09.20'
    },
    {
      id: 'ORD-2025-004',
      branch: '강남점',
      orderDate: '2025.09.15',
      productCount: 10,
      totalAmount: 450000,
      status: 'completed',
      deliveryDate: '2025.09.19'
    },
    {
      id: 'ORD-2025-005',
      branch: '신촌점',
      orderDate: '2025.09.14',
      productCount: 20,
      totalAmount: 1100000,
      status: 'pending',
      deliveryDate: '2025.09.23'
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

  // 필터링된 데이터
  const filteredData = purchaseOrders.filter(item => {
    const matchesSearch = !filters.searchTerm || 
      item.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      item.branch.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesBranch = !filters.branchFilter || item.branch === filters.branchFilter;
    const matchesStatus = !filters.statusFilter || item.status === filters.statusFilter;
    
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
