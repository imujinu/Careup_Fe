// src/layout/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { logoutUser } from '../stores/slices/authSlice';
import { MENU_PATH_MAP } from '../routes/routePaths';
import { getBranchName } from '../utils/branchUtils';

import Icon from '@mdi/react';
import {
  mdiViewDashboardOutline,
  mdiOfficeBuilding,
  mdiAccountGroupOutline,
  mdiHandshakeOutline,
  mdiClipboardTextOutline,
  mdiClockOutline,
  mdiPackageVariantClosed,
  mdiCartOutline,
  mdiShoppingOutline,
  mdiRobotOutline,
  mdiChartLine,
  mdiCogOutline,
  mdiLogout,
} from '@mdi/js';

const SidebarContainer = styled.aside`
  position: fixed;
  top: 0;
  left: ${(p) => (p.$isVisible ? '0' : '-240px')};
  width: 240px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e5e5;
  padding: 24px 0;
  z-index: 999;
  transition: left 0.3s ease;
`;

const MenuSection = styled.div`margin-bottom: 32px;`;
const MenuList = styled.ul`list-style: none; padding: 0; margin: 0;`;
const MenuItem = styled.li``;

const StyledNavLink = styled(NavLink)`
  display: flex; align-items: center; gap: 12px; padding: 12px 24px;
  color: #1f2937; background: transparent; border-right: 3px solid transparent;
  text-decoration: none; font-size: 14px; font-weight: 400; transition: all 0.2s ease; cursor: pointer;
  &:hover { background: #f9fafb; color: #6b46c1; }
  &.active { color: #6b46c1; background: #f3f4f6; border-right: 3px solid #6b46c1; font-weight: 600; }
`;

const MenuButton = styled.button`
  display: flex; align-items: center; gap: 12px; padding: 12px 24px;
  color: #1f2937; background: transparent; border: none; border-right: 3px solid transparent;
  font-size: 14px; font-weight: 400; transition: all 0.2s ease; cursor: pointer; width: 100%; text-align: left;
  &:hover { background: #f9fafb; color: #6b46c1; }
`;

const SidebarHeader = styled.div`padding: 20px 24px; border-bottom: 1px solid #e5e7eb; margin-bottom: 20px;`;
const Logo = styled.div`width: 32px; height: 32px; background: #6b46c1; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; margin-bottom: 8px;`;
const AppTitle = styled.h2`font-size: 16px; font-weight: 600; color: #1f2937; margin: 0;`;

// ▼ 플라이아웃 전용 요소
const FlyoutWrapper = styled.li`
  position: relative;
  /* Hover 시에만 패널 표시 */
  &:hover > div[data-flyout="panel"] {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }
`;

const FlyoutPanel = styled.div`
  position: absolute;
  top: 0; /* 설정 항목의 상단에 맞춰 뜨게 함 */
  left: calc(100% + 8px); /* 사이드바 오른쪽으로 살짝 띄움 */
  min-width: 180px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  padding: 8px 8px;
  z-index: 1000; /* 사이드바(999)보다 위 */
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
`;

const FlyoutLink = styled(StyledNavLink)`
  border-right: none;
  padding: 10px 12px;
  font-size: 13px;
  border-radius: 6px;
  &:hover { background: #f9fafb; }
`;

const Mdi = ({ path }) => <Icon path={path} size={0.95} />;

