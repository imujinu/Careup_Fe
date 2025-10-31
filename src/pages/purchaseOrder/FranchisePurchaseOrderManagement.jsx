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
    productName: '',
    startDate: '',
    endDate: '',
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
  const [sort, setSort] = useState(null); // { field, direction }

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
      const formattedData = data.map(item => {
        const orderDate = item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
        const serial = String(item.purchaseOrderId || 0).padStart(6, '0');
        const yyyymmdd = orderDate.replace(/-/g, '');
        const displayOrderNo = `PO-${yyyymmdd}-${serial}`;
        return ({
          id: item.purchaseOrderId,
          displayOrderNo,
          orderDate,
          productCount: item.productCount || 0,
          totalAmount: item.totalPrice || 0,
          status: item.orderStatus || 'PENDING',
          deliveryDate: item.deliveryDate || '-',
          // 검색용 필드(상세 조회 후 채움)
          productNames: ''
        });
      });
      
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

      // 상세 조회로 상품명 보강 (검색용)
      try {
        const detailed = await Promise.all(uniqueData.map(async (po) => {
          try {
            const detail = await purchaseOrderService.getPurchaseOrder(po.id);
            const names = Array.isArray(detail.orderDetails)
              ? detail.orderDetails.map(d => d.productName).filter(Boolean).join(', ')
              : '';
            return { ...po, productNames: names, products: detail.orderDetails };
          } catch (e) {
            return po;
          }
        }));
        setPurchaseOrders(detailed);
      } catch (e) {
        // ignore enrichment errors
      }
      
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

  const handleSort = (field, direction) => {
    setSort({ field, direction });
  };

  // 필터링된 데이터
  const filteredData = React.useMemo(() => {
    let filtered = purchaseOrders.filter(item => {
    // 상품명 필터
    const nameTerm = (filters.productName || '').trim().toLowerCase();
    const matchProductName = nameTerm === '' ||
      (Array.isArray(item.products) && item.products.some(p => String(p.productName || p.name || '').toLowerCase().includes(nameTerm))) ||
      (typeof item.productNames === 'string' && item.productNames.toLowerCase().includes(nameTerm));

    // 날짜 범위 필터
    const matchDate = (() => {
      if (!filters.startDate && !filters.endDate) return true;
      const d = new Date(item.orderDate);
      if (filters.startDate && d < new Date(filters.startDate)) return false;
      if (filters.endDate && d > new Date(filters.endDate)) return false;
      return true;
    })();

    const matchStatus = !filters.statusFilter || item.status === filters.statusFilter;

    return matchProductName && matchDate && matchStatus;
    });

    // 정렬 적용
    if (sort && sort.field) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (sort.field) {
          case 'orderNo':
            // 발주번호를 숫자로 변환하여 정렬 (PO-YYYYMMDD-###### 형식)
            const aOrderNo = String(a.displayOrderNo || a.id || '').split('-').pop() || '';
            const bOrderNo = String(b.displayOrderNo || b.id || '').split('-').pop() || '';
            aValue = parseInt(aOrderNo) || 0;
            bValue = parseInt(bOrderNo) || 0;
            break;
          case 'orderDate':
            aValue = new Date(a.orderDate || 0);
            bValue = new Date(b.orderDate || 0);
            break;
          case 'productCount':
            aValue = a.productCount || 0;
            bValue = b.productCount || 0;
            break;
          case 'totalAmount':
            aValue = a.totalAmount || 0;
            bValue = b.totalAmount || 0;
            break;
          case 'status':
            aValue = a.status || '';
            bValue = b.status || '';
            break;
          case 'deliveryDate':
            aValue = a.deliveryDate ? new Date(a.deliveryDate) : new Date(0);
            bValue = b.deliveryDate ? new Date(b.deliveryDate) : new Date(0);
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
  }, [purchaseOrders, filters, sort]);

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
      onDetail: handleDetail,
      onSort: handleSort,
      currentSort: sort
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
