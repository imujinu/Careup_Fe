import React, { useState, useEffect } from "react";
import "./MyPage.css";
import { cartService } from "../../service/cartService";
import { productInquiryService } from "../../service/productInquiryService";
import customerAxios from "../../utils/customerAxios";
import OrderDetailModal from "./OrderDetailModal";
import { useShopAuth } from "../hooks/useShopAuth";
import { useNavigate, useSearchParams } from "react-router-dom";

const MyPage = ({ onBack, currentUser: propCurrentUser, initialTab = "profile" }) => {
  const { currentUser: hookCurrentUser, isLoggedIn } = useShopAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // prop으로 전달된 currentUser가 있으면 우선 사용, 없으면 hook에서 가져옴
  const currentUser = propCurrentUser || hookCurrentUser;
  
  // URL 파라미터에서 탭 가져오기
  const tabFromUrl = searchParams.get('tab');
  const resolvedInitialTab = tabFromUrl || initialTab;
  
  const [activeTab, setActiveTab] = useState(resolvedInitialTab);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.memberId) {
      navigate('/shop/login');
    }
  }, [isLoggedIn, currentUser?.memberId, navigate]);

  // initialTab이 변경되면 activeTab 업데이트
  useEffect(() => {
    if (resolvedInitialTab) {
      setActiveTab(resolvedInitialTab);
    }
  }, [resolvedInitialTab]);

  // URL 파라미터와 동기화
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 탭 변경 시 URL 업데이트
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/shop/mypage?tab=${tab}`, { replace: true });
  };

  // 마이페이지 정보 로드
  useEffect(() => {
    const loadMyPageData = async () => {
      const memberId = currentUser?.memberId;
      if (!memberId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 프로필 정보
        const profileRes = await customerAxios.get('/customers/my-page');
        setProfile(profileRes?.data?.result);
        
        // 주문 내역
        const ordersRes = await cartService.getOrdersByMember(memberId);
        setOrders(ordersRes?.data || ordersRes || []);
        
        // 문의 목록
        try {
          const inquiriesRes = await productInquiryService.getMyInquiries(memberId);
          setInquiries(Array.isArray(inquiriesRes) ? inquiriesRes : []);
        } catch (inquiryErr) {
          console.error('문의 목록 조회 실패:', inquiryErr);
          setInquiries([]);
        }
      } catch (err) {
        console.error('마이페이지 데이터 로드 실패:', err);
        setError('정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadMyPageData();
  }, [currentUser?.memberId]); // memberId만 의존성으로 사용

  // 탭 변경 시 문의 목록 다시 로드
  useEffect(() => {
    if (activeTab === "inquiries" && currentUser?.memberId) {
      const loadInquiries = async () => {
        try {
          const inquiriesRes = await productInquiryService.getMyInquiries(currentUser.memberId);
          setInquiries(Array.isArray(inquiriesRes) ? inquiriesRes : []);
        } catch (err) {
          console.error('문의 목록 조회 실패:', err);
          setInquiries([]);
        }
      };
      loadInquiries();
    }
  }, [activeTab, currentUser?.memberId]);

  const handleOrderDetailClick = (order) => {
    setSelectedOrder(order);
    setIsOrderDetailModalOpen(true);
  };

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
        <button className="back-btn" onClick={onBack || (() => navigate('/shop'))}>
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
                      onClick={() => handleTabChange("profile")}
                    >
                      프로필 관리
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-item ${
                        activeTab === "purchase" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("purchase")}
                    >
                      구매 내역
                    </button>
                  </li>
                  <li>
                    <button
                      className={`nav-item ${
                        activeTab === "inquiries" ? "active" : ""
                      }`}
                      onClick={() => handleTabChange("inquiries")}
                    >
                      문의 목록
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
                          <div className="purchase-actions">
                            <button 
                              className="view-detail-btn"
                              onClick={() => handleOrderDetailClick(order)}
                            >
                              상세보기
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "inquiries" && (
                <div className="inquiries-content">
                  <h3>문의 목록</h3>
                  {inquiries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <p style={{ fontSize: '16px', color: '#666' }}>등록된 문의가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="inquiries-list">
                      {inquiries.map((inquiry) => (
                        <div key={inquiry.id} className="inquiry-item">
                          <div className="inquiry-header">
                            <div className="inquiry-title-section">
                              <h4 className="inquiry-title">
                                {inquiry.title}
                                {inquiry.isSecret && <span className="secret-badge">🔒 비공개</span>}
                              </h4>
                              <span className={`inquiry-status ${inquiry.status?.toLowerCase() || 'pending'}`}>
                                {inquiry.status === 'ANSWERED' ? '답변완료' : 
                                 inquiry.status === 'PENDING' ? '답변대기' : 
                                 inquiry.status === 'CLOSED' ? '종료' : '대기중'}
                              </span>
                            </div>
                            <div className="inquiry-meta">
                              <span className="inquiry-type">{inquiry.inquiryType || 'PRODUCT'}</span>
                              <span className="inquiry-date">
                                {inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleDateString('ko-KR') : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="inquiry-content">
                            <p>{inquiry.content}</p>
                          </div>
                          {inquiry.answerCount > 0 && (
                            <div className="inquiry-answers">
                              <span className="answer-count">답변 {inquiry.answerCount}개</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          currentUser={currentUser}
          isOpen={isOrderDetailModalOpen}
          onClose={() => {
            setIsOrderDetailModalOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
};

export default MyPage;
