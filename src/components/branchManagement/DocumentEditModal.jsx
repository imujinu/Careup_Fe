import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiClose, mdiChevronDown } from '@mdi/js';
import { documentService, DOCUMENT_TYPES } from '../../service/documentService';
import BaseModal from '../common/BaseModal';

function DocumentEditModal({ isOpen, onClose, document, onSuccess }) {
  const [formData, setFormData] = useState({
    documentType: '',
    title: '',
    documentUrl: null,
    description: '',
    expirationDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 문서 정보로 폼 초기화
  useEffect(() => {
    if (document && isOpen) {
      setFormData({
        documentType: document.documentType || '',
        title: document.title || '',
        documentUrl: null, // 새 파일 선택 시에만 사용
        description: document.description || '',
        expirationDate: document.expiryDate || document.expirationDate || ''
      });
      setErrors({});
    }
  }, [document, isOpen]);

  const documentTypeOptions = Object.entries(DOCUMENT_TYPES).map(([key, value]) => ({
    value: key,
    label: value
  }));

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'documentUrl') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.documentType) {
      newErrors.documentType = '문서 유형을 선택해주세요.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const updateFormData = new FormData();
      updateFormData.append('documentType', formData.documentType);
      updateFormData.append('title', formData.title);
      
      // 새 파일이 선택된 경우에만 추가
      if (formData.documentUrl) {
        updateFormData.append('documentUrl', formData.documentUrl);
      }
      
      if (formData.description) {
        updateFormData.append('description', formData.description);
      }
      
      if (formData.expirationDate) {
        updateFormData.append('expiryDate', formData.expirationDate);
      }

      await documentService.updateDocument(document.id, updateFormData);
      
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('문서 수정 실패:', error);
      // 에러 처리는 상위 컴포넌트에서 토스트로 처리
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      documentType: '',
      title: '',
      documentUrl: null,
      description: '',
      expirationDate: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={handleClose}
      maxWidth="500px"
      allowBackdropClose={false}
    >
      <ModalHeader>
        <ModalTitle>문서 수정</ModalTitle>
        <CloseButton onClick={handleClose}>
          <Icon path={mdiClose} size={1.2} />
        </CloseButton>
      </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="documentType">
              문서 유형 <Required>*</Required>
            </Label>
            <SelectContainer>
              <Select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleInputChange}
                hasError={!!errors.documentType}
              >
                <option value="">문서 유형을 선택하세요</option>
                {documentTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <SelectIcon>
                <Icon path={mdiChevronDown} size={1} />
              </SelectIcon>
            </SelectContainer>
            {errors.documentType && <ErrorMessage>{errors.documentType}</ErrorMessage>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="documentUrl">파일 변경 (선택사항)</Label>
            <FileInputContainer>
              <FileInput
                type="file"
                id="documentUrl"
                name="documentUrl"
                onChange={handleInputChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <FileInputLabel htmlFor="documentUrl">
                파일 선택
              </FileInputLabel>
              <FileInputText>
                {formData.documentUrl ? formData.documentUrl.name : '현재 파일 유지'}
              </FileInputText>
            </FileInputContainer>
            {document?.documentUrl && (
              <CurrentFileInfo>
                현재 파일: {document.documentUrl.split('/').pop()}
              </CurrentFileInfo>
            )}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="title">문서명</Label>
            <Input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="문서명을 입력하세요"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="expirationDate">만료일</Label>
            <Input
              type="date"
              id="expirationDate"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              placeholder="연도-월-일"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">설명</Label>
            <TextArea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="문서에 대한 설명을 입력하세요"
              rows={4}
            />
          </FormGroup>

          <ButtonGroup>
            <CancelButton type="button" onClick={handleClose}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? '수정 중...' : '수정'}
            </SubmitButton>
          </ButtonGroup>
        </Form>
    </BaseModal>
  );
}

export default DocumentEditModal;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const Form = styled.form`
  padding: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
`;

const Required = styled.span`
  color: #dc2626;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const Select = styled.select.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasError',
})`
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid ${props => props.hasError ? '#dc2626' : '#d1d5db'};
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#dc2626' : '#8b5cf6'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? '#fecaca' : 'rgba(139, 92, 246, 0.1)'};
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
`;

const FileInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  background: #f3f4f6;
  color: #374151;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #d1d5db;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const FileInputText = styled.span`
  color: #6b7280;
  font-size: 14px;
  flex: 1;
`;

const CurrentFileInfo = styled.div`
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
  font-style: italic;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  
  &[type="date"] {
    &::-webkit-calendar-picker-indicator {
      cursor: pointer;
    }
  }
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
`;

const CancelButton = styled.button`
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #4b5563;
  }
`;

const SubmitButton = styled.button`
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover:not(:disabled) {
    background: #7c3aed;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
`;
