import React, { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../stores/hooks";
import { removeNotification, clearNotifications } from "../../stores/slices/alertsSlice";
import { notificationService } from "../../service/notificationService";
import "./AlertPage.css";

function AlertsPanel({ onClose, isOpen }) {
  const dispatch = useAppDispatch();
  const categories = [
    "근태 ",
    "발주",
    "재고",
    "주문",
  ];
  const tabs = ["전체", ...categories];
  const [active, setActive] = useState("전체");
  const [collapsed, setCollapsed] = useState(true);

  // Redux에서 알림 목록 가져오기
  const notifications = useAppSelector((state) => {
    try {
      return state.alerts?.notifications || [];
    } catch (error) {
      console.error('알림 상태 가져오기 오류:', error);
      return [];
    }
  });

  // 선택된 탭에 따라 필터링
  const filtered = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) {
      return [];
    }
    return active === "전체"
      ? notifications
      : notifications.filter((item) => item?.cat === active);
  }, [notifications, active]);

  // 특정 알림 읽음 처리
  const handleNotificationRead = async (notificationId, e) => {
    e?.stopPropagation(); // 버블링 방지
    
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        // 읽음 처리 성공 시 알림 목록에서 제거
        dispatch(removeNotification(notificationId));
      }
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    if (filtered.length === 0) return;
    
    try {
      // 필터링된 알림들의 ID 목록 추출
      const notificationIds = filtered.map((n) => n.id);
      const success = await notificationService.markAllAsRead(notificationIds);
      if (success) {
        // 전체 읽음 처리 성공 시 필터링된 알림들 제거
        notificationIds.forEach((id) => {
          dispatch(removeNotification(id));
        });
      }
    } catch (error) {
      console.error('전체 읽음 처리 오류:', error);
    }
  };

  const handleOverlayClick = (e) => {
    console.log("오버레이 클릭됨");
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`alerts-overlay ${isOpen ? "open" : ""}`}
        onClick={handleOverlayClick}
      />
      <div
        className={`alerts-drawer ${isOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-head">
          <div>알림</div>
          <button
            className="top-btn"
            onClick={() => {
              console.log("닫기 버튼 클릭됨");
              onClose();
            }}
          >
            ✕
          </button>
        </div>
        <div className="drawer-tabs">
          {(collapsed ? tabs.slice(0, 5) : tabs).map((t) => (
            <button
              key={t}
              className={`pill${t === active ? " active" : ""}`}
              onClick={() => setActive(t)}
            >
              {t}
            </button>
          ))}
          {filtered.length > 0 && (
            <button
              className="pill mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              title="전체 읽음"
            >
              전체 읽음
            </button>
          )}
        </div>
        <div className="drawer-body">
          {filtered.length > 0 ? (
            filtered.map((d) => (
              <div
                key={d.id}
                className="alert-row"
                onClick={() => handleNotificationRead(d.id)}
              >
                <button
                  className="alert-close-btn"
                  onClick={(e) => handleNotificationRead(d.id, e)}
                  title="읽음 처리"
                  aria-label="읽음 처리"
                >
                  ✕
                </button>
                <div className="row-head">
                  <span className="cat">{d.cat}</span>
                  <span className={`badge ${d.status}`}>{d.statusLabel}</span>
                </div>
                <div className="row-title">{d.title}</div>
                <div className="row-desc">
                  {d.sub && <span className="row-desc-text">{d.sub}</span>}
                  <span className="time">{d.time}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty">최근 알림이 없습니다.</div>
          )}
        </div>
      </div>
    </>
  );
}

export default AlertsPanel;
