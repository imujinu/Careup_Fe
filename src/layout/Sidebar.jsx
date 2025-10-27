import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppDispatch } from '../stores/hooks';
import { logoutUser } from '../stores/slices/authSlice';
import { MENU_PATH_MAP } from '../routes/routePaths';
import { getBranchName } from '../utils/branchUtils';

const SidebarContainer = styled.aside`
  position: fixed;
  top: 0;

  left: ${props => props.$isVisible ? '0' : '-240px'};
  width: 240px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e5e5;
  padding: 24px 0;
  z-index: 999;
  transition: left 0.3s ease;
`;

const MenuSection = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 16px 24px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li``;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: #1f2937;
  background: transparent;
  border-right: 3px solid transparent;
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
    color: #6b46c1;
  }

  &.active {
    color: #6b46c1;
    background: #f3f4f6;
    border-right: 3px solid #6b46c1;
    font-weight: 600;
  }
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: #1f2937;
  background: transparent;
  border: none;
  border-right: 3px solid transparent;
  text-decoration: none;
  font-size: 14px;
  font-weight: 400;
  transition: all 0.2s ease;
  cursor: pointer;
  width: 100%;
  text-align: left;

  &:hover {
    background: #f9fafb;
    color: #6b46c1;
  }
`;

const MenuIcon = styled.span`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`;

const SidebarHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
`;

const Logo = styled.div`
  width: 32px;
  height: 32px;
  background: #6b46c1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
`;

const AppTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

function Sidebar({ isVisible, userType, branchId }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // 본사 메뉴 (branchId === 1)
  const headquartersMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊', path: MENU_PATH_MAP.dashboard },
    { id: 'branch', label: '지점관리', icon: '🏢', path: MENU_PATH_MAP.branch },
    { id: 'client', label: '거래처', icon: '🤝', path: MENU_PATH_MAP.client },
    { id: 'task', label: '작업관리', icon: '📋', path: MENU_PATH_MAP.task },
    { id: 'attendance', label: '근태관리', icon: '🕐', path: MENU_PATH_MAP.attendance },
    { id: 'inventory', label: '재고관리', icon: '📦', path: MENU_PATH_MAP.inventory },
    { id: 'purchaseOrder', label: '발주관리', icon: '🛒', path: MENU_PATH_MAP.purchaseOrder },
    { id: 'salesReport', label: '매출 리포트', icon: '📈', path: MENU_PATH_MAP.salesReport },
    { id: 'settings', label: '설정', icon: '⚙️', path: MENU_PATH_MAP.settings },
    { id: 'logout', label: '로그아웃', icon: '↪️', isButton: true },
  ];

  // 가맹점 메뉴 (branchId > 1)
  const franchiseMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊', path: MENU_PATH_MAP.dashboard },
    { id: 'inventory', label: '재고관리', icon: '📦', path: MENU_PATH_MAP.inventory },
    { id: 'purchaseOrder', label: '발주관리', icon: '🛒', path: MENU_PATH_MAP.purchaseOrder },
    { id: 'attendance', label: '근태관리', icon: '🕐', path: MENU_PATH_MAP.attendance },
    { id: 'settings', label: '설정', icon: '⚙️', path: MENU_PATH_MAP.settings },
    { id: 'logout', label: '로그아웃', icon: '↪️', isButton: true },
  ];

  const menuItems = userType === 'headquarters' ? headquartersMenuItems : franchiseMenuItems;

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

  return React.createElement(SidebarContainer, { $isVisible: isVisible },
    React.createElement(SidebarHeader, null,
      React.createElement(Logo, null, 'H'),
      React.createElement(AppTitle, null, 
        '한솔도시락',
        userType === 'franchise' && React.createElement('div', { 
          style: { 
            fontSize: '12px', 
            color: '#6b7280', 
            marginTop: '4px',
            fontWeight: '400'
          } 
        }, getBranchName(branchId))
      )
    ),
    React.createElement(MenuSection, null,
      React.createElement(MenuList, null,
        menuItems.map((item) =>
          React.createElement(MenuItem, { key: item.id },
            item.isButton 
              ? React.createElement(MenuButton, { 
                  onClick: handleLogout
                },
                  React.createElement(MenuIcon, null, item.icon),
                  item.label
                )
              : React.createElement(StyledNavLink, { 
                  to: item.path,
                  className: ({ isActive }) => isActive ? 'active' : ''
                },
                  React.createElement(MenuIcon, null, item.icon),
                  item.label
                )
          )
        )
      )
    )
  );
}

export default Sidebar;
