import React from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiDownload, mdiDelete, mdiFileDocument, mdiPencil } from '@mdi/js';
import { DOCUMENT_TYPES } from '../../service/documentService';
import Tooltip from '../common/Tooltip';

function DocumentTable({ documents, onDownload, onDelete, onEdit, loading }) {
  const getDocumentTypeLabel = (type) => {
    return DOCUMENT_TYPES[type] || type;
  };

  const getStatusInfo = (document) => {
    // 백엔드에서 documentStatus를 제공하는 경우 우선 사용
    if (document.documentStatus) {
      switch (document.documentStatus) {
        case 'ACTIVE':
          return { label: '활성', color: '#10b981' };
        case 'EXPIRING_SOON':
          return { label: '만료 임박', color: '#f59e0b' };
        case 'EXPIRED':
          return { label: '만료됨', color: '#dc2626' };
        default:
          return { label: '상태 없음', color: '#6b7280' };
      }
    }
    
    // documentStatus가 없는 경우 만료일로 계산 (fallback)
    const expiryDate = document.expiryDate || document.expirationDate;
    if (!expiryDate) return { label: '상태 없음', color: '#6b7280' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { label: '만료됨', color: '#dc2626' };
    } else if (daysUntilExpiry <= 7) {
      return { label: '만료 임박', color: '#f59e0b' };
    } else {
      return { label: '활성', color: '#10b981' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <TableContainer>
        <LoadingContainer>
          <LoadingSpinner>로딩 중...</LoadingSpinner>
        </LoadingContainer>
      </TableContainer>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <TableContainer>
        <EmptyContainer>
          <EmptyIcon>
            <Icon path={mdiFileDocument} size={3} />
          </EmptyIcon>
          <EmptyTitle>등록된 문서가 없습니다</EmptyTitle>
          <EmptyText>문서를 업로드하여 시작하세요.</EmptyText>
        </EmptyContainer>
      </TableContainer>
    );
  }

  return (
    <TableContainer>
      <DocumentGrid>
        {documents.map((document) => {
          const statusInfo = getStatusInfo(document);
          
          return (
            <DocumentCard key={document.id}>
              <CardHeader>
                <StatusBadge color={statusInfo.color}>
                  {statusInfo.label}
                </StatusBadge>
              </CardHeader>
              
              <CardContent>
                <FileName>{document.title || '제목 없음'}</FileName>
                <DocumentType>{getDocumentTypeLabel(document.documentType)}</DocumentType>
                <BranchCode>강남점 (BR001)</BranchCode>
                
                <DocumentDetails>
                  <DetailItem>
                    <DetailLabel>설명:</DetailLabel>
                    <DetailValue>{document.description || '-'}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>파일 크기:</DetailLabel>
                    <DetailValue>{formatFileSize(document.fileSize)}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>업로드일:</DetailLabel>
                    <DetailValue>{formatDateTime(document.uploadedAt || document.createdAt)}</DetailValue>
                  </DetailItem>
                  <DetailItem>
                    <DetailLabel>만료일:</DetailLabel>
                    <DetailValue>{formatDate(document.expiryDate || document.expirationDate)}</DetailValue>
                  </DetailItem>
                </DocumentDetails>
              </CardContent>
              
              <CardActions>
                <Tooltip content="다운로드" position="top">
                  <ActionButton 
                    onClick={() => onDownload(document)}
                    variant="primary"
                  >
                    <Icon path={mdiDownload} size={1.2} />
                  </ActionButton>
                </Tooltip>
                <Tooltip content="수정" position="top">
                  <ActionButton 
                    onClick={() => onEdit(document)}
                    variant="secondary"
                  >
                    <Icon path={mdiPencil} size={1.2} />
                  </ActionButton>
                </Tooltip>
                <Tooltip content="삭제" position="top">
                  <ActionButton 
                    onClick={() => onDelete(document)}
                    variant="danger"
                  >
                    <Icon path={mdiDelete} size={1.2} />
                  </ActionButton>
                </Tooltip>
              </CardActions>
            </DocumentCard>
          );
        })}
      </DocumentGrid>
    </TableContainer>
  );
}

export default DocumentTable;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const LoadingSpinner = styled.div`
  color: #6b7280;
  font-size: 16px;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  color: #d1d5db;
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 14px;
  margin: 0;
`;

const DocumentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const DocumentCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }
`;

const CardHeader = styled.div`
  padding: 16px 20px 0 20px;
  display: flex;
  justify-content: flex-end;
`;

const StatusBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})`
  background: ${props => props.color};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
`;

const CardContent = styled.div`
  padding: 16px 20px;
`;

const FileName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
  word-break: break-word;
`;

const DocumentType = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 4px 0;
`;

const BranchCode = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
`;

const DocumentDetails = styled.div`
  margin-bottom: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  font-size: 13px;
  color: #6b7280;
  min-width: 60px;
  margin-right: 8px;
`;

const DetailValue = styled.span`
  font-size: 13px;
  color: #374151;
  flex: 1;
`;

const CardActions = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 20px 20px 20px;
  justify-content: center;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'variant',
})`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  ${props => props.variant === 'primary' && `
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }
  `}
  
  ${props => props.variant === 'secondary' && `
    background: #6b7280;
    color: white;
    
    &:hover {
      background: #4b5563;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(107, 114, 128, 0.3);
    }
  `}
  
  ${props => props.variant === 'danger' && `
    background: #dc2626;
    color: white;
    
    &:hover {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
    }
  `}
`;
