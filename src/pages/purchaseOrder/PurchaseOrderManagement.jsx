import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SummaryCards from '../../components/purchaseOrder/common/SummaryCards';
import StatisticsChart from '../../components/purchaseOrder/common/StatisticsChart';
import SearchAndFilter from '../../components/purchaseOrder/common/SearchAndFilter';
import PurchaseOrderTable from '../../components/purchaseOrder/common/PurchaseOrderTable';
import PurchaseOrderDetailModal from '../../components/purchaseOrder/common/PurchaseOrderDetailModal';
import { purchaseOrderService } from '../../service/purchaseOrderService';
import { authService } from '../../service/authService';

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
  const [statusStatistics, setStatusStatistics] = useState([]);
  const [branchStatistics, setBranchStatistics] = useState([]);
  const [productStatistics, setProductStatistics] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [sort, setSort] = useState(null); // { field, direction }

  // 상태 한글 변환 함수
  const getStatusText = (status) => {
    if (!status) return status;
    const upperStatus = status.toUpperCase();
    switch(upperStatus) {
      case 'PENDING': return '대기중';
      case 'APPROVED': return '승인됨';
      case 'REJECTED': return '반려됨';
      case 'PARTIAL': return '부분승인';
      case 'SHIPPED': return '배송중';
      case 'COMPLETED': return '완료';
      case 'CANCELLED': return '취소됨';
      default: return status;
    }
  };

  // 본사용 발주 목록 조회 (모든 지점)
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 본사는 모든 지점의 발주를 조회해야 하므로 각 지점별로 조회
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 1; // 본사 ID
      
      const [data, statistics, statusStats, branchStats, productStats, branches] = await Promise.all([
        purchaseOrderService.getPurchaseOrders(branchId),
        purchaseOrderService.getHQOverallStatistics(),
        purchaseOrderService.getHQStatusStatistics().catch((err) => {
          console.error('상태 통계 API 호출 실패:', err);
          return [];
        }),
        purchaseOrderService.getHQBranchStatistics().catch((err) => {
          console.error('지점 통계 API 호출 실패:', err);
          return [];
        }),
        purchaseOrderService.getHQProductStatistics().catch((err) => {
          console.error('상품 통계 API 호출 실패:', err);
          return [];
        }),
        purchaseOrderService.getBranchList().catch((err) => {
          console.error('지점 목록 API 호출 실패:', err);
          console.error('에러 상세:', err.response?.data || err.message);
          return null;
        })
      ]);
      
      // 데이터 변환
      const formattedData = data.map(item => {
        const orderDate = item.createdAt ? item.createdAt.split('T')[0] : (item.orderDate || new Date().toISOString().split('T')[0]);
        const serial = String(item.purchaseOrderId || 0).padStart(6, '0');
        const yyyymmdd = orderDate.replace(/-/g, '');
        const displayOrderNo = `PO-${yyyymmdd}-${serial}`;
        return {
          id: item.purchaseOrderId,
          displayOrderNo,
          branch: item.branchName || `지점-${item.branchId}`,
          orderDate,
          productCount: item.productCount || 0,
          totalAmount: item.totalPrice || 0,  // 백엔드에서 totalPrice 필드로 반환됨
          status: item.orderStatus || item.status || 'pending',
          orderStatus: item.orderStatus,
          // 상태가 COMPLETED이면 updatedAt 사용 (입고완료 시점), 아니면 기본값 '-'
          deliveryDate: (item.orderStatus === 'COMPLETED' && item.updatedAt)
            ? item.updatedAt.split('T')[0]
            : '-' // 입고완료일(배송일자)
        };
      });
      
      setPurchaseOrders(formattedData);
      
      // 지점 목록 설정
      console.log('지점 목록 API 응답:', branches);
      
      // API 응답이 배열이 아닌 경우 처리 (예: { data: [...] } 형태)
      let branchArray = null;
      if (branches === null || branches === undefined) {
        // API 실패 시 null 반환됨
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
        // 응답 데이터 형태 정규화 (id와 name 필드 확인)
        const normalizedBranches = branchArray.map(branch => {
          if (typeof branch === 'string') {
            return { id: branch, name: branch };
          }
          return {
            id: branch.id || branch.branchId || branch.name,
            name: branch.name || branch.branchName || String(branch.id || branch.branchId)
          };
        });
        setBranchList(normalizedBranches);
        console.log('지점 목록 설정 완료:', normalizedBranches.length, '개', normalizedBranches);
      } else {
        console.warn('지점 목록 API가 실패했거나 데이터가 비어있습니다. 발주 목록에서 지점 추출을 시도합니다.');
        // API가 실패했을 경우, 실제 발주 목록에서 고유한 지점명 추출
        const uniqueBranches = {};
        formattedData.forEach(item => {
          if (item.branch && !uniqueBranches[item.branch]) {
            uniqueBranches[item.branch] = {
              id: item.branch,
              name: item.branch
            };
          }
        });
        
        const extractedBranches = Object.values(uniqueBranches);
        if (extractedBranches.length > 0) {
          setBranchList(extractedBranches);
          console.log('발주 목록에서 지점 추출 완료:', extractedBranches.length, '개', extractedBranches);
        } else {
          console.warn('발주 목록에서도 지점을 찾을 수 없습니다. 기본값을 사용합니다.');
          // 최후의 수단: 기본 지점 데이터
          const fallbackBranches = [
            { id: 1, name: '본점' }
          ];
          setBranchList(fallbackBranches);
        }
      }
      
      // 차트 데이터 설정
      if (statusStats && statusStats.length > 0) {
        const statusChartData = statusStats.map(stat => ({
          status: getStatusText(stat.status),
          count: stat.count
        }));
        setStatusStatistics(statusChartData);
      }

      if (branchStats && branchStats.length > 0) {
        const branchChartData = branchStats.map(stat => ({
          branchName: stat.branchName || `지점-${stat.branchId}`,
          orderCount: stat.orderCount || 0,
          totalAmount: (stat.totalAmount || 0) / 10000  // 만원 단위
        }));
        setBranchStatistics(branchChartData);
      }

      if (productStats && productStats.length > 0) {
        const productChartData = productStats.map(stat => ({
          productName: stat.productName,
          totalQuantity: stat.totalQuantity || 0,
          totalAmount: (stat.totalAmount || 0) / 10000  // 만원 단위
        }));
        setProductStatistics(productChartData);
      }
      
      if (statistics) {
        setSummary({
          totalOrders: statistics.totalOrderCount || 0,
          pending: statistics.pendingCount || 0,
          completed: statistics.totalOrderCount - statistics.pendingCount || 0,  // 완료는 전체 - 대기
          totalAmount: statistics.totalOrderAmount || 0
        });
      } else {
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
      }
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

  // 전체 엑셀 다운로드
  const handleExportAll = async () => {
    try {
      const userInfo = authService.getCurrentUser();
      const branchId = userInfo?.branchId || 1; // 본사 ID
      
      await purchaseOrderService.exportToExcel(branchId);
      alert('전체 발주 내역 엑셀 다운로드가 완료되었습니다.');
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const handleSort = (field, direction) => {
    setSort({ field, direction });
  };

  // 필터링된 데이터
  const filteredData = React.useMemo(() => {
    let filtered = purchaseOrders.filter(item => {
    const matchesSearch = !filters.searchTerm || 
      String(item.id).toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (item.displayOrderNo && item.displayOrderNo.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
      item.branch.toLowerCase().includes(filters.searchTerm.toLowerCase());
    
    const matchesBranch = !filters.branchFilter || item.branch === filters.branchFilter;
    const matchesStatus = !filters.statusFilter || 
      (item.status || item.orderStatus || '').toUpperCase() === filters.statusFilter.toUpperCase();
    
    return matchesSearch && matchesBranch && matchesStatus;
    });

    // 정렬 적용
    if (sort && sort.field) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (sort.field) {
          case 'orderNo':
            // 발주번호를 숫자로 변환하여 정렬
            aValue = parseInt(String(a.id || '')) || 0;
            bValue = parseInt(String(b.id || '')) || 0;
            break;
          case 'branch':
            aValue = a.branch || '';
            bValue = b.branch || '';
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
            aValue = a.status || a.orderStatus || '';
            bValue = b.status || b.orderStatus || '';
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
        React.createElement(PageTitle, null, '발주관리'),
        React.createElement(PageSubtitle, null, '본사 - 발주 현황을 확인하고 관리하세요')
      ),
      React.createElement(HeaderRight, null,
        React.createElement(ExportButton, { onClick: handleExportAll },
          React.createElement('span', null, '📥'),
          '전체 엑셀 다운로드'
        )
      )
    ),
    React.createElement(SummaryCards, { summary }),
    React.createElement(StatisticsChart, {
      statusData: statusStatistics,
      branchData: branchStatistics,
      productData: productStatistics
    }),
    React.createElement(SearchAndFilter, {
      filters,
      onFiltersChange: handleFiltersChange,
      branchList
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
    React.createElement(PurchaseOrderDetailModal, {
      isOpen: isDetailModalOpen,
      onClose: handleCloseDetailModal,
      item: selectedItem
    })
  );
}

export default PurchaseOrderManagement;
