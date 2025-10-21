import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { checkAuthStatus } from "./stores/slices/authSlice";

import Layout from "./layout/Layout";
import Login from "./pages/auth/Login";

// 본사 및 가맹점 라우트
import { headquartersRoutes } from "./routes/headquartersRoutes";
import { franchiseRoutes } from "./routes/franchiseRoutes";

// 고객용 (auth 폴더 경로로 통일)
import CustomerLogin from './pages/auth/CustomerLogin';
import OAuthCallbackGoogle from './pages/auth/OauthCallbackGoogle';
import OAuthCallbackKakao from './pages/auth/OauthCallbackKakao';
import AdditionalInfo from './pages/auth/AdditionalInfo';
import SuccessPage from './pages/auth/Success';
import CustomerHome from './pages/customer/CustomerHome';

// 인증이 필요한 라우트를 감싸는 컴포넌트
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

// 사용자 타입에 따라 적절한 컴포넌트를 렌더링하는 래퍼
function RouteWrapper({ headquartersComponent, franchiseComponent }) {
  const { userType } = useAppSelector((state) => state.auth);
  return userType === "headquarters" ? headquartersComponent : franchiseComponent;
}

export default function App() {
  // 공통 경로와 본사 전용 경로를 매핑
  const getRouteElement = (path) => {
    const hqRoute = headquartersRoutes.find(r => r.path === path);
    const frRoute = franchiseRoutes.find(r => r.path === path);
    
    if (hqRoute && frRoute) {
      // 공통 경로인 경우 userType에 따라 다른 컴포넌트 렌더링
      return <RouteWrapper headquartersComponent={hqRoute.element} franchiseComponent={frRoute.element} />;
    } else if (hqRoute) {
      // 본사 전용 경로
      return hqRoute.element;
    } else if (frRoute) {
      // 가맹점 전용 경로
      return frRoute.element;
    }
    return null;
  };

  // 모든 고유한 경로를 수집
  const allPaths = Array.from(
    new Set([
      ...headquartersRoutes.map(r => r.path).filter(Boolean),
      ...franchiseRoutes.map(r => r.path).filter(Boolean),
    ])
  );

  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/login" element={<Login />} />

        {/* 직원용 포털 - 인증이 필요한 라우트들 */}
        <Route element={<ProtectedRoute />}>
          {/* index 라우트 처리 */}
          {(headquartersRoutes.find(r => r.index) || franchiseRoutes.find(r => r.index)) && (
            <Route 
              index 
              element={
                <RouteWrapper 
                  headquartersComponent={headquartersRoutes.find(r => r.index)?.element} 
                  franchiseComponent={franchiseRoutes.find(r => r.index)?.element} 
                />
              } 
            />
          )}
          {/* 모든 경로 등록 */}
          {allPaths.map((path) => (
            <Route key={path} path={path} element={getRouteElement(path)} />
          ))}
        </Route>

        {/* 고객용 인증 플로우 */}
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/oauth/google/callback" element={<OAuthCallbackGoogle />} />
        <Route path="/oauth/kakao/callback" element={<OAuthCallbackKakao />} />
        <Route path="/customer/oauth/additional-info" element={<AdditionalInfo />} />
        <Route path="/customer/success" element={<SuccessPage />} />
        <Route path="/customer/home" element={<CustomerHome />} />

        {/* 루트 경로는 로그인 페이지로 */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 알 수 없는 경로 → 로그인으로 이동 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
