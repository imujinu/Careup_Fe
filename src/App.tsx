import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import InventoryManagement from './pages/InventoryManagement';
import PurchaseOrderManagement from './pages/PurchaseOrderManagement';
import FranchiseInventoryManagement from './pages/FranchiseInventoryManagement';
import FranchisePurchaseOrderManagement from './pages/FranchisePurchaseOrderManagement';
import Login from './pages/Login';
import { authService } from './service/authService';

function App() {
  const [currentPage, setCurrentPage] = useState('inventory');
  const [userType, setUserType] = useState('franchise'); // 'headquarters' or 'franchise'
  const [branchId, setBranchId] = useState(2); // 1: 본사, 2+: 가맹점
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // JWT에서 사용자 정보 자동 추출
    if (authService.isAuthenticated()) {
      const userInfo = authService.getCurrentUser();
      
      if (userInfo) {
        setBranchId(userInfo.branchId || 2);
        setUserType(userInfo.userType || 'franchise');
        setIsAuthenticated(true);
      } else {
        // 로그인 안 되어 있으면 임시로 가맹점으로 설정 (개발용)
        setBranchId(2);
        setUserType('franchise');
        setIsAuthenticated(false);
      }
    } else {
      // 로그인 안 되어 있으면 임시로 가맹점으로 설정 (개발용)
      setBranchId(2);
      setUserType('franchise');
      setIsAuthenticated(false);
    }
  }, []);

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
    setBranchId(userInfo.branchId || 2);
    setUserType(userInfo.userType || 'franchise');
    setIsAuthenticated(true);
  };

  // 로그인 안 되어 있으면 로그인 페이지 표시
  if (!isAuthenticated && !authService.isAuthenticated()) {
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
