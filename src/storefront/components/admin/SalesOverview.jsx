import React, { useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import "./admin.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from "recharts";

export default function SalesOverview({ onBack, onGoDetail }) {
  const ranges = ["일간", "주간", "월간", "연간"];
  const [rangeA, setRangeA] = useState(ranges[0]); // 상단 KPI 필터
  const [rangeB, setRangeB] = useState(ranges[0]); // 변동 그래프 필터
  const prodTabs = ["상품", "옵션", "카테고리"];
  const [prodTab, setProdTab] = useState(prodTabs[0]);
  const [trendTab, setTrendTab] = useState("매출 변동사항");

  const trendData = useMemo(() => buildTrend(rangeB), [rangeB]);
  const customerData = useMemo(
    () => [
      { name: "단골", value: 5000 },
      { name: "예비 단골", value: 0 },
      { name: "첫 방문", value: 0 },
    ],
    []
  );
  const productRank = useMemo(
    () => [
      {
        name:
          prodTab === "상품"
            ? "sample 사이다"
            : prodTab === "옵션"
            ? "500ml 옵션"
            : "음료",
        qty: 2,
        amt: 5000,
      },
    ],
    [prodTab]
  );

  return (
    <AdminLayout title="매출" onBack={onBack}>
      <div className="kpi-grid">
        {kpis.map((k) => (
          <div key={k.k} className="kpi">
            <div className="k">{k.k}</div>
            <div className="v">{k.v}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          margin: "12px 0",
        }}
      >
        <b>통계 기간</b>
        <div>
          {ranges.map((r) => (
            <button
              key={r}
              className={`top-btn${r === rangeA ? " active" : ""}`}
              onClick={() => setRangeA(r)}
              style={{ marginRight: 6 }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* 1열: 실매출 변동 (블루 테마) */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <b>{trendTab}</b>
          <div>
            {ranges.map((r) => (
              <button
                key={r}
                className={`top-btn${r === rangeB ? " active" : ""}`}
                onClick={() => setRangeB(r)}
                style={{ marginLeft: 6 }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="매출"
                stroke="#2563eb"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2열: 판매유형 / 고객 등급별 매출 (같은 행) */}
      <div className="grid-2">
        <div className="card" style={{ padding: 16 }}>
          <b>판매유형</b>
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <div className="kpi" style={{ flex: 1 }}>
              <div className="k">매장</div>
              <div className="v">100%</div>
            </div>
            <div className="kpi" style={{ flex: 1 }}>
              <div className="k">온라인</div>
              <div className="v">0%</div>
            </div>
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <b>고객별 매출 (막대)</b>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart
                data={customerData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3열: 상품별 매출 (풀 너비) */}
      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <b>상품별 매출순위</b>
        <div style={{ margin: "8px 0" }}>
          {prodTabs.map((t) => (
            <button
              key={t}
              className={`top-btn${t === prodTab ? " active" : ""}`}
              onClick={() => setProdTab(t)}
              style={{ marginRight: 6 }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={productRank}
              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="qty"
                name="판매개수"
                fill="#60a5fa"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="amt"
                name="실판매금액"
                fill="#2563eb"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ textAlign: "right", marginTop: 12 }}>
          <button className="top-btn" onClick={onGoDetail}>
            매출 상세보기 ▸
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

const kpis = [
  { k: "실매출", v: "5,000원" },
  { k: "주문건수", v: "1건" },
  { k: "결제건수", v: "1건" },
  { k: "환불", v: "0원" },
];

function buildTrend(range) {
  // 더미 데이터 생성: 일간=시간, 주간=요일, 월간=일, 연간=월
  const keys = {
    일간: Array.from({ length: 12 }).map((_, i) => `${i + 8}시`),
    주간: ["월", "화", "수", "목", "금", "토", "일"],
    월간: Array.from({ length: 12 }).map((_, i) => `${i + 1}일`),
    연간: Array.from({ length: 12 }).map((_, i) => `${i + 1}월`),
  };
  const xs = keys[range] || keys.일간;
  return xs.map((x, i) => ({ x, 매출: i === xs.length - 1 ? 5 : 0 }));
}
