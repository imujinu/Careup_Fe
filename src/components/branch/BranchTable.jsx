import React, { useState } from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  overflow: hidden;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  @media (max-width: 768px) {
    /* 모바일에서는 카드 레이아웃으로 전환 */
    display: none;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px; /* 최소 테이블 너비 설정 */
`;

const Th = styled.th`
  padding: 12px 8px;
  text-align: left;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  cursor: ${props => props.$sortable ? 'pointer' : 'default'};
  user-select: none;
  position: relative;
  transition: all 0.2s;
  white-space: nowrap; /* 헤더 텍스트 줄바꿈 방지 */
  min-width: ${props => props.$minWidth || 'auto'};
  
  &:hover {
    ${props => props.$sortable && `
      color: #6d28d9;
      background: #f9fafb;
    `}
  }
`;

const SortIndicator = styled.span`
  margin-left: 4px;
  font-size: 10px;
  color: ${props => props.$active ? '#6d28d9' : '#d1d5db'};
`;

const Td = styled.td`
  padding: 12px 8px;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: ${props => props.$maxWidth || '200px'};
`;

const Tr = styled.tr`
  & + & {
    border-top: 1px solid #f3f4f6;
  }
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const NameCell = styled(Td)`
  color: #6d28d9;
  font-weight: 600;
`;

const ActionButton = styled.button`
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;
  white-space: nowrap;
  &:not(:last-child) {
    margin-right: 8px;
  }
`;

const DangerButton = styled(ActionButton)`
  border-color: #fecaca;
  background: #fee2e2;
  color: #b91c1c;
`;

// 모바일 카드 레이아웃
const MobileCard = styled.div`
  display: none;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileCardItem = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const MobileCardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const MobileCardAvatar = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
`;

const MobileCardInfo = styled.div`
  flex: 1;
`;

const MobileCardTitle = styled.h3`
  margin: 0 0 4px 0;
  color: #6d28d9;
  font-size: 16px;
  font-weight: 600;
`;

const MobileCardSubtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
`;

const MobileCardContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
`;

const MobileCardField = styled.div`
  display: flex;
  flex-direction: column;
`;

const MobileCardLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 2px;
`;

const MobileCardValue = styled.span`
  font-size: 14px;
  color: #374151;
  word-break: break-word;
`;

const MobileCardActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const Tooltip = styled.div`
  position: absolute;
  background: #1f2937;
  color: #fff;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  z-index: 1000;
  max-width: 300px;
  word-wrap: break-word;
  white-space: normal;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  opacity: ${props => props.$visible ? 1 : 0};
  visibility: ${props => props.$visible ? 'visible' : 'hidden'};
  transition: all 0.2s;
`;

// 정렬 가능한 컬럼 정의
const SORTABLE_COLUMNS = {
  id: 'id',
  name: 'name',
  businessDomain: 'businessDomain',
  status: 'status',
  openDate: 'openDate',
  phone: 'phone',
  businessNumber: 'businessNumber',
  corporationNumber: 'corporationNumber',
  zipcode: 'zipcode',
};

function BranchTable({ branches = [], onEdit, onDelete, onSort, currentSort }) {
  const [tooltip, setTooltip] = useState({ visible: false, content: '', x: 0, y: 0 });

  const handleSort = (field) => {
    if (!onSort) return;
    
    let direction = 'asc';
    
    // 현재 정렬 필드와 동일하면 방향 토글
    if (currentSort?.field === field) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(field, direction);
  };

  const getSortIndicator = (field) => {
    if (!currentSort || currentSort.field !== field) {
      return <SortIndicator>⇅</SortIndicator>;
    }
    return (
      <SortIndicator $active>
        {currentSort.direction === 'asc' ? '↑' : '↓'}
      </SortIndicator>
    );
  };

  const handleCellHover = (e, content) => {
    if (content && content.length > 20) {
      const rect = e.target.getBoundingClientRect();
      setTooltip({
        visible: true,
        content,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
  };

  const handleCellLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
  };

  const formatAddress = (address, addressDetail) => {
    const fullAddress = [address, addressDetail].filter(Boolean).join(' ');
    return fullAddress || '-';
  };

  return (
    <Card>
      {/* 데스크톱 테이블 */}
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th $minWidth="60px">사진</Th>
              <Th 
                $sortable 
                $minWidth="60px"
                onClick={() => handleSort(SORTABLE_COLUMNS.id)}
              >
                ID{getSortIndicator(SORTABLE_COLUMNS.id)}
              </Th>
              <Th 
                $sortable 
                $minWidth="100px"
                onClick={() => handleSort(SORTABLE_COLUMNS.name)}
              >
                지점명{getSortIndicator(SORTABLE_COLUMNS.name)}
              </Th>
              <Th 
                $sortable 
                $minWidth="100px"
                onClick={() => handleSort(SORTABLE_COLUMNS.businessDomain)}
              >
                업종{getSortIndicator(SORTABLE_COLUMNS.businessDomain)}
              </Th>
              <Th 
                $sortable 
                $minWidth="80px"
                onClick={() => handleSort(SORTABLE_COLUMNS.status)}
              >
                지점상태{getSortIndicator(SORTABLE_COLUMNS.status)}
              </Th>
              <Th 
                $sortable 
                $minWidth="100px"
                onClick={() => handleSort(SORTABLE_COLUMNS.openDate)}
              >
                개업일{getSortIndicator(SORTABLE_COLUMNS.openDate)}
              </Th>
              <Th 
                $sortable 
                $minWidth="120px"
                onClick={() => handleSort(SORTABLE_COLUMNS.phone)}
              >
                지점 전화번호{getSortIndicator(SORTABLE_COLUMNS.phone)}
              </Th>
              <Th 
                $sortable 
                $minWidth="140px"
                onClick={() => handleSort(SORTABLE_COLUMNS.businessNumber)}
              >
                사업자등록번호{getSortIndicator(SORTABLE_COLUMNS.businessNumber)}
              </Th>
              <Th 
                $sortable 
                $minWidth="140px"
                onClick={() => handleSort(SORTABLE_COLUMNS.corporationNumber)}
              >
                법인등록번호{getSortIndicator(SORTABLE_COLUMNS.corporationNumber)}
              </Th>
              <Th 
                $sortable 
                $minWidth="100px"
                onClick={() => handleSort(SORTABLE_COLUMNS.zipcode)}
              >
                지점 우편번호{getSortIndicator(SORTABLE_COLUMNS.zipcode)}
              </Th>
              <Th $minWidth="200px">지점 주소</Th>
              <Th $minWidth="120px">조치</Th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <Tr key={b.id}>
                <Td>
                  <Avatar src={b.profileImageUrl || '/vite.svg'} alt={b.name} />
                </Td>
                <Td $maxWidth="60px">{b.id}</Td>
                <NameCell $maxWidth="100px" 
                  onMouseEnter={(e) => handleCellHover(e, b.name)}
                  onMouseLeave={handleCellLeave}
                >
                  {b.name}
                </NameCell>
                <Td $maxWidth="100px"
                  onMouseEnter={(e) => handleCellHover(e, b.businessDomain)}
                  onMouseLeave={handleCellLeave}
                >
                  {b.businessDomain}
                </Td>
                <Td $maxWidth="80px">{b.status}</Td>
                <Td $maxWidth="100px">{b.openDate || '-'}</Td>
                <Td $maxWidth="120px">{b.phone || '-'}</Td>
                <Td $maxWidth="140px">{b.businessNumber || '-'}</Td>
                <Td $maxWidth="140px">{b.corporationNumber || '-'}</Td>
                <Td $maxWidth="100px">{b.zipcode || '-'}</Td>
                <Td $maxWidth="200px"
                  onMouseEnter={(e) => handleCellHover(e, formatAddress(b.address, b.addressDetail))}
                  onMouseLeave={handleCellLeave}
                >
                  {formatAddress(b.address, b.addressDetail)}
                </Td>
                <Td $maxWidth="120px">
                  <ActionButton onClick={() => onEdit && onEdit(b)}>수정</ActionButton>
                  <DangerButton onClick={() => onDelete && onDelete(b)}>삭제</DangerButton>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {/* 모바일 카드 레이아웃 */}
      <MobileCard>
        {branches.map((b) => (
          <MobileCardItem key={b.id}>
            <MobileCardHeader>
              <MobileCardAvatar src={b.profileImageUrl || '/vite.svg'} alt={b.name} />
              <MobileCardInfo>
                <MobileCardTitle>{b.name}</MobileCardTitle>
                <MobileCardSubtitle>ID: {b.id} | {b.businessDomain}</MobileCardSubtitle>
              </MobileCardInfo>
            </MobileCardHeader>
            
            <MobileCardContent>
              <MobileCardField>
                <MobileCardLabel>지점상태</MobileCardLabel>
                <MobileCardValue>{b.status}</MobileCardValue>
              </MobileCardField>
              <MobileCardField>
                <MobileCardLabel>개업일</MobileCardLabel>
                <MobileCardValue>{b.openDate || '-'}</MobileCardValue>
              </MobileCardField>
              <MobileCardField>
                <MobileCardLabel>전화번호</MobileCardLabel>
                <MobileCardValue>{b.phone || '-'}</MobileCardValue>
              </MobileCardField>
              <MobileCardField>
                <MobileCardLabel>사업자등록번호</MobileCardLabel>
                <MobileCardValue>{b.businessNumber || '-'}</MobileCardValue>
              </MobileCardField>
              <MobileCardField>
                <MobileCardLabel>법인등록번호</MobileCardLabel>
                <MobileCardValue>{b.corporationNumber || '-'}</MobileCardValue>
              </MobileCardField>
              <MobileCardField>
                <MobileCardLabel>우편번호</MobileCardLabel>
                <MobileCardValue>{b.zipcode || '-'}</MobileCardValue>
              </MobileCardField>
            </MobileCardContent>
            
            <MobileCardField>
              <MobileCardLabel>지점 주소</MobileCardLabel>
              <MobileCardValue>{formatAddress(b.address, b.addressDetail)}</MobileCardValue>
            </MobileCardField>
            
            <MobileCardActions>
              <ActionButton onClick={() => onEdit && onEdit(b)}>수정</ActionButton>
              <DangerButton onClick={() => onDelete && onDelete(b)}>삭제</DangerButton>
            </MobileCardActions>
          </MobileCardItem>
        ))}
      </MobileCard>

      {/* 툴팁 */}
      <Tooltip
        $visible={tooltip.visible}
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateX(-50%)'
        }}
      >
        {tooltip.content}
      </Tooltip>
    </Card>
  );
}

export default BranchTable;


