import React from "react";

const AttendanceTab = ({ onTabClick }) => {
  const attendanceTabs = [
    { id: "금일근무현황", label: "📅 금일근무현황" },
    { id: "전체직원조회", label: "👥 전체 직원 조회" },
    { id: "상세직원조회", label: "🔍 상세 직원 조회" },
    { id: "인건비계산", label: "✏️ 인건비 계산" },
  ];

  return (
    <div className="attendance-tabs">
      <div className="attendance-tabs-title">근태 관리 옵션을 선택해주세요</div>
      <div className="attendance-tabs-buttons">
        {attendanceTabs.map((tab) => (
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

export default AttendanceTab;
