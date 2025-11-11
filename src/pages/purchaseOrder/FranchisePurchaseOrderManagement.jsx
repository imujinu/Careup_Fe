import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SummaryCards from '../../components/purchaseOrder/franchise/SummaryCards';
import SearchAndFilter from '../../components/purchaseOrder/franchise/SearchAndFilter';
import PurchaseOrderTable from '../../components/purchaseOrder/franchise/PurchaseOrderTable';
import FranchisePurchaseOrderDetailModal from '../../components/purchaseOrder/franchise/FranchisePurchaseOrderDetailModal';
import OrderRequestModal from '../../components/purchaseOrder/franchise/OrderRequestModal';
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

const SORT_FIELD_MAP = {
  orderNo: 'purchaseOrderId',
  orderDate: 'createdAt',
  productCount: 'productCount',
  totalAmount: 'totalPrice',
  status: 'orderStatus',
  deliveryDate: 'updatedAt'
};

function FranchisePurchaseOrderManagement() {
  const currentUser = authService.getCurrentUser();
  const branchId = currentUser?.branchId || 2;
  const branchName = currentUser?.branchName || getBranchName(branchId); // 실제 지점 이름 사용
  
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
  const [selectedItem, setSelectedItem] = useState(null);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productStatistics, setProductStatistics] = useState([]);
  const [sort, setSort] = useState({ field: 'orderDate', direction: 'desc' }); // { field, direction }
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const buildSortParam = React.useCallback((sortOption) => {
    if (!sortOption || !sortOption.field) {
      return 'createdAt,DESC';
    }
    const backendField = SORT_FIELD_MAP[sortOption.field] || SORT_FIELD_MAP.orderDate;
    const direction = (sortOption.direction || 'desc').toUpperCase();
    return `${backendField},${direction}`;
  }, []);

  // 가맹점용 발주 목록 조회
  const fetchPurchaseOrders = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const sortParam = buildSortParam(sort);
      const pageRequest = Math.max(currentPage - 1, 0);

      const [pageData, productStats, franchiseStats] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(branchId, {
          page: pageRequest,
          size: pageSize,
          sort: sortParam
        }),
        purchaseOrderService.getFranchiseProductStatistics(branchId).catch(() => []),
        purchaseOrderService.getFranchiseStatistics(branchId).catch(() => null)
      ]);

      const content = Array.isArray(pageData?.content) ? pageData.content : [];
      const totalElementsValue = pageData?.totalElements ?? content.length;

      setTotalPages(pageData?.totalPages ? Math.max(pageData.totalPages, 1) : 1);
      setTotalElements(totalElementsValue);

      if (typeof pageData?.number === 'number') {
        const serverPage = pageData.number + 1;
        if (serverPage !== currentPage) {
          setCurrentPage(serverPage);
        }
      }

      const formattedData = content.map(item => {
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
          // 상태가 COMPLETED이면 updatedAt 사용 (입고완료 시점), 아니면 기본값 '-'
          deliveryDate: (item.orderStatus === 'COMPLETED' && item.updatedAt) 
            ? item.updatedAt.split('T')[0] 
            : '-', // 입고완료일(배송일자)
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
            // 상세 조회에서 배송일자(입고완료일) 업데이트
            const orderStatus = detail.orderStatus || po.status;
            let completedDate = '-';
            
            // 상태가 COMPLETED인 경우 updatedAt 사용 (입고완료 시점)
            if (orderStatus === 'COMPLETED' && detail.updatedAt) {
              completedDate = detail.updatedAt.split('T')[0];
            } else if (po.deliveryDate && po.deliveryDate !== '-') {
              // 기존 deliveryDate 유지
              completedDate = po.deliveryDate;
            }
            
            return { ...po, productNames: names, products: detail.orderDetails, deliveryDate: completedDate, status: orderStatus };
          } catch (e) {
            return po;
          }
        }));
        setPurchaseOrders(detailed);
      } catch (e) {
        // ignore enrichment errors
      }
      
      const totalOrders = franchiseStats?.totalOrders ?? totalElementsValue ?? uniqueData.length;
      const pending = franchiseStats?.pendingOrders ?? uniqueData.filter(item => item.status === 'PENDING').length;
      const approvedOrders = franchiseStats?.approvedOrders ?? uniqueData.filter(item => item.status === 'APPROVED').length;
      const inProgress = uniqueData.filter(item => item.status === 'APPROVED' || item.status === 'PARTIAL' || item.status === 'SHIPPED').length;
      const completed = uniqueData.filter(item => item.status === 'COMPLETED').length;

      setSummary({
        totalOrders,
        pending,
        inProgress: franchiseStats ? (franchiseStats.approvedOrders ?? inProgress) : inProgress,
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
  }, [branchId, buildSortParam, currentPage, pageSize, sort]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    if (size === pageSize) {
      return;
    }
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

  // 엑셀 다운로드
  const handleExportExcel = async () => {
    try {
      await purchaseOrderService.exportToExcel(branchId);
      alert('발주 내역 엑셀 다운로드가 완료되었습니다.');
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const handleSort = (field, direction) => {
    setSort({ field, direction });
    setCurrentPage(1);
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

    // 상태 필터 매칭 (소문자 필터를 대문자 상태와 비교)
    const matchStatus = !filters.statusFilter || (() => {
      const filterStatus = filters.statusFilter.toLowerCase();
      const itemStatus = (item.status || '').toUpperCase();
      
      switch(filterStatus) {
        case 'pending':
          return itemStatus === 'PENDING';
        case 'inprogress':
          // 처리 중 = 승인됨, 부분승인, 배송중
          return itemStatus === 'APPROVED' || itemStatus === 'PARTIAL' || itemStatus === 'SHIPPED';
        case 'completed':
          return itemStatus === 'COMPLETED';
        case 'rejected':
          return itemStatus === 'REJECTED';
        case 'cancelled':
          return itemStatus === 'CANCELLED';
        default:
          return false;
      }
    })();

    return matchProductName && matchDate && matchStatus;
    });

    return filtered;
  }, [purchaseOrders, filters]);
  const effectiveTotalPages = Math.max(1, totalPages);

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(HeaderLeft, null,
        React.createElement(PageTitle, null, `발주관리 - ${branchName}`),
        React.createElement(PageSubtitle, null, '가맹점 발주 내역 조회 및 발주 요청')
      ),
      React.createElement(HeaderRight, null,
        React.createElement(ExportButton, { onClick: handleExportExcel },
          React.createElement('span', null, '📥'),
          '엑셀 다운로드'
        )
      )
    ),
    React.createElement(SummaryCards, { summary }),
    productStatistics.length > 0 && React.createElement(ChartCard, null,
      React.createElement(ChartTitle, null, '상품별 발주량 TOP 10'),
      React.createElement(ResponsiveContainer, { width: "100%", height: 300 },
        React.createElement(BarChart, { data: productStatistics
          .sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0)) // 수량 기준 내림차순 정렬
          .slice(0, 10) // 상위 10개만 표시
          .map(stat => ({
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
      onOrderRequest: handleOrderRequest
    }),
    React.createElement(PurchaseOrderTable, {
      data: filteredData,
      currentPage,
      totalPages: effectiveTotalPages,
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
      item: selectedItem,
      onOrderUpdated: fetchPurchaseOrders
    }),
    React.createElement(OrderRequestModal, {
      isOpen: isOrderRequestModalOpen,
      onClose: handleCloseOrderRequestModal,
      onSubmitOrderRequest: handleSubmitOrderRequest
    })
  );
}

export default FranchisePurchaseOrderManagement;
