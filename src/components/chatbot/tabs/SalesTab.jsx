import React from "react";

const SalesTab = ({ onTabClick }) => {
  const salesTabs = [
    { id: "일일매출", label: "📊 일일 매출" },
    { id: "상품별매출", label: "🛍️ 상품별 매출" },
    { id: "인건비 분석", label: "📈 인건비 분석" },
    { id: "매출분석", label: "📋 매출 분석" },
  ];

  return (
    <div className="attendance-tabs">
      <div className="attendance-tabs-title">매출 관리 옵션을 선택해주세요</div>
      <div className="attendance-tabs-buttons">
        {salesTabs.map((tab) => (
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

export default SalesTab;
