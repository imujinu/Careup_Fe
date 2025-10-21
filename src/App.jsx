import React, { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './stores/hooks';
import { checkAuthStatus } from './stores/slices/authSlice';
import { createAppRouter } from './routes';

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, userType, branchId } = useAppSelector(state => state.auth);

  useEffect(() => {
    // 앱 시작 시 인증 상태 확인
    dispatch(checkAuthStatus());
  }, [dispatch]);

  // 인증 상태가 변경될 때마다 라우터 재생성
  const router = useMemo(() => {
    return createAppRouter({ 
      isAuthenticated, 
      userType, 
      branchId 
    });
  }, [isAuthenticated, userType, branchId]);

  return <RouterProvider router={router} />;
}

export default App;
