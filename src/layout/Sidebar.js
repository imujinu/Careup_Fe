import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.aside`
  position: fixed;
  top: 0;
  left: ${props => props.isVisible ? '0' : '-240px'};
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

const MenuLink = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  color: ${props => props.isActive ? '#6b46c1' : '#1f2937'};
  background: ${props => props.isActive ? '#f3f4f6' : 'transparent'};
  border-right: ${props => props.isActive ? '3px solid #6b46c1' : '3px solid transparent'};
  text-decoration: none;
  font-size: 14px;
  font-weight: ${props => props.isActive ? '600' : '400'};
  transition: all 0.2s ease;
  cursor: pointer;

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

function Sidebar({ isVisible, currentPage, onPageChange, userType, branchId }) {
  // 본사 메뉴 (branchId === 1)
  const headquartersMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'branch', label: '지점관리', icon: '🏢' },
    { id: 'client', label: '거래처', icon: '🤝' },
    { id: 'task', label: '작업관리', icon: '📋' },
    { id: 'attendance', label: '근태관리', icon: '🕐' },
    { id: 'inventory', label: '재고관리', icon: '📦' },
    { id: 'purchaseOrder', label: '발주관리', icon: '🛒' },
    { id: 'settings', label: '설정', icon: '⚙️' },
    { id: 'logout', label: '로그아웃', icon: '↪️' },
  ];

  // 가맹점 메뉴 (branchId > 1)
  const franchiseMenuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊' },
    { id: 'inventory', label: '재고관리', icon: '📦' },
    { id: 'purchaseOrder', label: '발주관리', icon: '🛒' },
    { id: 'attendance', label: '근태관리', icon: '🕐' },
    { id: 'settings', label: '설정', icon: '⚙️' },
    { id: 'logout', label: '로그아웃', icon: '↪️' },
  ];

  const menuItems = userType === 'headquarters' ? headquartersMenuItems : franchiseMenuItems;

  const handleMenuClick = (menuId) => {
    if (menuId === 'logout') {
      // 로그아웃 처리
      return;
    }
    onPageChange(menuId);
  };

  return React.createElement(SidebarContainer, { isVisible },
    React.createElement(SidebarHeader, null,
      React.createElement(Logo, null, 'H'),
      React.createElement(AppTitle, null, '한솔도시락')
    ),
    React.createElement(MenuSection, null,
      React.createElement(MenuList, null,
        menuItems.map((item) =>
          React.createElement(MenuItem, { key: item.id },
            React.createElement(MenuLink, { 
              isActive: currentPage === item.id,
              onClick: () => handleMenuClick(item.id)
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
