import { useState, useEffect, useRef } from 'react';
import { customerAuthService } from '../../service/customerAuthService';

export function useShopAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(customerAuthService.isAuthenticated());
  const [currentUser, setCurrentUser] = useState(customerAuthService.getCurrentUser());
  const prevMemberIdRef = useRef(currentUser?.memberId);
  const prevIsLoggedInRef = useRef(isLoggedIn);

  useEffect(() => {
    // 인증 상태 변경 감지
    const checkAuth = () => {
      const newIsLoggedIn = customerAuthService.isAuthenticated();
      const newCurrentUser = customerAuthService.getCurrentUser();
      const newMemberId = newCurrentUser?.memberId;
      
      // 실제로 변경된 경우에만 상태 업데이트
      if (newIsLoggedIn !== prevIsLoggedInRef.current) {
        prevIsLoggedInRef.current = newIsLoggedIn;
        setIsLoggedIn(newIsLoggedIn);
      }
      
      // memberId가 변경된 경우에만 currentUser 업데이트 (참조 변경 방지)
      if (newMemberId !== prevMemberIdRef.current) {
        prevMemberIdRef.current = newMemberId;
        setCurrentUser(newCurrentUser);
      } else if (!newIsLoggedIn && prevIsLoggedInRef.current) {
        // 로그아웃된 경우
        setCurrentUser(null);
        prevMemberIdRef.current = null;
      }
    };

    // 초기 체크
    checkAuth();
    
    // 주기적으로 체크 (5초로 변경하여 불필요한 업데이트 방지)
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []); // 의존성 배열 비움 - 마운트 시 한 번만 실행

  const handleLogout = async () => {
    try {
      await customerAuthService.logout();
      setIsLoggedIn(false);
      setCurrentUser(null);
      prevMemberIdRef.current = null;
      prevIsLoggedInRef.current = false;
      return true;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      setIsLoggedIn(false);
      setCurrentUser(null);
      prevMemberIdRef.current = null;
      prevIsLoggedInRef.current = false;
      return false;
    }
  };

  return {
    isLoggedIn,
    currentUser,
    handleLogout
  };
}

