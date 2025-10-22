import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import InfoModal from '../../components/common/InfoModal';
import { createBranch } from '../../service/branchService';

const BranchRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    businessDomain: '',
    ownershipType: '',
    openDate: '',
    businessNumber: '',
    corporationNumber: '',
    zipcode: '',
    address: '',
    addressDetail: '',
    phone: '',
    email: '',
    geofenceRadius: '',
    remark: '',
    latitude: '',
    longitude: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const businessDomains = [
    '카페', '음식점', '편의점', '마트', '서점', '미용실', '헬스장', '기타'
  ];

  const ownershipTypes = [
    { value: 'YES', label: '직영' },
    { value: 'NO', label: '가맹점' }
  ];

  // 사업자등록번호 포맷팅 함수 (nnn-nn-nnnnn)
  const formatBusinessNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    
    // 10자리 제한
    if (numbers.length > 10) {
      return numbers.slice(0, 10);
    }
    
    // 포맷팅 적용
    if (numbers.length === 0) {
      return '';
    } else if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
    }
  };

  // 법인등록번호 포맷팅 함수 (nnnn-nn-nnnnnn-n)
  const formatCorporationNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    
    // 13자리 제한
    if (numbers.length > 13) {
      return numbers.slice(0, 13);
    }
    
    // 포맷팅 적용
    if (numbers.length === 0) {
      return '';
    } else if (numbers.length <= 4) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 12)}-${numbers.slice(12)}`;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    
    // 사업자등록번호 포맷팅 적용
    if (name === 'businessNumber') {
      formattedValue = formatBusinessNumber(value);
    }
    
    // 법인등록번호 포맷팅 적용
    if (name === 'corporationNumber') {
      formattedValue = formatCorporationNumber(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
    
    // 에러 메시지 제거
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
  };

  const handlePostcodeSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드
          let addr = ''; // 주소 변수
          let extraAddr = ''; // 참고항목 변수

          // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
          if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
            addr = data.roadAddress;
          } else { // 사용자가 지번 주소를 선택했을 경우(J)
            addr = data.jibunAddress;
          }

          // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
          if(data.userSelectedType === 'R'){
            // 법정동명이 있을 경우 추가한다. (법정리는 제외)
            // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
            if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
              extraAddr += data.bname;
            }
            // 건물명이 있고, 공동주택일 경우 추가한다.
            if(data.buildingName !== '' && data.apartment === 'Y'){
              extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
            }
            // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
            if(extraAddr !== ''){
              extraAddr = ' (' + extraAddr + ')';
            }
            // 조합된 참고항목을 해당 필드에 넣는다.
            // document.getElementById("sample6_extraAddress").value = extraAddr;
          } else {
            // document.getElementById("sample6_extraAddress").value = '';
          }

          // 우편번호와 주소 정보를 해당 필드에 넣는다.
          setFormData(prev => ({
            ...prev,
            zipcode: data.zonecode,
            address: addr
          }));
        }
      }).open();
    } else {
      alert('우편번호 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = '지점명은 필수입니다.';
    if (!formData.businessDomain) newErrors.businessDomain = '업종은 필수입니다.';
    if (!formData.ownershipType) newErrors.ownershipType = '직영여부는 필수입니다.';
    if (!formData.openDate) newErrors.openDate = '개업연월은 필수입니다.';
    if (!formData.businessNumber.trim()) newErrors.businessNumber = '사업자등록번호는 필수입니다.';
    if (!formData.corporationNumber.trim()) newErrors.corporationNumber = '법인등록번호는 필수입니다.';
    if (!formData.zipcode.trim()) newErrors.zipcode = '지점 우편번호는 필수입니다.';
    if (!formData.address.trim()) newErrors.address = '주소는 필수입니다.';
    if (!formData.phone.trim()) newErrors.phone = '지점 전화번호는 필수입니다.';
    if (!formData.email.trim()) newErrors.email = '대표 이메일은 필수입니다.';
    if (!formData.geofenceRadius) newErrors.geofenceRadius = '출퇴근 반경은 필수입니다.';
    
    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = '이메일 형식이 올바르지 않습니다.';
    }
    
    // 사업자등록번호 형식 검증 (nnn-nn-nnnnn)
    if (formData.businessNumber && !/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNumber)) {
      newErrors.businessNumber = '사업자등록번호는 nnn-nn-nnnnn 형식이어야 합니다.';
    }
    
    // 법인등록번호 형식 검증 (nnnn-nn-nnnnnn-n)
    if (formData.corporationNumber && !/^\d{4}-\d{2}-\d{6}-\d{1}$/.test(formData.corporationNumber)) {
      newErrors.corporationNumber = '법인등록번호는 nnnn-nn-nnnnnn-n 형식이어야 합니다.';
    }
    
    // 위도/경도 범위 검증
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = '위도는 -90 ~ 90 범위여야 합니다.';
    }
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = '경도는 -180 ~ 180 범위여야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const submitData = {
        ...formData,
        // 포맷팅된 형태로 그대로 전송
        businessNumber: formData.businessNumber,
        corporationNumber: formData.corporationNumber,
        geofenceRadius: parseInt(formData.geofenceRadius),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        openDate: formData.openDate
      };

      await createBranch(submitData, profileImage);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('지점 등록 실패:', error);
      setErrors({ submit: '지점 등록에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    navigate('/branch');
  };

  const handleSuccessConfirm = () => {
    navigate('/branch');
  };

  return (
    <Container>
      <Title>지점등록</Title>
      
      <Form onSubmit={handleSubmit}>
        {/* 프로필 이미지 업로드 */}
        <ProfileImageSection>
          <ProfileImageLabel>프로필 이미지</ProfileImageLabel>
          <ProfileImageUpload>
            <FileInput
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={handleFileChange}
            />
            <FileInputLabel htmlFor="profileImage">
              {profileImage ? (
                <ImagePreview>
                  <img 
                    src={URL.createObjectURL(profileImage)} 
                    alt="프로필 미리보기" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <ImageOverlay>
                    <ChangeText>이미지 변경</ChangeText>
                  </ImageOverlay>
                </ImagePreview>
              ) : (
                <>
                  <UploadIcon>📁</UploadIcon>
                  <UploadText>지점 프로필 이미지를 업로드 해주세요.</UploadText>
                </>
              )}
            </FileInputLabel>
          </ProfileImageUpload>
        </ProfileImageSection>

        <FormGrid>
          <FormField>
            <Label>지점명 *</Label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="지점명을 입력하세요."
              hasError={!!errors.name}
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </FormField>

          <FormField>
            <Label>업종 *</Label>
            <Select
              name="businessDomain"
              value={formData.businessDomain}
              onChange={handleInputChange}
              hasError={!!errors.businessDomain}
            >
              <option value="">업종을 선택해주세요.</option>
              {businessDomains.map(domain => (
                <option key={domain} value={domain}>{domain}</option>
              ))}
            </Select>
            {errors.businessDomain && <ErrorText>{errors.businessDomain}</ErrorText>}
          </FormField>

          <FormField>
            <Label>직영여부 *</Label>
            <Select
              name="ownershipType"
              value={formData.ownershipType}
              onChange={handleInputChange}
              hasError={!!errors.ownershipType}
            >
              <option value="">직영여부를 선택해주세요.</option>
              {ownershipTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </Select>
            {errors.ownershipType && <ErrorText>{errors.ownershipType}</ErrorText>}
          </FormField>

          <FormField>
            <Label>개업연월 *</Label>
            <Input
              type="date"
              name="openDate"
              value={formData.openDate}
              onChange={handleInputChange}
              hasError={!!errors.openDate}
            />
            {errors.openDate && <ErrorText>{errors.openDate}</ErrorText>}
          </FormField>

          <FormField>
            <Label>사업자등록번호 *</Label>
            <Input
              type="text"
              name="businessNumber"
              value={formData.businessNumber}
              onChange={handleInputChange}
              placeholder="사업자등록번호 10자리를 입력해주세요."
              hasError={!!errors.businessNumber}
              maxLength={12}
            />
            {errors.businessNumber && <ErrorText>{errors.businessNumber}</ErrorText>}
          </FormField>

          <FormField>
            <Label>법인등록번호 *</Label>
            <Input
              type="text"
              name="corporationNumber"
              value={formData.corporationNumber}
              onChange={handleInputChange}
              placeholder="법인등록번호 13자리를 입력해주세요."
              hasError={!!errors.corporationNumber}
              maxLength={16}
            />
            {errors.corporationNumber && <ErrorText>{errors.corporationNumber}</ErrorText>}
          </FormField>

          <FormField>
            <Label>우편번호 *</Label>
            <PostcodeContainer>
              <Input
                type="text"
                name="zipcode"
                value={formData.zipcode}
                onChange={handleInputChange}
                placeholder="주소 검색을 눌러주세요."
                hasError={!!errors.zipcode}
                readOnly
              />
              <SearchButton type="button" onClick={handlePostcodeSearch}>
                주소검색
              </SearchButton>
            </PostcodeContainer>
            {errors.zipcode && <ErrorText>{errors.zipcode}</ErrorText>}
          </FormField>

          <FormField>
            <Label>주소 *</Label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="주소를 입력해주세요."
              hasError={!!errors.address}
              readOnly
            />
            {errors.address && <ErrorText>{errors.address}</ErrorText>}
          </FormField>

          <FormField>
            <Label>상세주소</Label>
            <Input
              type="text"
              name="addressDetail"
              value={formData.addressDetail}
              onChange={handleInputChange}
              placeholder="상세주소를 입력해주세요."
            />
          </FormField>

          <FormField>
            <Label>지점 전화번호 *</Label>
            <Input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="지점 전화번호"
              hasError={!!errors.phone}
            />
            {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
          </FormField>

          <FormField>
            <Label>대표 이메일 *</Label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="지점의 대표 이메일을 입력해주세요."
              hasError={!!errors.email}
            />
            {errors.email && <ErrorText>{errors.email}</ErrorText>}
          </FormField>

          <FormField>
            <Label>출퇴근 위치</Label>
            <Input
              type="text"
              name="commuteLocation"
              placeholder="출퇴근 가능한 위치를 선택해주세요."
            />
          </FormField>

          <FormField>
            <Label>출퇴근 반경 *</Label>
            <Input
              type="number"
              name="geofenceRadius"
              value={formData.geofenceRadius}
              onChange={handleInputChange}
              placeholder="출퇴근이 가능한 반경을 설정해주세요. (미터 m)"
              hasError={!!errors.geofenceRadius}
            />
            {errors.geofenceRadius && <ErrorText>{errors.geofenceRadius}</ErrorText>}
          </FormField>

          <FormField fullWidth>
            <Label>위치 정보 (선택)</Label>
            <LocationContainer>
              <LocationField>
                <LocationLabel>위도</LocationLabel>
                <Input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="위도 (-90 ~ 90)"
                  hasError={!!errors.latitude}
                />
                {errors.latitude && <ErrorText>{errors.latitude}</ErrorText>}
              </LocationField>
              <LocationField>
                <LocationLabel>경도</LocationLabel>
                <Input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="경도 (-180 ~ 180)"
                  hasError={!!errors.longitude}
                />
                {errors.longitude && <ErrorText>{errors.longitude}</ErrorText>}
              </LocationField>
            </LocationContainer>
          </FormField>

          <FormField fullWidth>
            <Label>비고</Label>
            <TextArea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              placeholder="비고란을 작성하실 수 있습니다."
              rows="4"
            />
          </FormField>
        </FormGrid>

        {errors.submit && <SubmitError>{errors.submit}</SubmitError>}

        <ButtonGroup>
          <CancelButton type="button" onClick={handleCancel}>
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? '등록 중...' : '등록'}
          </SubmitButton>
        </ButtonGroup>
      </Form>

      {/* 성공 모달 */}
      <InfoModal
        isOpen={showSuccessModal}
        onClose={handleSuccessConfirm}
        title="안내"
        message={`${formData.name} 등록이 완료되었습니다.`}
        buttonText="확인"
        buttonColor="#A87C7C"
      />

      {/* 취소 확인 모달 */}
      <InfoModal
        isOpen={showCancelModal}
        onClose={handleConfirmCancel}
        title="안내"
        message="지점 등록을 취소하시겠습니까?"
        buttonText="확인"
        buttonColor="#A87C7C"
      />
    </Container>
  );
};

const Container = styled.div`
  padding: 24px;
  max-width: 80%;
  margin: 0 auto;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 32px;
  font-size: 24px;
  font-weight: bold;
