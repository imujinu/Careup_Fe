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
    const isLoggedIn = customerAuthService.isAuthenticated();
    const currentUser = customerAuthService.getCurrentUser();

    if (!isLoggedIn || !currentUser) {
      alert('장바구니를 사용하려면 로그인이 필요합니다.');
      navigate('/shop/login');
      return;
    }

    try {
      let resolvedBranchProductId = product.branchProductId || product.id;
      let resolvedBranchId = product.selectedBranchId || null;

      if (product.availableBranches && product.availableBranches.length > 0) {
        if (product.selectedBranchId != null) {
          const selectedBranch = product.availableBranches.find(
            (b) => String(b.branchId) === String(product.selectedBranchId)
          );
          if (selectedBranch) {
            resolvedBranchProductId = selectedBranch.branchProductId || resolvedBranchProductId;
            resolvedBranchId = selectedBranch.branchId;
          }
        } else {
          const firstBranch = product.availableBranches[0];
          if (firstBranch) {
            resolvedBranchProductId = firstBranch.branchProductId || resolvedBranchProductId;
            resolvedBranchId = firstBranch.branchId;
          }
        }
      }

      // 선택된 옵션 정보 추출
      let attributeName = null;
      let attributeValue = null;
      
      if (product.selectedOptionInfo && Object.keys(product.selectedOptionInfo).length > 0) {
        // 첫 번째 옵션 정보 사용 (또는 모든 옵션을 조합)
        const optionKeys = Object.keys(product.selectedOptionInfo);
        if (optionKeys.length > 0) {
          const firstOption = product.selectedOptionInfo[optionKeys[0]];
          attributeName = firstOption.attributeTypeName || null;
          attributeValue = firstOption.attributeValueName || null;
          
          // 여러 옵션이 있는 경우 조합 (예: "Hot, Large")
          if (optionKeys.length > 1) {
            const optionValues = optionKeys.map(key => 
              product.selectedOptionInfo[key].attributeValueName
            ).filter(Boolean);
            attributeValue = optionValues.join(', ');
          }
        }
      }

      const cartData = {
        memberId: currentUser.memberId,
        branchProductId: resolvedBranchProductId,
        quantity: 1,
        attributeName: attributeName,
        attributeValue: attributeValue
      };

      await cartService.addToCart(cartData);

      let resolvedPrice = product?.minPrice || product?.price || 0;
      if (product.availableBranches && product.availableBranches.length > 0) {
        const selected = product.selectedBranchId != null
          ? product.availableBranches.find((b) => String(b.branchId) === String(product.selectedBranchId))
          : product.availableBranches[0];
        if (selected && selected.price) {
          resolvedPrice = Number(selected.price);
        }
      }

      dispatch(addToCart({
        productId: product.productId,
        branchProductId: resolvedBranchProductId,
        branchId: resolvedBranchId || 1,
        productName: product.name,
        price: resolvedPrice,
        quantity: 1,
        imageUrl: product.image,
        attributeName: attributeName,
        attributeValue: attributeValue,
        selectedAttributes: product.selectedAttributes || {},
        selectedOptionInfo: product.selectedOptionInfo || {}
      }));

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
    
    if (productId) {
      await customerProductService.recordProductView(productId);
    }
    navigate(`/shop/products/${productId}`);
  };

  return {
    handleAddToCart,
    handleProductClick
  };
}

