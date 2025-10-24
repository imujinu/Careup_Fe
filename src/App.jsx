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

function RouteWrapper({ headquartersComponent, franchiseComponent }) {
  const { userType } = useAppSelector((state) => state.auth);
  return userType === "headquarters" ? headquartersComponent : franchiseComponent;
}

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
        <StaffLogoutWatcher />
        <Routes>
          <Route path="/shop/*" element={<ShopApp />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            {allPaths.map((path) => (
              <Route key={path} path={path} element={getRouteElement(path)} />
            ))}
          </Route>
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/oauth/google/callback" element={<OauthCallbackGoogle />} />
          <Route path="/oauth/kakao/callback" element={<OauthCallbackKakao />} />
          <Route path="/customer/oauth/additional-info" element={<AdditionalInfo />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/customer/password/forgot" element={<PasswordResetRequest />} />
          <Route path="/customer/password/reset" element={<PasswordReset />} />
          <Route path="/password/forgot" element={<EmployeePasswordResetRequest />} />
          <Route path="/password/reset" element={<EmployeePasswordReset />} />
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}
