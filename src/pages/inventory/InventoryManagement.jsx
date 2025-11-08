import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import SummaryCards from '../../components/inventory/common/SummaryCards';
import SearchAndFilter from '../../components/inventory/common/SearchAndFilter';
import InventoryTable from '../../components/inventory/common/InventoryTable';
import EditInventoryModal from '../../components/inventory/common/EditInventoryModal';
import InventoryDetailModal from '../../components/inventory/common/InventoryDetailModal';
import AddInventoryModal from '../../components/inventory/common/AddInventoryModal';
import InventoryFlowTable from '../../components/inventory/headquarters/InventoryFlowTable';
import EditInventoryFlowModal from '../../components/inventory/headquarters/EditInventoryFlowModal';
import AddInventoryFlowModal from '../../components/inventory/headquarters/AddInventoryFlowModal';
import InventoryFlowFilter from '../../components/inventory/headquarters/InventoryFlowFilter';
import { inventoryService } from '../../service/inventoryService';
import { authService } from '../../service/authService';
import { purchaseOrderService } from '../../service/purchaseOrderService';
import { branchService } from '../../service/branchService';

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 80px;
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

const TabContainer = styled.div`
  margin-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const TabList = styled.div`
  display: flex;
  gap: 0;
`;

const Tab = styled.button`
  padding: 12px 24px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    color: #374151;
  }
  
  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }
`;

const TabContent = styled.div`
  margin-top: 24px;
