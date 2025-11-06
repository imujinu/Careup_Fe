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

      const cartData = {
        memberId: currentUser.memberId,
        branchProductId: resolvedBranchProductId,
        quantity: 1,
        attributeName: null,
        attributeValue: null
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
        imageUrl: product.image
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

