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
      const getBranchKey = (branch) => {
        if (!branch) return '';
        if (branch.branchProductId != null) return String(branch.branchProductId);
        const branchIdPart = branch.branchId != null ? branch.branchId : 'no-branch';
        const attrPart = branch.attributeValueId != null ? branch.attributeValueId : (branch.attributeValueName || 'no-attr');
        return `${branchIdPart}-${attrPart}`;
      };

      let resolvedBranchProductId = product.selectedBranchProductId || product.branchProductId || product.id;
      let resolvedBranchId = product.selectedBranchId ?? null;
      const selectedOptions = Array.isArray(product.selectedOptions) ? product.selectedOptions : [];

      let selectedBranch = null;
      if (product.availableBranches && product.availableBranches.length > 0) {
        if (product.selectedBranchProductId != null) {
          selectedBranch = product.availableBranches.find(
            (b) => String(b.branchProductId) === String(product.selectedBranchProductId)
          );
        }
        if (!selectedBranch && product.selectedBranchKey) {
          selectedBranch = product.availableBranches.find(
            (b) => getBranchKey(b) === product.selectedBranchKey
          );
        }
        if (!selectedBranch && product.selectedBranchId != null) {
          selectedBranch = product.availableBranches.find(
            (b) => String(b.branchId) === String(product.selectedBranchId)
          );
        }

        if (selectedBranch) {
          resolvedBranchProductId = selectedBranch.branchProductId || resolvedBranchProductId;
          resolvedBranchId = selectedBranch.branchId;
        } else {
          const firstBranch = product.availableBranches[0];
          if (firstBranch) {
            resolvedBranchProductId = firstBranch.branchProductId || resolvedBranchProductId;
            resolvedBranchId = firstBranch.branchId;
            selectedBranch = firstBranch;
          }
        }
      }

      let resolvedPrice = product?.minPrice || product?.price || 0;
      if (selectedBranch && selectedBranch.price) {
        resolvedPrice = Number(selectedBranch.price);
      } else if (product.availableBranches && product.availableBranches.length > 0) {
        const fallbackBranch = product.availableBranches[0];
        if (fallbackBranch?.price) {
          resolvedPrice = Number(fallbackBranch.price);
        }
      }

      dispatch(addToCart({
        productId: product.productId,
        branchProductId: resolvedBranchProductId,
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
        attributeValueName: selectedBranch?.attributeValueName
      }));

      const cartData = {
        memberId: currentUser.memberId,
        branchProductId: resolvedBranchProductId,
        quantity: 1,
        attributeName: selectedOptions[0]?.label || null,
        attributeValue: selectedOptions[0]?.value || null
      };

      await cartService.addToCart(cartData);


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

