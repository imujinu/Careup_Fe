import React, { useState } from "react";
import AdminLayout from "./AdminLayout";
import "./admin.css";

export default function SalesDetail({ onBack }) {
  const ranges = ["일간", "주간", "월간", "연간"];
  const [range, setRange] = useState(ranges[0]);

  return (
    <AdminLayout title="매출 상세" onBack={onBack}>
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <b>기간</b>
        {ranges.map((r) => (
          <button
            key={r}
            className={`top-btn${r === range ? " active" : ""}`}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0 }}>2025-09-25</h3>
          <div className="kpi">
            <div className="k">실매출</div>
            <div className="v">5,000원</div>
          </div>
        </div>
        <div
          className="grid-2"
          style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}
        >
          <div className="kpi">
            <div className="k">주문건수</div>
            <div className="v">1건</div>
          </div>
          <div className="kpi">
            <div className="k">결제건수</div>
            <div className="v">1건</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <b>결제 수단별 매출</b>
        <table className="prod-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>수단</th>
              <th>금액(결제건)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>현금</td>
              <td>5,000 (1건)</td>
            </tr>
            <tr>
              <td>카드</td>
              <td>0 (0건)</td>
            </tr>
            <tr>
              <td>간편결제</td>
              <td>0 (0건)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
