import React from "react";
import { Navigate } from "react-router-dom";
import FranchiseInventoryManagement from "../pages/inventory/FranchiseInventoryManagement";
import FranchisePurchaseOrderManagement from "../pages/purchaseOrder/FranchisePurchaseOrderManagement";

/**
 * 가맹점(Franchise) 전용 라우트 설정
 * branchId > 1인 사용자만 접근 가능
 */
export const franchiseRoutes = [
  {
    index: true,
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "dashboard",
    element: <div>대시보드 (준비중)</div>,
  },
  {
    path: "inventory",
    element: <FranchiseInventoryManagement />,
  },
  {
    path: "purchase-order",
    element: <FranchisePurchaseOrderManagement />,
  },
  {
    path: "attendance",
    element: <div>근태 관리 (준비중)</div>,
  },
  {
    path: "settings",
    element: <div>설정 (준비중)</div>,
  },
];

export default franchiseRoutes;
