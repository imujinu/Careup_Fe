import axios from '../utils/axiosConfig'; // Interceptor가 설정된 axios 사용

const API_BASE_URL = import.meta.env.VITE_CUSTOMER_API_URL;

// axios 인스턴스 대신 기본 axios 사용 (interceptor가 적용됨)
const inventoryApi = axios;

export const inventoryService = {
  // 카테고리 목록 조회
  getCategories: async () => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/categories`);
    console.log('카테고리 API 전체 응답:', response);
    console.log('카테고리 API 응답 데이터:', response.data);
    return response.data.data; // ResponseDto 구조에서 data 추출
  },

  // 카테고리 등록
  createCategory: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/api/categories`, data);
    console.log('카테고리 등록 API 전체 응답:', response);
    console.log('카테고리 등록 API 응답 데이터:', response.data);
    return response.data.data; // ResponseDto 구조에서 data 추출
  },

  // 상품 마스터 등록
  createProduct: async (data) => {
    const formData = new FormData();
    
    // product 객체를 JSON string으로 변환하여 FormData에 추가
    const productData = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      supplyPrice: data.supplyPrice,
      visibility: data.visibility
    };
    
    formData.append('product', new Blob([JSON.stringify(productData)], {
      type: 'application/json'
    }));
    
    // 이미지 파일이 있으면 추가
    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }
    
    const response = await inventoryApi.post(`${API_BASE_URL}/api/products`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 전체 상품 목록 조회 (본사 상품 마스터) - 페이징 지원
  getAllProducts: async (page = 0, size = 100) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/products?page=${page}&size=${size}&sort=createdAt,desc`);
    console.log('getAllProducts API 전체 응답:', response);
    console.log('getAllProducts API 응답 데이터:', response.data);
    return response.data; // Page<ProductResponseDto> 형태로 반환
  },

  // 상품 삭제
  deleteProduct: async (productId) => {
    const response = await inventoryApi.delete(`${API_BASE_URL}/api/products/${productId}`);
    return response.data;
  },

  // 상품 상세 조회
  getProduct: async (productId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/products/${productId}`);
    return response.data;
  },

  // 상품 수정
  updateProduct: async (productId, data) => {
    const formData = new FormData();
    
    // product 객체를 JSON string으로 변환하여 FormData에 추가
    const productData = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      supplyPrice: data.supplyPrice,
      visibility: data.visibility
    };
    
    // imageUrl이 명시적으로 전달된 경우에만 추가 (undefined가 아닌 경우만)
    if (data.imageUrl !== undefined) {
      productData.imageUrl = data.imageUrl;
    }
    
    formData.append('product', new Blob([JSON.stringify(productData)], {
      type: 'application/json'
    }));
    
    // 이미지 파일이 있으면 추가
    if (data.imageFile) {
      formData.append('image', data.imageFile);
    }
    
    const response = await inventoryApi.put(`${API_BASE_URL}/api/products/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // 지점별 재고 조회
  getBranchProducts: async (branchId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/inventory/branch/${branchId}`);
    return response.data;
  },

  // 지점에 상품 등록
  createBranchProduct: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/inventory/branch-products`, data);
    console.log('지점 상품 등록 API 응답:', response);
    return response.data;
  },

  // 특정 상품의 지점별 재고 조회
  getBranchProduct: async (branchId, productId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/inventory/branch/${branchId}/product/${productId}`);
    return response.data;
  },

  // 안전재고 설정
  updateSafetyStock: async (branchProductId, safetyStock) => {
    await inventoryApi.post(`${API_BASE_URL}/inventory/safety-stock`, {
      branchProductId,
      safetyStock
    });
  },

  // 재고 정보 수정 (안전재고, 단가)
  updateInventoryInfo: async (branchProductId, safetyStock, unitPrice) => {
    await inventoryApi.post(`${API_BASE_URL}/inventory/update`, {
      branchProductId,
      safetyStock,
      unitPrice
    });
  },

  // 지점 상품 삭제
  deleteBranchProduct: async (branchProductId) => {
    const response = await inventoryApi.delete(`${API_BASE_URL}/inventory/branch-products/${branchProductId}`);
    return response.data;
  },

  // 재고 증감
  adjustStock: async (data) => {
    await inventoryApi.post(`${API_BASE_URL}/inventory/adjust`, data);
  },

  // 입출고 기록 조회
  getInventoryFlows: async (branchId, productId) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId.toString());
    if (productId) params.append('productId', productId.toString());
    
    const response = await inventoryApi.get(`${API_BASE_URL}/inventory/flow?${params.toString()}`);
    return response.data;
  },

  // 입출고 기록 등록
  createInventoryFlow: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/inventory/flow`, data);
    return response.data;
  },

  // 입출고 기록 수정
  updateInventoryFlow: async (flowId, data) => {
    const response = await inventoryApi.put(`${API_BASE_URL}/inventory/flow/${flowId}`, data);
    return response.data;
  },

  // 입출고 기록 삭제
  deleteInventoryFlow: async (flowId) => {
    await inventoryApi.delete(`${API_BASE_URL}/inventory/flow/${flowId}`);
  },

  // 재고 조절 내역 조회
  getAdjustmentHistory: async (branchId, reason) => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId.toString());
    if (reason) params.append('reason', reason);
    
    const response = await inventoryApi.get(`${API_BASE_URL}/inventory/adjustment-history?${params.toString()}`);
    return response.data;
  },

  // ========== 속성 관리 API ==========
  
  // 카테고리별 속성 조회 (값 포함)
  getCategoryAttributes: async (categoryId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/category-attributes/category/${categoryId}/with-values`);
    return response.data.data || response.data || [];
  },

  // 상품 속성 값 일괄 추가
  addProductAttributeValues: async (productId, attributeValueIds) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/api/product-attribute-values/bulk`, {
      productId,
      attributes: attributeValueIds.map(id => ({ attributeValueId: id }))
    });
    return response.data.data || response.data || [];
  },

  // 상품 속성 값 조회
  getProductAttributeValues: async (productId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/product-attribute-values/product/${productId}`);
    return response.data.data || response.data || [];
  },

  // 상품 속성 값 일괄 삭제 및 재등록
  updateProductAttributeValues: async (productId, attributeValueIds) => {
    // 기존 속성 값 삭제 (자동으로 처리됨 - bulk API가 전체 교체)
    const response = await inventoryApi.post(`${API_BASE_URL}/api/product-attribute-values/bulk`, {
      productId,
      attributes: attributeValueIds.map(id => ({ attributeValueId: id }))
    });
    return response.data.data || response.data || [];
  },

  // ========== 속성 타입 관리 API ==========
  
  // 속성 타입 목록 조회
  getAttributeTypes: async () => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/attribute-types`);
    return response.data.data || response.data || [];
  },

  // 속성 타입 목록 조회 (값 포함)
  getAttributeTypesWithValues: async () => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/attribute-types/with-values`);
    return response.data.data || response.data || [];
  },

  // 속성 타입 단건 조회
  getAttributeType: async (id) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/attribute-types/${id}`);
    return response.data.data || response.data;
  },

  // 속성 타입 생성
  createAttributeType: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/api/attribute-types`, data);
    return response.data.data || response.data;
  },

  // 속성 타입 수정
  updateAttributeType: async (id, data) => {
    const response = await inventoryApi.put(`${API_BASE_URL}/api/attribute-types/${id}`, data);
    return response.data.data || response.data;
  },

  // 속성 타입 삭제
  deleteAttributeType: async (id) => {
    const response = await inventoryApi.delete(`${API_BASE_URL}/api/attribute-types/${id}`);
    return response.data;
  },

  // ========== 속성 값 관리 API ==========
  
  // 속성 타입별 속성 값 조회
  getAttributeValuesByType: async (attributeTypeId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/attribute-values/by-type/${attributeTypeId}`);
    return response.data.data || response.data || [];
  },

  // 속성 타입별 활성 속성 값 조회
  getActiveAttributeValuesByType: async (attributeTypeId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/attribute-values/by-type/${attributeTypeId}/active`);
    return response.data.data || response.data || [];
  },

  // 속성 값 단건 조회
  getAttributeValue: async (id) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/attribute-values/${id}`);
    return response.data.data || response.data;
  },

  // 속성 값 생성 (단건)
  createAttributeValue: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/api/attribute-values`, data);
    return response.data.data || response.data;
  },

  // 속성 값 일괄 생성
  createAttributeValuesBulk: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/api/attribute-values/bulk`, data);
    return response.data.data || response.data || [];
  },

  // 속성 값 수정
  updateAttributeValue: async (id, data) => {
    const response = await inventoryApi.put(`${API_BASE_URL}/api/attribute-values/${id}`, data);
    return response.data.data || response.data;
  },

  // 속성 값 삭제
  deleteAttributeValue: async (id) => {
    const response = await inventoryApi.delete(`${API_BASE_URL}/api/attribute-values/${id}`);
    return response.data;
  },

  // 속성 값 활성화/비활성화 토글
  toggleAttributeValue: async (id) => {
    const response = await inventoryApi.patch(`${API_BASE_URL}/api/attribute-values/${id}/toggle`);
    return response.data.data || response.data;
  },

  // ========== 카테고리 속성 연결 관리 API ==========
  
  // 카테고리별 속성 목록 조회 (값 제외) - 관리 페이지용
  getCategoryAttributesWithoutValues: async (categoryId) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/category-attributes/category/${categoryId}`);
    return response.data.data || response.data || [];
  },

  // 카테고리 속성 단건 조회
  getCategoryAttribute: async (id) => {
    const response = await inventoryApi.get(`${API_BASE_URL}/api/category-attributes/${id}`);
    return response.data.data || response.data;
  },

  // 카테고리에 속성 타입 추가
  addCategoryAttribute: async (data) => {
    const response = await inventoryApi.post(`${API_BASE_URL}/api/category-attributes`, data);
    return response.data.data || response.data;
  },

  // 카테고리 속성 수정
  updateCategoryAttribute: async (id, data) => {
    const response = await inventoryApi.put(`${API_BASE_URL}/api/category-attributes/${id}`, data);
    return response.data.data || response.data;
  },

  // 카테고리 속성 삭제
  deleteCategoryAttribute: async (id) => {
    const response = await inventoryApi.delete(`${API_BASE_URL}/api/category-attributes/${id}`);
    return response.data;
  },
};


