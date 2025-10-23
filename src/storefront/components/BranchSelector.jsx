import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BranchSelector = ({ onClose, onBranchSelected }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  // 인증 없이 사용할 axios 인스턴스 생성
  const publicApi = axios.create({ 
    baseURL: API_BASE_URL,
    timeout: 5000
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      // 인증 없이 접근 가능한 엔드포인트 사용
      const response = await publicApi.get('/branch/public/list');
      // 백엔드 응답 구조: { result: [...], status_code: 200, status_message: "..." }
      setBranches(response.data.result || response.data);
    } catch (error) {
      console.error('지점 목록 로드 실패:', error);
      // 백업으로 더미 데이터 사용
      setBranches([
        {
          branchId: 1,
          branchName: "강남점",
          address: "서울특별시 강남구 테헤란로 123",
          addressDetail: "강남빌딩 1층",
          phone: "02-1234-5678",
          email: "gangnam@careup.com",
          latitude: 37.5665,
          longitude: 126.9780,
          isOpen: true
        },
        {
          branchId: 2,
          branchName: "홍대점",
          address: "서울특별시 마포구 홍익로 456",
          addressDetail: "홍대상가 2층",
          phone: "02-2345-6789",
          email: "hongdae@careup.com",
          latitude: 37.5563,
          longitude: 126.9226,
          isOpen: true
        },
        {
          branchId: 3,
          branchName: "신촌점",
          address: "서울특별시 서대문구 신촌로 789",
          addressDetail: "신촌센터 3층",
          phone: "02-3456-7890",
          email: "sinchon@careup.com",
          latitude: 37.5551,
          longitude: 126.9368,
          isOpen: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch =>
    branch.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBranchSelect = (branch) => {
    onBranchSelected(branch);
  };

  return (
    <div className="branch-selector-overlay">
      <div className="branch-selector-modal">
        <div className="branch-selector-header">
          <h3>지점 선택</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="branch-selector-search">
          <input
            type="text"
            placeholder="지점명 또는 주소로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="branch-selector-content">
          {loading ? (
            <div className="loading">지점 목록을 불러오는 중...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : filteredBranches.length === 0 ? (
            <div className="no-results">검색 결과가 없습니다.</div>
          ) : (
            <div className="branch-list">
              {filteredBranches.map((branch) => (
                <div
                  key={branch.branchId}
                  className="branch-item"
                  onClick={() => handleBranchSelect(branch)}
                >
                  <div className="branch-info">
                    <div className="branch-name">{branch.branchName}</div>
                    <div className="branch-address">
                      {branch.address} {branch.addressDetail}
                    </div>
                    <div className="branch-contact">
                      📞 {branch.phone} | ✉️ {branch.email}
                    </div>
                    <div className={`branch-status ${branch.isOpen ? 'open' : 'closed'}`}>
                      {branch.isOpen ? '🟢 영업중' : '🔴 영업종료'}
                    </div>
                  </div>
                  <div className="branch-action">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BranchSelector;
