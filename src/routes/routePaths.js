/**
 * 라우트 경로 상수 정의
 * 모든 라우트 경로를 중앙에서 관리하여 일관성 유지
 */

// 공통 경로
export const PATHS = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
};

// 본사 전용 경로
export const HEADQUARTERS_PATHS = {
  BRANCH: '/branch',
  BRANCH_DETAIL: '/branch/detail',
  CLIENT: '/client',
  TASK: '/task',
  ATTENDANCE: '/attendance',
  INVENTORY: '/inventory',
  PURCHASE_ORDER: '/purchase-order',
  SETTINGS: '/settings',
};

// 가맹점 전용 경로
export const FRANCHISE_PATHS = {
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  PURCHASE_ORDER: '/purchase-order',
  ATTENDANCE: '/attendance',
  SETTINGS: '/settings',
};

// 메뉴 ID와 경로 매핑
export const MENU_PATH_MAP = {
  dashboard: '/dashboard',
  branch: '/branch',
  client: '/client',
  task: '/task',
  attendance: '/attendance',
  inventory: '/inventory',
  purchaseOrder: '/purchase-order',
  settings: '/settings',
  logout: '/logout',
};

export default PATHS;

