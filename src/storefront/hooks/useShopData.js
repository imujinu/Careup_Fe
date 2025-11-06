import { useState, useEffect } from 'react';
import axios from 'axios';
import { customerProductService } from '../../service/customerProductService';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// 상품명 기준으로 그룹화하는 함수
function groupProductsByName(products) {
  const groupedMap = {};
  
  products.forEach(product => {
    // 상품명 정규화 (공백 제거, 대소문자 통일)
    const normalizedName = (product.name || product.productName || '').trim();
    
    if (!normalizedName) return;
    
    if (!groupedMap[normalizedName]) {
      // 첫 번째 상품을 기준으로 그룹 생성
      groupedMap[normalizedName] = {
        ...product,
        // 대표 상품 정보 (첫 번째 상품 사용)
        id: product.id,
        productId: product.productId,
        name: normalizedName,
        // variants: 같은 이름의 다른 상품들
        variants: [product],
        // 모든 variants의 productId 목록
        productIds: [product.productId]
      };
    } else {
      // 기존 그룹에 추가
      const group = groupedMap[normalizedName];
      group.variants.push(product);
      group.productIds.push(product.productId);
      
      // 가격 범위 업데이트
      const allMinPrices = group.variants.map(v => v.minPrice || 0).filter(p => p > 0);
      const allMaxPrices = group.variants.map(v => v.maxPrice || 0).filter(p => p > 0);
      
      if (allMinPrices.length > 0) {
        group.minPrice = Math.min(...allMinPrices);
      }
      if (allMaxPrices.length > 0) {
        group.maxPrice = Math.max(...allMaxPrices);
        group.price = group.maxPrice;
      }
      
      // availableBranches 통합
      const allBranches = group.variants.flatMap(v => v.availableBranches || []);
      group.availableBranches = allBranches;
      group.availableBranchCount = allBranches.length;
      
      // 속성 그룹 통합
      const allAttributeGroups = {};
      
      group.variants.forEach(variant => {
        if (variant.attributeGroups && variant.attributeGroups.length > 0) {
          variant.attributeGroups.forEach(attrGroup => {
            const attrTypeName = attrGroup.attributeTypeName || '기본';
            
            if (!allAttributeGroups[attrTypeName]) {
              allAttributeGroups[attrTypeName] = {
                attributeTypeName: attrTypeName,
                values: {}
              };
            }
            
            if (attrGroup.values && attrGroup.values.length > 0) {
              attrGroup.values.forEach(valueGroup => {
                const valueName = valueGroup.attributeValueName || '기본';
                const valueKey = `${valueGroup.attributeValueId || valueName}`;
                
                if (!allAttributeGroups[attrTypeName].values[valueKey]) {
                  allAttributeGroups[attrTypeName].values[valueKey] = {
                    attributeValueId: valueGroup.attributeValueId,
                    attributeValueName: valueGroup.attributeValueName,
                    attributeTypeName: attrTypeName,
                    branches: []
                  };
                }
                
                // branches 통합
                if (valueGroup.branches && valueGroup.branches.length > 0) {
                  allAttributeGroups[attrTypeName].values[valueKey].branches.push(...valueGroup.branches);
                }
              });
            }
          });
        }
      });
      
      // attributeGroups를 배열로 변환
      const attributeGroupsArray = Object.values(allAttributeGroups).map(typeGroup => ({
        attributeTypeName: typeGroup.attributeTypeName,
        values: Object.values(typeGroup.values)
      }));
      
      group.attributeGroups = attributeGroupsArray.length > 0 ? attributeGroupsArray : null;
    }
  });
  
  // 그룹화된 상품들을 배열로 변환
  return Object.values(groupedMap);
}

