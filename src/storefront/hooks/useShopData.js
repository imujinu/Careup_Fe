import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { customerProductService } from '../../service/customerProductService';

const API_BASE_URL = import.meta.env.VITE_ORDERING_URL || 'http://localhost:8080/ordering-service';
const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

// 상품명 기준으로 그룹화하는 함수
function groupProductsByName(products) {
  const groupedMap = {};
  const defaultImage = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
  
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
        // 이미지: 기본 이미지가 아니면 사용, 아니면 나중에 variants에서 찾기
        image: product.image && product.image !== defaultImage ? product.image : product.image,
        images: product.images && product.images.length > 0 ? product.images : [product.image || defaultImage],
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
      
      // 이미지 업데이트: 기본 이미지가 아니고, 현재 그룹의 이미지가 기본 이미지면 업데이트
      if (group.image === defaultImage && product.image && product.image !== defaultImage) {
        group.image = product.image;
        group.images = [product.image];
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
                    imageUrl: valueGroup.imageUrl, // 이미지 URL 추가
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
  
  // 그룹화된 상품들을 배열로 변환하고 최종 이미지 확인
  return Object.values(groupedMap).map(group => {
    // 그룹의 이미지가 기본 이미지인 경우, variants에서 이미지 찾기
    if (group.image === defaultImage) {
      for (const variant of group.variants) {
        if (variant.image && variant.image !== defaultImage) {
          group.image = variant.image;
          group.images = [variant.image];
          break;
        }
      }
    }
    return group;
  });
}

export function useShopData() {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const isLoadingRef = useRef(false); // 로딩 중인지 추적
  const productsRef = useRef([]); // 이전 products 저장
  const abortControllerRef = useRef(null); // 요청 취소를 위한 AbortController

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
        setLoadingCategories(true);
        setCategoriesError(null);
        
        const res = await axios.get(`${API_BASE_URL}/api/categories`, {
          timeout: 10000 // 10초 타임아웃
        });
        const data = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(data) ? data : [];
        const mapped = list.map((c, index) => ({
          id: c.id || c.categoryId || `default-${index}`, // id가 없으면 기본값 사용
          name: c.name || "기타",
          photo: categoryImageMap[c.name] || categoryImageMap["의류"],
          description: c.description || ""
        }));
        
        if (mapped.length > 0) {
          setCategories(mapped);
        } else {
          // API 응답이 빈 배열이면 기본 카테고리 사용
          const defaultCategories = Object.keys(categoryImageMap).map((name, index) => ({
            id: `default-${index}`,
            name,
            photo: categoryImageMap[name]
          }));
          setCategories(defaultCategories);
        }
      } catch (e) {
        console.error('❌ 카테고리 로딩 실패:', e);
        setCategoriesError(e?.message || '카테고리를 불러오지 못했습니다.');
        // 에러 발생 시 기본 카테고리 사용
        const defaultCategories = [
          { id: 'default-0', name: "신발", photo: categoryImageMap["신발"] },
          { id: 'default-1', name: "의류", photo: categoryImageMap["의류"] },
          { id: 'default-2', name: "가방", photo: categoryImageMap["가방"] },
          { id: 'default-3', name: "모자", photo: categoryImageMap["모자"] },
        ];
        setCategories(defaultCategories);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // 상품 로딩
  useEffect(() => {
    async function loadBranchProducts() {
      // 이전 요청이 있으면 취소하고 로딩 상태 해제
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        isLoadingRef.current = false;
        setLoadingProducts(false);
      }
      
      // 새로운 AbortController 생성
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      try {
        isLoadingRef.current = true;
        // 로딩 상태 설정 (이전 데이터가 있어도 로딩 상태 표시)
        setLoadingProducts(true);
        setProductsError(null);
        
        const page = currentPage;
        const targetSize = 12; // 목표 상품 개수
        let allRawProducts = [];
        let currentPageNum = 0; // 항상 처음부터 시작
        let hasMore = true;
        let totalPagesFromApi = 0;
        let totalElementsFromApi = 0;
        
        // 전체 상품을 모두 요청해서 그룹화 후 페이지네이션
        // 최대 1000개까지 요청 (너무 많으면 성능 문제)
        const maxRequests = 50; // 최대 50페이지 (50 * 24 = 1200개)
        let requestCount = 0;
        
        while (hasMore && requestCount < maxRequests) {
          const params = {
            page: currentPageNum,
            size: 24 // 한 번에 24개씩 요청
          };
          
          if (selectedCategoryId) {
            params.categoryId = selectedCategoryId;
          }
          
          const res = await shopApi.get('/api/public/products/with-branches', {
            params: params,
            signal: abortController.signal
          });
          
          // 요청이 취소되었는지 확인
          if (abortController.signal.aborted) {
            return;
          }
          
          const responseData = res?.data?.data;
          const isPageResponse = responseData && typeof responseData === 'object' && 'content' in responseData;
          
          if (isPageResponse) {
            if (currentPageNum === 0) {
              // 첫 페이지에서 전체 페이지 정보 저장
              totalPagesFromApi = responseData.totalPages || 0;
              totalElementsFromApi = responseData.totalElements || 0;
            }
            
            const raw = responseData.content || [];
            
            if (raw.length === 0) {
              hasMore = false;
            } else {
              allRawProducts.push(...raw);
              // 다음 페이지가 있는지 확인
              if (currentPageNum >= totalPagesFromApi - 1) {
                hasMore = false;
              } else {
                currentPageNum++;
                requestCount++;
              }
            }
          } else {
            hasMore = false;
          }
        }
        
        // 이미지 찾기 헬퍼 함수
        const findImage = (item) => {
          const defaultImage = "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
          
          // 1순위: imageUrl 필드 확인
          if (item.imageUrl) {
            return item.imageUrl;
          }
          // 2순위: image 필드 확인
          if (item.image) {
            return item.image;
          }
          // 3순위: productImageUrl 확인
          if (item.productImageUrl) {
            return item.productImageUrl;
          }
          // 4순위: productImage 확인
          if (item.productImage) {
            return item.productImage;
          }
          // 5순위: availableBranches에서 이미지 찾기
          if (item.availableBranches && item.availableBranches.length > 0) {
            for (const branch of item.availableBranches) {
              if (branch.imageUrl) {
                return branch.imageUrl;
              }
            }
          }
          // 6순위: 기본 이미지 사용
          return defaultImage;
        };
        
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
                    imageUrl: branch.imageUrl, // 속성 값별 이미지 추가
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
            
            // findImage는 외부에서 호출하므로 여기서는 기본값만 설정
            const productImage = item.imageUrl || item.image || item.productImageUrl || item.productImage || "https://beyond-16-care-up.s3.ap-northeast-2.amazonaws.com/image/products/default/product-default-image.png";
            
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
              image: productImage,
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
              images: [productImage],
              relatedProducts: [],
              availableBranches: item.availableBranches || [],
              availableBranchCount: item.availableBranchCount || 0,
              // 속성별 상품 정보 추가
              attributeGroups: attributeGroups.length > 0 ? attributeGroups : null
            };
          };

          const mapped = (Array.isArray(allRawProducts) ? allRawProducts : [])
            .filter((item) => item.productId != null) // productId가 없는 항목 제외
            .map((item, index) => {
              // findImage에 index 전달
              const productImage = findImage(item, index);
              const mappedItem = mapProduct(item);
              // mapProduct 내부에서 findImage를 호출하므로, 여기서 다시 설정
              mappedItem.image = productImage;
              mappedItem.images = [productImage];
              return mappedItem;
            });
        
          const filteredMapped = mapped.filter(item => {
            return item.availableBranchCount > 0 && item.availableBranches && item.availableBranches.length > 0;
          });
          
          // 상품명 기준으로 그룹화
          const groupedProducts = groupProductsByName(filteredMapped);
          
          // 그룹화 후 전체 상품 수를 기반으로 totalPages 재계산
          const groupedTotalElements = groupedProducts.length;
          const groupedTotalPages = Math.ceil(groupedTotalElements / targetSize);
          
          // 그룹화 후에도 페이지당 12개가 되도록 슬라이스
          const startIndex = page * targetSize;
          const endIndex = startIndex + targetSize;
          const paginatedProducts = groupedProducts.slice(startIndex, endIndex);
        
          // 로딩이 완료된 후에만 products 업데이트 (깜빡임 방지)
          setProducts(paginatedProducts);
          productsRef.current = paginatedProducts; // ref에도 저장
          // 그룹화 후 실제 상품 수를 기반으로 페이지네이션 정보 업데이트
          setTotalPages(groupedTotalPages);
          setTotalElements(groupedTotalElements);
      } catch (e) {
        // 요청 취소로 인한 에러는 무시
        if (e.name === 'AbortError' || e.name === 'CanceledError' || abortController.signal.aborted) {
          return;
        }
        
        console.error('❌ 상품 로딩 실패:', e);
        setProductsError(e?.message || "상품을 불러오지 못했습니다.");
        // 에러 발생 시에만 products를 빈 배열로 설정 (이전 데이터가 있으면 유지)
        if (productsRef.current.length === 0) {
          setProducts([]);
          productsRef.current = [];
        }
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        // 요청이 취소되지 않았을 때만 로딩 상태 해제
        if (!abortController.signal.aborted && abortControllerRef.current === abortController) {
          setLoadingProducts(false);
          isLoadingRef.current = false;
        }
        // 현재 요청이면 ref 초기화
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    }
    loadBranchProducts();
  }, [currentPage, selectedCategoryId]);

  // products 상태가 변경될 때 ref도 동기화
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const getCategoryIdByName = (categoryName) => {
    if (!categoryName || categoryName === '전체') return null;
    if (!categories || categories.length === 0) return null;
    
    // 정확한 이름 매칭 시도
    let category = categories.find(c => c.name === categoryName);
    
    // 정확한 매칭이 실패하면 대소문자 무시하고 공백 제거 후 매칭
    if (!category) {
      const normalizedName = categoryName.trim().toLowerCase();
      category = categories.find(c => {
        const normalized = (c.name || '').trim().toLowerCase();
        return normalized === normalizedName;
      });
    }
    
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
    loadingCategories,
    categoriesError,
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

