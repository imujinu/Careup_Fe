import axios from '../utils/axiosConfig'; // Interceptor가 설정된 axios 사용

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
      imageUrl: data.imageUrl,
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
};


