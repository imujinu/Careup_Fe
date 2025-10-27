// src/App.jsx
import React, { useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAppDispatch, useAppSelector } from "./stores/hooks";
import { checkAuthStatus } from "./stores/slices/authSlice";

import Layout from "./layout/Layout";
import Login from "./pages/auth/Login";
import { ToastProvider } from "./components/common/Toast";
import ShopApp from "./storefront/pages/ShopApp";

import { headquartersRoutes } from "./routes/headquartersRoutes";
import { franchiseRoutes } from "./routes/franchiseRoutes";

import CustomerLogin from "./pages/auth/CustomerLogin";
import OauthCallbackGoogle from "./pages/auth/OauthCallbackGoogle";
import OauthCallbackKakao from "./pages/auth/OauthCallbackKakao";
import AdditionalInfo from "./pages/auth/AdditionalInfo";
import CustomerSignup from "./pages/auth/CustomerSignup";
import PasswordResetRequest from "./pages/auth/PasswordResetRequest";
import PasswordReset from "./pages/auth/PasswordReset";
import EmployeePasswordResetRequest from "./pages/auth/EmployeePasswordResetRequest";
import EmployeePasswordReset from "./pages/auth/EmployeePasswordReset";

// 동적 파비콘/타이틀에 사용할 에셋
import careupFavicon from "./assets/logos/care-up_logo_primary.svg";
import sharkFavicon from "./assets/logos/shark-favicon.svg";

// 로그인 보호 레이어
function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, branchId } = useAppSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Layout userType={userType} branchId={branchId}>
      <Outlet />
    </Layout>
  );
}

// 본사/가맹 구분 렌더
function RouteWrapper({ headquartersComponent, franchiseComponent }) {
  const { userType } = useAppSelector((state) => state.auth);
  return userType === "headquarters" ? headquartersComponent : franchiseComponent;
}

// 직원 로그아웃 감지 → 로그인 화면으로 안내
function StaffLogoutWatcher() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const prev = useRef(isAuthenticated);

  useEffect(() => {
    if (prev.current && !isAuthenticated) {
      sessionStorage.setItem("staff_just_logged_out", "1");
      navigate("/login", { replace: true, state: { justLoggedOut: true } });
    }
    prev.current = isAuthenticated;
  }, [isAuthenticated, navigate]);

  return null;
}

// 라우트에 따라 문서 제목/파비콘 동적 변경
function BrandingManager() {
  const location = useLocation();

  useEffect(() => {
    const isShop = location.pathname.startsWith("/shop");
    const nextTitle = isShop ? "SHARK" : "Care-up";
    const nextIcon = isShop ? sharkFavicon : careupFavicon;

    // 제목 변경
    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }

    // 파비콘 변경 (id로 지정된 링크가 있으면 교체, 없으면 생성)
    const ensureIcon = (id, rel = "icon") => {
      let link = document.querySelector(`link#${id}`) || document.createElement("link");
      link.id = id;
      link.rel = rel;
      link.type = "image/svg+xml";
      link.href = nextIcon;
      if (!link.parentNode) document.head.appendChild(link);
    };

    // 기본 파비콘 및 단축 아이콘을 모두 동일 자원으로 맞춤
    ensureIcon("app-favicon", "icon");
    ensureIcon("app-shortcut-icon", "shortcut icon");
  }, [location]);

  return null;
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
        <BrandingManager />
        <StaffLogoutWatcher />
        <Routes>
          {/* 고객 쇼핑몰: 인증 불필요 */}
          <Route path="/shop/*" element={<ShopApp />} />

          {/* 직원 로그인 */}
          <Route path="/login" element={<Login />} />

          {/* 직원 포털: 인증 필요 */}
          <Route element={<ProtectedRoute />}>
            {allPaths.map((path) => (
              <Route key={path} path={path} element={getRouteElement(path)} />
            ))}
          </Route>

          {/* 고객 인증/가입/리셋 */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/oauth/google/callback" element={<OauthCallbackGoogle />} />
          <Route path="/oauth/kakao/callback" element={<OauthCallbackKakao />} />
          <Route path="/customer/oauth/additional-info" element={<AdditionalInfo />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/customer/password/forgot" element={<PasswordResetRequest />} />
          <Route path="/customer/password/reset" element={<PasswordReset />} />

          {/* 직원 비밀번호 찾기/재설정 */}
          <Route path="/password/forgot" element={<EmployeePasswordResetRequest />} />
          <Route path="/password/reset" element={<EmployeePasswordReset />} />

          {/* 루트/기타 → 쇼핑 홈 */}
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
