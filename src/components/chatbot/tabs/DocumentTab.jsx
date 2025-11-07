import React from "react";

const DocumentTab = ({ onTabClick }) => {
  const documentTabs = [
    { id: "문서조회", label: "📄 문서 조회" },
    { id: "문서등록", label: "📝 문서 등록" },
    { id: "문서수정", label: "✏️ 문서 수정" },
  ];

  return (
    <div className="attendance-tabs">
      <div className="attendance-tabs-title">문서 관리 옵션을 선택해주세요</div>
      <div className="attendance-tabs-buttons">
        {documentTabs.map((tab) => (
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

export default DocumentTab;

