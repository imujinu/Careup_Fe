import React, { useState, useEffect } from "react";
import "./MyPage.css";
import { cartService } from "../../service/cartService";
import customerAxios from "../../utils/customerAxios";

const MyPage = ({ onBack, currentUser }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 마이페이지 정보 로드
  useEffect(() => {
    const loadMyPageData = async () => {
      if (!currentUser?.memberId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 프로필 정보
        const profileRes = await customerAxios.get('/customers/my-page');
        setProfile(profileRes?.data?.result);
        
        // 주문 내역
        const ordersRes = await cartService.getOrdersByMember(currentUser.memberId);
        setOrders(ordersRes?.data || ordersRes || []);
      } catch (err) {
        console.error('마이페이지 데이터 로드 실패:', err);
        setError('정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadMyPageData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="mypage">
        <div className="container" style={{ textAlign: "center", padding: "40px 0" }}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

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
                  <div className="username">{profile?.nickname || profile?.name || currentUser?.nickname || currentUser?.name || '사용자'}</div>
                  <div className="email">{profile?.email || currentUser?.email || '이메일 없음'}</div>
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
                      <input type="text" defaultValue={profile?.nickname || ''} disabled />
                    </div>
                    <div className="form-group">
                      <label>이름</label>
                      <input type="text" defaultValue={profile?.name || ''} disabled />
                    </div>
                    <div className="form-group">
                      <label>이메일</label>
                      <input type="email" defaultValue={profile?.email || ''} disabled />
                    </div>
                    <div className="form-group">
                      <label>휴대폰 번호</label>
                      <input type="tel" defaultValue={profile?.phone || ''} disabled />
                    </div>
                    <div className="form-group">
                      <label>주소</label>
                      <input type="text" defaultValue={profile?.address || ''} disabled />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "purchase" && (
                <div className="purchase-content">
                  <h3>구매 내역</h3>
                  {error && <div style={{ color: 'red', marginBottom: '20px' }}>{error}</div>}
                  <div className="purchase-list">
                    {orders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p>구매 내역이 없습니다.</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <div key={order.orderId || order.id} className="purchase-item">
                          <div className="purchase-info">
                            <div className="purchase-name">주문번호: {order.orderId || order.id}</div>
                            <div className="purchase-price">{(order.totalAmount || 0).toLocaleString()}원</div>
                            <div className="purchase-date">
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : '-'}
                            </div>
                            <div className={`purchase-status ${order.orderStatus?.toLowerCase() || 'pending'}`}>
                              {order.orderStatus === 'CONFIRMED' ? '구매완료' : 
                               order.orderStatus === 'PENDING' ? '주문대기' :
                               order.orderStatus === 'CANCELLED' ? '취소됨' : order.orderStatus || '대기중'}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "favorites" && (
                <div className="favorites-content">
                  <h3>관심 상품</h3>
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <p style={{ fontSize: '16px', color: '#666' }}>이 기능은 추후 추가 예정입니다.</p>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="reviews-content">
                  <h3>리뷰 목록</h3>
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <p style={{ fontSize: '16px', color: '#666' }}>이 기능은 추후 추가 예정입니다.</p>
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
