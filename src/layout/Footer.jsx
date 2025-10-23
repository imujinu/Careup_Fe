import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  position: relative;
  width: 100%;
  height: 100px;
  background: #ffffff;
  border-top: 1px solid #e5e5e5;
  padding: 20px 32px;
  margin-top: auto;
`;

const FooterContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 1200px;
  margin: 0 auto;
`;

const LinksSection = styled.div`
  display: flex;
  gap: 24px;
`;

const FooterLink = styled.a`
  color: #374151;
  text-decoration: none;
  font-size: 14px;
  
  &:hover {
    color: #6b46c1;
    text-decoration: underline;
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
`;

function Footer() {
  return React.createElement(FooterContainer, null,
    React.createElement(FooterContent, null,
      React.createElement(LinksSection, null,
        React.createElement(FooterLink, { href: '/company-info' }, '기업정보'),
        React.createElement(FooterLink, { href: '/terms' }, '허가 및 약관'),
        React.createElement(FooterLink, { href: '/privacy' }, '개인정보 처리방침'),
        React.createElement(FooterLink, { href: '/contact' }, 'Contact Us')
      ),
      React.createElement(InfoSection, null,
        React.createElement('div', null, 'Copyright © 2025 Care-up Co., Ltd. All rights reserved.'),
        React.createElement('div', null, '주소 서울시 영등포구 양산로 87 3-5층')
      )
    )
  );
}

export default Footer;
