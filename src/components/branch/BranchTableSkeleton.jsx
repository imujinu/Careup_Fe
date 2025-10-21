import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

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

const SkeletonBase = styled.div`
  background: #e5e7eb;
  background-image: linear-gradient(
    to right,
    #e5e7eb 0%,
    #f3f4f6 20%,
    #e5e7eb 40%,
    #e5e7eb 100%
  );
  background-repeat: no-repeat;
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
  border-radius: 4px;
`;

const SkeletonCircle = styled(SkeletonBase)`
  width: 40px;
  height: 40px;
  border-radius: 50%;
`;

const SkeletonText = styled(SkeletonBase)`
  height: 16px;
  width: ${props => props.width || '100%'};
`;

const SkeletonButton = styled(SkeletonBase)`
  height: 32px;
  width: 48px;
  display: inline-block;
  margin-right: 8px;
`;

function BranchTableSkeleton({ rows = 5 }) {
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
          {Array.from({ length: rows }).map((_, index) => (
            <Tr key={index}>
              <Td>
                <SkeletonCircle />
              </Td>
              <Td>
                <SkeletonText width="30px" />
              </Td>
              <Td>
                <SkeletonText width="80px" />
              </Td>
              <Td>
                <SkeletonText width="60px" />
              </Td>
              <Td>
                <SkeletonText width="50px" />
              </Td>
              <Td>
                <SkeletonText width="90px" />
              </Td>
              <Td>
                <SkeletonText width="100px" />
              </Td>
              <Td>
                <SkeletonText width="110px" />
              </Td>
              <Td>
                <SkeletonText width="110px" />
              </Td>
              <Td>
                <SkeletonText width="60px" />
              </Td>
              <Td>
                <SkeletonText width="150px" />
              </Td>
              <Td>
                <div>
                  <SkeletonButton />
                  <SkeletonButton />
                </div>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

export default BranchTableSkeleton;

