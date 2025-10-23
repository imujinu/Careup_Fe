import React, { useState } from "react";
import "./MyPage.css";

const MyPage = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="mypage">
      <div className="container">
        <button className="back-btn" onClick={onBack}>
          ← 홈으로
        </button>

        <div className="mypage-layout">
          {/* 사이드바 */}
          <div className="sidebar">
            <h2 className="sidebar-title">마이 페이지</h2>
            <nav className="sidebar-nav">
              <div className="nav-section">
                <h3 className="nav-section-title">내 정보</h3>
                <ul className="nav-list">
                  <li>
                    <button
                      className={`nav-item ${
                        activeTab === "profile" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("profile")}
                    >
                      프로필 관리
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-item ${
                        activeTab === "purchase" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("purchase")}
                    >
                      구매 내역
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-item ${
                        activeTab === "favorites" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("favorites")}
                    >
                      관심
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-item ${
                        activeTab === "reviews" ? "active" : ""
                      }`}
                      onClick={() => setActiveTab("reviews")}
                    >
                      리뷰 목록
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="main-content">
            {/* 프로필 카드 */}
            <div className="profile-card">
              <div className="profile-info">
                <div className="profile-avatar">
                  <div className="avatar-placeholder">👤</div>
                </div>
                <div className="profile-details">
                  <div className="username">avv5hu</div>
                  <div className="email">wl...... •@naver.com</div>
                </div>
              </div>
              <div className="quick-link-item">
                <div className="quick-icon coupons">
                  🎫
                  <span className="notification-dot">19</span>
                </div>
                <div className="quick-label">쿠폰 19</div>
              </div>
              <div className="quick-link-item">
                <div className="quick-icon reviews">💬</div>
                <div className="quick-label">리뷰</div>
              </div>
              <div className="quick-link-item">
                <div className="quick-icon favorites">♡</div>
                <div className="quick-label">관심 0</div>
              </div>
              <div className="profile-actions">
                <button className="action-btn">프로필 관리</button>
              </div>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="tab-content">
              {activeTab === "profile" && (
                <div className="profile-content">
                  <h3>프로필 관리</h3>
                  <div className="profile-form">
                    <div className="form-group">
                      <label>닉네임</label>
                      <input type="text" defaultValue="avv5hu" />
                    </div>
                    <div className="form-group">
                      <label>이메일</label>
                      <input type="email" defaultValue="wl...... •@naver.com" />
                    </div>
                    <div className="form-group">
                      <label>휴대폰 번호</label>
                      <input type="tel" placeholder="010-0000-0000" />
                    </div>
                    <button className="save-btn">저장하기</button>
                  </div>
                </div>
              )}

              {activeTab === "purchase" && (
                <div className="purchase-content">
                  <h3>구매 내역</h3>
                  <div className="purchase-list">
                    <div className="purchase-item">
                      <div className="purchase-image">
                        <img
                          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80"
                          alt="상품"
                        />
                      </div>
                      <div className="purchase-info">
                        <div className="purchase-name">
                          New Balance 204L Suede
                        </div>
                        <div className="purchase-price">182,000원</div>
                        <div className="purchase-date">2024.01.15</div>
                        <div className="purchase-status completed">
                          구매완료
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="favorites-content">
                  <h3>관심 상품</h3>
                  <div className="favorites-list">
                    <div className="favorite-item">
                      <div className="favorite-image">
                        <img
                          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=100&q=80"
                          alt="상품"
                        />
                      </div>
                      <div className="favorite-info">
                        <div className="favorite-name">Adidas 러닝화</div>
                        <div className="favorite-price">89,000원</div>
                        <div className="favorite-date">2024.01.10</div>
                      </div>
                      <button className="remove-btn">삭제</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="reviews-content">
                  <h3>리뷰 목록</h3>
                  <div className="reviews-list">
                    <div className="review-item">
                      <div className="review-image">
                        <img
                          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80"
                          alt="상품"
                        />
                      </div>
                      <div className="review-info">
                        <div className="review-name">
                          New Balance 204L Suede
                        </div>
                        <div className="review-rating">★★★★★</div>
                        <div className="review-text">
                          정말 좋은 신발이에요! 착화감도 편하고 디자인도 예뻐요.
                        </div>
                        <div className="review-date">2024.01.15</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
