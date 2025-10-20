import React from 'react';
import styled from 'styled-components';
import { getBranchName } from '../utils/branchUtils';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: ${props => props.sidebarVisible ? '240px' : '0'};
  right: 0;
  height: 80px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 32px;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
`;

const SidebarToggle = styled.button`
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background: #f3f4f6;
  }
  
  img {
    width: 16px;
    height: 16px;
    object-fit: contain;
  }
`;

const SearchSection = styled.div`
  flex: 1;
  max-width: 400px;
  margin: 0 8px 0 8px;
  max-width: 300px;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 16px 0 48px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: #ffffff;
  outline: none;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    border-color: #6b46c1;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 16px;
    height: 16px;
    opacity: 0.6;
  }
`;

const NotificationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
  margin-right: 0;
`;

const NotificationIcon = styled.div`
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-right: 8px;
  
  img {
    width: 20px;
    height: 20px;
  }
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const NotificationBadgeStandalone = styled.div`
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  margin-right: 8px;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProfileImage = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Greeting = styled.div`
  font-size: 14px;
  color: #1f2937;
  
  .highlight {
    color: #6b46c1;
    font-weight: 600;
  }
`;

const DateInfo = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

function Header({ onToggleSidebar, sidebarVisible, userType, branchId }) {
  return React.createElement(HeaderContainer, { sidebarVisible },
    React.createElement(SidebarToggle, { onClick: onToggleSidebar },
      React.createElement('img', {
        src: '/header-button.svg',
        alt: '메뉴',
        style: { width: '16px', height: '16px' }
      })
    ),
    React.createElement(SearchSection, null,
      React.createElement(SearchContainer, null,
        React.createElement(SearchIcon, null,
          React.createElement('img', {
            src: '/header-search.svg',
            alt: '돋보기',
            style: { width: '16px', height: '16px' }
          })
        ),
        React.createElement(SearchInput, { placeholder: '검색...' })
      )
    ),
    React.createElement(NotificationSection, null,
      React.createElement(NotificationIcon, null,
        React.createElement('img', { 
          src: '/notification-icon.svg', 
          alt: '알림' 
        })
      ),
      React.createElement(NotificationBadgeStandalone, null, '10+'),
      React.createElement(UserSection, null,
        React.createElement(ProfileImage, null,
          React.createElement('img', {
            src: '/api/placeholder/40/40',
            alt: 'Profile',
            style: { width: '100%', height: '100%', objectFit: 'cover' }
          })
        ),
        React.createElement(UserInfo, null,
          React.createElement(Greeting, null,
            '안녕하세요, ',
            React.createElement('span', { className: 'highlight' }, 
              userType === 'headquarters' ? '이승지 대표님' : `이승지 점장님 (${getBranchName(branchId)})`
            )
          ),
          React.createElement(DateInfo, null, '2025년 09월 20일 토요일')
        )
      )
    )
  );
}

export default Header;
