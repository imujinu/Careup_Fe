import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layout/Layout';
import Login from '../pages/auth/Login';
import ShopApp from '../storefront/pages/ShopApp';
import PaymentSuccessPage from '../storefront/pages/PaymentSuccessPage';
import PaymentFailPage from '../storefront/pages/PaymentFailPage';
import { headquartersRoutes } from './headquartersRoutes';
import { franchiseRoutes } from './franchiseRoutes';

/**
 * 라우터 생성 함수
 * @param {Object} authState - 인증 상태 (isAuthenticated, userType, branchId)
 * @returns {Object} React Router 인스턴스
 */
export const createAppRouter = (authState) => {
  const { isAuthenticated, userType } = authState;

  // 인증되지 않은 경우 로그인 페이지만 표시
  if (!isAuthenticated) {
    return createBrowserRouter([
      {
        path: '/shop',
        element: <ShopApp />,
      },
      {
        path: '/shop/payment-success',
        element: <PaymentSuccessPage />,
      },
      {
        path: '/shop/payment-fail',
        element: <PaymentFailPage />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '*',
        element: <Navigate to="/login" replace />,
      },
    ]);
  }

  // 사용자 타입에 따라 다른 라우트 설정
  const routes = userType === 'headquarters' 
    ? headquartersRoutes 
    : franchiseRoutes;

  return createBrowserRouter([
    {
      path: '/shop',
      element: <ShopApp />,
    },
    {
      path: '/shop/payment-success',
      element: <PaymentSuccessPage />,
    },
    {
      path: '/shop/payment-fail',
      element: <PaymentFailPage />,
    },
    {
      path: '/',
      element: <Layout />,
      children: routes,
    },
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ]);
};

export default createAppRouter;

