import React, { useState } from "react";
import "./admin.css";

export default function AdminLayout({
  title = "매출 리포트",
  children,
  onBack,
}) {
  const [openAlerts, setOpenAlerts] = useState(false);
  const menu = [
    { key: "overview", label: "매출" },
    { key: "detail", label: "매출상세" },
  ];

  return (
    <div className="admin-wrap">
      <aside className="admin-side">
        <div className="brand">Admin</div>
        <nav>
          {menu.map((m) => (
            <a
              key={m.key}
              className="side-link"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              {m.label}
            </a>
          ))}
        </nav>
        <div className="side-foot">
          <button className="side-btn" onClick={onBack}>
            ← 사용자 사이트
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-top">
          <div className="left">
            <h1>{title}</h1>
          </div>
          <div className="right">
            <button
              className="top-btn"
              onClick={() => setOpenAlerts((v) => !v)}
              aria-label="알림"
            >
              🔔
            </button>
            <div className="avatar">관리자</div>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>

      {openAlerts && <AlertsPanel onClose={() => setOpenAlerts(false)} />}
    </div>
  );
}

function AlertsPanel({ onClose }) {
  const categories = [
    "근태 / 스케줄 관리",
    "가맹점 관리",
    "발주 / 재고",
    "매출 / 정산",
    "고객 관리",
    "주문 / 결제",
    "기타 협업/커뮤니케이션",
  ];
  const tabs = ["전체", ...categories];
  const [active, setActive] = useState("전체");
  const [collapsed, setCollapsed] = useState(true);

  const items = buildItems(categories);
  const filtered =
    active === "전체" ? items : items.filter((i) => i.cat === active);

  return (
    <div className="alerts-drawer" role="dialog" aria-modal="true">
      <div className="drawer-head">
        <div>알림</div>
        <button className="top-btn" onClick={onClose}>
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
  );
}

function buildItems(cats) {
  const base = [
    {
      title: "가맹점 정보 변경 승인 대기",
      sub: "홍길동 패밀리점 사업자 정보 수정 요청 접수",
      status: "pending",
      statusLabel: "승인 대기",
      time: "09:33",
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