export function useShopData() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [favorites, setFavorites] = useState(new Set());

  // 카테고리 로딩
  useEffect(() => {
    const categoryImageMap = {
      "신발": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
      "의류": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
      "가방": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80",
      "모자": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
      "액세서리": "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
      "러닝": "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=600&q=80",
      "트레이닝": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=600&q=80",
      "아웃도어": "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?q=80&w=600&auto=format&fit=crop",
      "축구": "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop",
      "농구": "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=600&auto=format&fit=crop",
      "요가": "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=600&q=80",
      "골프": "https://images.unsplash.com/photo-1548191265-cc70d3d45ba1?auto=format&fit=crop&w=600&q=80",
    };

    async function loadCategories() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/categories`);
        const data = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((c) => ({
          id: c.id || c.categoryId,
          name: c.name || "기타",
          photo: categoryImageMap[c.name] || categoryImageMap["의류"],
          description: c.description || ""
        }));
        
        if (mapped.length > 0) {
          setCategories(mapped);
        } else {
          setCategories(
            Object.keys(categoryImageMap).map((name) => ({ name, photo: categoryImageMap[name] }))
          );
        }
      } catch (e) {
        console.error('❌ 카테고리 로딩 실패:', e);
        setCategories([
          { name: "신발", photo: categoryImageMap["신발"] },
          { name: "의류", photo: categoryImageMap["의류"] },
          { name: "가방", photo: categoryImageMap["가방"] },
          { name: "모자", photo: categoryImageMap["모자"] },
        ]);
      }
    }

    loadCategories();
  }, []);

  // 상품 로딩
  useEffect(() => {
    async function loadBranchProducts() {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        
        const page = currentPage;
        const size = 12;
        
        const params = {
          page: page,
          size: size
        };
        
        if (selectedCategoryId) {
          params.categoryId = selectedCategoryId;
        }
        
        const res = await shopApi.get('/api/public/products/with-branches', {
          params: params
        });
        
        const responseData = res?.data?.data;
        const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
        
        if (isPageResponse) {
          setTotalPages(responseData.totalPages || 0);
          setTotalElements(responseData.totalElements || 0);
          const raw = responseData.content || [];
          
          const mapProduct = (item) => {
            // 속성별로 상품을 그룹화하기 위해 availableBranches를 속성 타입별로 분류
            const branchesByAttributeType = {};
            
            if (item.availableBranches && item.availableBranches.length > 0) {
              item.availableBranches.forEach(branch => {
                // 속성 타입별로 그룹화
                const attributeTypeName = branch.attributeTypeName || '기본';
                
                if (!branchesByAttributeType[attributeTypeName]) {
                  branchesByAttributeType[attributeTypeName] = {
                    attributeTypeName: attributeTypeName,
                    values: {} // 속성 값별로 분류
                  };
                }
                
                // 속성 값별로 분류
                const valueName = branch.attributeValueName || '기본';
                if (!branchesByAttributeType[attributeTypeName].values[valueName]) {
                  branchesByAttributeType[attributeTypeName].values[valueName] = {
                    attributeValueId: branch.attributeValueId,
                    attributeValueName: branch.attributeValueName,
                    branches: []
                  };
                }
                branchesByAttributeType[attributeTypeName].values[valueName].branches.push(branch);
              });
            }
            
            // 속성 그룹을 배열로 변환
            const attributeGroups = Object.values(branchesByAttributeType).map(typeGroup => ({
              attributeTypeName: typeGroup.attributeTypeName,
              values: Object.values(typeGroup.values)
            }));
            
            return {
              id: item.productId, // productId가 있는 경우만 사용
              productId: item.productId,
              name: item.productName || "상품",
              price: Number(item.maxPrice || item.minPrice || 0),
              minPrice: Number(item.minPrice || 0),
              maxPrice: Number(item.maxPrice || 0),
              promotionPrice: null,
              discountRate: null,
              imageAlt: item.productName || "상품 이미지",
              image: item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
              category: item.categoryName || "미분류",
              stock: 0,
              safetyStock: 0,
              isOutOfStock: false,
              isLowStock: false,
              brand: "",
              likes: 0,
              reviews: 0,
              pop: 0,
              discount: 0,
              description: item.description || "상품에 대한 자세한 설명이 없습니다.",
              specifications: [
                { name: "카테고리", value: item.categoryName || "정보 없음" },
              ],
              images: [item.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"],
              relatedProducts: [],
              availableBranches: item.availableBranches || [],
              availableBranchCount: item.availableBranchCount || 0,
              // 속성별 상품 정보 추가
              attributeGroups: attributeGroups.length > 0 ? attributeGroups : null
            };
          };

          const mapped = (Array.isArray(raw) ? raw : [])
            .filter((item) => item.productId != null) // productId가 없는 항목 제외
            .map(mapProduct);
        
          const filteredMapped = mapped.filter(item => {
            return item.availableBranchCount > 0 && item.availableBranches && item.availableBranches.length > 0;
          });
          
          // 상품명 기준으로 그룹화
          const groupedProducts = groupProductsByName(filteredMapped);
        
          setProducts(groupedProducts);
        } else {
          const raw = responseData || [];
          const mapped = (Array.isArray(raw) ? raw : [])
            .filter((item) => item.productId != null) // productId가 없는 항목 제외
            .map(mapProduct);
          const filteredMapped = mapped.filter(item => {
            return item.availableBranchCount > 0 && item.availableBranches && item.availableBranches.length > 0;
          });
          
          // 상품명 기준으로 그룹화
          const groupedProducts = groupProductsByName(filteredMapped);
          
          setProducts(groupedProducts);
          setTotalPages(0);
          setTotalElements(groupedProducts.length);
        }
      } catch (e) {
        console.error('❌ 상품 로딩 실패:', e);
        setProductsError(e?.message || "상품을 불러오지 못했습니다.");
        setProducts([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoadingProducts(false);
      }
    }
    loadBranchProducts();
  }, [currentPage, selectedCategoryId]);

  const getCategoryIdByName = (categoryName) => {
    if (!categoryName || categoryName === '전체') return null;
    const category = categories.find(c => c.name === categoryName);
    return category?.id || null;
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    categories,
    products,
    loadingProducts,
    productsError,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    selectedCategoryId,
    setSelectedCategoryId,
    favorites,
    toggleFavorite,
    getCategoryIdByName
  };
}

