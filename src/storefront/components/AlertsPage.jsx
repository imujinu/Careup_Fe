import React, { useState } from "react";
import "./AlertsPage.css";

const tabs = [
  { key: "근태", icon: "🕒" },
  { key: "재고", icon: "📦" },
  { key: "발주", icon: "🧾" },
  { key: "채팅", icon: "💬" },
];

const AlertsPage = ({ onBack }) => {
  const [active, setActive] = useState("근태");

  return (
    <div className="alerts-page">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          ← 홈으로
        </button>
        <div className="alerts-header">
          <h1>이전 알림</h1>
          <div className="tabs-wrap">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`pill${active === t.key ? " active" : ""}`}
                onClick={() => setActive(t.key)}
              >
                <span className="i">{t.icon}</span> {t.key}
              </button>
            ))}
          </div>
        </div>

        <div className="alert-list">
          {demoItems[active].map((a, i) => (
            <div className="alert-item" key={i}>
              <div className={`source ${a.sourceType}`}>{a.source}</div>
              <div className="content">
                <div className="title">
                  {a.title}
                  <span className="time">어제 오후 {a.time}</span>
                </div>
                <div className="desc">{a.desc}</div>
              </div>
              <button className="more">⋮</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const demoItems = {
  근태: [
    {
      source: "네이버 로그인",
      sourceType: "naver",
      title: "로그인",
      desc: "abcmart 계정으로 로그인 되었습니다. 본인의 활동이 맞는지 확인해 주세요.",
      time: "09:33",
    },
    {
      source: "출퇴근",
      sourceType: "work",
      title: "출근 지각",
      desc: "홍길동님 09:12 출근 기록",
      time: "09:12",
    },
  ],
  재고: [
    {
      source: "재고봇",
      sourceType: "stock",
      title: "안전재고 임계치",
      desc: "아메리카노 원두 재고 12개, 발주 필요",
      time: "11:20",
    },
    {
      source: "재고봇",
      sourceType: "stock",
      title: "유통기한 임박",
      desc: "우유 5개 유통기한 D-2",
      time: "08:10",
    },
  ],
  발주: [
    {
      source: "발주시스템",
      sourceType: "order",
      title: "발주 승인",
      desc: "컵 뚜껑 1000개 발주 승인 완료",
      time: "14:02",
    },
  ],
  채팅: [
    {
      source: "SBS",
      sourceType: "channel",
      title: "단독 속보",
      desc: "주한미군 배치...",
      time: "09:33",
    },
    {
      source: "고객문의",
      sourceType: "chat",
      title: "주문 문의",
      desc: "오늘 수령 가능한가요?",
      time: "13:21",
    },
  ],
};

export default AlertsPage;
