// src/routes/franchiseRoutes.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import FranchiseInventoryManagement from '../pages/inventory/FranchiseInventoryManagement';
import FranchisePurchaseOrderManagement from '../pages/purchaseOrder/FranchisePurchaseOrderManagement';
import FranchiseOrderManagement from '../pages/franchise/FranchiseOrderManagement';
import AutoOrderSettings from '../pages/franchise/AutoOrderSettings';
import MyBranchDetail from '../pages/branch/MyBranchDetail';
import BranchSalesReport from '../pages/salesReport/BranchSalesReport';
import AttendanceCalendar from '../pages/attendance/AttendanceCalendar';
import FranchiseDashboard from "../pages/franchise/FranchiseDashboard";

/**
 * 가맹점(Franchise) 전용 라우트 설정
 * branchId > 1인 사용자만 접근 가능
 */
export const franchiseRoutes = [
  { index: true, element: <Navigate to="/dashboard" replace /> },

  { path: 'dashboard', element: <FranchiseDashboard /> },

  // 기능별 메뉴
  { path: 'inventory', element: <FranchiseInventoryManagement /> },
  { path: 'purchase-order', element: <FranchisePurchaseOrderManagement /> },
  { path: 'order', element: <FranchiseOrderManagement /> },
  { path: 'auto-order', element: <AutoOrderSettings /> },
  { path: 'attendance', element: <AttendanceCalendar /> },
  { path: 'my-branch', element: <MyBranchDetail /> },
  { path: 'sales-report', element: <BranchSalesReport /> },

  // 설정
  { path: 'settings', element: <div>설정 (준비중)</div> },
];

export default franchiseRoutes;
