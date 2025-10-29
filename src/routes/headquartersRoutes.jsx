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

  { path: 'client', element: <div>거래처 관리 (준비중)</div> },
  { path: 'task', element: <div>작업 관리 (준비중)</div> },
  { path: 'attendance', element: <div>근태 관리 (준비중)</div> },
  { path: 'inventory', element: <InventoryManagement /> },
  { path: 'purchase-order', element: <PurchaseOrderManagement /> },
  { path: 'order', element: <OrderManagement /> },
  { path: 'sales-report', element: <SalesReport /> },
  { path: 'settings', element: <div>설정 (준비중)</div> },
];

export default headquartersRoutes;
