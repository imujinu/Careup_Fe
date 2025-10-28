import React, { useState } from "react";
import "./AlertPage.css";

function AlertsPanel({ onClose, isOpen }) {
  const categories = [
    "근태 / 스케줄 관리",
    "가맹점 관리",
    "발주 / 재고",
    "매출 / 정산",
    "주문 / 결제",
  ];
  const tabs = ["전체", ...categories];
  const [active, setActive] = useState("전체");
  const [collapsed, setCollapsed] = useState(true);

  const items = buildItems(categories);
  const filtered =
    active === "전체" ? items : items.filter((i) => i.cat === active);

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
          {(collapsed ? tabs.slice(0, 4) : tabs).map((t) => (
            <button
              key={t}
              className={`pill${t === active ? " active" : ""}`}
              onClick={() => setActive(t)}
            >
              {t}
            </button>
          ))}
          {tabs.length > 4 && (
            <button
              className="pill tabs-toggle"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((v) => !v)}
              title={collapsed ? "더보기" : "접기"}
            >
              {collapsed ? "▾ 더보기" : "▴ 접기"}
            </button>
          )}
        </div>
        <div className="drawer-body">
          {filtered.map((d, i) => (
            <div key={i} className="alert-row">
              <div className="row-head">
                <span className="cat">{d.cat}</span>
                <span className={`badge ${d.status}`}>{d.statusLabel}</span>
                <span className="time">{d.time}</span>
              </div>
              <div className="row-title">{d.title}</div>
              {d.title.includes("승인 대기") && d.sub && (
                <div className="row-desc">{d.sub}</div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty">최근 알림이 없습니다.</div>
          )}
        </div>
      </div>
    </>
  );
}

function buildItems(cats) {
  const base = [
    {
      title: "가맹점 정보 변경 승인 대기",
      sub: "홍길동 패밀리점 사업자 정보 수정 요청 접수",
      status: "pending",
      statusLabel: "승인 대기",
      time: "10.27 09:33",
    },
    {
      title: "주문 결제 취소 접수",
      status: "canceled",
      statusLabel: "취소",
      time: "08:10",
    },
  ];
  const out = [];
  cats.forEach((cat) => base.forEach((b) => out.push({ ...b, cat })));
  return out;
}

export default AlertsPanel;
