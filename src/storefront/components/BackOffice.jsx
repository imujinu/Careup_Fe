import React, { useState } from "react";
import "./BackOffice.css";
import ChatBot from "./ChatBot";

const BackOffice = ({ onBack }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="backoffice-page">
      <div className="backoffice-container">
        <header className="backoffice-header">
          <button className="back-btn" onClick={onBack}>
            ← 홈으로
          </button>
          <h1 className="backoffice-title">백오피스 대시보드</h1>
          <div className="user-info">
            <span>관리자님, 안녕하세요!</span>
          </div>
        </header>

        <div className="dashboard-content">
          {/* KPI Cards */}
          <div className="kpi-section">
            <div className="kpi-card">
              <div className="kpi-number">324</div>
              <div className="kpi-label">총 주문</div>
              <div className="kpi-change">+12.5%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-number">1,347</div>
              <div className="kpi-label">총 방문자</div>
              <div className="kpi-change">+8.2%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-number">₩ 2.4M</div>
              <div className="kpi-label">총 매출</div>
              <div className="kpi-change">+15.3%</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-number">18.2%</div>
              <div className="kpi-label">전환율</div>
              <div className="kpi-change">+2.1%</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <div className="chart-header">
                <h3>매출 현황</h3>
                <div className="chart-controls">
                  <button className="chart-btn active">일간</button>
                  <button className="chart-btn">주간</button>
                  <button className="chart-btn">월간</button>
                </div>
              </div>
              <div className="chart-area">
                <div className="line-chart">
                  <svg width="100%" height="200" viewBox="0 0 400 200">
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points="0,150 50,120 100,140 150,100 200,80 250,90 300,60 350,70 400,50"
                    />
                    <circle cx="400" cy="50" r="4" fill="#3b82f6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3>카테고리별 매출 비율</h3>
              </div>
              <div className="chart-area">
                <div className="pie-chart">
                  <div className="pie-item" style={{ '--percentage': '45%', '--color': '#3b82f6' }}>
                    <span>의류 45%</span>
                  </div>
                  <div className="pie-item" style={{ '--percentage': '30%', '--color': '#10b981' }}>
                    <span>신발 30%</span>
                  </div>
                  <div className="pie-item" style={{ '--percentage': '25%', '--color': '#f59e0b' }}>
                    <span>액세서리 25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="recent-orders">
            <div className="section-header">
              <h3>최근 주문 현황</h3>
              <button className="view-all-btn">전체보기</button>
            </div>
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>주문번호</th>
                    <th>고객명</th>
                    <th>상품</th>
                    <th>금액</th>
                    <th>상태</th>
                    <th>주문일</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>#12345</td>
                    <td>김철수</td>
                    <td>러닝화 경량 모델</td>
                    <td>89,000원</td>
                    <td><span className="status-badge processing">처리중</span></td>
                    <td>2025-10-02</td>
                  </tr>
                  <tr>
                    <td>#12344</td>
                    <td>이영희</td>
                    <td>트레이닝 조거 팬츠</td>
                    <td>36,000원</td>
                    <td><span className="status-badge completed">완료</span></td>
                    <td>2025-10-01</td>
                  </tr>
                  <tr>
                    <td>#12343</td>
                    <td>박민수</td>
                    <td>퍼포먼스 드라이 티셔츠</td>
                    <td>18,900원</td>
                    <td><span className="status-badge shipped">배송중</span></td>
                    <td>2025-10-01</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Products */}
          <div className="top-products">
            <div className="section-header">
              <h3>인기 상품 랭킹</h3>
            </div>
            <div className="products-list">
              <div className="product-item">
                <div className="product-rank">1</div>
                <div className="product-info">
                  <div className="product-name">러닝화 경량 모델</div>
                  <div className="product-sales">판매량: 45개</div>
                </div>
                <div className="product-revenue">₩4,005,000</div>
              </div>
              <div className="product-item">
                <div className="product-rank">2</div>
                <div className="product-info">
                  <div className="product-name">트레이닝 조거 팬츠</div>
                  <div className="product-sales">판매량: 32개</div>
                </div>
                <div className="product-revenue">₩1,152,000</div>
              </div>
              <div className="product-item">
                <div className="product-rank">3</div>
                <div className="product-info">
                  <div className="product-name">퍼포먼스 드라이 티셔츠</div>
                  <div className="product-sales">판매량: 28개</div>
                </div>
                <div className="product-revenue">₩529,200</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Button */}
        <button 
          className="chat-toggle-btn"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          💬
        </button>

        {/* ChatBot Component */}
        {isChatOpen && (
          <ChatBot onClose={() => setIsChatOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default BackOffice;
