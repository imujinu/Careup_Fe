import React from 'react';
import { Navigate } from 'react-router-dom';
import HeadquartersBranchList from '../pages/branch/HeadquartersBranchList';
import BranchRegistration from '../pages/branch/BranchRegistration';
import BranchEdit from '../pages/branch/BranchEdit';
import BranchDetail from '../pages/branch/BranchDetail';
import TestBranchRegistration from '../pages/branch/TestBranchRegistration';
import InventoryManagement from '../pages/inventory/InventoryManagement';
import PurchaseOrderManagement from '../pages/purchaseOrder/PurchaseOrderManagement';
import SalesReport from '../pages/salesReport/SalesReport';

/**
 * 본사(Headquarters) 전용 라우트 설정
 * branchId === 1인 사용자만 접근 가능
 */
export const headquartersRoutes = [
  {
    index: true,
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: 'dashboard',
    element: <div>대시보드 (준비중)</div>,
  },
  {
    path: 'branch',
    element: <HeadquartersBranchList />,
  },
  {
    path: 'branch/register',
    element: <BranchRegistration />,
  },
  {
    path: 'branch/edit/:branchId',
    element: <BranchEdit />,
  },
  {
    path: 'branch/detail/:branchId',
    element: <BranchDetail />,
  },
  {
    path: 'branch/test-register',
    element: <TestBranchRegistration />,
  },
  {
    path: 'client',
    element: <div>거래처 관리 (준비중)</div>,
  },
  {
    path: 'task',
    element: <div>작업 관리 (준비중)</div>,
  },
  {
    path: 'attendance',
    element: <div>근태 관리 (준비중)</div>,
  },
  {
    path: 'inventory',
    element: <InventoryManagement />,
  },
  {
    path: 'purchase-order',
    element: <PurchaseOrderManagement />,
  },
  {
    path: 'sales-report',
    element: <SalesReport />,
  },
  {
    path: 'settings',
    element: <div>설정 (준비중)</div>,
  },
];

export default headquartersRoutes;

