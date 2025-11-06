// src/layout/Header.jsx
import React, { useMemo, useState } from "react";
import styled from "styled-components";
import AlertsPanel from "../components/notification/AlertsPanel";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { closeChatbot } from "../stores/slices/chatbotSlice";
import { toggleAlerts, closeAlerts } from "../stores/slices/alertsSlice";
import { tokenStorage } from "../service/authService";
import { useNavigate } from "react-router-dom";

//상환바보
const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: ${(props) => (props.sidebarVisible ? "240px" : "0")};
  right: 0;
  height: 80px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 32px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
`;

const SidebarToggle = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover { background: #f3f4f6; }

  img { width: 16px; height: 16px; object-fit: contain; }
`;

const NotificationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  margin-right: 0;
`;

const NotificationIcon = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 8px;

  img { width: 20px; height: 20px; }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px solid white;
  box-sizing: border-box;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProfileImage = styled.button`
  width: 40px;
  height: 40px;
  border: 0;
  padding: 0;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const UserInfo = styled.button`
  display: flex;
  flex-direction: column;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  padding: 0;
`;

const Greeting = styled.div`
  font-size: 14px;
  color: #1f2937;

  .highlight {
    color: #6b46c1;
    font-weight: 600;
  }
`;

const DateInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

/** 상대경로 이미지 → 절대경로 보정 (중복 경로 안전) */
const toAbsoluteUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const API = import.meta.env.VITE_BRANCH_URL || import.meta.env.VITE_API_URL || "";
  if (!API) return url.startsWith("/") ? url : `/${url}`;
  try {
    const base = new URL(API, window.location.origin); // ex) http://localhost:8080/branch-service
    const origin = `${base.protocol}//${base.host}`;   // ex) http://localhost:8080
    const cleanJoin = (a, b) => a.replace(/\/+$/, "") + "/" + b.replace(/^\/+/, "");
    if (url.startsWith("/branch-service")) return cleanJoin(origin, url);
    return cleanJoin(API, url);
  } catch {
    return (API.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, ""));
  }
};

/** Redux user → 이름/사진만 사용 */
const useUserView = (user) => {
  const name =
    user?.name ||
    user?.username ||
    user?.nick ||
    user?.nickname ||
    user?.displayName ||
    user?.fullName ||
    user?.employeeName ||
    "";

  const profileRaw =
    user?.profileImageUrl ||
    user?.profile_image_url ||
    user?.profile_image ||
    user?.profileImage ||
    user?.imageUrl ||
    user?.image_url ||
    user?.picture ||
    user?.avatarUrl ||
    user?.avatar ||
    null;

  return {
    name,
    imageUrl: toAbsoluteUrl(profileRaw),
  };
};

function Header({ onToggleSidebar, sidebarVisible }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isOpen: isAlertsOpen } = useAppSelector((s) => s.alerts);
  const notifications = useAppSelector((s) => s.alerts.notifications);
  const unreadCount = notifications.filter((n) => !n.isRead).length; // 읽지 않은 알림 수
  const { user: reduxUser } = useAppSelector((s) => s.auth);

  // 리덕스 비어있을 시 LocalStorage 폴백 → 초기 깜빡임 방지
  const storageUser = useMemo(() => tokenStorage.getUserInfo(), []);
  const safeUser = reduxUser || storageUser || {};

  const view = useUserView(safeUser);

  const today = useMemo(() => {
    return new Date().toLocaleDateString("ko-KR", {
      dateStyle: "full",
      timeZone: "Asia/Seoul",
    });
  }, []);

  const [imgOk, setImgOk] = useState(true);
  const resolvedImg = imgOk ? view.imageUrl : null;

  // ★ 프로필 이미지 URL 변경 시 로드 상태 초기화
  React.useEffect(() => {
    setImgOk(true);
  }, [view.imageUrl]);

  const handleAlertsToggle = () => {
    if (!isAlertsOpen) dispatch(closeChatbot());
    dispatch(toggleAlerts());
  };
  const handleAlertsClose = () => dispatch(closeAlerts());
  const goMyPage = () => navigate("/my");

  return React.createElement(
    HeaderContainer,
    { sidebarVisible },
    React.createElement(
      SidebarToggle,
      { onClick: onToggleSidebar, "aria-label": "사이드바 열기/닫기" },
      React.createElement("img", {
        src: "/header-button.svg",
        alt: "메뉴",
        style: { width: "16px", height: "16px" },
      })
    ),
    React.createElement(
      NotificationSection,
      null,
      React.createElement(
        NotificationIcon,
        { onClick: handleAlertsToggle, "aria-label": "알림 열기/닫기" },
        React.createElement("img", {
          src: "/notification-icon.svg",
          alt: "알림",
        }),
        React.createElement(
          NotificationBadge,
          null,
          unreadCount ?? 0
        )
      ),
      React.createElement(
        UserSection,
        null,
        React.createElement(
          ProfileImage,
          { onClick: goMyPage, "aria-label": "마이페이지로 이동" },
          resolvedImg &&
            React.createElement("img", {
              src: resolvedImg,
              alt: "Profile",
              style: { width: "100%", height: "100%", objectFit: "cover" },
              onError: () => setImgOk(false),
            })
        ),
        React.createElement(
          UserInfo,
          { onClick: goMyPage, "aria-label": "마이페이지로 이동" },
          React.createElement(
            Greeting,
            null,
            "안녕하세요, ",
            view.name
              ? React.createElement(
                  "span",
                  { className: "highlight" },
                  `${view.name}님`
                )
              : "사용자님"
          ),
          React.createElement(DateInfo, null, today)
        )
      )
    ),
    React.createElement(AlertsPanel, {
      isOpen: isAlertsOpen,
      onClose: handleAlertsClose,
    })
  );
}

export default Header;
