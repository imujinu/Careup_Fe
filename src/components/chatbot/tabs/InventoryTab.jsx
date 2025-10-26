import React from "react";

const InventoryTab = ({ onTabClick }) => {
  const inventoryTabs = [
    { id: "전체조회", label: "📦 전체 재고 조회" },
    { id: "재고수정", label: "✏️ 재고 수정" },
    { id: "회전율", label: "🔄 회전율 보기" },
  ];

  return (
    <div className="attendance-tabs">
      <div className="attendance-tabs-title">재고 관리 옵션을 선택해주세요</div>
      <div className="attendance-tabs-buttons">
        {inventoryTabs.map((tab) => (
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

export default InventoryTab;
