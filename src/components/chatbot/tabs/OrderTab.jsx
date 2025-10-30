import React from "react";

const OrderTab = ({ onTabClick }) => {
  const orderTabs = [
    { id: "전체조회", label: "📋 전체 발주 조회" },
    { id: "발주요청", label: "🧾 발주 요청" },
    { id: "발주추천", label: "🛒 발주 추천" }, // ✅ handleOrderTab 분기와 일치
  ];

  return (
    <div className="attendance-tabs">
      <div className="attendance-tabs-title">발주 관리 옵션을 선택해주세요</div>
      <div className="attendance-tabs-buttons">
        {orderTabs.map((tab) => (
          <button
            key={tab.id}
            className="attendance-tab-btn"
            onClick={() => onTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrderTab;
