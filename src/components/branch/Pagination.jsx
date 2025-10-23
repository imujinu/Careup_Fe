import React, { useState } from 'react';
import styled from 'styled-components';

const Wrap = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  align-items: center;
`;

const PagerBtn = styled.button`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  min-width: 36px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #6d28d9;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PageNumber = styled.button`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid ${props => props.$active ? '#6d28d9' : '#e5e7eb'};
  background: ${props => props.$active ? '#ede9fe' : '#fff'};
  color: ${props => props.$active ? '#6d28d9' : '#374151'};
  min-width: 36px;
  cursor: pointer;
  font-weight: ${props => props.$active ? '600' : '400'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$active ? '#ede9fe' : '#f3f4f6'};
    border-color: #6d28d9;
  }
`;

const Ellipsis = styled.span`
  padding: 6px 10px;
  color: #9ca3af;
`;

const PageInput = styled.input`
  width: 50px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #6d28d9;
  }
`;

const GoButton = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #6d28d9;
  background: #6d28d9;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: #5b21b6;
  }
`;

function Pagination({ currentPage = 0, totalPages = 0, onChange }) {
  const [inputPage, setInputPage] = useState('');
  const canPrev = currentPage > 0;
  const canNext = currentPage < (totalPages || 1) - 1;
  const goto = (p) => onChange && onChange(Math.max(0, Math.min(p, (totalPages || 1) - 1)));

  const handleGoToPage = () => {
    const pageNum = parseInt(inputPage, 10) - 1;
    if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages) {
      goto(pageNum);
      setInputPage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  // 페이지 번호 생성 로직
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // 최대 표시할 페이지 번호 개수
    
    if (totalPages <= maxVisible + 2) {
      // 전체 페이지가 적으면 모두 표시
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 첫 페이지는 항상 표시
      pages.push(0);
      
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);
      
      // 현재 페이지가 앞쪽에 있을 때
      if (currentPage < 3) {
        start = 1;
        end = maxVisible - 1;
      }
      
      // 현재 페이지가 뒤쪽에 있을 때
      if (currentPage > totalPages - 4) {
        start = totalPages - maxVisible;
        end = totalPages - 2;
      }
      
      // 앞쪽 생략 표시
      if (start > 1) {
        pages.push('ellipsis-start');
      }
      
      // 중간 페이지들
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // 뒤쪽 생략 표시
      if (end < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      
      // 마지막 페이지는 항상 표시
      pages.push(totalPages - 1);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Wrap>
      {/* 이전 버튼들은 첫 페이지가 아닐 때만 표시 */}
      {canPrev && (
        <>
          <PagerBtn onClick={() => goto(0)}>{'<<'}</PagerBtn>
          <PagerBtn onClick={() => goto(currentPage - 1)}>{'<'}</PagerBtn>
        </>
      )}
      
      {/* 페이지 번호 버튼들 */}
      {pageNumbers.map((pageNum, idx) => {
        if (typeof pageNum === 'string') {
          return <Ellipsis key={pageNum}>...</Ellipsis>;
        }
        return (
          <PageNumber
            key={pageNum}
            $active={pageNum === currentPage}
            onClick={() => goto(pageNum)}
          >
            {pageNum + 1}
          </PageNumber>
        );
      })}
      
      {/* 다음 버튼들은 마지막 페이지가 아닐 때만 표시 */}
      {canNext && (
        <>
          <PagerBtn onClick={() => goto(currentPage + 1)}>{'>'}</PagerBtn>
          <PagerBtn onClick={() => goto((totalPages || 1) - 1)}>{'>>'}</PagerBtn>
        </>
      )}
      
      {/* 페이지 검색 */}
      {totalPages > 1 && (
        <>
          <span style={{ margin: '0 8px', color: '#9ca3af' }}>|</span>
          <PageInput
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="페이지"
          />
          <GoButton onClick={handleGoToPage}>이동</GoButton>
        </>
      )}
    </Wrap>
  );
}

export default Pagination;