`;

function InventoryManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL 쿼리 파라미터에서 탭 상태 읽기 (기본값: 'inventory')
  const activeTabFromUrl = searchParams.get('tab') || 'inventory';
  const [activeTab, setActiveTab] = useState(activeTabFromUrl);

  const [summary, setSummary] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalBranches: 0,
    totalValue: 0
  });

  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    searchTerm: '',
    categoryFilter: '',
    branchFilter: '본점', // 기본값: 본점
    statusFilter: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 입출고 기록 관련 상태
  const [inventoryFlowData, setInventoryFlowData] = useState([]);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowCurrentPage, setFlowCurrentPage] = useState(1);
  const [flowPageSize, setFlowPageSize] = useState(10);
  const [isFlowEditModalOpen, setIsFlowEditModalOpen] = useState(false);
  const [isFlowAddModalOpen, setIsFlowAddModalOpen] = useState(false);
  const [selectedFlowItem, setSelectedFlowItem] = useState(null);
  const [branchProducts, setBranchProducts] = useState([]);
  const [flowSort, setFlowSort] = useState(null); // { field, direction }
  const [flowFilters, setFlowFilters] = useState({
    searchTerm: '',
    startDate: '',
    endDate: '',
    branchFilter: '본점', // 기본값: 본점
    typeFilter: ''
  });
  const [branchList, setBranchList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [inventorySort, setInventorySort] = useState(null); // { field, direction }

  // 본사: 전체 지점 재고 조회
  const fetchInventoryData = async (branchId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const userInfo = authService.getCurrentUser();
      
      // 지점 목록 가져오기
      let branches = [];
      try {
        const branchResponse = await branchService.fetchBranches({ page: 0, size: 100 });
        if (branchResponse?.data && Array.isArray(branchResponse.data)) {
          branches = branchResponse.data;
        } else if (branchResponse?.content && Array.isArray(branchResponse.content)) {
          branches = branchResponse.content;
        } else if (Array.isArray(branchResponse)) {
          branches = branchResponse;
        } else if (branchResponse?.result?.data && Array.isArray(branchResponse.result.data)) {
          branches = branchResponse.result.data;
        }
      } catch (err) {
        try {
          branches = await purchaseOrderService.getBranchList();
        } catch (e) {
          branches = [{ id: 1, name: '본점' }];
        }
      }
      
      // 지점 데이터 정규화 및 branchId 추출
      const normalizedBranches = branches.map(branch => {
        let branchName = branch.name || branch.branchName || String(branch.id || branch.branchId);
        // 본사가 들어오면 본점으로 변경
        if (branchName === '본사' || branchName.includes('본사')) {
          branchName = '본점';
        }
        // branchId가 1이면 본점으로 설정
        const branchId = branch.id || branch.branchId;
        if (branchId === 1 || String(branchId) === '1') {
          branchName = '본점';
        }
        return {
          id: branch.id || branch.branchId || branch.name,
          name: branchName
        };
      });
      
      const branchIds = normalizedBranches.map(b => b.id).filter(id => id != null);
      
      // 모든 지점의 재고를 병렬로 조회
      const allBranchProductsPromises = branchIds.map(async (bid) => {
        try {
          const products = await inventoryService.getBranchProducts(bid);
          
          // API 응답의 실제 branchId를 사용하고, 요청한 bid와 일치하는지 검증
          return products
            .filter(item => {
              // 응답에 branchId가 있으면 그것을 사용하고, 없으면 요청한 bid 사용
              const itemBranchId = item.branchId || bid;
              
              // 응답의 branchId가 요청한 bid와 일치하는지 확인 (데이터 무결성 검증)
              const itemBranchIdNum = typeof itemBranchId === 'string' ? Number(itemBranchId) : itemBranchId;
              const bidNum = typeof bid === 'string' ? Number(bid) : bid;
              
              // branchId가 일치하는 항목만 반환 (본점에만 등록된 상품이 다른 지점에 표시되는 것을 방지)
              return itemBranchIdNum === bidNum;
            })
            .map(item => {
              // 응답의 실제 branchId를 우선 사용하고, 없으면 요청한 bid 사용
              const actualBranchId = item.branchId || bid;
              const branchName = normalizedBranches.find(b => b.id === actualBranchId)?.name || 
                                (actualBranchId === 1 ? '본점' : `지점-${actualBranchId}`);
              
              return {
                ...item,
                branchId: actualBranchId,  // API 응답의 실제 branchId 사용
                branchName: branchName
              };
            });
        } catch (err) {
          return [];
        }
      });
      
      const allBranchProductsResults = await Promise.all(allBranchProductsPromises);
      const allBranchProducts = allBranchProductsResults.flat();
      
      // 전체 상품 목록 가져오기 (재고가 없는 상품도 표시하기 위해)
      let allProducts = [];
      try {
        const productsResponse = await inventoryService.getAllProducts();
        const pageData = productsResponse.data?.data || productsResponse.data;
        allProducts = pageData?.content || [];
      } catch (err) {
      }
      
      // 상품 ID로 상품 정보를 빠르게 찾기 위한 Map 생성
      const productMap = new Map();
      allProducts.forEach(product => {
        productMap.set(product.productId, product);
      });
      
      // 상품별 속성 정보를 가져오기 위한 Map (캐싱)
      const productAttributesMap = new Map();
      // 카테고리별 속성 정보를 가져오기 위한 Map (캐싱)
      const categoryAttributesMap = new Map();
      
      // 먼저 모든 고유한 상품 ID 수집
      const uniqueProductIds = [...new Set(allBranchProducts.map(bp => bp.productId).filter(Boolean))];
      
      // 모든 상품의 카테고리 ID 수집
      const uniqueCategoryIds = [...new Set(
        Array.from(productMap.values())
          .map(p => p.categoryId || p.category?.id || p.category?.categoryId)
          .filter(Boolean)
      )];
      
      // 카테고리별 속성 정보를 먼저 가져오기 (캐싱)
      for (const categoryId of uniqueCategoryIds) {
        if (!categoryAttributesMap.has(categoryId)) {
          try {
            const categoryAttributes = await inventoryService.getCategoryAttributes(categoryId);
            if (Array.isArray(categoryAttributes)) {
              // attributeTypeId를 키로 하는 Map 생성
              const categoryAttrMap = new Map();
              categoryAttributes.forEach(ca => {
                const typeId = String(ca.attributeTypeId || ca.attributeType?.id || ca.id || '');
                if (typeId) {
                  categoryAttrMap.set(typeId, {
                    displayOrder: ca.displayOrder || 0,
                    attributeTypeName: ca.attributeTypeName || ca.attributeType?.name
                  });
                }
              });
              categoryAttributesMap.set(categoryId, categoryAttrMap);
            }
          } catch (err) {
            categoryAttributesMap.set(categoryId, new Map());
          }
        }
      }
      
      // 모든 상품의 속성 정보를 배치로 가져오기 (동시 요청 수 제한)
      const batchSize = 10; // 한 번에 10개씩 처리
      for (let i = 0; i < uniqueProductIds.length; i += batchSize) {
        const batch = uniqueProductIds.slice(i, i + batchSize);
        await Promise.all(batch.map(async (productId) => {
          if (!productAttributesMap.has(productId)) {
            try {
              const product = productMap.get(productId);
              const categoryId = product?.categoryId || product?.category?.id || product?.category?.categoryId;
              const productAttributes = await inventoryService.getProductAttributeValues(productId);
              
              // 카테고리별 displayOrder 가져오기
              const categoryAttrMap = categoryAttributesMap.get(categoryId) || new Map();
              
              // 속성 타입별로 그룹화
              const attributeMap = new Map();
              (productAttributes || []).forEach(attr => {
                const typeId = String(attr.attributeTypeId || attr.attributeType?.id || '');
                const typeName = attr.attributeTypeName || attr.attributeType?.name || '';
                const valueId = attr.attributeValueId || attr.attributeValue?.id || attr.id;
                const valueName = attr.attributeValueName || attr.attributeValue?.name || attr.displayName || '';
                
                // 카테고리별 displayOrder 우선 사용, 없으면 속성 타입의 displayOrder 사용
                const categoryDisplayOrder = categoryAttrMap.get(typeId)?.displayOrder;
                const displayOrder = categoryDisplayOrder !== undefined 
                  ? categoryDisplayOrder 
                  : (attr.attributeType?.displayOrder || attr.displayOrder || 0);
                
                // typeId가 없으면 typeName을 키로 사용
                const key = typeId || typeName;
                
                if (!key) {
                  return;
                }
                
                if (!attributeMap.has(key)) {
                  attributeMap.set(key, {
                    attributeTypeId: typeId,
                    attributeTypeName: typeName,
                    displayOrder: displayOrder,
                    values: []
                  });
                }
                
                if (valueId && valueName) {
                  attributeMap.get(key).values.push({
                    attributeValueId: valueId,
                    attributeValueName: valueName
                  });
                }
              });
              
              // 속성 타입별로 정렬하고 최대 2개까지만 선택
              // 각 속성 타입의 모든 값들을 포함 (나중에 BranchProduct와 매칭)
              const sortedAttributes = Array.from(attributeMap.values())
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
              
              const attributes = sortedAttributes
                .slice(0, 2) // 최대 2개
                .map(attr => ({
                  attributeTypeId: attr.attributeTypeId,
                  attributeTypeName: attr.attributeTypeName,
                  attributeValueId: attr.values[0]?.attributeValueId || null,
                  attributeValueName: attr.values[0]?.attributeValueName || null,
                  allValues: attr.values // 모든 값 보관 (나중에 매칭용)
                }));
              
              productAttributesMap.set(productId, attributes);
            } catch (err) {
              productAttributesMap.set(productId, []);
            }
          }
        }));
      }
      
      // 같은 상품(productId)과 지점(branchId)을 가진 BranchProduct들을 그룹화
      const productGroupMap = new Map();
      allBranchProducts.forEach((item) => {
        const key = `${item.productId}-${item.branchId}`;
        
        if (!productGroupMap.has(key)) {
          productGroupMap.set(key, []);
        }
        productGroupMap.get(key).push(item);
      });
      
      // 그룹화된 데이터를 하나의 행으로 변환
      const productsWithStock = Array.from(productGroupMap.entries()).map(([key, items]) => {
        // 첫 번째 항목을 기준으로 기본 정보 설정
        const firstItem = items[0];
        const currentStock = items.reduce((sum, item) => sum + (item.stockQuantity || 0), 0);
        const reservedStock = items.reduce((sum, item) => sum + (item.reservedQuantity || 0), 0);
        const availableStock = items.reduce((sum, item) => sum + (item.availableQuantity !== undefined ? item.availableQuantity : (item.stockQuantity || 0) - (item.reservedQuantity || 0)), 0);
        const safetyStock = firstItem.safetyStock || 0;
        
        // 공급가는 Product.supplyPrice에서 가져오기
        const product = productMap.get(firstItem.productId);
        const unitPrice = product?.supplyPrice || 0;
        // 판매가는 첫 번째 BranchProduct.price 사용
        const salesPrice = firstItem.price || 0;
        const status = currentStock < safetyStock ? 'low' : 'normal';
        let branchName = firstItem.branchName || (firstItem.branchId === 1 ? '본점' : `지점-${firstItem.branchId}`);
        // 본사가 들어오면 본점으로 변경
        if (branchName === '본사' || branchName.includes('본사')) {
          branchName = '본점';
        }
        
        // 상품 속성 정보 가져오기 (캐시 사용)
        // 상품에 연결된 모든 속성 값을 표시 (각 속성 타입별로 첫 번째 값 사용)
        let attributes = productAttributesMap.get(firstItem.productId) || [];
        
        if (attributes.length > 0) {
          attributes = attributes.map(attr => ({
            attributeTypeId: attr.attributeTypeId,
            attributeTypeName: attr.attributeTypeName,
            attributeValueId: attr.attributeValueId,
            attributeValueName: attr.attributeValueName
          }));
        } else {
          // 속성 정보가 없으면 BranchProduct에서 수집
          const attributeMap = new Map();
          items.forEach(item => {
            if (item.attributeValueId && item.attributeTypeName && item.attributeValueName) {
              const typeKey = item.attributeTypeId || item.attributeTypeName;
              if (!attributeMap.has(typeKey)) {
                attributeMap.set(typeKey, {
                  attributeTypeId: item.attributeTypeId || '',
                  attributeTypeName: item.attributeTypeName,
                  attributeValueId: item.attributeValueId,
                  attributeValueName: item.attributeValueName
                });
              }
            }
          });
          attributes = Array.from(attributeMap.values()).slice(0, 2);
        }
        
        return {
          id: `${firstItem.branchId}-${firstItem.productId}`, // 지점-상품 조합으로 고유 ID
          branchProductId: firstItem.branchProductId, // 첫 번째 BranchProduct ID
          product: { 
            name: firstItem.productName || '알 수 없음', 
            id: firstItem.productId || 'N/A'
          },
          category: firstItem.categoryName || '미분류',
          branchId: firstItem.branchId,
          branch: branchName, // branchName은 이미 올바르게 설정됨 (targetBranchId 기준)
          currentStock: currentStock,
          reservedStock: reservedStock,
          availableStock: availableStock,
          safetyStock: safetyStock,
          status: status,
          unitPrice: unitPrice,
          salesPrice: salesPrice,
          totalValue: currentStock * unitPrice,
          // 속성 정보 배열 (최대 2개)
          attributes: attributes,
          // 하위 호환성을 위한 필드
          attributeValueId: attributes[0]?.attributeValueId || null,
          attributeValueName: attributes[0]?.attributeValueName || null,
          attributeTypeName: attributes[0]?.attributeTypeName || null
        };
      });
      
      // 상품별로 본점 재고 정보 매핑 (본점 필터에서 모든 상품을 표시하기 위해)
      const mainBranchStockMap = new Map(); // productId -> 본점 재고 정보
      allBranchProducts
        .filter(bp => bp.branchId === 1) // 본점 재고만
        .forEach(bp => {
          const key = `${bp.productId}-${bp.attributeValueId || 'no-attr'}`;
          if (!mainBranchStockMap.has(key)) {
            mainBranchStockMap.set(key, []);
          }
          mainBranchStockMap.get(key).push(bp);
        });
      
      // 본점에 재고가 없는 상품은 추가하지 않음
      // 본점 필터에서는 본점에 실제 재고가 있는 것만 표시
      // 전체 지점 필터에서는 productsWithStock에 모든 지점의 재고가 포함되어 있으므로 모두 표시됨
      const productsWithoutMainBranchStock = [];
      
      // 전체 데이터 합치기
      const formattedData = [...productsWithStock, ...productsWithoutMainBranchStock];
      
      setInventoryData(formattedData);
      
      // Summary 계산 (필터된 데이터 기준이 아닌 전체 데이터 기준)
      const totalItems = formattedData.length;
      const lowStockItems = formattedData.filter(item => item.status === 'low').length;
      const totalValue = formattedData.reduce((sum, item) => sum + item.totalValue, 0);
      
      // 지점 목록은 재고 데이터와 무관하게 고정 (재고가 없는 지점도 포함)
      // branchList가 비어있을 때만 설정 (이미 설정되어 있으면 업데이트하지 않음)
      if (normalizedBranches.length > 0 && branchList.length === 0) {
        setBranchList(normalizedBranches);
      }
      
      // 총 지점 수는 모든 지점 목록 기준으로 계산 (재고가 없는 지점도 포함)
      // 현재 branchList의 길이를 사용 (재고 데이터 기반이 아님)
      const totalBranches = branchList.length > 0 ? branchList.length : (normalizedBranches.length > 0 ? normalizedBranches.length : 1);
      setSummary({
        totalItems,
        lowStockItems,
        totalBranches: totalBranches,
        totalValue
      });
    } catch (err) {
      setError('재고 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 입출고 기록 조회
  const fetchInventoryFlowData = async () => {
    try {
      setFlowLoading(true);
      setError(null);
      
      const userInfo = authService.getCurrentUser();
      const data = await inventoryService.getInventoryFlows();
      
      // 각 입출고 기록에 상품 속성 정보 추가
      if (data && Array.isArray(data) && data.length > 0) {
        // 고유한 productId 수집
        const uniqueProductIds = [...new Set(data.map(item => item.productId).filter(Boolean))];
        
        // 상품 정보를 먼저 가져와서 카테고리 ID 수집
        const productMap = new Map();
        const batchSize = 10;
        
        for (let i = 0; i < uniqueProductIds.length; i += batchSize) {
          const batch = uniqueProductIds.slice(i, i + batchSize);
          await Promise.all(batch.map(async (productId) => {
            try {
              const productResponse = await inventoryService.getProduct(productId);
              const product = productResponse.data?.data || productResponse.data;
              if (product) {
                productMap.set(String(productId), product);
              }
            } catch (err) {
              // 상품 정보 조회 실패 시 무시
            }
          }));
        }
        
        // 모든 상품의 카테고리 ID 수집
        const uniqueCategoryIds = [...new Set(
          Array.from(productMap.values())
            .map(p => p.categoryId || p.category?.id || p.category?.categoryId)
            .filter(Boolean)
        )];
        
        // 카테고리별 속성 정보를 먼저 가져오기 (캐싱)
        const categoryAttributesMap = new Map();
        for (const categoryId of uniqueCategoryIds) {
          if (!categoryAttributesMap.has(categoryId)) {
            try {
              const categoryAttributes = await inventoryService.getCategoryAttributes(categoryId);
              if (Array.isArray(categoryAttributes)) {
                // attributeTypeId를 키로 하는 Map 생성
                const categoryAttrMap = new Map();
                categoryAttributes.forEach(ca => {
                  const typeId = String(ca.attributeTypeId || ca.attributeType?.id || ca.id || '');
                  if (typeId) {
                    categoryAttrMap.set(typeId, {
                      displayOrder: ca.displayOrder || 0,
                      attributeTypeName: ca.attributeTypeName || ca.attributeType?.name
                    });
                  }
                });
                categoryAttributesMap.set(categoryId, categoryAttrMap);
              }
            } catch (err) {
              categoryAttributesMap.set(categoryId, new Map());
            }
          }
        }
        
        // 각 상품의 속성 정보를 배치로 가져오기
        const productAttributesMap = new Map();
        
        for (let i = 0; i < uniqueProductIds.length; i += batchSize) {
          const batch = uniqueProductIds.slice(i, i + batchSize);
          const promises = batch.map(async (productId) => {
            try {
              const product = productMap.get(String(productId));
              const categoryId = product?.categoryId || product?.category?.id || product?.category?.categoryId;
              const attrs = await inventoryService.getProductAttributeValues(productId);
              
              if (Array.isArray(attrs)) {
                // 카테고리별 displayOrder 가져오기
                const categoryAttrMap = categoryAttributesMap.get(categoryId) || new Map();
                
                // 속성 타입별로 그룹화하고 카테고리별 displayOrder 적용
                const attributeMap = new Map();
                attrs.forEach(attr => {
                  const typeId = String(attr.attributeTypeId || attr.attributeType?.id || '');
                  const typeName = attr.attributeTypeName || attr.attributeType?.name || '';
                  const valueId = attr.attributeValueId || attr.attributeValue?.id || attr.id;
                  const valueName = attr.attributeValueName || attr.attributeValue?.name || attr.displayName || '';
                  
                  // 카테고리별 displayOrder 우선 사용, 없으면 속성 타입의 displayOrder 사용
                  const categoryDisplayOrder = categoryAttrMap.get(typeId)?.displayOrder;
                  const displayOrder = categoryDisplayOrder !== undefined 
                    ? categoryDisplayOrder 
                    : (attr.attributeType?.displayOrder || attr.displayOrder || 0);
                  
                  const key = typeId || typeName;
                  if (!key) return;
                  
                  if (!attributeMap.has(key)) {
                    attributeMap.set(key, {
                      attributeTypeId: typeId,
                      attributeTypeName: typeName,
                      displayOrder: displayOrder,
                      values: []
                    });
                  }
                  
                  if (valueId && valueName) {
                    attributeMap.get(key).values.push({
                      attributeValueId: valueId,
                      attributeValueName: valueName
                    });
                  }
                });
                
                // displayOrder 순으로 정렬
                const sortedAttrs = Array.from(attributeMap.values())
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                
                productAttributesMap.set(String(productId), sortedAttrs);
              }
            } catch (err) {
              // 속성 정보 조회 실패 시 무시
            }
          });
          
          await Promise.all(promises);
        }
        
        // 입출고 기록 데이터에 속성 정보 추가
        const enrichedData = data.map(item => {
          const productId = String(item.productId || '');
          const productAttributes = productAttributesMap.get(productId) || [];
          
          // 속성 정보를 배열로 변환 (최대 2개)
        const attributes = [];

        // 백엔드에서 내려준 실제 속성 정보 우선 반영
        if (item.attributeTypeName && item.attributeValueName) {
          attributes.push({
            attributeTypeId: item.attributeTypeId || null,
            attributeTypeName: item.attributeTypeName,
            attributeValueId: item.attributeValueId || null,
            attributeValueName: item.attributeValueName
          });
        }
        
        // 최대 2개까지 속성 추가하되, 이미 추가된 값은 제외
        for (const attr of productAttributes) {
          if (attributes.length >= 2) {
            break;
          }
          
          const typeName = attr.attributeTypeName;
          const valueName = attr.values[0]?.attributeValueName || '';
          
          if (!typeName || !valueName) {
            continue;
          }

          const isDuplicate = attributes.some(existing => 
            existing.attributeTypeName === typeName && existing.attributeValueName === valueName
          );

          if (!isDuplicate) {
            attributes.push({
              attributeTypeId: attr.attributeTypeId,
              attributeTypeName: typeName,
              attributeValueId: attr.values[0]?.attributeValueId || null,
              attributeValueName: valueName
            });
          }
        }
          
          return {
            ...item,
            attributes: attributes
          };
        });
        
        setInventoryFlowData(enrichedData);
      
      // 입출고 기록을 불러온 후 지점 목록 갱신
        await fetchBranchListWithFlowData(enrichedData);
      } else {
        setInventoryFlowData(data || []);
      }
    } catch (err) {
      setError('입출고 기록을 불러오는데 실패했습니다.');
    } finally {
      setFlowLoading(false);
    }
  };

  // 지점 목록 조회
  const fetchBranchListWithFlowData = async (flowData = null) => {
    const dataToUse = flowData || inventoryFlowData;
    
    try {
      let branches = null;
      try {
        const branchResponse = await branchService.fetchBranches({ page: 0, size: 100 });
        if (branchResponse?.data && Array.isArray(branchResponse.data)) {
          branches = branchResponse.data;
        } else if (branchResponse?.content && Array.isArray(branchResponse.content)) {
          branches = branchResponse.content;
        } else if (Array.isArray(branchResponse)) {
          branches = branchResponse;
        }
      } catch (err) {
        branches = await purchaseOrderService.getBranchList().catch(() => {
          return null;
        });
      }
      
      // API 응답이 배열이 아닌 경우 처리
      let branchArray = null;
      if (branches === null || branches === undefined) {
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
        // 응답 데이터 형태 정규화
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
        return;
      }
      
      // API 실패 시 기본값 (본점만)
      // 지점 목록은 재고 데이터나 입출고 기록 데이터 기반으로 동적으로 생성하지 않음
      // 재고가 없는 지점도 필터에서 선택할 수 있어야 하므로, API에서만 가져온 고정 목록 사용
      setBranchList([{ id: 1, name: '본점' }]);
    } catch (err) {
      setBranchList([{ id: 1, name: '본점' }]);
    }
  };

  // 지점 목록 조회
  const fetchBranchList = async () => {
    await fetchBranchListWithFlowData();
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'inventory';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  // 카테고리 목록 조회
  const fetchCategories = async () => {
    try {
      const data = await inventoryService.getCategories();
      // API 응답 구조에 따라 데이터 추출
      const categories = Array.isArray(data) ? data : (data?.data || data?.result || []);
      if (categories.length > 0) {
        setCategoryList(categories.map(cat => ({
          id: cat.categoryId || cat.id,
          name: cat.name || cat.categoryName
        })));
      }
    } catch (err) {
      setCategoryList([]);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchInventoryData();
    fetchInventoryFlowData();
    fetchBranchList();
    fetchCategories();
  }, []);

  // branchList가 로드되면 본점을 찾아서 기본 필터로 설정
  useEffect(() => {
    if (branchList.length > 0 && filters.branchFilter === '본점') {
      const mainBranch = branchList.find(b => 
        b.name.includes('본점') || b.name.includes('본사') || b.id === 1
      );
      if (mainBranch) {
        setFilters(prev => ({ ...prev, branchFilter: mainBranch.name }));
      }
    }
    
    // 입출고 기록 필터도 본점으로 설정
    if (branchList.length > 0 && flowFilters.branchFilter === '본점') {
      const mainBranch = branchList.find(b => 
        b.name.includes('본점') || b.name.includes('본사') || b.id === 1
      );
      if (mainBranch) {
        setFlowFilters(prev => ({ ...prev, branchFilter: mainBranch.name }));
      }
    }
  }, [branchList]);
  
  // 지점 목록은 입출고 기록 데이터 기반으로 동적으로 변경하지 않음
  // 지점 목록은 fetchBranchList에서 API로 가져온 고정 목록만 사용
  // useEffect(() => {
  //   if (inventoryFlowData.length > 0 && branchList.length <= 1) {
  //     // API에서 지점 목록을 가져오지 못한 경우에만 발주 목록에서 추출
  //     const uniqueBranches = {};
  //     inventoryFlowData.forEach(item => {
  //       const branchName = item.branchId === 1 ? '본점' : `지점-${item.branchId}`;
  //       if (!uniqueBranches[branchName]) {
  //         uniqueBranches[branchName] = {
  //           id: item.branchId,
  //           name: branchName
  //         };
  //       }
  //     });
  //     
  //     const extractedBranches = Object.values(uniqueBranches);
  //     if (extractedBranches.length > branchList.length) {
  //       setBranchList(extractedBranches);
  //     }
  //   }
  // }, [inventoryFlowData]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleInventorySort = (field, direction) => {
    setInventorySort({ field, direction });
    setCurrentPage(1); // 정렬 변경시 첫 페이지로 이동
  };

  const handleAddInventory = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveAddModal = async (formData) => {
    try {
      const userInfo = authService.getCurrentUser();
      const userRole = userInfo?.role;
      
      if (userRole === 'HQ_ADMIN') {
        // 유효성 검사 (AddInventoryModal에서도 검증하지만, 이중 체크)
        if (!formData.name || !formData.category) {
          alert('상품명과 카테고리는 필수 입력 항목입니다.');
          throw new Error('필수 입력 항목이 누락되었습니다.');
        }
        
        // 본사 관리자: 상품 마스터 등록
        const productData = {
          name: formData.name,
          description: formData.description || '',
          categoryId: parseInt(formData.category),
          minPrice: formData.minPrice || 0,
          maxPrice: formData.maxPrice || 0,
          supplyPrice: formData.supplyPrice || 0,
          imageUrl: formData.imageUrl || '',
          visibility: formData.visibility || 'ALL',
          imageFile: formData.imageFile || null // 이미지 파일 추가
        };
        
        const productResponse = await inventoryService.createProduct(productData);
        
        // 등록된 상품의 ID 추출 (ResponseDto 구조 고려)
        const responseData = productResponse.data?.data || productResponse.data;
        const productId = responseData?.productId;
        
        if (productId) {
          // 선택한 속성 값들을 상품에 연결 (먼저 연결)
          if (formData.attributeValueIds && formData.attributeValueIds.length > 0) {
            try {
              await inventoryService.addProductAttributeValues(productId, formData.attributeValueIds);
            } catch (attrError) {
              // 속성 값 등록 실패해도 상품은 등록됨 (경고만 표시)
              alert('상품은 등록되었지만 속성 값 등록에 실패했습니다.');
            }
          }
          
          // 본사 지점에 재고 추가 (초기 재고 0)
          // 판매가가 있으면 판매가를 price로 사용, 없으면 공급가 사용
          const price = formData.sellingPrice ? parseInt(formData.sellingPrice) : (formData.supplyPrice || 0);
          
          // 선택한 속성 값이 있으면 하나의 BranchProduct만 생성
          // 백엔드에서는 하나의 attributeValueId만 받으므로,
          // 여러 속성 중 displayOrder가 더 큰(두 번째) 속성 값을 사용
          if (formData.attributeValueIds && formData.attributeValueIds.length > 0) {
            // 카테고리 속성 정보를 가져와서 displayOrder 기준으로 정렬
            let selectedAttributeValueId = null;
            
            try {
              const categoryAttributes = await inventoryService.getCategoryAttributes(formData.category);
              
              // 선택된 속성 값들을 속성 타입별로 매핑
              const attributeValueMap = new Map(); // attributeValueId -> attributeType 정보
              
              if (Array.isArray(categoryAttributes) && categoryAttributes.length > 0) {
                categoryAttributes.forEach(attr => {
                  const typeId = String(attr.attributeTypeId || attr.attributeType?.id || attr.id || '');
                  const displayOrder = attr.displayOrder || 0;
                  const availableValues = attr.availableValues || [];
                  
                  availableValues.forEach(val => {
                    const valueId = String(val.id || val.attributeValueId || '');
                    if (formData.attributeValueIds.includes(Number(valueId)) || 
                        formData.attributeValueIds.includes(valueId)) {
                      attributeValueMap.set(valueId, {
                        attributeValueId: valueId,
                        attributeTypeId: typeId,
                        displayOrder: displayOrder
                      });
                    }
                  });
                });
                
                // displayOrder가 더 큰 속성 값을 선택 (두 번째 속성)
                const sortedAttributes = Array.from(attributeValueMap.values())
                  .sort((a, b) => (b.displayOrder || 0) - (a.displayOrder || 0));
                
                if (sortedAttributes.length > 0) {
                  // displayOrder가 가장 큰 속성 값 사용 (두 번째 속성)
                  selectedAttributeValueId = Number(sortedAttributes[0].attributeValueId);
                } else {
                  // 매핑 실패 시 마지막 속성 값 사용
                  selectedAttributeValueId = formData.attributeValueIds[formData.attributeValueIds.length - 1];
                }
              } else {
                // 카테고리 속성 정보가 없으면 마지막 속성 값 사용
                selectedAttributeValueId = formData.attributeValueIds[formData.attributeValueIds.length - 1];
              }
            } catch (err) {
              // 실패 시 마지막 속성 값 사용
              selectedAttributeValueId = formData.attributeValueIds[formData.attributeValueIds.length - 1];
            }
            
            // 본점(branchId: 1)에만 BranchProduct 생성
            // 선택한 속성 값들에 대해 각각 BranchProduct 생성 (최대 2개 속성 조합)
            // 실제로는 각 속성 값 조합별로 하나의 BranchProduct만 생성
            try {
              // 본점에만 등록 (branchId: 1로 고정) - 절대 다른 지점에 등록하지 않음
              const branchProductData = {
                productId: productId,
                branchId: 1, // 본점에만 등록 (고정) - 다른 지점에는 등록하지 않음
                serialNumber: `HQ-${productId}-${Date.now()}-${selectedAttributeValueId}`,
                stockQuantity: 0,
                safetyStock: 0,
                price: price,
                attributeValueId: selectedAttributeValueId
              };
              
              await inventoryService.createBranchProduct(branchProductData);
            } catch (bpError) {
              // 이미 존재하는 속성 조합인 경우 무시 (중복 등록 방지)
              if (bpError.response?.status !== 400 && bpError.response?.status !== 409) {
                throw bpError;
              }
            }
          } else {
            // 속성 값이 없으면 본점에만 생성
            const branchProductData = {
              productId: productId,
              branchId: 1, // 본점에만 등록 (고정) - 다른 지점에는 등록하지 않음
              serialNumber: `HQ-${productId}-${Date.now()}`,
              stockQuantity: 0,
              safetyStock: 0,
              price: price
            };
            
            await inventoryService.createBranchProduct(branchProductData);
          }
        }
        
        alert('상품이 성공적으로 등록되었습니다.');
        
        // 재고 목록 새로고침
        await fetchInventoryData();
        
        // 성공 시에만 모달 닫기
        handleCloseAddModal();
      } else {
        // 지점 관리자: 지점별 상품 추가 (추후 구현)
        alert('지점별 상품 추가 기능은 추후 구현 예정입니다.');
        throw new Error('지점별 상품 추가 기능은 추후 구현 예정입니다.');
      }
      
      // 데이터 새로고침 (이미 위에서 fetchInventoryData 호출됨)
    } catch (err) {
      // API 에러 시에만 alert 표시 (유효성 검사는 이미 처리됨)
      if (err.response) {
        alert('등록에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
      }
      // 에러 발생 시 모달은 닫지 않고 그대로 유지
    }
  };

  const handleModify = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleDetail = (item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`'${item.product.name}' 상품을 삭제하시겠습니까?\n\n주의: 삭제된 상품은 복구할 수 없습니다.`)) {
      try {
        // 상품 삭제 API 호출
        await inventoryService.deleteProduct(item.product.id);
        
        alert('상품이 성공적으로 삭제되었습니다.');
        
        // 데이터 새로고침
        await fetchInventoryData();
      } catch (err) {
        let errorMessage = '상품 삭제에 실패했습니다.';
        if (err.response?.data?.status_message) {
          errorMessage += '\n' + err.response.data.status_message;
        } else if (err.message) {
          errorMessage += '\n' + err.message;
        }
        
        alert(errorMessage);
      }
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleSaveModal = async (formData) => {
    try {
      const productId = formData.productId || selectedItem?.product?.id;
      const branchProductId = selectedItem?.branchProductId || selectedItem?.id;
      
      // 상품 정보 수정 (이름, 카테고리, 이미지 등)
      if (productId && (formData.productName || formData.category || formData.imageFile || formData.removeImage || formData.minPrice !== undefined || formData.maxPrice !== undefined || formData.unitPrice !== undefined || formData.description !== undefined)) {
        try {
          // 기존 상품 정보 가져오기
          const productResponse = await inventoryService.getProduct(productId);
          const existingProduct = productResponse.data?.data || productResponse.data;
          
          // 이미지 제거인 경우
          const imageFileToSend = formData.removeImage ? null : formData.imageFile || null;
          const imageUrlToSend = formData.removeImage ? "" : (formData.imageFile ? undefined : existingProduct.imageUrl);
          
          // 상품 수정 API 호출
          await inventoryService.updateProduct(productId, {
            name: formData.productName || existingProduct.name,
            description: formData.description !== undefined ? formData.description : (existingProduct.description || ''),
            categoryId: formData.category || existingProduct.categoryId || existingProduct.category?.categoryId,
            minPrice: formData.minPrice !== undefined ? formData.minPrice : (existingProduct.minPrice || 0),
            maxPrice: formData.maxPrice !== undefined ? formData.maxPrice : (existingProduct.maxPrice || 0),
            supplyPrice: formData.unitPrice !== undefined ? formData.unitPrice : (existingProduct.supplyPrice || 0),
            visibility: formData.visibility || existingProduct.visibility || 'ALL',
            imageFile: imageFileToSend,
            imageUrl: imageUrlToSend
          });
        } catch (err) {
          alert('상품 정보 수정에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
          return;
        }
      }
      
      // 상품 속성 값 업데이트
      if (productId && formData.attributeValueIds !== undefined) {
        try {
          await inventoryService.updateProductAttributeValues(productId, formData.attributeValueIds);
        } catch (attrError) {
          alert('상품 속성 값 업데이트에 실패했습니다.');
        }
      }
      
      // 재고 정보 업데이트 (안전재고, 판매가)
      // 공급가는 상품 정보로 관리되므로 별도 업데이트 필요
      if (branchProductId) {
        // 판매가를 unitPrice로 전달 (BranchProduct.price가 판매가)
        await inventoryService.updateInventoryInfo(
          branchProductId,
          formData.safetyStock,
          formData.sellingPrice || formData.unitPrice
        );
        
        // 공급가가 변경된 경우 상품 정보도 업데이트
        if (formData.unitPrice && productId) {
          try {
            const productResponse = await inventoryService.getProduct(productId);
            const existingProduct = productResponse.data?.data || productResponse.data;
            
            await inventoryService.updateProduct(productId, {
              name: existingProduct.name,
              description: formData.description !== undefined ? formData.description : (existingProduct.description || ''),
              categoryId: formData.category || existingProduct.categoryId || existingProduct.category?.categoryId,
              minPrice: formData.minPrice !== undefined ? formData.minPrice : (existingProduct.minPrice || 0),
              maxPrice: formData.maxPrice !== undefined ? formData.maxPrice : (existingProduct.maxPrice || 0),
              supplyPrice: formData.unitPrice,
              visibility: existingProduct.visibility || 'ALL',
              imageFile: null,
              imageUrl: existingProduct.imageUrl
            });
          } catch (err) {
            // 공급가 업데이트 실패 시 무시
          }
        }
        
        alert('재고 정보가 성공적으로 수정되었습니다.');
        handleCloseEditModal();
        
        // 데이터 새로고침
        fetchInventoryData();
      }
    } catch (err) {
      alert('재고 수정에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 입출고 기록 관련 핸들러들
  const handleFlowAdd = async () => {
    try {
      // 본점(branchId === 1)의 재고를 직접 API에서 가져와서 사이즈 정보 포함 확인
      const userInfo = authService.getCurrentUser();
      const branchId = 1; // 본점
      
      const branchProductsData = await inventoryService.getBranchProducts(branchId);
      
      // BranchProduct 데이터를 모달에서 사용할 수 있도록 변환 (사이즈 정보 포함)
      const formattedBranchProducts = (branchProductsData.data || branchProductsData || []).map(item => {
        const sizeInfo = item.attributeValueName 
          ? ` - ${item.attributeTypeName || ''} ${item.attributeValueName}` 
          : '';
        return {
          id: item.branchProductId,
          productId: item.productId,
          product: { id: item.productId },
          productName: `${item.productName || '알 수 없음'}${sizeInfo}`,
          branchId: item.branchId || branchId,
          attributeValueId: item.attributeValueId || null,
          attributeValueName: item.attributeValueName || null,
          attributeTypeName: item.attributeTypeName || null,
          stockQuantity: item.stockQuantity || 0
        };
      });
      
      setBranchProducts(formattedBranchProducts);
      setIsFlowAddModalOpen(true);
    } catch (err) {
      alert('상품 목록을 불러오는데 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowCloseAddModal = () => {
    setIsFlowAddModalOpen(false);
  };

  const handleFlowSaveAddModal = async (formData) => {
    try {
      await inventoryService.createInventoryFlow(formData);
      alert('입출고 기록이 성공적으로 등록되었습니다.');
      handleFlowCloseAddModal();
      fetchInventoryFlowData(); // 목록 새로고침
      fetchInventoryData(); // 재고도 새로고침
    } catch (err) {
      alert('입출고 기록 등록에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowEdit = (item) => {
    setSelectedFlowItem(item);
    setIsFlowEditModalOpen(true);
  };

  const handleFlowCloseEditModal = () => {
    setIsFlowEditModalOpen(false);
    setSelectedFlowItem(null);
  };

  const handleFlowSaveEditModal = async (formData) => {
    try {
      await inventoryService.updateInventoryFlow(selectedFlowItem.flowId || selectedFlowItem.id, formData);
      alert('입출고 기록이 성공적으로 수정되었습니다.');
      handleFlowCloseEditModal();
      fetchInventoryFlowData(); // 목록 새로고침
      fetchInventoryData(); // 재고도 새로고침
    } catch (err) {
      alert('입출고 기록 수정에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowDelete = async (item) => {
    try {
      await inventoryService.deleteInventoryFlow(item.flowId || item.id);
      alert('입출고 기록이 성공적으로 삭제되었습니다.');
      
      // 데이터 새로고침 (순서 중요)
      await fetchInventoryFlowData(); // 입출고 기록 목록 새로고침
      await fetchInventoryData(); // 재고 현황 새로고침
      
      // 페이지 상태 초기화 (삭제 후 빈 페이지가 될 수 있으므로)
      if (flowCurrentPage > 1 && inventoryFlowData.length <= flowPageSize) {
        setFlowCurrentPage(flowCurrentPage - 1);
      }
      
    } catch (err) {
      alert('입출고 기록 삭제에 실패했습니다: ' + (err.response?.data?.status_message || err.message));
    }
  };

  const handleFlowPageChange = (page) => {
    setFlowCurrentPage(page);
  };

  const handleFlowPageSizeChange = (size) => {
    setFlowPageSize(size);
    setFlowCurrentPage(1);
  };

  // 필터된 데이터 계산 및 정렬
  const filteredData = useMemo(() => {
    let filtered = inventoryData.filter(item => {
      const matchesSearch = filters.searchTerm === '' || 
        item.product.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (item.product.id && item.product.id.toString().includes(filters.searchTerm));
      
      const matchesCategory = filters.categoryFilter === '' ||
        (item.category && item.category.includes(filters.categoryFilter));
      
      // 지점 필터: branchId 기준으로 정확히 매칭
      let matchesBranch = true;
      if (filters.branchFilter !== '') {
        // branchList에서 선택한 지점 이름에 해당하는 branchId 찾기
        const selectedBranch = branchList.find(b => {
          const branchName = b.name || '';
          const filterName = filters.branchFilter || '';
          // 정확한 이름 일치 또는 본점인 경우
          return branchName === filterName || 
                 branchName.trim() === filterName.trim() ||
                 (filterName === '본점' && (branchName === '본점' || branchName === '본사' || b.id === 1)) ||
                 (filterName === '본사' && (branchName === '본점' || branchName === '본사' || b.id === 1));
        });
        
        if (selectedBranch) {
          const selectedBranchId = selectedBranch.id;
          
          // 본점 필터인 경우: 본점에 실제 재고가 있는 상품만 표시
          if (selectedBranchId === 1 || selectedBranchId === '1') {
            // 본점 필터에서는 본점에 실제로 재고가 있는 상품만 표시 (item.branchId === 1)
            const itemBranchId = typeof item.branchId === 'string' ? Number(item.branchId) : item.branchId;
            matchesBranch = itemBranchId === 1;
          } else {
            // 다른 지점 필터인 경우: 해당 지점의 재고만 표시
            // branchId를 숫자와 문자열 모두 비교 (타입 불일치 문제 해결)
            const itemBranchId = typeof item.branchId === 'string' ? Number(item.branchId) : item.branchId;
            const targetBranchId = typeof selectedBranchId === 'string' ? Number(selectedBranchId) : selectedBranchId;
            matchesBranch = itemBranchId === targetBranchId;
          }
        } else {
          // branchList에서 찾지 못한 경우 이름으로 비교 (fallback)
          if (filters.branchFilter === '본점' || filters.branchFilter === '본사') {
            // 본점 필터 fallback: 본점에 실제 재고가 있는 상품만 표시
            const itemBranchId = typeof item.branchId === 'string' ? Number(item.branchId) : item.branchId;
            matchesBranch = itemBranchId === 1;
          } else {
            // 이름으로 직접 비교 (fallback)
            matchesBranch = item.branch === filters.branchFilter || 
                           (item.branch && item.branch.trim() === filters.branchFilter.trim());
          }
        }
      }
      
      const matchesStatus = filters.statusFilter === '' ||
        item.status === filters.statusFilter;
      
      return matchesSearch && matchesCategory && matchesBranch && matchesStatus;
    });

    // 정렬 적용
    if (inventorySort && inventorySort.field) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (inventorySort.field) {
          case 'productName':
            aValue = (a.product.name || '').toLowerCase();
            bValue = (b.product.name || '').toLowerCase();
            break;
          case 'category':
            aValue = (a.category || '').toLowerCase();
            bValue = (b.category || '').toLowerCase();
            break;
          case 'branch':
            aValue = (a.branch || '').toLowerCase();
            bValue = (b.branch || '').toLowerCase();
            break;
          case 'currentStock':
            aValue = a.currentStock || 0;
            bValue = b.currentStock || 0;
            break;
          case 'safetyStock':
            aValue = a.safetyStock || 0;
            bValue = b.safetyStock || 0;
            break;
          case 'unitPrice':
            aValue = a.unitPrice || 0;
            bValue = b.unitPrice || 0;
            break;
          case 'salesPrice':
            aValue = a.salesPrice || 0;
            bValue = b.salesPrice || 0;
            break;
          case 'totalValue':
            aValue = a.totalValue || 0;
            bValue = b.totalValue || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return inventorySort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return inventorySort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventoryData, filters, inventorySort, branchList]);

  // 필터된 데이터 기준으로 Summary 계산
  const filteredSummary = useMemo(() => {
    const totalItems = filteredData.length;
    const lowStockItems = filteredData.filter(item => item.status === 'low').length;
    const totalValue = filteredData.reduce((sum, item) => sum + item.totalValue, 0);
    
    return {
      totalItems,
      lowStockItems,
      totalBranches: summary.totalBranches, // 항상 전체 지점 수로 고정
      totalValue
    };
  }, [filteredData, summary.totalBranches]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // 입출고 기록 필터링
  const getBranchNameFromId = (branchId, itemBranchName) => {
    // branchId가 1이면 항상 본점으로 표시
    if (branchId === 1) {
      return '본점';
    }
    
    // API 응답에 branchName이 포함되어 있으면 사용 (본사가 들어올 경우 본점으로 변경)
    if (itemBranchName) {
      return itemBranchName === '본사' ? '본점' : itemBranchName;
    }
    
    // branchList에서 지점명 찾기
    const branch = branchList.find(b => b.id === branchId || String(b.id) === String(branchId));
    if (branch && branch.name) {
      // branchList에서 찾은 이름도 본사면 본점으로 변경
      return branch.name === '본사' ? '본점' : branch.name;
    }
    
    // 찾지 못한 경우 fallback
    return `지점-${branchId}`;
  };

  const filteredFlowData = useMemo(() => {
    let filtered = inventoryFlowData.filter(item => {
      // 상품명 검색
      const matchesSearch = !flowFilters.searchTerm || 
        (item.productName || '').toLowerCase().includes(flowFilters.searchTerm.toLowerCase());
      
      // 날짜 범위 필터
      const matchesStartDate = !flowFilters.startDate || 
        (item.createdAt && new Date(item.createdAt) >= new Date(flowFilters.startDate));
      const matchesEndDate = !flowFilters.endDate || 
        (item.createdAt && new Date(item.createdAt) <= new Date(flowFilters.endDate + 'T23:59:59'));
      
      // 지점 필터
      const branchName = getBranchNameFromId(item.branchId, item.branchName);
      const matchesBranch = !flowFilters.branchFilter || 
        branchName === flowFilters.branchFilter ||
        String(item.branchId) === flowFilters.branchFilter ||
        (flowFilters.branchFilter === '본점' && (branchName === '본점' || branchName === '본사' || item.branchId === 1));
      
      // 구분 필터 (입고/출고)
      const matchesType = !flowFilters.typeFilter || 
        (flowFilters.typeFilter === 'in' && (item.inQuantity || 0) > 0 && (item.outQuantity || 0) === 0) ||
        (flowFilters.typeFilter === 'out' && (item.outQuantity || 0) > 0 && (item.inQuantity || 0) === 0);
      
      return matchesSearch && matchesStartDate && matchesEndDate && matchesBranch && matchesType;
    });

    // 정렬 적용
    if (flowSort && flowSort.field) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue;

        switch (flowSort.field) {
          case 'productName':
            aValue = (a.productName || '').toLowerCase();
            bValue = (b.productName || '').toLowerCase();
            break;
          case 'branch':
            aValue = getBranchNameFromId(a.branchId, a.branchName).toLowerCase();
            bValue = getBranchNameFromId(b.branchId, b.branchName).toLowerCase();
            break;
          case 'createdAt':
            aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            break;
          case 'inQuantity':
            aValue = a.inQuantity || 0;
            bValue = b.inQuantity || 0;
            break;
          case 'outQuantity':
            aValue = a.outQuantity || 0;
            bValue = b.outQuantity || 0;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return flowSort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return flowSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [inventoryFlowData, flowFilters, flowSort]);

  // 입출고 기록 페이징
  const flowTotalPages = Math.ceil(filteredFlowData.length / flowPageSize);
  const flowStartIndex = (flowCurrentPage - 1) * flowPageSize;
  const flowEndIndex = flowStartIndex + flowPageSize;
  const flowPaginatedData = filteredFlowData.slice(flowStartIndex, flowEndIndex);

  const handleFlowFiltersChange = (newFilters) => {
    setFlowFilters(newFilters);
    setFlowCurrentPage(1);
  };

  const handleFlowSort = (field, direction) => {
    setFlowSort({ field, direction });
    setFlowCurrentPage(1); // 정렬 변경시 첫 페이지로 이동
  };

  // 재고 상품 목록 (입출고 등록용)
  const branchProductsForFlow = inventoryData.map(item => ({
    id: item.id,
    productName: item.product.name,
    branchId: item.branchId
  }));

  return React.createElement(PageContainer, null,
    React.createElement(PageHeader, null,
      React.createElement(PageTitle, null, '재고관리'),
      React.createElement(PageSubtitle, null, '본사 - 재고 현황을 확인하고 관리하세요')
    ),
    React.createElement(TabContainer, null,
      React.createElement(TabList, null,
        React.createElement(Tab, {
          className: activeTab === 'inventory' ? 'active' : '',
          onClick: () => {
            setActiveTab('inventory');
            setSearchParams({ tab: 'inventory' });
          }
        }, '재고현황'),
        React.createElement(Tab, {
          className: activeTab === 'flow' ? 'active' : '',
          onClick: () => {
            setActiveTab('flow');
            setSearchParams({ tab: 'flow' });
          }
        }, '입출고 기록')
      )
    ),
    React.createElement(TabContent, null,
      activeTab === 'inventory' ? React.createElement(React.Fragment, null,
        React.createElement(SummaryCards, { 
          summary: filteredSummary,
          userRole: authService.getCurrentUser()?.role
        }),
        React.createElement(SearchAndFilter, {
          filters,
          onFiltersChange: handleFiltersChange,
          onAddInventory: handleAddInventory,
          userRole: authService.getCurrentUser()?.role,
          branchList: branchList,
          categoryList: categoryList
        }),
        React.createElement(InventoryTable, {
          data: paginatedData,
          currentPage,
          totalPages,
          pageSize,
          onPageChange: handlePageChange,
          onPageSizeChange: handlePageSizeChange,
          onModify: handleModify,
          onDetail: handleDetail,
          onDelete: handleDelete,
          onSort: handleInventorySort,
          currentSort: inventorySort
        })
      ) : React.createElement(React.Fragment, null,
        React.createElement('div', { style: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement('h3', { style: { margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' } }, '입출고 기록 관리'),
          React.createElement('button', {
            onClick: handleFlowAdd,
            style: {
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }
          }, '입출고 기록 등록')
        ),
        React.createElement(InventoryFlowFilter, {
          filters: flowFilters,
          onFiltersChange: handleFlowFiltersChange,
          branchList: branchList
        }),
        React.createElement(InventoryFlowTable, {
          data: flowPaginatedData,
          currentPage: flowCurrentPage,
          totalPages: flowTotalPages,
          pageSize: flowPageSize,
          totalCount: filteredFlowData.length,
          branchList: branchList,
          onPageChange: handleFlowPageChange,
          onPageSizeChange: handleFlowPageSizeChange,
          onEdit: handleFlowEdit,
          onDelete: handleFlowDelete,
          onSort: handleFlowSort,
          currentSort: flowSort
        })
      )
    ),
    React.createElement(EditInventoryModal, {
      isOpen: isEditModalOpen,
      onClose: handleCloseEditModal,
      item: selectedItem,
      onSave: handleSaveModal
    }),
    React.createElement(InventoryDetailModal, {
      isOpen: isDetailModalOpen,
      onClose: handleCloseDetailModal,
      item: selectedItem
    }),
    React.createElement(AddInventoryModal, {
      isOpen: isAddModalOpen,
      onClose: handleCloseAddModal,
      onSave: handleSaveAddModal
    }),
    React.createElement(EditInventoryFlowModal, {
      isOpen: isFlowEditModalOpen,
      onClose: handleFlowCloseEditModal,
      item: selectedFlowItem,
      onSave: handleFlowSaveEditModal
    }),
    React.createElement(AddInventoryFlowModal, {
      isOpen: isFlowAddModalOpen,
      onClose: handleFlowCloseAddModal,
      onSave: handleFlowSaveAddModal,
      branchProducts: branchProducts
    })
  );
}

export default InventoryManagement;
