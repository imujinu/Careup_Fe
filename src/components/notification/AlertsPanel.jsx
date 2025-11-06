import React, { useState, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../stores/hooks";
import { removeNotification, clearNotifications } from "../../stores/slices/alertsSlice";
import { notificationService } from "../../service/notificationService";
import { useNavigate } from "react-router-dom";
import "./AlertPage.css";

function AlertsPanel({ onClose, isOpen }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const categories = [
    "근태",
    "발주",
    "재고",
    "주문",
    "지점",
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
    if (active === "전체") {
      return notifications;
    }
    // 카테고리 필터링 (공백 제거 및 정확한 매칭)
    return notifications.filter((item) => {
      const itemCat = item?.cat?.trim();
      const activeCat = active.trim();
      return itemCat === activeCat;
    });
  }, [notifications, active]);

  // 특정 알림 읽음 처리
  const handleNotificationRead = async (notificationId, e) => {
    e?.stopPropagation(); // 버블링 방지
    
    // Optimistic update: 즉시 알림 제거 (UI 반응성 향상)
    dispatch(removeNotification(notificationId));
    
    try {
      // 백그라운드에서 읽음 처리 API 호출
      await notificationService.markAsRead(notificationId);
      console.log('알림 읽음 처리 완료:', notificationId);
    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      // API 호출 실패 시에도 이미 UI에서 제거했으므로 그대로 유지
      // (서버 동기화는 다음 알림 목록 조회 시 해결됨)
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
            filtered.map((d) => {
              const isBranchNotification = (d.cat === "지점" || d.cat?.trim() === "지점") && (d.status === "pending" || d.status === "대기중");
              const requestId = d.rawData?.requestId || d.rawData?.id || d.rawData?.branchUpdateRequestId || d.rawData?.updateRequestId;
              
              return (
                <div
                  key={d.id}
                  className="alert-row"
                  onClick={() => {
                    if (isBranchNotification && requestId) {
                      // 지점 수정 요청 상세 페이지로 이동
                      // 이동 전 알림 읽음 처리
                      handleNotificationRead(d.id);
                      navigate(`/branch/update-requests/${requestId}`);
                      onClose();
                    } else {
                      // 일반 알림 읽음 처리
                      handleNotificationRead(d.id);
                    }
                  }}
                >
                  <button
                    className="alert-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationRead(d.id, e);
                    }}
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
                  {isBranchNotification && requestId && (
                    <div className="alert-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="alert-action-btn approve"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 상세보기 클릭 시에도 알림 읽음 처리
                          handleNotificationRead(d.id, e);
                          navigate(`/branch/update-requests/${requestId}`);
                          onClose();
                        }}
                      >
                        상세보기
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty">최근 알림이 없습니다.</div>
          )}
        </div>
      </div>
    </>
  );
}

export default AlertsPanel;
