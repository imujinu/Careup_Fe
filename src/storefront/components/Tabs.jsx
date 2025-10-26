import React from "react";

function Tabs({ active, onChange, tabs }) {
  const defaultTabs = ["전체", "의류", "신발", "액세서리", "러닝", "트레이닝"];
  const list = Array.isArray(tabs) && tabs.length > 0 ? tabs : defaultTabs;
  return (
    <div className="tabs">
      {list.map((t) => (
        <button
          key={t}
          className={`tab${active === t ? " active" : ""}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export default Tabs;

