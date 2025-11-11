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
import { store } from "./stores";
import { checkAuthStatus } from "./stores/slices/authSlice";
import { toggleChatbot, closeChatbot } from "./stores/slices/chatbotSlice";
import { closeAlerts } from "./stores/slices/alertsSlice";

import Layout from "./layout/Layout";
import Login from "./pages/auth/Login";
import { ToastProvider } from "./components/common/Toast";
import ShopApp from "./storefront/pages/ShopApp";
import ChatBot from "./components/chatbot/ChatBot";
import "./components/chatbot/ChatBot.css";

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

// 직원 근태용 모바일 로그인
import MobileLogin from "./pages/auth/MobileLogin";
import MobileStaffHome from "./pages/mobile/MobileStaffHome";
import MobileFindEmployeeId from "./pages/auth/MobileFindEmployeeId";
import MobilePasswordResetRequest from "./pages/auth/MobilePasswordResetRequest";

// 고객 아이디 찾기
import FindCustomerId from "./pages/auth/FindCustomerId";
// ★ 직원 아이디 찾기 (공개 라우트)
import EmployeeFindId from "./pages/auth/FindEmployeeId";

import careupFavicon from "./assets/logos/care-up_logo_primary.svg";
import sharkFavicon from "./assets/logos/shark-favicon.svg";

// ★ 마이페이지: StaffCreate를 재사용(헤더에서 /my로 이동)
import StaffCreate from "./pages/staff/StaffCreate";
import { sseService } from "./service/sseService";
import { fetchNotificationList } from "./stores/slices/alertsSlice";

function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, branchId } = useAppSelector(
    (state) => state.auth
  );
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
  return userType === "headquarters"
    ? headquartersComponent
    : franchiseComponent;
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

function BrandingManager() {
  const location = useLocation();

  useEffect(() => {
    const isShop = location.pathname.startsWith("/shop");
    const nextTitle = isShop ? "SHARK" : "Care-up";
    const nextIcon = isShop ? sharkFavicon : careupFavicon;

    if (document.title !== nextTitle) {
      document.title = nextTitle;
    }

    const ensureIcon = (id, rel = "icon") => {
      let link = document.querySelector(`link#${id}`) || document.createElement("link");
      link.id = id;
      link.rel = rel;
      link.type = "image/svg+xml";
      link.href = nextIcon;
      if (!link.parentNode) document.head.appendChild(link);
    };

    ensureIcon("app-favicon", "icon");
    ensureIcon("app-shortcut-icon", "shortcut icon");
  }, [location]);

  return null;
}

function SSEConnectionManager() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !connectedRef.current) {
      // 최초 로그인 후 한 번만 연결
      store.dispatch(fetchNotificationList());
      sseService.connect();
      connectedRef.current = true;
    } else if (!isAuthenticated && connectedRef.current) {
      // 로그아웃 시 한 번만 끊기
      sseService.disconnect();
      connectedRef.current = false;
    }

    const handleBeforeUnload = () => {
      if (connectedRef.current) sseService.disconnectSync();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isAuthenticated]);

  return null;
}

export default function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { isOpen: showChatBot } = useAppSelector((state) => state.chatbot);

  // 챗봇 표시 여부 확인: role이 BRANCH_ADMIN, FRANCHISE_OWNER, STAFF 중 하나일 때만 표시
  // 단, cust_userInfo가 있으면 챗봇을 표시하지 않음
  const shouldShowChatbot = () => {
    try {
      // cust_userInfo가 있으면 챗봇 숨김
      const custUserInfo = localStorage.getItem("cust_userInfo");
      if (custUserInfo) return false;

      const userInfoStr = localStorage.getItem("userInfo");
      if (!userInfoStr) return false;

      const userInfo = JSON.parse(userInfoStr);
      const allowedRoles = ["BRANCH_ADMIN", "FRANCHISE_OWNER", "STAFF"];
      return allowedRoles.includes(userInfo.role);
    } catch (error) {
      return false;
    }
  };

  const showChatbot = shouldShowChatbot();

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
        <SSEConnectionManager />
        <Routes>
          {/* 고객 쇼핑몰: 인증 불필요 */}
          <Route path="/shop/*" element={<ShopApp />} />

          {/* 직원 로그인 */}
          <Route path="/login" element={<Login />} />

          {/* 중요: /auth/find-id 는 보호 라우트보다 먼저 리다이렉트 처리 */}
          <Route path="/auth/find-id" element={<Navigate to="/customer/find-id" replace />} />

          {/* === 직원 근태용 모바일 섹션 (⭐ catch-all보다 위에 둔다) === */}
          <Route path="/m/login" element={<MobileLogin />} />
          <Route path="/m" element={<MobileStaffHome />} />
          <Route path="/m/find-id" element={<MobileFindEmployeeId />} />
          <Route path="/m/password/forgot" element={<MobilePasswordResetRequest />} />

          {/* 직원 포털: 인증 필요 */}
          <Route element={<ProtectedRoute />}>
            {allPaths.map((path) => (
              <Route key={path} path={path} element={getRouteElement(path)} />
            ))}
            {/* ★ 마이페이지: StaffCreate 재사용 */}
            <Route path="/my" element={<StaffCreate />} />
          </Route>

          {/* 고객 인증/가입/리셋 */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/oauth/google/callback" element={<OauthCallbackGoogle />} />
          <Route path="/oauth/kakao/callback" element={<OauthCallbackKakao />} />
          <Route path="/customer/oauth/additional-info" element={<AdditionalInfo />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/customer/password/forgot" element={<PasswordResetRequest />} />
          <Route path="/customer/password/reset" element={<PasswordReset />} />
          <Route path="/customer/find-id" element={<FindCustomerId />} />

          {/* 직원 인증/리셋 (공개) */}
          <Route path="/password/forgot" element={<EmployeePasswordResetRequest />} />
          <Route path="/password/reset" element={<EmployeePasswordReset />} />
          {/* ★ 직원 아이디 찾기 (공개) */}
          <Route path="/employee/find-id" element={<EmployeeFindId />} />

          {/* 루트/기타 → 쇼핑 홈 */}
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Routes>

        {/* 챗봇 */}
        {showChatbot && showChatBot && <ChatBot onClose={() => dispatch(closeChatbot())} />}

        {showChatbot && (
          <button
            onClick={() => {
              const { isOpen: isChatbotOpen } = store.getState().chatbot;
              if (!isChatbotOpen) {
                dispatch(closeAlerts());
              }
              dispatch(toggleChatbot());
            }}
            className="chatbot-toggle-btn"
            title="챗봇 열기"
          >
            🤖
          </button>
        )}
      </Router>
    </ToastProvider>
  );
}
