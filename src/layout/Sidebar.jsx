// src/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../stores/hooks';
import { logoutUser } from '../stores/slices/authSlice';
import { MENU_PATH_MAP } from '../routes/routePaths';

import Icon from '@mdi/react';
import {
  mdiViewDashboardOutline,
  mdiOfficeBuilding,
  mdiAccountGroupOutline,
  mdiClipboardTextOutline,
  mdiClockOutline,
  mdiPackageVariantClosed,
  mdiCartOutline,
  mdiShoppingOutline,
  mdiRobotOutline,
  mdiChartLine,
  mdiLogout,
  mdiChevronDown,
  mdiBriefcaseOutline, // ▼ 직급관리 아이콘
  mdiTune,            // ▼ 타입 관리 아이콘(변경)
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

/* ▼ 아코디언(하위 메뉴)용: 더 부드럽고 약간 느린 전환 */
const ArrowWrap = styled.button`
  margin-left: auto;
  display: inline-flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border: 0; background: transparent; cursor: pointer;
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  color: inherit;
  &:hover { color: #6b46c1; }
  &.open { transform: rotate(180deg); }
`;

/* 래퍼는 항상 렌더 → max-height/opacity/translateY로 전환 */
const SubmenuWrap = styled.div`
  overflow: hidden;
  max-height: ${(p) => (p.$open ? '260px' : '0')};
  opacity: ${(p) => (p.$open ? 1 : 0)};
  transform: translateY(${(p) => (p.$open ? '0' : '-2px')});
  transition:
    max-height 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
`;

const SubmenuList = styled.ul`
  list-style: none;
  margin: 0; padding: 0; /* 들여쓰기는 링크에 적용 */
  background: #f9fafb;
`;

const SubmenuItem = styled.li``;

/* 하위 탭도 상위 탭과 톤 맞춤 + 연한 보라 하이라이트 */
const SubmenuLink = styled(StyledNavLink)`
  display: flex; align-items: center; gap: 10px;
  padding: 10px 24px 10px 52px;  /* 상위(24px) + 인덴트 28px */
  font-size: 13px; border-radius: 0; /* 상위와 동일 톤 */
  border-right: 3px solid transparent;
  &:hover { background: #f5f3ff; color: #6b46c1; }
  &.active { color: #6b46c1; background: #f3f4f6; border-right-color: #6b46c1; font-weight: 600; }
`;

const Mdi = ({ path }) => <Icon path={path} size={0.95} />;

function Sidebar({ isVisible, userType, branchId }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const rawRole = useAppSelector((s) => s.auth.role);
  const branchName = useAppSelector((s) => s.auth.branchName);
  const role = String(rawRole || '').replace(/^ROLE_/, '').toUpperCase();
  const canManageStaff = role === 'BRANCH_ADMIN' || role === 'FRANCHISE_OWNER';
  const canViewTemplates = ['HQ_ADMIN','BRANCH_ADMIN','FRANCHISE_OWNER'].includes(role);

  const JOB_GRADE_PATH = (MENU_PATH_MAP && MENU_PATH_MAP.jobGrade) || '/settings/job-grades';
  const ATTENDANCE_TEMPLATES_PATH = (MENU_PATH_MAP && MENU_PATH_MAP.attendanceTemplates) || '/attendance/templates';
  const ATTENDANCE_TYPES_PATH = (MENU_PATH_MAP && MENU_PATH_MAP.attendanceTypes) || '/attendance/types';

  const showJobGradeSubmenu = userType === 'headquarters' || canManageStaff;

  // ▼ 경로에 따라 "초기 1회만" 자동 펼침. 이후에는 사용자가 토글로 제어(경로가 하위여도 접을 수 있음)
  const [open, setOpen] = useState(() => ({
    attendance: pathname.startsWith(ATTENDANCE_TEMPLATES_PATH) || pathname.startsWith(ATTENDANCE_TYPES_PATH),
    staff: pathname.startsWith(JOB_GRADE_PATH),
  }));

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const headquartersMenuItems = [
    { id: 'dashboard',     label: '대시보드',     icon: mdiViewDashboardOutline, path: MENU_PATH_MAP.dashboard },
    { id: 'branch',        label: '지점관리',     icon: mdiOfficeBuilding,       path: MENU_PATH_MAP.branch },
    { id: 'staff',         label: '직원관리',     icon: mdiAccountGroupOutline,  path: MENU_PATH_MAP.staff },
    { id: 'attendance',    label: '근태관리',     icon: mdiClockOutline,         path: MENU_PATH_MAP.attendance },
    { id: 'inventory',     label: '재고관리',     icon: mdiPackageVariantClosed, path: MENU_PATH_MAP.inventory },
    { id: 'purchaseOrder', label: '발주관리',     icon: mdiCartOutline,          path: MENU_PATH_MAP.purchaseOrder },
    { id: 'order',         label: '주문관리',     icon: mdiShoppingOutline,      path: MENU_PATH_MAP.order },
    { id: 'salesReport',   label: '매출 리포트',  icon: mdiChartLine,            path: MENU_PATH_MAP.salesReport },
    { id: 'logout',        label: '로그아웃',     icon: mdiLogout,               isButton: true },
  ];

  const franchiseBase = [
    { id: 'dashboard',     label: '대시보드', icon: mdiViewDashboardOutline, path: MENU_PATH_MAP.dashboard },
    { id: 'branch',        label: '지점관리', icon: mdiOfficeBuilding,       path: MENU_PATH_MAP.myBranch },
    { id: 'inventory',     label: '재고관리', icon: mdiPackageVariantClosed, path: MENU_PATH_MAP.inventory },
    { id: 'purchaseOrder', label: '발주관리', icon: mdiCartOutline,          path: MENU_PATH_MAP.purchaseOrder },
    { id: 'order',         label: '주문관리', icon: mdiShoppingOutline,      path: MENU_PATH_MAP.order },
    { id: 'autoOrder',     label: '자동발주', icon: mdiRobotOutline,         path: MENU_PATH_MAP.autoOrder },
    { id: 'salesReport',   label: '매출 리포트', icon: mdiChartLine,            path: MENU_PATH_MAP.salesReport },
    { id: 'attendance',    label: '근태관리', icon: mdiClockOutline,         path: MENU_PATH_MAP.attendance },
    { id: 'settings_removed_placeholder', label: '', icon: null, path: '' },
    { id: 'logout',        label: '로그아웃', icon: mdiLogout,               isButton: true },
  ].filter((m) => m.id !== 'settings_removed_placeholder');

  const franchiseMenuItems = (() => {
    if (!canManageStaff) return franchiseBase;
    const items = [...franchiseBase];
    const staffItem = { id: 'staff', label: '직원관리', icon: mdiAccountGroupOutline, path: MENU_PATH_MAP.staff };
    items.splice(1, 0, staffItem);
    return items;
  })();

  let menuItems = userType === 'headquarters' ? headquartersMenuItems : franchiseMenuItems;
  // STAFF는 발주관리/자동발주/매출 리포트 메뉴 비노출
  if (role === 'STAFF') {
    menuItems = menuItems.filter((m) => m.id !== 'purchaseOrder' && m.id !== 'autoOrder' && m.id !== 'salesReport');
  }
  // BRANCH_ADMIN, FRANCHISE_OWNER만 매출 리포트 메뉴 노출 (franchiseBase에 이미 포함되어 있음)

  const handleLogout = async () => {
    try { await dispatch(logoutUser()).unwrap(); } catch {}
    navigate('/login');
  };

  return (
    <SidebarContainer $isVisible={isVisible}>
      <SidebarHeader>
        <Logo>H</Logo>
        <AppTitle>
          한솔도시락
          {userType === 'franchise' && branchName && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', fontWeight: 400 }}>
              {branchName}
            </div>
          )}
        </AppTitle>
      </SidebarHeader>

      <MenuSection>
        <MenuList>
          {menuItems.map((item) => {
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

            // ✅ 직원관리: 직급관리 하위 탭(권한 허용 시)
            if (item.id === 'staff' && (userType === 'headquarters' || canManageStaff)) {
              const staffOpen = open.staff;
              return (
                <MenuItem key={item.id}>
                  {/* ▼ 하위 탭이 있을 때는 end를 넣어 상위가 부분 경로에서 활성화되지 않도록 */}
                  <StyledNavLink end to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <Mdi path={item.icon} />
                    {item.label}
                    <ArrowWrap
                      aria-label="하위 메뉴 토글"
                      className={staffOpen ? 'open' : ''}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle('staff');
                      }}
                    >
                      <Icon path={mdiChevronDown} size={0.9} />
                    </ArrowWrap>
                  </StyledNavLink>

                  <SubmenuWrap $open={staffOpen} aria-hidden={!staffOpen}>
                    <SubmenuList>
                      <SubmenuItem>
                        <SubmenuLink
                          to={JOB_GRADE_PATH}
                          className={({ isActive }) => (isActive ? 'active' : '')}
                        >
                          <Mdi path={mdiBriefcaseOutline} />
                          직급관리
                        </SubmenuLink>
                      </SubmenuItem>
                    </SubmenuList>
                  </SubmenuWrap>
                </MenuItem>
              );
            }

            // ✅ 근태관리: 타입 관리 → 템플릿 관리 순서(요청 반영)
            if (item.id === 'attendance') {
              const attendanceOpen = open.attendance;
              if (canViewTemplates) {
                return (
                  <MenuItem key={item.id}>
                    {/* ▼ 하위 탭이 있을 때는 end를 넣어 상위가 부분 경로에서 활성화되지 않도록 */}
                    <StyledNavLink end to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                      <Mdi path={item.icon} />
                      {item.label}
                      <ArrowWrap
                        aria-label="하위 메뉴 토글"
                        className={attendanceOpen ? 'open' : ''}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle('attendance');
                        }}
                      >
                        <Icon path={mdiChevronDown} size={0.9} />
                      </ArrowWrap>
                    </StyledNavLink>

                    <SubmenuWrap $open={attendanceOpen} aria-hidden={!attendanceOpen}>
                      <SubmenuList>
                        {/* ▼ 1. 타입 관리 (위로 이동 + 아이콘 변경) */}
                        <SubmenuItem>
                          <SubmenuLink
                            to={ATTENDANCE_TYPES_PATH}
                            className={({ isActive }) => (isActive ? 'active' : '')}
                          >
                            <Mdi path={mdiTune} />
                            타입 관리
                          </SubmenuLink>
                        </SubmenuItem>
                        {/* ▼ 2. 템플릿 관리 (기존 아이콘 유지) */}
                        <SubmenuItem>
                          <SubmenuLink
                            to={ATTENDANCE_TEMPLATES_PATH}
                            className={({ isActive }) => (isActive ? 'active' : '')}
                          >
                            <Mdi path={mdiClipboardTextOutline} />
                            템플릿 관리
                          </SubmenuLink>
                        </SubmenuItem>
                      </SubmenuList>
                    </SubmenuWrap>
                  </MenuItem>
                );
              }
              // 권한 없으면 하위 메뉴 없이 기본 링크만
              return (
                <MenuItem key={item.id}>
                  <StyledNavLink to={item.path} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <Mdi path={item.icon} />
                    {item.label}
                  </StyledNavLink>
                </MenuItem>
              );
            }

            // 일반 단일 메뉴
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
