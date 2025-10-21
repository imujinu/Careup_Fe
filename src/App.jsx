import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { checkAuthStatus } from "./stores/slices/authSlice";

import Layout from "./layout/Layout";
import InventoryManagement from "./pages/inventory/InventoryManagement";
import FranchiseInventoryManagement from "./pages/inventory/FranchiseInventoryManagement";
import PurchaseOrderManagement from "./pages/purchaseOrder/PurchaseOrderManagement";
import FranchisePurchaseOrderManagement from "./pages/purchaseOrder/FranchisePurchaseOrderManagement";
import Login from "./pages/auth/Login";

// 고객용 (auth 폴더 경로로 통일)
import CustomerLogin from './pages/auth/CustomerLogin';
import OAuthCallbackGoogle from './pages/auth/OauthCallbackGoogle';
import OAuthCallbackKakao from './pages/auth/OauthCallbackKakao';
import AdditionalInfo from './pages/auth/AdditionalInfo';
import SuccessPage from './pages/auth/Success';
import CustomerHome from './pages/customer/CustomerHome';

function EmployeeApp() {
  const [currentPage, setCurrentPage] = useState("inventory");
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, branchId } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const renderPage = () => {
    if (userType === "headquarters") {
      switch (currentPage) {
        case "inventory":
          return <InventoryManagement />;
        case "purchaseOrder":
          return <PurchaseOrderManagement />;
        default:
          return <InventoryManagement />;
      }
    } else {
      switch (currentPage) {
        case "inventory":
          return <FranchiseInventoryManagement />;
        case "purchaseOrder":
          return <FranchisePurchaseOrderManagement />;
        default:
          return <FranchiseInventoryManagement />;
      }
    }
  };

  const handleLoginSuccess = () => {};

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      userType={userType}
      branchId={branchId}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 직원용 포털 */}
        <Route path="/" element={<EmployeeApp />} />
        <Route path="/login" element={<EmployeeApp />} />

        {/* 고객용 인증 플로우 */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/oauth/google/callback" element={<OAuthCallbackGoogle />} />
        <Route path="/oauth/kakao/callback" element={<OAuthCallbackKakao />} />
        <Route path="/customer/oauth/additional-info" element={<AdditionalInfo />} />
        <Route path="/customer/success" element={<SuccessPage />} />
        <Route path="/customer/home" element={<CustomerHome />} />

        {/* 알 수 없는 경로 → 루트로 이동 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
