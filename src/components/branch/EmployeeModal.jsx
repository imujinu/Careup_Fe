import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Icon } from '@mdi/react';
import { mdiClose, mdiUpload, mdiCalendar } from '@mdi/js';

function EmployeeModal({ 
  isOpen, 
  onClose, 
  employee = null, 
  onSave, 
  loading = false,
  branchId 
}) {
  const [formData, setFormData] = useState({
    employeeNumber: '',
    name: '',
    jobGradeId: null,
    dateOfBirth: '',
    gender: 'MALE',
    email: '',
    zipcode: '',
    address: '',
    addressDetail: '',
    mobile: '',
    emergencyTel: '',
    emergencyName: '',
    relationship: 'PARENT',
    hireDate: '',
    terminateDate: '',
    authorityType: 'FRANCHISE_OWNER',
    employmentStatus: 'ACTIVE',
    employmentType: 'FULL_TIME',
    profileImageUrl: '',
    remark: '',
    rawPassword: '',
    dispatches: [{ branchId: branchId || '', assignedFrom: '', assignedTo: '' }]
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const isEdit = !!employee;

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          employeeNumber: employee.employeeNumber || '',
          name: employee.name || '',
          jobGradeId: employee.jobGradeId || null,
          dateOfBirth: employee.dateOfBirth || '',
          gender: employee.gender || 'MALE',
          email: employee.email || '',
          zipcode: employee.zipcode || '',
          address: employee.address || '',
          addressDetail: employee.addressDetail || '',
          mobile: employee.mobile || '',
          emergencyTel: employee.emergencyTel || '',
          emergencyName: employee.emergencyName || '',
          relationship: employee.relationship || 'PARENT',
          hireDate: employee.hireDate || '',
          terminateDate: employee.terminateDate || '',
          authorityType: employee.authorityType || 'FRANCHISE_OWNER',
          employmentStatus: employee.employmentStatus || 'ACTIVE',
          employmentType: employee.employmentType || 'FULL_TIME',
          profileImageUrl: employee.profileImageUrl || '',
          remark: employee.remark || '',
          rawPassword: '',
          dispatches: employee.dispatches || [{ branchId: branchId || '', assignedFrom: '', assignedTo: '' }]
        });
        setProfileImagePreview(employee.profileImageUrl);
      } else {
        // 새 직원 등록 시 초기화
        setFormData({
          employeeNumber: '',
          name: '',
          jobGradeId: null,
          dateOfBirth: '',
          gender: 'MALE',
          email: '',
          zipcode: '',
          address: '',
          addressDetail: '',
          mobile: '',
          emergencyTel: '',
          emergencyName: '',
          relationship: 'PARENT',
          hireDate: '',
          terminateDate: '',
          authorityType: 'FRANCHISE_OWNER',
          employmentStatus: 'ACTIVE',
          employmentType: 'FULL_TIME',
          profileImageUrl: '',
          remark: '',
          rawPassword: '',
          dispatches: [{ branchId: branchId || '', assignedFrom: '', assignedTo: '' }]
        });
        setProfileImagePreview(null);
      }
      setProfileImage(null);
      setErrors({});
    }
  }, [isOpen, employee, branchId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 에러 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeNumber.trim()) newErrors.employeeNumber = '사번을 입력하세요';
    if (!formData.name.trim()) newErrors.name = '이름을 입력하세요';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = '생년월일을 입력하세요';
    if (!formData.email.trim()) newErrors.email = '이메일을 입력하세요';
    if (!formData.zipcode.trim()) newErrors.zipcode = '우편번호를 입력하세요';
    if (!formData.address.trim()) newErrors.address = '주소를 입력하세요';
    if (!formData.addressDetail.trim()) newErrors.addressDetail = '상세주소를 입력하세요';
    if (!formData.mobile.trim()) newErrors.mobile = '휴대폰번호를 입력하세요';
    if (!formData.emergencyTel.trim()) newErrors.emergencyTel = '비상연락처를 입력하세요';
    if (!formData.emergencyName.trim()) newErrors.emergencyName = '비상연락처 이름을 입력하세요';
    if (!formData.hireDate) newErrors.hireDate = '입사일을 입력하세요';
    if (!isEdit && !formData.rawPassword.trim()) newErrors.rawPassword = '비밀번호를 입력하세요';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = { ...formData };
    
    // 수정 시 비밀번호가 비어있으면 제거
    if (isEdit && !submitData.rawPassword) {
      delete submitData.rawPassword;
    }

    onSave(submitData, profileImage);
  };

  const handleClose = () => {
    setFormData({
      employeeNumber: '',
      name: '',
      jobGradeId: null,
      dateOfBirth: '',
      gender: 'MALE',
      email: '',
      zipcode: '',
      address: '',
      addressDetail: '',
      mobile: '',
      emergencyTel: '',
      emergencyName: '',
      relationship: 'PARENT',
      hireDate: '',
      terminateDate: '',
      authorityType: 'FRANCHISE_OWNER',
      employmentStatus: 'ACTIVE',
      employmentType: 'FULL_TIME',
      profileImageUrl: '',
      remark: '',
      rawPassword: '',
      dispatches: [{ branchId: branchId || '', assignedFrom: '', assignedTo: '' }]
    });
    setProfileImage(null);
    setProfileImagePreview(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{isEdit ? '점주 정보 수정' : '점주 등록'}</ModalTitle>
          <ModalSubtitle>
            {isEdit ? '점주의 정보를 수정합니다' : '새로운 점주를 등록합니다'}
          </ModalSubtitle>
          <CloseButton onClick={handleClose}>
            <Icon path={mdiClose} size={1.2} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>기본 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>점주명</Label>
                <Input
                  type="text"
                  placeholder="점주명을 입력하세요"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                />
                {errors.name && <ErrorText>{errors.name}</ErrorText>}
              </FormGroup>
              
              <FormGroup>
                <Label required>생년월일</Label>
                <Input
                  type="date"
                  placeholder="연도-월-일"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  error={errors.dateOfBirth}
                />
                {errors.dateOfBirth && <ErrorText>{errors.dateOfBirth}</ErrorText>}
              </FormGroup>
              
              <FormGroup>
                <Label required>성별</Label>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </Select>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label>프로필 이미지</Label>
              <ImageUploadContainer>
                <ImagePreview>
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="프로필 미리보기" />
                  ) : (
                    <UploadPlaceholder>
                      <Icon path={mdiUpload} size={2} />
                      <span>이미지 업로드</span>
                    </UploadPlaceholder>
                  )}
                </ImagePreview>
                <ImageInput
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </ImageUploadContainer>
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>사업자 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>사업자등록번호</Label>
                <Input
                  type="text"
                  placeholder="123-45-67890"
                  value={formData.employeeNumber}
                  onChange={(e) => handleInputChange('employeeNumber', e.target.value)}
                  error={errors.employeeNumber}
                />
                {errors.employeeNumber && <ErrorText>{errors.employeeNumber}</ErrorText>}
              </FormGroup>
              
              <FormGroup>
                <Label>법인등록번호</Label>
                <Input
                  type="text"
                  placeholder="123456-1234567"
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>연락처 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>이메일</Label>
                <Input
                  type="email"
                  placeholder="example@hansot.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                />
                {errors.email && <ErrorText>{errors.email}</ErrorText>}
              </FormGroup>
              
              <FormGroup>
                <Label required>휴대폰번호</Label>
                <Input
                  type="tel"
                  placeholder="010-1234-5678"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  error={errors.mobile}
                />
                {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>주소 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>우편번호</Label>
                <Input
                  type="text"
                  placeholder="06292"
                  value={formData.zipcode}
                  onChange={(e) => handleInputChange('zipcode', e.target.value)}
                  error={errors.zipcode}
                />
                {errors.zipcode && <ErrorText>{errors.zipcode}</ErrorText>}
              </FormGroup>
            </FormRow>
            
            <FormGroup>
              <Label required>주소</Label>
              <Input
                type="text"
                placeholder="서울특별시 강남구 테헤란로 123"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                error={errors.address}
              />
              {errors.address && <ErrorText>{errors.address}</ErrorText>}
            </FormGroup>
            
            <FormGroup>
              <Label required>상세주소</Label>
              <Input
                type="text"
                placeholder="한솔빌딩 5층"
                value={formData.addressDetail}
                onChange={(e) => handleInputChange('addressDetail', e.target.value)}
                error={errors.addressDetail}
              />
              {errors.addressDetail && <ErrorText>{errors.addressDetail}</ErrorText>}
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>대리인 정보 (선택사항)</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label>대리인명</Label>
                <Input
                  type="text"
                  placeholder="대리인명을 입력하세요"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>대리인 연락처</Label>
                <Input
                  type="tel"
                  placeholder="010-9876-5432"
                />
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>비고</SectionTitle>
            <FormGroup>
              <TextArea
                placeholder="추가 정보나 메모를 입력하세요"
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                rows={3}
              />
            </FormGroup>
          </FormSection>

          <ModalFooter>
            <CancelButton type="button" onClick={handleClose}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? '처리 중...' : (isEdit ? '수정하기' : '등록하기')}
            </SubmitButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default EmployeeModal;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 24px;
  right: 32px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const Form = styled.form`
  padding: 32px;
`;

const FormSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 20px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;

  &::after {
    content: ${props => props.required ? '" *"' : '""'};
    color: #dc2626;
  }
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid ${props => props.error ? '#dc2626' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.error ? '#dc2626' : '#8b5cf6'};
    box-shadow: 0 0 0 3px ${props => props.error ? 'rgba(220, 38, 38, 0.1)' : 'rgba(139, 92, 246, 0.1)'};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const ImageUploadContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ImagePreview = styled.div`
  width: 120px;
  height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #8b5cf6;
    background: #f9fafb;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UploadPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
`;

const ImageInput = styled.input`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
`;

const ErrorText = styled.span`
  font-size: 12px;
  color: #dc2626;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
`;

const SubmitButton = styled.button`
  padding: 12px 24px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: #7c3aed;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;
