import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setSelectedBranch, setNearbyBranches, setLoading, setError } from '../../store/slices/branchSlice';
import axios from 'axios';

const BranchSelectPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { nearbyBranches, loading, error } = useSelector(state => state.branch);
  
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  const shopApi = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

  useEffect(() => {
    loadNearbyBranches();
  }, []);

  const loadNearbyBranches = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // 현재 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const res = await shopApi.get(`/api/branches/nearby?lat=${latitude}&lng=${longitude}`);
            dispatch(setNearbyBranches(res.data.data || res.data || []));
          },
          async () => {
            // 위치 접근 실패시 전체 지점 조회
            const res = await shopApi.get('/api/branches');
            dispatch(setNearbyBranches(res.data.data || res.data || []));
          }
        );
      } else {
        // 위치 서비스 미지원시 전체 지점 조회
        const res = await shopApi.get('/api/branches');
        dispatch(setNearbyBranches(res.data.data || res.data || []));
      }
    } catch (e) {
      console.error('지점 조회 실패:', e);
      dispatch(setError('지점을 불러오는데 실패했습니다.'));
      
      // API 실패시 테스트 데이터 사용
      const testBranches = [
        {
          branchId: 1,
          name: '강남점',
          address: '서울시 강남구 테헤란로 123',
          phone: '02-1234-5678',
          latitude: 37.5665,
          longitude: 126.9780,
        },
        {
          branchId: 2,
          name: '홍대점',
          address: '서울시 마포구 홍익로 456',
          phone: '02-2345-6789',
          latitude: 37.5563,
          longitude: 126.9226,
        },
        {
          branchId: 3,
          name: '신촌점',
          address: '서울시 서대문구 신촌로 789',
          phone: '02-3456-7890',
          latitude: 37.5551,
          longitude: 126.9368,
        },
      ];
      dispatch(setNearbyBranches(testBranches));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    
    try {
      dispatch(setLoading(true));
      const res = await shopApi.get(`/api/branches/search?keyword=${encodeURIComponent(searchKeyword)}`);
      setSearchResults(res.data.data || res.data || []);
      setShowSearchResults(true);
    } catch (e) {
      console.error('지점 검색 실패:', e);
      dispatch(setError('지점 검색에 실패했습니다.'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleBranchSelect = (branch) => {
    dispatch(setSelectedBranch({
      branchId: branch.branchId,
      branchName: branch.name,
      address: branch.address,
      phone: branch.phone,
    }));
    navigate('/shop/products');
  };

  const branchesToShow = showSearchResults ? searchResults : nearbyBranches;

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          🏪 지점을 선택해주세요
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          선택한 지점의 상품을 주문할 수 있습니다
        </p>
      </div>

      {/* 검색 섹션 */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '12px', maxWidth: '500px', margin: '0 auto' }}>
          <input
            type="text"
            placeholder="지점명 또는 주소로 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: '#111',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? '검색중...' : '검색'}
          </button>
        </div>
        
        {showSearchResults && (
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              onClick={() => {
                setShowSearchResults(false);
                setSearchKeyword('');
              }}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              ← 전체 지점 보기
            </button>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div style={{
          background: '#fef2f2',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center',
        }}>
          ❌ {error}
        </div>
      )}

      {/* 지점 목록 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>
            🔄 지점을 불러오는 중...
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {branchesToShow.map((branch) => (
            <div
              key={branch.branchId}
              onClick={() => handleBranchSelect(branch)}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#111';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  color: '#111',
                }}>
                  {branch.name}
                </h3>
                <p style={{
                  color: '#6b7280',
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                }}>
                  📍 {branch.address}
                </p>
                {branch.phone && (
                  <p style={{
                    color: '#6b7280',
                    margin: '0',
                    fontSize: '14px',
                  }}>
                    📞 {branch.phone}
                  </p>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '16px',
              }}>
                <span style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  선택하기
                </span>
                <span style={{ fontSize: '20px' }}>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {branchesToShow.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '18px', color: '#6b7280' }}>
            📍 등록된 지점이 없습니다
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSelectPage;
