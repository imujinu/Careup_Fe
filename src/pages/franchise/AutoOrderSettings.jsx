import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import Icon from '@mdi/react';
import { mdiMagnify } from '@mdi/js';
import { inventoryService } from '../../service/inventoryService';
import { autoOrderService } from '../../service/autoOrderService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  padding-bottom: 80px; /* 푸터와 겹치지 않도록 하단 여백 추가 */
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

const Card = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #3b82f6;
  }

  &:checked + span:before {
    transform: translateX(26px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const Alert = styled.div`
  background: ${props => props.type === 'success' ? '#f0f9ff' : props.type === 'warning' ? '#fffbeb' : '#fef2f2'};
  border: 1px solid ${props => props.type === 'success' ? '#bfdbfe' : props.type === 'warning' ? '#fed7aa' : '#fecaca'};
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const AlertIcon = styled.span`
  color: ${props => props.type === 'success' ? '#3b82f6' : props.type === 'warning' ? '#f59e0b' : '#ef4444'};
  font-size: 16px;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  color: ${props => props.type === 'success' ? '#1e40af' : props.type === 'warning' ? '#92400e' : '#dc2626'};
  margin-bottom: 4px;
`;

const AlertDescription = styled.div`
  font-size: 14px;
  color: ${props => props.type === 'success' ? '#1e40af' : props.type === 'warning' ? '#92400e' : '#dc2626'};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableHeaderCell = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
`;

const Button = styled.button`
  background: ${props => props.primary ? '#3b82f6' : '#ffffff'};
  color: ${props => props.primary ? '#ffffff' : '#374151'};
  border: 1px solid ${props => props.primary ? '#3b82f6' : '#d1d5db'};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.primary ? '#2563eb' : '#f9fafb'};
    border-color: ${props => props.primary ? '#2563eb' : '#9ca3af'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  background: #ffffff;
  color: #374151;
  width: 100px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Badge = styled.span`
  background: ${props => props.count < 20 ? '#ef4444' : '#10b981'};
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #6b7280;
`;

const SearchFilterContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  color: #9ca3af;
  font-size: 16px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 48px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  outline: none;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const TableContainer = styled.div`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const PageSizeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageSizeLabel = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const PageSizeSelect = styled.select`
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaginationButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  background: ${props => props.active ? '#6b46c1' : '#ffffff'};
  color: ${props => props.active ? '#ffffff' : '#374151'};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: ${props => props.active ? '#553c9a' : '#f3f4f6'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AutoOrderSettings = () => {
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      await fetchInventoryData(); // 먼저 재고 데이터 로드
      await fetchAutoOrderStatus(); // 그 다음 자동발주 설정 로드 및 병합
    };
    loadData();
  }, []);

  // 재고 데이터 조회
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      // 현재 가맹점의 재고 데이터 조회 (branchId는 실제 로그인한 사용자의 지점 ID)
      const branchId = 2; // TODO: 실제 로그인한 사용자의 branchId 사용
      const response = await inventoryService.getBranchProducts(branchId);
      
      // API 응답 구조에 따라 데이터 추출
      const inventoryList = Array.isArray(response) ? response : (response.data || []);
      
      // 각 BranchProduct의 속성 정보 조회 (각 행별로 표시)
      const autoOrderData = await Promise.all(inventoryList.map(async (item) => {
        let attributes = [];
        try {
          // 상품의 속성 정보 조회
          const productAttributes = await inventoryService.getProductAttributeValues(item.productId);
          if (productAttributes && Array.isArray(productAttributes)) {
            // 속성 타입별로 그룹화하여 최대 2개까지만 선택
            const attributeMap = new Map();
            productAttributes.forEach(attr => {
              const typeId = String(attr.attributeTypeId || attr.attributeType?.id || '');
              const typeName = attr.attributeTypeName || attr.attributeType?.name || '';
              const valueId = attr.attributeValueId || attr.attributeValue?.id || attr.id;
              const valueName = attr.displayName || attr.attributeValue?.name || attr.value || '';
              
              if (typeId && typeName && !attributeMap.has(typeId)) {
                attributeMap.set(typeId, {
                  attributeTypeId: typeId,
                  attributeTypeName: typeName,
                  attributeValueId: valueId,
                  attributeValueName: valueName
                });
              }
            });
            
            attributes = Array.from(attributeMap.values()).slice(0, 2);
          }
        } catch (err) {
          // 속성 정보 조회 실패 시 무시
        }
        
        // 속성 표시 문자열 생성
        const attributeDisplay = attributes.length > 0
          ? attributes.map(attr => `${attr.attributeTypeName}: ${attr.attributeValueName}`).join(', ')
          : null;
        
        return {
          id: item.branchProductId || item.productId,
          productId: item.productId,
          branchProductId: item.branchProductId,
          name: item.productName || `상품 ${item.productId}`,
          attributeDisplay: attributeDisplay, // 속성 정보 표시용
          attributes: attributes,
          currentStock: item.stockQuantity || 0,
          safetyStock: item.safetyStock || 0,
          autoOrderEnabled: item.autoOrderEnabled || false
        };
      }));
      
      setInventoryData(autoOrderData);
    } catch (error) {
      console.error('재고 데이터 조회 실패:', error);
      alert('재고 데이터 조회 실패: ' + error.message);
      // 에러 시 더미 데이터로 폴백
      const mockData = [
        { id: 1, name: '아메리카노', currentStock: 10, safetyStock: 50, autoOrderEnabled: true },
        { id: 2, name: '라떼', currentStock: 5, safetyStock: 30, autoOrderEnabled: true },
        { id: 3, name: '카푸치노', currentStock: 8, safetyStock: 25, autoOrderEnabled: false },
        { id: 4, name: '에스프레소', currentStock: 15, safetyStock: 20, autoOrderEnabled: true }
      ];
      setInventoryData(mockData);
    } finally {
      setLoading(false);
    }
  };

  // 자동 발주 상태 조회
  const fetchAutoOrderStatus = async () => {
    try {
      const response = await autoOrderService.getFranchiseAutoOrderSettings();
      
      // 전체 자동 발주 설정
      setAutoOrderEnabled(response.autoOrderEnabled || false);
      
      // 상품별 자동 발주 설정이 있으면 기존 재고 데이터와 병합
      if (response.products && response.products.length > 0) {
        setInventoryData(prev => {
          // branchProductId를 우선으로 매칭, 없으면 productId로 매칭
          const productSettingsMap = new Map(
            response.products.map(p => [
              p.branchProductId ? `bp_${p.branchProductId}` : `p_${p.productId}`, 
              p
            ])
          );
          
          return prev.map(item => {
            // branchProductId 우선 매칭, 없으면 productId로 매칭
            const key = item.branchProductId ? `bp_${item.branchProductId}` : `p_${item.productId}`;
            const productSetting = productSettingsMap.get(key);
            
            // branchProductId가 없으면 productId로도 시도 (하위 호환성)
            const fallbackSetting = !productSetting && !item.branchProductId 
              ? productSettingsMap.get(`p_${item.productId}`)
              : productSetting;
            
            return {
              ...item,
              autoOrderEnabled: fallbackSetting ? fallbackSetting.autoOrderEnabled : false,
              safetyStock: item.safetyStock
            };
          });
        });
      }
    } catch (error) {
      console.error('자동 발주 상태 조회 실패:', error);
      // 에러 시 기본값 설정
      setAutoOrderEnabled(true);
    }
  };

  // 전체 자동 발주 토글
  const handleToggleAutoOrder = async (enabled) => {
    try {
      setAutoOrderEnabled(enabled);
      
      // 전체 시스템을 끄면 모든 상품의 자동 발주도 비활성화
      let updatedInventoryData = inventoryData;
      if (!enabled) {
        updatedInventoryData = inventoryData.map(item => ({ ...item, autoOrderEnabled: false }));
        setInventoryData(updatedInventoryData);
        alert('자동 발주 시스템이 비활성화되었습니다. 모든 상품의 자동 발주가 중단됩니다.');
      } else {
        alert('자동 발주 시스템이 활성화되었습니다. 개별 상품 설정을 확인해주세요.');
      }
      
      // 백엔드에 저장 (업데이트된 데이터 사용)
      const transformedData = {
        autoOrderEnabled: enabled,
        products: updatedInventoryData.map(item => ({
          productId: item.productId || item.id,
          branchProductId: item.branchProductId || null, // 실제 branchProductId 전송
          productName: item.name,
          autoOrderEnabled: item.autoOrderEnabled,
          safetyStock: item.safetyStock,
          currentStock: item.currentStock
        }))
      };
      
      await autoOrderService.updateFranchiseAutoOrderSettings(transformedData);
      
    } catch (error) {
      console.error('자동 발주 설정 변경 실패:', error);
      alert('자동 발주 설정 변경 실패: ' + error.message);
    }
  };

  // 개별 상품 자동 발주 토글
  const handleToggleProductAutoOrder = async (productId, enabled) => {
    try {
      // 전체 시스템이 꺼져있으면 개별 설정 불가
      if (!autoOrderEnabled && enabled) {
        alert('전체 자동 발주 시스템이 비활성화되어 있습니다. 먼저 전체 시스템을 활성화해주세요.');
        return;
      }
      
      // 먼저 state 업데이트
      const updatedInventoryData = inventoryData.map(item => 
        item.id === productId 
          ? { ...item, autoOrderEnabled: enabled }
          : item
      );
      
      setInventoryData(updatedInventoryData);
      
      // 백엔드에 저장 (업데이트된 데이터 사용)
      const transformedData = {
        autoOrderEnabled: autoOrderEnabled,
        products: updatedInventoryData.map(item => ({
          productId: item.productId || item.id,
          branchProductId: item.branchProductId || null, // 실제 branchProductId 전송
          productName: item.name,
          autoOrderEnabled: item.autoOrderEnabled,
          safetyStock: item.safetyStock,
          currentStock: item.currentStock
        }))
      };
      
      await autoOrderService.updateFranchiseAutoOrderSettings(transformedData);
      alert(`상품 자동 발주가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('상품 자동 발주 설정 변경 실패:', error);
      alert('상품 자동 발주 설정 변경 실패: ' + error.message);
    }
  };

  // 모든 상품 자동 발주 활성화
  const handleEnableAllProducts = async () => {
    try {
      if (!autoOrderEnabled) {
        alert('전체 자동 발주 시스템이 비활성화되어 있습니다. 먼저 전체 시스템을 활성화해주세요.');
        return;
      }

      const updatedInventoryData = inventoryData.map(item => ({
        ...item,
        autoOrderEnabled: true
      }));

      setInventoryData(updatedInventoryData);

      const transformedData = {
        autoOrderEnabled: autoOrderEnabled,
        products: updatedInventoryData.map(item => ({
          productId: item.productId || item.id,
          branchProductId: item.branchProductId || null, // 실제 branchProductId 전송
          productName: item.name,
          autoOrderEnabled: true,
          safetyStock: item.safetyStock,
          currentStock: item.currentStock
        }))
      };

      await autoOrderService.updateFranchiseAutoOrderSettings(transformedData);
      alert('모든 상품의 자동 발주가 활성화되었습니다.');
    } catch (error) {
      console.error('모든 상품 자동 발주 활성화 실패:', error);
      alert('모든 상품 자동 발주 활성화 실패: ' + error.message);
      await fetchAutoOrderStatus();
    }
  };

  // 필터링된 데이터
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return inventoryData;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return inventoryData.filter(item => {
      const productName = (item.name || '').toLowerCase();
      return productName.includes(term);
    });
  }, [inventoryData, searchTerm]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };


  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>자동 발주 설정</PageTitle>
        <PageSubtitle>재고가 안전 재고 미만일 때 자동으로 발주가 생성됩니다</PageSubtitle>
      </PageHeader>

      {/* 자동 발주 전체 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>자동 발주 시스템</CardTitle>
          <ToggleSwitch>
            <ToggleInput
              type="checkbox"
              checked={autoOrderEnabled}
              onChange={(e) => handleToggleAutoOrder(e.target.checked)}
            />
            <ToggleSlider />
          </ToggleSwitch>
        </CardHeader>
        
        {autoOrderEnabled ? (
          <Alert type="success">
            <AlertIcon>✅</AlertIcon>
            <AlertContent>
              <AlertTitle>자동 발주 활성화</AlertTitle>
              <AlertDescription>
                재고가 안전 재고 미만일 때 자동으로 발주가 생성됩니다.
              </AlertDescription>
            </AlertContent>
          </Alert>
        ) : (
          <Alert type="warning">
            <AlertIcon>⚠️</AlertIcon>
            <AlertContent>
              <AlertTitle>자동 발주 비활성화</AlertTitle>
              <AlertDescription>
                자동 발주가 비활성화되어 있습니다. 수동으로 발주를 관리해야 합니다.
              </AlertDescription>
            </AlertContent>
          </Alert>
        )}
      </Card>

      {/* 상품별 자동 발주 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>상품별 자동 발주 설정</CardTitle>
          {autoOrderEnabled && inventoryData.length > 0 && (
            <Button
              primary
              onClick={handleEnableAllProducts}
              disabled={loading}
            >
              전체 켜기
            </Button>
          )}
        </CardHeader>
        
        {loading ? (
          <LoadingSpinner>재고 데이터를 불러오는 중...</LoadingSpinner>
        ) : inventoryData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            재고 데이터가 없습니다. 먼저 지점에 상품을 추가해주세요.
          </div>
        ) : (
          <>
            {/* 검색 필터 */}
            <SearchFilterContainer>
              <SearchContainer>
                <SearchIcon>
                  <Icon path={mdiMagnify} size={1} />
                </SearchIcon>
                <SearchInput
                  type="text"
                  placeholder="상품명으로 검색"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </SearchContainer>
            </SearchFilterContainer>

            {/* 테이블 */}
            <TableContainer>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>상품명</TableHeaderCell>
                    <TableHeaderCell>속성</TableHeaderCell>
                    <TableHeaderCell>현재 재고</TableHeaderCell>
                    <TableHeaderCell>안전 재고</TableHeaderCell>
                    <TableHeaderCell>자동 발주</TableHeaderCell>
                    <TableHeaderCell>상태</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        검색 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map(product => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{product.name}</div>
                        </TableCell>
                        <TableCell>
                          {product.attributeDisplay || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge count={product.currentStock}>
                            {product.currentStock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={product.safetyStock}
                            readOnly
                            disabled
                            style={{
                              backgroundColor: '#f9fafb',
                              color: '#6b7280',
                              cursor: 'not-allowed'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <ToggleSwitch>
                            <ToggleInput
                              type="checkbox"
                              checked={product.autoOrderEnabled}
                              disabled={!autoOrderEnabled}
                              onChange={(e) => handleToggleProductAutoOrder(product.id, e.target.checked)}
                            />
                            <ToggleSlider style={{ 
                              opacity: !autoOrderEnabled ? 0.5 : 1,
                              cursor: !autoOrderEnabled ? 'not-allowed' : 'pointer'
                            }} />
                          </ToggleSwitch>
                        </TableCell>
                        <TableCell>
                          {product.currentStock < product.safetyStock ? (
                            <span style={{ color: '#ef4444', fontWeight: '600' }}>발주 필요</span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: '600' }}>충분</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* 페이지네이션 */}
              {filteredData.length > 0 && (
                <PaginationContainer>
                  <PageSizeContainer>
                    <PageSizeLabel>페이지당 표시</PageSizeLabel>
                    <PageSizeSelect
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </PageSizeSelect>
                  </PageSizeContainer>
                  <PaginationControls>
                    <PaginationButton
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </PaginationButton>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <PaginationButton
                        key={pageNum}
                        active={pageNum === currentPage}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </PaginationButton>
                    ))}
                    <PaginationButton
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      &gt;
                    </PaginationButton>
                  </PaginationControls>
                </PaginationContainer>
              )}
            </TableContainer>
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default AutoOrderSettings;
