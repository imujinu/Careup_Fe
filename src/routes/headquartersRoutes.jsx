// src/routes/headquartersRoutes.jsx
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
import StaffList from '../pages/staff/StaffList';
import StaffCreate from '../pages/staff/StaffCreate';
import HeadquartersDashboard from '../pages/admin/HeadquartersDashboard';
import OrderManagement from '../pages/admin/OrderManagement';
import StaffDetail from '../pages/staff/StaffDetail';

// 직급관리 페이지가 이미 있다면 경로를 맞춰 import 하세요.
import JobGradeManagement from '../pages/settings/JobGradeManagement';

export const headquartersRoutes = [
  { index: true, element: <Navigate to="/dashboard" replace /> },
  { path: 'dashboard', element: <HeadquartersDashboard /> },

  { path: 'branch', element: <HeadquartersBranchList /> },
  { path: 'branch/register', element: <BranchRegistration /> },
  { path: 'branch/edit/:branchId', element: <BranchEdit /> },
  { path: 'branch/detail/:branchId', element: <BranchDetail /> },
  { path: 'branch/test-register', element: <TestBranchRegistration /> },

  // 직원관리
  { path: 'staff', element: <StaffList /> },
  { path: 'staff/create', element: <StaffCreate /> },
  { path: 'staff/detail/:id', element: <StaffDetail /> },

  { path: 'client', element: <div>거래처 관리 (준비중)</div> },
  { path: 'task', element: <div>작업 관리 (준비중)</div> },
  { path: 'attendance', element: <div>근태 관리 (준비중)</div> },
  { path: 'inventory', element: <InventoryManagement /> },
  { path: 'purchase-order', element: <PurchaseOrderManagement /> },
  { path: 'order', element: <OrderManagement /> },
  { path: 'sales-report', element: <SalesReport /> },

  // 설정
  { path: 'settings', element: <div>설정 (준비중)</div> },
  { path: 'settings/job-grades', element: <JobGradeManagement /> }, // ← 직급관리 라우트 추가
];

export default headquartersRoutes;
