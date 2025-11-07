/**
 * 라우트 경로 상수 정의
 * 모든 라우트 경로를 중앙에서 관리하여 일관성 유지
 */

// 공통 경로
export const PATHS = {
  ROOT: "/",
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  SHOP: "/shop",
};

// 본사 전용 경로
export const HEADQUARTERS_PATHS = {
  BRANCH: '/branch',
  BRANCH_DETAIL: '/branch/detail',
  ATTENDANCE: '/attendance',
  ATTENDANCE_TEMPLATES: '/attendance/templates',   // ✅ 추가
  ATTENDANCE_TYPES: '/attendance/types',           // ✅ 추가
  INVENTORY: '/inventory',
  PURCHASE_ORDER: '/purchase-order',
  SALES_REPORT: '/sales-report',
  SETTINGS: '/settings',

  // 직원관리
  STAFF: '/staff',
  STAFF_CREATE: '/staff/create',
  // (상세 경로는 라우트 파일에서 :id 파라미터로 처리)
};

// 가맹점 전용 경로
export const FRANCHISE_PATHS = {
  DASHBOARD: "/dashboard",
  INVENTORY: "/inventory",
  PURCHASE_ORDER: "/purchase-order",
  AUTO_ORDER: "/auto-order",
  ATTENDANCE: "/attendance",
  // 템플릿/타입 관리 화면 접근이 필요한 경우 아래 2개 사용 가능
  ATTENDANCE_TEMPLATES: "/attendance/templates",   // (권한에 따라 노출)
  ATTENDANCE_TYPES: "/attendance/types",           // (권한에 따라 노출)
  MY_BRANCH: "/my-branch",
  SALES_REPORT: "/sales-report",
  SETTINGS: "/settings",
};

// 메뉴 ID와 경로 매핑 (사이드바에서 사용)
export const MENU_PATH_MAP = {
  dashboard: '/dashboard',
  branch: '/branch',
  myBranch: '/my-branch',
  attendance: '/attendance',
  attendanceTemplates: '/attendance/templates', // ✅ 추가
  attendanceTypes: '/attendance/types',         // ✅ 추가
  inventory: '/inventory',
  purchaseOrder: '/purchase-order',
  order: '/order',
  salesReport: '/sales-report',
  autoOrder: '/auto-order',
  settings: '/settings',
  shop: '/shop',
  logout: '/logout',

  // 직원관리
  staff: '/staff',
  staffCreate: '/staff/create',

  // 설정 하위
  jobGrade: '/settings/job-grades',             // ✅ 추가 (사이드바 하위 "직급관리")
};

export default PATHS;
