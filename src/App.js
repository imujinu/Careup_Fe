import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './stores/hooks';
import { checkAuthStatus } from './stores/slices/authSlice';
import Layout from './layout/Layout';
import InventoryManagement from './pages/inventory/InventoryManagement';
import FranchiseInventoryManagement from './pages/inventory/FranchiseInventoryManagement';
import PurchaseOrderManagement from './pages/purchaseOrder/PurchaseOrderManagement';
import FranchisePurchaseOrderManagement from './pages/purchaseOrder/FranchisePurchaseOrderManagement';
import Login from './pages/auth/Login';

function App() {
  const [currentPage, setCurrentPage] = useState('inventory');
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, branchId, user } = useAppSelector(state => state.auth);

  useEffect(() => {
    // 앱 시작 시 인증 상태 확인
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const renderPage = () => {
    // 본사 사용자 (branchId === 1)
    if (userType === 'headquarters') {
      switch(currentPage) {
        case 'inventory':
          return React.createElement(InventoryManagement, null);
        case 'purchaseOrder':
          return React.createElement(PurchaseOrderManagement, null);
        default:
          return React.createElement(InventoryManagement, null);
      }
    }
    // 가맹점 사용자 (branchId > 1)
    else {
      switch(currentPage) {
        case 'inventory':
          return React.createElement(FranchiseInventoryManagement, null);
        case 'purchaseOrder':
          return React.createElement(FranchisePurchaseOrderManagement, null);
        default:
          return React.createElement(FranchiseInventoryManagement, null);
      }
    }
  };

  const handleLoginSuccess = (userInfo) => {
    // Redux 상태는 loginUser thunk에서 자동으로 업데이트됨
    console.log('로그인 성공:', userInfo);
  };

  // 로그인 안 되어 있으면 로그인 페이지 표시
  if (!isAuthenticated) {
    return React.createElement(Login, { onLoginSuccess: handleLoginSuccess });
  }

  return React.createElement(Layout, { 
    currentPage, 
    onPageChange: setCurrentPage,
    userType,
    branchId
  }, renderPage());
}

export default App;
