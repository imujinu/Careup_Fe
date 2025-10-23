import React, { useState } from "react";
import "./SalesDashboard.css";

const SalesDashboard = ({ onBack }) => {
  const tabs = ["매출현황", "매출상세", "매출탐색", "상품분석", "설정"];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <div className="sales-page">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          ← 홈으로
        </button>
        <div className="sales-layout">
          <aside className="sales-sidebar">
            <div className="brand">Sales Report</div>
            <nav>
              {tabs.map((t) => (
                <button
                  key={t}
                  className={`side-item${activeTab === t ? " active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
              <div className="side-spacer" />
              <button className="export-btn">엑셀 내보내기</button>
              <button className="feedback-btn">의견 보내기</button>
            </nav>
          </aside>

          <main className="sales-main">
            {activeTab === "매출현황" && <OverviewTab />}
            {activeTab === "매출상세" && <DetailTab />}
            {activeTab === "매출탐색" && <ExploreTab />}
            {activeTab === "상품분석" && <ProductTab />}
            {activeTab === "설정" && <SettingsTab />}
          </main>
        </div>
      </div>
    </div>
  );
};

function KpiCard({ title, value, sub }) {
  return (
    <div className="kpi-card">
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="tab-wrap">
      <div className="kpi-grid">
        <KpiCard title="실매출" value="5,000원" sub="지난주 대비 +5,000" />
        <KpiCard title="주문건수" value="1건" sub="+1건" />
        <KpiCard title="방문수" value="2명" sub="+1명" />
        <KpiCard title="환불" value="0원" />
        <KpiCard title="할인" value="0원" />
        <KpiCard title="고객등급" value="미확인" />
      </div>

      <div className="panels">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">매출 현황</div>
            <div className="seg">일간</div>
          </div>
          <div className="chart fake-chart">
            <div className="axis-x">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i}>{i * 3}시</span>
              ))}
            </div>
            <div className="axis-y">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
              <span>0</span>
            </div>
            <div className="line-sample" />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">카테고리별 매출 비율</div>
          </div>
          <div className="pie fake-pie">
            <div className="pie-legend">
              <span className="c1" /> 의류
              <span className="c2" /> 신발
              <span className="c3" /> 액세서리
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">최근 부문 랭킹</div>
        </div>
        <div className="rank-table">
          {rankingRows.map((r) => (
            <div className="rank-row" key={r.name}>
              <div className="rank-name">{r.name}</div>
              <div className="rank-bar">
                <div className="fill" style={{ width: r.width }} />
              </div>
              <div className="rank-val">{r.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">공지사항</div>
        </div>
        <table className="notice-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>등록일</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>시스템 점검 안내</td>
              <td>2025-09-25</td>
              <td>공지</td>
              <td>
                <button className="mini">보기</button>
              </td>
            </tr>
            <tr>
              <td>VAT 변경 안내</td>
              <td>2025-09-20</td>
              <td>공지</td>
              <td>
                <button className="mini">보기</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailTab() {
  return (
    <div className="tab-wrap">
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">시간대별 매출</div>
        </div>
        <div className="chart fake-chart small">
          <div className="line-sample up" />
        </div>
        <div className="stats-grid">
          <div>
            <div className="stat-k">총매출</div>
            <div className="stat-v">5,000원</div>
          </div>
          <div>
            <div className="stat-k">주문건수</div>
            <div className="stat-v">1건</div>
          </div>
          <div>
            <div className="stat-k">결제건수</div>
            <div className="stat-v">1건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExploreTab() {
  return (
    <div className="tab-wrap">
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">판매유형</div>
        </div>
        <div className="tag-cloud">
          <span className="tag">매장</span>
          <span className="tag">픽업</span>
          <span className="tag">온라인</span>
        </div>
      </div>
    </div>
  );
}

function ProductTab() {
  return (
    <div className="tab-wrap">
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">상품 매출순위</div>
        </div>
        <table className="prod-table">
          <thead>
            <tr>
              <th>순위</th>
              <th>상품명</th>
              <th>판매개수</th>
              <th>실판매금액</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>sample 사이다</td>
              <td>2개</td>
              <td>5,000원</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab() {
  return (
    <div className="tab-wrap">
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">설정</div>
        </div>
        <div className="form-grid">
          <input placeholder="사업장명" />
          <input placeholder="사업자번호" />
          <button className="save-btn">저장</button>
        </div>
      </div>
    </div>
  );
}

const rankingRows = [
  { name: "아메리카노", value: "1,200,000", width: "95%" },
  { name: "라떼", value: "950,000", width: "80%" },
  { name: "스파클링", value: "660,000", width: "55%" },
  { name: "샌드위치", value: "420,000", width: "35%" },
];

export default SalesDashboard;
