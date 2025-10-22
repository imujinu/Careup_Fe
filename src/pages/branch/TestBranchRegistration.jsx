import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const TestBranchRegistration = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/branch');
  };

  return (
    <Container>
      <Title>지점 등록 테스트 페이지</Title>
      <Message>라우팅이 정상적으로 작동합니다!</Message>
      <Button onClick={handleBack}>지점 목록으로 돌아가기</Button>
    </Container>
  );
};

export default TestBranchRegistration;

const Container = styled.div`
  padding: 24px;
  text-align: center;
`;

const Title = styled.h1`
  color: #6d28d9;
  margin-bottom: 16px;
`;

const Message = styled.p`
  font-size: 18px;
  margin-bottom: 24px;
  color: #374151;
`;

const Button = styled.button`
  background: #6d28d9;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  
  &:hover {
    background: #5b21b6;
  }
`;
