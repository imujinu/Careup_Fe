/// Login.jsx
/// src/pages/auth/Login.jsx
/// 직원용
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../stores/hooks';
import { loginUser, clearError } from '../../stores/slices/authSlice';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f3f4f6;
`;

const LoginBox = styled.div`
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 400px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const Button = styled.button`
  width: 100%;
  height: 44px;
  background: #6b46c1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  
  &:hover {
    background: #553c9a;
  }
  
  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const QuickLoginBox = styled.div`
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const QuickLoginTitle = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 12px;
  text-align: center;
`;

const QuickLoginButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const QuickButton = styled.button`
  flex: 1;
  height: 36px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: #e5e7eb;
  }
`;

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(state => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      dispatch(clearError());
      const result = await dispatch(loginUser({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      })).unwrap();
      
      console.log('로그인 성공:', result.userInfo);
      
      if (onLoginSuccess) {
        onLoginSuccess(result.userInfo);
      } else {
        // 페이지 새로고침으로 App.tsx에서 자동으로 사용자 정보 로드
        window.location.reload();
      }
    } catch (err) {
      console.error('로그인 실패:', err);
    }
  };

  const quickLogin = async (email, password) => {
    setFormData({ email, password, rememberMe: true });
    
    try {
      dispatch(clearError());
      const result = await dispatch(loginUser({
        email,
        password,
        rememberMe: true
      })).unwrap();
      
      console.log('로그인 성공:', result.userInfo);
      
      if (onLoginSuccess) {
        onLoginSuccess(result.userInfo);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('로그인 실패:', err);
    }
  };

  return React.createElement(LoginContainer, null,
    React.createElement(LoginBox, null,
      React.createElement(Title, null, '재고관리 시스템'),
      error && React.createElement(ErrorMessage, null, error),
      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '이메일'),
          React.createElement(Input, {
            type: 'email',
            value: formData.email,
            onChange: (e) => setFormData({ ...formData, email: e.target.value }),
            placeholder: 'example@company.com',
            required: true
          })
        ),
        React.createElement(FormGroup, null,
          React.createElement(Label, null, '비밀번호'),
          React.createElement(Input, {
            type: 'password',
            value: formData.password,
            onChange: (e) => setFormData({ ...formData, password: e.target.value }),
            placeholder: '비밀번호를 입력하세요',
            required: true
          })
        ),
        React.createElement(Button, { 
          type: 'submit', 
          disabled: loading 
        }, loading ? '로그인 중...' : '로그인')
      ),
      React.createElement(QuickLoginBox, null,
        React.createElement(QuickLoginTitle, null, '빠른 로그인 (테스트용)'),
        React.createElement(QuickLoginButtons, null,
          React.createElement(QuickButton, {
            onClick: () => quickLogin('dev.s3lim@gmail.com', 'care1234')
          }, '본사 관리자'),
          React.createElement(QuickButton, {
            onClick: () => quickLogin('branch.dj@starbucks.co.kr', 'care1234')
          }, '가맹점 관리자')
        )
      )
    )
  );
}

export default Login;

