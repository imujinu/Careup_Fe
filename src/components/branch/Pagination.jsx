import React from 'react';
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
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Current = styled.span`
  padding: 6px 10px;
  border-radius: 8px;
  background: #ede9fe;
  color: #6d28d9;
`;

function Pagination({ currentPage = 0, totalPages = 0, onChange }) {
  const canPrev = currentPage > 0;
  const canNext = currentPage < (totalPages || 1) - 1;
  const goto = (p) => onChange && onChange(Math.max(0, Math.min(p, (totalPages || 1) - 1)));

  return (
    <Wrap>
      <PagerBtn disabled={!canPrev} onClick={() => goto(0)}>{'<<'}</PagerBtn>
      <PagerBtn disabled={!canPrev} onClick={() => goto(currentPage - 1)}>{'<'}</PagerBtn>
      <Current>{currentPage + 1}</Current>
      <span>/ {totalPages || 1}</span>
      <PagerBtn disabled={!canNext} onClick={() => goto(currentPage + 1)}>{'>'}</PagerBtn>
      <PagerBtn disabled={!canNext} onClick={() => goto((totalPages || 1) - 1)}>{'>>'}</PagerBtn>
    </Wrap>
  );
}

export default Pagination;


