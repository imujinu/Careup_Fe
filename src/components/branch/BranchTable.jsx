import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 16px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  padding: 12px 8px;
  text-align: left;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 12px 8px;
  vertical-align: middle;
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
  &:not(:last-child) {
    margin-right: 8px;
  }
`;

const DangerButton = styled(ActionButton)`
  border-color: #fecaca;
  background: #fee2e2;
  color: #b91c1c;
`;

function BranchTable({ branches = [], onEdit, onDelete }) {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>사진</Th>
            <Th>ID</Th>
            <Th>지점명</Th>
            <Th>업종</Th>
            <Th>지점상태</Th>
            <Th>개업일</Th>
            <Th>지점 전화번호</Th>
            <Th>사업자등록번호</Th>
            <Th>법인등록번호</Th>
            <Th>지점 우편번호</Th>
            <Th>지점 주소</Th>
            <Th>조치</Th>
          </tr>
        </thead>
        <tbody>
          {branches.map((b) => (
            <Tr key={b.id}>
              <Td>
                <Avatar src={b.profileImageUrl || '/vite.svg'} alt={b.name} />
              </Td>
              <Td>{b.id}</Td>
              <NameCell>{b.name}</NameCell>
              <Td>{b.businessDomain}</Td>
              <Td>{b.status}</Td>
              <Td>{b.openDate || '-'}</Td>
              <Td>{b.phone || '-'}</Td>
              <Td>{b.businessNumber || '-'}</Td>
              <Td>{b.corporationNumber || '-'}</Td>
              <Td>{b.zipcode || '-'}</Td>
              <Td>{[b.address, b.addressDetail].filter(Boolean).join(' ')}</Td>
              <Td>
                <ActionButton onClick={() => onEdit && onEdit(b)}>수정</ActionButton>
                <DangerButton onClick={() => onDelete && onDelete(b)}>삭제</DangerButton>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export default BranchTable;


