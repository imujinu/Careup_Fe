import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart, clearCart } from '../../store/slices/cartSlice';
import { cartService } from '../../service/cartService';
import { customerAuthService } from '../../service/customerAuthService';
import { customerProductService } from '../../service/customerProductService';

export function useShopCart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddToCart = async (product) => {
    console.log('🛒 장바구니 추가 시작:', product);
    
    const isLoggedIn = customerAuthService.isAuthenticated();
    const currentUser = customerAuthService.getCurrentUser();

    if (!isLoggedIn || !currentUser) {
      alert('장바구니를 사용하려면 로그인이 필요합니다.');
      navigate('/shop/login');
      return;
    }

    try {
      const getBranchKey = (branch) => {
        if (!branch) return '';
        if (branch.branchProductId != null) return String(branch.branchProductId);
        const branchIdPart = branch.branchId != null ? branch.branchId : 'no-branch';
        const attrPart = branch.attributeValueId != null ? branch.attributeValueId : (branch.attributeValueName || 'no-attr');
        return `${branchIdPart}-${attrPart}`;
      };

      // product.id는 상품 ID이므로 branchProductId로 사용하면 안됨
      // branchProductId는 지점별 상품 ID이므로 availableBranches에서 찾아야 함
      let resolvedBranchProductId = product.selectedBranchProductId || product.branchProductId;
      let resolvedBranchId = product.selectedBranchId ?? null;
      const selectedOptions = Array.isArray(product.selectedOptions) ? product.selectedOptions : [];

      console.log('📦 초기 값:', {
        selectedBranchProductId: product.selectedBranchProductId,
        branchProductId: product.branchProductId,
        selectedBranchId: product.selectedBranchId,
        selectedBranchKey: product.selectedBranchKey,
        availableBranches: product.availableBranches?.length || 0,
        productId: product.productId,
        productIdWarning: product.id !== product.productId ? `⚠️ product.id(${product.id})와 product.productId(${product.productId})가 다름` : '일치'
      });

      let selectedBranch = null;
      if (product.availableBranches && product.availableBranches.length > 0) {
        // 1. selectedBranchProductId로 찾기
        if (product.selectedBranchProductId != null) {
          selectedBranch = product.availableBranches.find(
            (b) => String(b.branchProductId) === String(product.selectedBranchProductId)
          );
          console.log('🔍 selectedBranchProductId로 찾기:', selectedBranch ? '찾음' : '못찾음');
        }
        // 2. selectedBranchKey로 찾기
        if (!selectedBranch && product.selectedBranchKey) {
          selectedBranch = product.availableBranches.find(
            (b) => getBranchKey(b) === product.selectedBranchKey
          );
          console.log('🔍 selectedBranchKey로 찾기:', selectedBranch ? '찾음' : '못찾음');
        }
        // 3. selectedBranchId로 찾기 (같은 지점의 첫 번째 상품 사용)
        if (!selectedBranch && product.selectedBranchId != null) {
          selectedBranch = product.availableBranches.find(
            (b) => String(b.branchId) === String(product.selectedBranchId)
          );
          console.log('🔍 selectedBranchId로 찾기:', selectedBranch ? '찾음' : '못찾음');
        }
        // 4. branchProductId로 찾기 (이미 선택된 지점 상품)
        if (!selectedBranch && product.branchProductId != null) {
          selectedBranch = product.availableBranches.find(
            (b) => String(b.branchProductId) === String(product.branchProductId)
          );
          console.log('🔍 branchProductId로 찾기:', selectedBranch ? '찾음' : '못찾음');
        }

        if (selectedBranch) {
          resolvedBranchProductId = selectedBranch.branchProductId;
          resolvedBranchId = selectedBranch.branchId;
          console.log('✅ 지점 찾음:', {
            branchName: selectedBranch.branchName,
            branchProductId: selectedBranch.branchProductId,
            branchId: selectedBranch.branchId
          });
        } else {
          // 지점이 선택되지 않았으면 첫 번째 지점 사용
          const firstBranch = product.availableBranches[0];
          if (firstBranch) {
            resolvedBranchProductId = firstBranch.branchProductId;
            resolvedBranchId = firstBranch.branchId;
            selectedBranch = firstBranch;
            console.log('⚠️ 첫 번째 지점 사용 (지점 미선택):', {
              branchName: firstBranch.branchName,
              branchProductId: firstBranch.branchProductId
            });
          }
        }
      }

      console.log('📊 최종 resolved 값:', {
        resolvedBranchProductId,
        resolvedBranchId,
        selectedBranch: selectedBranch?.branchName
      });

      // branchProductId가 없으면 첫 번째 지점 사용 (장바구니에서 선택하도록 함)
      let numericBranchProductId = null;
      if (resolvedBranchProductId && resolvedBranchProductId !== null && resolvedBranchProductId !== undefined) {
        numericBranchProductId = Number(resolvedBranchProductId);
        if (isNaN(numericBranchProductId) || numericBranchProductId <= 0) {
          numericBranchProductId = null;
        }
      }
      
      // branchProductId가 없으면 첫 번째 지점의 branchProductId 사용
      if (!numericBranchProductId && product.availableBranches && product.availableBranches.length > 0) {
        const firstBranch = product.availableBranches[0];
        if (firstBranch && firstBranch.branchProductId) {
          numericBranchProductId = Number(firstBranch.branchProductId);
          resolvedBranchId = firstBranch.branchId;
          selectedBranch = firstBranch;
          console.log('⚠️ branchProductId 없음, 첫 번째 지점 사용:', {
            branchProductId: numericBranchProductId,
            branchName: firstBranch.branchName
          });
        }
      }
      
      // 여전히 branchProductId가 없으면 에러
      if (!numericBranchProductId) {
        console.error('❌ branchProductId를 찾을 수 없음');
        alert('상품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      console.log('✅ 사용할 branchProductId:', numericBranchProductId);

      let resolvedPrice = product?.minPrice || product?.price || 0;
      if (selectedBranch && selectedBranch.price) {
        resolvedPrice = Number(selectedBranch.price);
      } else if (product.availableBranches && product.availableBranches.length > 0) {
        const fallbackBranch = product.availableBranches[0];
        if (fallbackBranch?.price) {
          resolvedPrice = Number(fallbackBranch.price);
        }
      }

      const cartPayload = {
        productId: product.productId,
        branchProductId: numericBranchProductId,
        branchId: resolvedBranchId || selectedBranch?.branchId || product.branchId || 1,
        productName: product.name,
        price: resolvedPrice,
        quantity: 1,
        imageUrl: product.image,
        options: selectedOptions,
        branchName: selectedBranch?.branchName,
        stockQuantity: selectedBranch?.stockQuantity,
        attributeTypeName: selectedBranch?.attributeTypeName,
        attributeValueId: selectedBranch?.attributeValueId,
        attributeValueName: selectedBranch?.attributeValueName,
        attributeName: selectedOptions[0]?.label || null,
        attributeValue: selectedOptions[0]?.value || null,
        selectedAttributes: product.selectedAttributes || {}
      };
      
      console.log('📦 Redux dispatch 준비:', cartPayload);
      
      try {
        dispatch(addToCart(cartPayload));
        console.log('✅ Redux dispatch 성공');
      } catch (error) {
        console.error('❌ Redux dispatch 실패:', error);
        alert(error.message || '장바구니 추가에 실패했습니다.');
        return;
      }

      const cartData = {
        memberId: currentUser.memberId,
        branchProductId: numericBranchProductId,
        quantity: 1,
        attributeName: selectedOptions[0]?.label || null,
        attributeValue: selectedOptions[0]?.value || null
      };

      console.log('📤 장바구니 API 요청 데이터:', cartData);
      const response = await cartService.addToCart(cartData);
      console.log('✅ 장바구니 API 응답:', response);

      alert(`${product.name}이(가) 장바구니에 추가되었습니다.`);
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        alert('장바구니를 사용하려면 로그인이 필요합니다.');
        navigate('/shop/login');
        return;
      }
      const errorMessage =
        error?.response?.data?.status_message ||
        error?.response?.data?.message ||
        '장바구니 추가에 실패했습니다.';
      alert(errorMessage);
    }
  };

  const handleProductClick = async (product) => {
    const productId = product.productId || product.id;
    
    // 유효한 productId인지 확인 (정수이고 0보다 커야 함)
    const isValidProductId = productId != null && 
                             typeof productId === 'number' && 
                             Number.isInteger(productId) && 
                             productId > 0;
    
    if (!isValidProductId) {
      console.error('❌ 유효하지 않은 상품 ID:', productId);
      alert('상품 정보를 불러올 수 없습니다.');
      return;
    }
    
    // 상품 클릭 시 조회 API 요청
    if (productId) {
      await customerProductService.recordProductViewClick(productId);
    }
    
    navigate(`/shop/products/${productId}`);
  };

  return {
    handleAddToCart,
    handleProductClick
  };
}

