// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { checkAuthStatus } from "./stores/slices/authSlice";

import Layout from "./layout/Layout";
import Login from "./pages/auth/Login";
import { ToastProvider } from "./components/common/Toast";
import ShopApp from "./storefront/pages/ShopApp";

// 본사 및 가맹점 라우트
import { headquartersRoutes } from "./routes/headquartersRoutes";
import { franchiseRoutes } from "./routes/franchiseRoutes";

// 고객용 (auth)
import CustomerLogin from "./pages/auth/CustomerLogin";
import OauthCallbackGoogle from "./pages/auth/OauthCallbackGoogle";
import OauthCallbackKakao from "./pages/auth/OauthCallbackKakao";
import AdditionalInfo from "./pages/auth/AdditionalInfo";
import CustomerSignup from "./pages/auth/CustomerSignup";

// 비밀번호 찾기/재설정
import PasswordResetRequest from "./pages/auth/PasswordResetRequest";
import PasswordReset from "./pages/auth/PasswordReset";

function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, branchId } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout userType={userType} branchId={branchId}>
      <Outlet />
    </Layout>
  );
}

function RouteWrapper({ headquartersComponent, franchiseComponent }) {
  const { userType } = useAppSelector((state) => state.auth);
  return userType === "headquarters" ? headquartersComponent : franchiseComponent;
}

export default function App() {
  const getRouteElement = (path) => {
    const hqRoute = headquartersRoutes.find((r) => r.path === path);
    const frRoute = franchiseRoutes.find((r) => r.path === path);

    if (hqRoute && frRoute) {
      return (
        <RouteWrapper
          headquartersComponent={hqRoute.element}
          franchiseComponent={frRoute.element}
        />
      );
    } else if (hqRoute) {
      return hqRoute.element;
    } else if (frRoute) {
      return frRoute.element;
    }
    return null;
  };

  const allPaths = Array.from(
    new Set([
      ...headquartersRoutes.map((r) => r.path).filter(Boolean),
      ...franchiseRoutes.map((r) => r.path).filter(Boolean),
    ])
  );

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* 쇼핑몰 - 인증 불필요 */}
          <Route path="/shop/*" element={<ShopApp />} />

          {/* 직원 로그인 */}
          <Route path="/login" element={<Login />} />

          {/* 직원용 포털 - 인증이 필요한 라우트들 */}
          <Route element={<ProtectedRoute />}>
            {/* 🔴 (중요) index 라우트 제거해서 루트 진입 시 로그인으로 안 빠지게 함 */}
            {allPaths.map((path) => (
              <Route key={path} path={path} element={getRouteElement(path)} />
            ))}
          </Route>

          {/* 고객용 인증 플로우 */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/oauth/google/callback" element={<OauthCallbackGoogle />} />
          <Route path="/oauth/kakao/callback" element={<OauthCallbackKakao />} />
          <Route path="/customer/oauth/additional-info" element={<AdditionalInfo />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />

          {/* 비번 찾기/재설정 */}
          <Route path="/customer/password/forgot" element={<PasswordResetRequest />} />
          <Route path="/customer/password/reset" element={<PasswordReset />} />
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="/password/reset" element={<PasswordReset />} />

          {/* 루트/기타 → 쇼핑 홈 */}
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
