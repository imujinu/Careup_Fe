import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DocumentSearchAndFilter from './DocumentSearchAndFilter';
import DocumentTable from './DocumentTable';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentEditModal from './DocumentEditModal';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { documentService } from '../../service/documentService';
import { useToast } from '../common/Toast';

function DocumentManagement({ branchId, readOnly = false }) {
  const { addToast } = useToast();
  
  // 상태 관리
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // 필터 및 검색 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 모달 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // 임시 employeeId (실제로는 지점 정보에서 가져와야 함)
  const employeeId = 1; // TODO: 실제 employeeId로 변경

  useEffect(() => {
    if (branchId) {
      fetchDocuments();
    }
  }, [branchId, currentPage]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocumentsList(employeeId, currentPage, 10);
      
      if (response) {
        setDocuments(response.data || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      }
    } catch (error) {
      console.error('서류 목록 조회 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '서류 목록을 불러오는데 실패했습니다.',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    fetchDocuments();
    
    addToast({
      type: 'success',
      title: '성공',
      message: '문서가 성공적으로 업로드되었습니다.',
      duration: 3000
    });
  };

  const handleEditClick = (document) => {
    setSelectedDocument(document);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedDocument(null);
    fetchDocuments();
    
    addToast({
      type: 'success',
      title: '성공',
      message: '문서가 성공적으로 수정되었습니다.',
      duration: 3000
    });
  };

  const handleDownload = async (document) => {
    try {
      const downloadUrl = await documentService.getDocumentDownloadUrl(employeeId, document.id);
      
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        addToast({
          type: 'success',
          title: '성공',
          message: '파일 다운로드가 시작되었습니다.',
          duration: 3000
        });
      } else {
        throw new Error('다운로드 URL을 받지 못했습니다.');
      }
    } catch (error) {
      console.error('다운로드 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '파일 다운로드에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const handleDeleteClick = (document) => {
    setSelectedDocument(document);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await documentService.deleteDocument(employeeId, selectedDocument.id);
      
      setShowDeleteModal(false);
      setSelectedDocument(null);
      fetchDocuments();
      
      addToast({
        type: 'success',
        title: '성공',
        message: '문서가 성공적으로 삭제되었습니다.',
        duration: 3000
      });
    } catch (error) {
      console.error('문서 삭제 실패:', error);
      addToast({
        type: 'error',
        title: '오류',
        message: '문서 삭제에 실패했습니다.',
        duration: 3000
      });
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedDocument(null);
  };

  const getDocumentStatus = (document) => {
    // 백엔드에서 documentStatus를 제공하는 경우 우선 사용
    if (document.documentStatus) {
      switch (document.documentStatus) {
        case 'ACTIVE':
          return 'valid';
        case 'EXPIRING_SOON':
          return 'expiring';
        case 'EXPIRED':
          return 'expired';
        default:
          return 'valid';
      }
    }
    
    // documentStatus가 없는 경우 만료일로 계산 (fallback)
    const expiryDate = document.expiryDate || document.expirationDate;
    if (!expiryDate) return 'valid';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring';
    return 'valid';
  };

  // 필터링된 문서 목록
  const filteredDocuments = documents.filter(document => {
    const matchesSearch = !searchTerm || 
      document.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDocumentType = !documentTypeFilter || 
      document.documentType === documentTypeFilter;
    
    const matchesStatus = !statusFilter || 
      getDocumentStatus(document) === statusFilter;
    
    const result = matchesSearch && matchesDocumentType && matchesStatus;
    
    
    return result;
  });


  return (
    <Container>
      <DocumentSearchAndFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
        documentTypeFilter={documentTypeFilter}
        onDocumentTypeFilterChange={setDocumentTypeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onUploadClick={readOnly ? undefined : () => setShowUploadModal(true)}
        readOnly={readOnly}
      />

      <DocumentTable
        documents={filteredDocuments}
        onDownload={handleDownload}
        onEdit={readOnly ? undefined : handleEditClick}
        onDelete={readOnly ? undefined : handleDeleteClick}
        loading={loading}
        readOnly={readOnly}
      />

      {!readOnly && showUploadModal && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          employeeId={employeeId}
          onSuccess={handleUploadSuccess}
        />
      )}

      {!readOnly && showEditModal && (
        <DocumentEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocument(null);
          }}
          employeeId={employeeId}
          document={selectedDocument}
          onSuccess={handleEditSuccess}
        />
      )}

      {!readOnly && showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="문서 삭제"
          message={`"${selectedDocument?.title || '선택된 문서'}"를 삭제하시겠습니까?`}
          confirmText="삭제"
          cancelText="취소"
        />
      )}
    </Container>
  );
}

export default DocumentManagement;

const Container = styled.div`
  padding: 0;
`;
