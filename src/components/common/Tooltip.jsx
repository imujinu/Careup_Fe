import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

function Tooltip({ children, content, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      
      // 툴팁 위치 조정
      const rect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      switch (position) {
        case 'top':
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
          break;
        case 'bottom':
          tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
          tooltip.style.top = `${rect.bottom + 8}px`;
          break;
        case 'left':
          tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
        case 'right':
          tooltip.style.left = `${rect.right + 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
          break;
      }
    }
  }, [isVisible, position]);

  return (
    <TooltipContainer>
      <TooltipTrigger
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </TooltipTrigger>
      
      {isVisible && (
        <TooltipContent ref={tooltipRef} position={position}>
          {content}
        </TooltipContent>
      )}
    </TooltipContainer>
  );
}

export default Tooltip;

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipTrigger = styled.div`
  display: inline-block;
`;

const TooltipContent = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    border: 4px solid transparent;
    
    ${props => {
      switch (props.position) {
        case 'top':
          return `
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-top-color: rgba(0, 0, 0, 0.8);
          `;
        case 'bottom':
          return `
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-bottom-color: rgba(0, 0, 0, 0.8);
          `;
        case 'left':
          return `
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-left-color: rgba(0, 0, 0, 0.8);
          `;
        case 'right':
          return `
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            border-right-color: rgba(0, 0, 0, 0.8);
          `;
        default:
          return '';
      }
    }}
  }
`;