`;

const Form = styled.form`
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const ProfileImageSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  border: 2px dashed #e5e7eb;
  border-radius: 8px;
`;

const ProfileImageLabel = styled.label`
  font-weight: 500;
  margin-bottom: 16px;
  color: #374151;
`;

const ProfileImageUpload = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 16px;
  border-radius: 8px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const UploadIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

const UploadText = styled.span`
  color: #6b7280;
  font-size: 14px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
  text-align: left;
  padding-right: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  background-color: ${props => props.readOnly ? '#f9fafb' : 'white'};
  cursor: ${props => props.readOnly ? 'default' : 'text'};
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#6d28d9'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? '#fef2f2' : '#f3e8ff'};
  }
  
  &[readonly] {
    color: #6b7280;
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#6d28d9'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? '#fef2f2' : '#f3e8ff'};
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px #f3e8ff;
  }
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
`;

const SubmitError = styled.div`
  color: #ef4444;
  text-align: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #fef2f2;
  border-radius: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const CancelButton = styled.button`
  padding: 12px 24px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const SubmitButton = styled.button`
  padding: 12px 24px;
  background: #6d28d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background: #5b21b6;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${ImagePreview}:hover & {
    opacity: 1;
  }
`;

const ChangeText = styled.span`
  color: white;
  font-weight: 500;
  font-size: 14px;
`;

const PostcodeContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const SearchButton = styled.button`
  padding: 12px 16px;
  background: #6d28d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    background: #5b21b6;
  }
`;

const LocationContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const LocationField = styled.div`
  display: flex;
  flex-direction: column;
`;

const LocationLabel = styled.label`
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
`;

export default BranchRegistration;
