import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
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

const AutoOrderSettings = () => {
  const [autoOrderEnabled, setAutoOrderEnabled] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);

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
      
      console.log('재고 데이터 API 응답:', response);
      console.log('재고 데이터:', response.data);
      
      // API 응답 구조에 따라 데이터 추출
      const inventoryList = Array.isArray(response) ? response : (response.data || []);
      console.log('재고 목록:', inventoryList);
      
      // 재고 데이터를 자동 발주 설정 형태로 변환
      const autoOrderData = inventoryList.map(item => {
        console.log('재고 아이템:', item);
        return {
          id: item.productId,
          name: item.productName || `상품 ${item.productId}`, // productName이 없을 경우 대체
          currentStock: item.stockQuantity || 0,
          safetyStock: item.safetyStock || 0,
          autoOrderEnabled: item.autoOrderEnabled || false
        };
      });
      
      console.log('변환된 자동 발주 데이터:', autoOrderData);
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
      console.log('자동 발주 설정 API 응답:', response);
      
      // 전체 자동 발주 설정
      setAutoOrderEnabled(response.autoOrderEnabled || false);
      
      // 상품별 자동 발주 설정이 있으면 기존 재고 데이터와 병합
      if (response.products && response.products.length > 0) {
        setInventoryData(prev => {
          const productSettingsMap = new Map(
            response.products.map(p => [p.productId, p])
          );
          
          return prev.map(item => {
            const productSetting = productSettingsMap.get(item.id);
            return {
              ...item,
              autoOrderEnabled: productSetting ? productSetting.autoOrderEnabled : false,
              // 안전재고는 항상 재고 목록의 값 사용 (자동발주 설정에서 변경 불가)
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
          productId: item.id,
          productName: item.name,
          autoOrderEnabled: item.autoOrderEnabled,
          safetyStock: item.safetyStock,
          currentStock: item.currentStock
        }))
      };
      
      await autoOrderService.updateFranchiseAutoOrderSettings(transformedData);
      
      console.log('전체 자동 발주 설정 업데이트 완료:', transformedData);
      
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
          productId: item.id,
          productName: item.name,
          autoOrderEnabled: item.autoOrderEnabled,
          safetyStock: item.safetyStock,
          currentStock: item.currentStock
        }))
      };
      
      await autoOrderService.updateFranchiseAutoOrderSettings(transformedData);
      
      console.log('상품 자동 발주 설정 업데이트 완료:', transformedData);
      alert(`상품 자동 발주가 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
    } catch (error) {
      console.error('상품 자동 발주 설정 변경 실패:', error);
      alert('상품 자동 발주 설정 변경 실패: ' + error.message);
    }
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
        </CardHeader>
        
        {loading ? (
          <LoadingSpinner>재고 데이터를 불러오는 중...</LoadingSpinner>
        ) : inventoryData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            재고 데이터가 없습니다. 먼저 지점에 상품을 추가해주세요.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>상품명</TableHeaderCell>
                <TableHeaderCell>현재 재고</TableHeaderCell>
                <TableHeaderCell>안전 재고</TableHeaderCell>
                <TableHeaderCell>자동 발주</TableHeaderCell>
                <TableHeaderCell>상태</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryData.map(product => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* 자동 발주 히스토리 */}
      <Card>
        <CardHeader>
          <CardTitle>자동 발주 히스토리</CardTitle>
          <Button onClick={() => alert('자동 발주 히스토리 조회 기능은 개발 중입니다')}>
            📋 히스토리 조회
          </Button>
        </CardHeader>
        
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          자동 발주 히스토리가 여기에 표시됩니다.
        </div>
      </Card>
    </PageContainer>
  );
};

export default AutoOrderSettings;