function Sidebar({ isVisible, userType, branchId }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const rawRole = useAppSelector((s) => s.auth.role);
  const role = String(rawRole || '').replace(/^ROLE_/, '').toUpperCase();
  const canManageStaff = role === 'BRANCH_ADMIN' || role === 'FRANCHISE_OWNER';

  // 직급관리 경로: 존재하면 사용, 없으면 폴백
  const JOB_GRADE_PATH = (MENU_PATH_MAP && MENU_PATH_MAP.jobGrade) || '/settings/job-grades';
  // 플라이아웃 노출 조건: 본사 항상, 가맹점은 관리자급만
  const showJobGradeFlyout = userType === 'headquarters' || canManageStaff;

  const headquartersMenuItems = [
    { id: 'dashboard',     label: '대시보드',     icon: mdiViewDashboardOutline, path: MENU_PATH_MAP.dashboard },
    { id: 'branch',        label: '지점관리',     icon: mdiOfficeBuilding,       path: MENU_PATH_MAP.branch },
    { id: 'staff',         label: '직원관리',     icon: mdiAccountGroupOutline,  path: MENU_PATH_MAP.staff },
    { id: 'client',        label: '거래처',       icon: mdiHandshakeOutline,     path: MENU_PATH_MAP.client },
    { id: 'task',          label: '작업관리',     icon: mdiClipboardTextOutline, path: MENU_PATH_MAP.task },
    { id: 'attendance',    label: '근태관리',     icon: mdiClockOutline,         path: MENU_PATH_MAP.attendance },
    { id: 'inventory',     label: '재고관리',     icon: mdiPackageVariantClosed, path: MENU_PATH_MAP.inventory },
    { id: 'purchaseOrder', label: '발주관리',     icon: mdiCartOutline,          path: MENU_PATH_MAP.purchaseOrder },
    { id: 'order',         label: '주문관리',     icon: mdiShoppingOutline,      path: MENU_PATH_MAP.order },
    { id: 'salesReport',   label: '매출 리포트',  icon: mdiChartLine,            path: MENU_PATH_MAP.salesReport },
    { id: 'settings',      label: '설정',         icon: mdiCogOutline,           path: MENU_PATH_MAP.settings },
    { id: 'logout',        label: '로그아웃',     icon: mdiLogout,               isButton: true },
  ];

  const franchiseBase = [
    { id: 'dashboard',     label: '대시보드', icon: mdiViewDashboardOutline, path: MENU_PATH_MAP.dashboard },
    { id: 'branch',        label: '지점관리', icon: mdiOfficeBuilding,       path: MENU_PATH_MAP.myBranch },
    { id: 'inventory',     label: '재고관리', icon: mdiPackageVariantClosed, path: MENU_PATH_MAP.inventory },
    { id: 'purchaseOrder', label: '발주관리', icon: mdiCartOutline,          path: MENU_PATH_MAP.purchaseOrder },
    { id: 'order',         label: '주문관리', icon: mdiShoppingOutline,      path: MENU_PATH_MAP.order },
    { id: 'autoOrder',     label: '자동발주', icon: mdiRobotOutline,         path: MENU_PATH_MAP.autoOrder },
    { id: 'attendance',    label: '근태관리', icon: mdiClockOutline,         path: MENU_PATH_MAP.attendance },
    { id: 'settings',      label: '설정',     icon: mdiCogOutline,           path: MENU_PATH_MAP.settings },
    { id: 'logout',        label: '로그아웃', icon: mdiLogout,               isButton: true },
  ];

  const franchiseMenuItems = (() => {
    if (!canManageStaff) return franchiseBase;
    const items = [...franchiseBase];
    const staffItem = { id: 'staff', label: '직원관리', icon: mdiAccountGroupOutline, path: MENU_PATH_MAP.staff };
    items.splice(1, 0, staffItem);
    return items;
  })();

  let menuItems = userType === 'headquarters' ? headquartersMenuItems : franchiseMenuItems;
  // STAFF는 발주관리/자동발주 메뉴 비노출
  if (role === 'STAFF') {
    menuItems = menuItems.filter((m) => m.id !== 'purchaseOrder' && m.id !== 'autoOrder');
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return (
    <SidebarContainer $isVisible={isVisible}>
      <SidebarHeader>
        <Logo>H</Logo>
        <AppTitle>
          한솔도시락
          {userType === 'franchise' && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: 400 }}>
              {getBranchName(branchId)}
            </div>
          )}
        </AppTitle>
      </SidebarHeader>

      <MenuSection>
        <MenuList>
          {menuItems.map((item) => {
            // 로그아웃 버튼
            if (item.isButton) {
              return (
                <MenuItem key={item.id}>
                  <MenuButton onClick={handleLogout}>
                    <Mdi path={item.icon} />
                    {item.label}
                  </MenuButton>
                </MenuItem>
              );
            }

            // 설정 항목 + 플라이아웃(직급관리)
            if (item.id === 'settings' && showJobGradeFlyout) {
              return (
                <FlyoutWrapper key={item.id}>
                  <StyledNavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <Mdi path={item.icon} />
                    {item.label}
                  </StyledNavLink>

                  <FlyoutPanel data-flyout="panel" aria-label="설정 확장 메뉴">
                    <FlyoutLink to={JOB_GRADE_PATH} className={({ isActive }) => (isActive ? 'active' : '')}>
                      <Mdi path={mdiAccountGroupOutline} />
                      직급관리
                    </FlyoutLink>
                  </FlyoutPanel>
                </FlyoutWrapper>
              );
            }

            // 기본 항목
            return (
              <MenuItem key={item.id}>
                <StyledNavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                  <Mdi path={item.icon} />
                  {item.label}
                </StyledNavLink>
              </MenuItem>
            );
          })}
        </MenuList>
      </MenuSection>
    </SidebarContainer>
  );
}

export default Sidebar;
