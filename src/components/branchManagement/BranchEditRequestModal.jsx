import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon } from "@mdi/react";
import { mdiClose } from "@mdi/js";
import InfoModal from "../common/InfoModal";
import { fetchCoordinatesByAddress } from "../../service/geocodingService";

function BranchEditRequestModal({ branch, isOpen, onClose, onSubmit }) {
  // controlled component로 시작하기 위해 모든 필드를 초기값으로 설정
  const [formData, setFormData] = useState({
    name: "",
    businessDomain: "",
    ownershipType: "",
    openDate: "",
    businessNumber: "",
    corporationNumber: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    phone: "",
    email: "",
    geofenceRadius: "",
    remark: "",
    latitude: "",
    longitude: "",
    attorneyName: "",
    attorneyPhoneNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);

  const businessDomains = [
    "카페",
    "음식점",
    "편의점",
    "마트",
    "서점",
    "미용실",
    "헬스장",
    "기타",
  ];

  const ownershipTypes = [
    { value: "YES", label: "직영" },
    { value: "NO", label: "가맹점" },
  ];

  // 모달이 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        // 모달이 닫힐 때 스크롤 위치 복원
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (branch) {
      let openDate = "";
      if (branch.openDate) {
        if (typeof branch.openDate === "string") {
          openDate = branch.openDate.includes("T")
            ? branch.openDate.split("T")[0]
            : branch.openDate;
        } else {
          openDate = branch.openDate;
        }
      }

      const geofenceRadius = branch.geofenceRadius
        ? String(branch.geofenceRadius)
        : "";
      const latitude = branch.latitude ? String(branch.latitude) : "";
      const longitude = branch.longitude ? String(branch.longitude) : "";

      setFormData({
        name: branch.name || "",
        businessDomain: branch.businessDomain || "",
        ownershipType: branch.ownershipType || "",
        openDate: openDate,
        businessNumber: branch.businessNumber || "",
        corporationNumber: branch.corporationNumber || "",
        zipcode: branch.zipcode || "",
        address: branch.address || "",
        addressDetail: branch.addressDetail || "",
        phone: branch.phone || "",
        email: branch.email || "",
        geofenceRadius: geofenceRadius,
        remark: branch.remark || "",
        latitude: latitude,
        longitude: longitude,
        attorneyName: branch.attorneyName || "",
        attorneyPhoneNumber: branch.attorneyPhoneNumber || "",
      });
      setExistingImageUrl(branch.profileImageUrl || "");
    }
  }, [branch]);

  if (!isOpen || !branch) return null;

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

  // 전화번호 포맷팅 함수
  // 휴대폰: 0XX-XXXX-XXXX
  // 서울: 02-XXXX-XXXX 또는 02-XXX-XXXX
  // 서울 이외 전 지역: 0XX-XXXX-XXXX 또는 0XX-XXX-XXXX
  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '');
    
    // 11자리 제한 (휴대폰 번호 기준)
    if (numbers.length > 11) {
      return numbers.slice(0, 11);
    }
    
    // 포맷팅 적용
    if (numbers.length === 0) {
      return '';
    } else if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      // 중간 단계 포맷팅
      if (numbers.startsWith('02')) {
        return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      }
    } else if (numbers.length <= 11) {
      // 최종 포맷팅
      if (numbers.startsWith('02')) {
        // 서울: 02-XXXX-XXXX 또는 02-XXX-XXXX
        const middleLength = numbers.length - 6; // 02(2자리) + 마지막4자리 = 6자리 제외
        if (middleLength === 3) {
          return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
        } else {
          return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        }
      } else if (numbers.startsWith('01')) {
        // 휴대폰: 0XX-XXXX-XXXX
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
      } else {
        // 서울 이외 전 지역: 0XX-XXXX-XXXX 또는 0XX-XXX-XXXX
        const middleLength = numbers.length - 7; // 0XX(3자리) + 마지막4자리 = 7자리 제외
        if (middleLength === 3) {
          return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
        } else {
          return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        }
      }
    }
    
    return numbers;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "businessNumber") {
      formattedValue = formatBusinessNumber(value);
    }
    if (name === "corporationNumber") {
      formattedValue = formatCorporationNumber(value);
    }
    if (name === "phone" || name === "attorneyPhoneNumber") {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfileImage(file);
  };

  const handlePostcodeSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: async function (data) {
          let addr = "";
          if (data.userSelectedType === "R") {
            addr = data.roadAddress;
          } else {
            addr = data.jibunAddress;
          }

          try {
            const coordinates = await fetchCoordinatesByAddress(addr);

            setFormData((prev) => ({
              ...prev,
              zipcode: data.zonecode,
              address: addr,
              latitude: coordinates?.latitude ? String(coordinates.latitude) : "",
              longitude: coordinates?.longitude ? String(coordinates.longitude) : "",
            }));

            setErrors((prev) => ({
              ...prev,
              latitude: coordinates ? "" : "좌표를 자동으로 찾지 못했습니다. 직접 입력해주세요.",
              longitude: coordinates ? "" : "좌표를 자동으로 찾지 못했습니다. 직접 입력해주세요.",
            }));
          } catch (error) {
            console.error("좌표 조회 실패:", error);
            setErrors((prev) => ({
              ...prev,
              latitude: "좌표 조회 중 오류가 발생했습니다. 직접 입력해주세요.",
              longitude: "좌표 조회 중 오류가 발생했습니다. 직접 입력해주세요.",
            }));
          }
        },
      }).open();
    } else {
      alert("우편번호 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.");
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "지점명은 필수입니다.";
    if (!formData.businessDomain)
      newErrors.businessDomain = "업종은 필수입니다.";
    if (!formData.ownershipType)
      newErrors.ownershipType = "직영여부는 필수입니다.";
    if (!formData.openDate) newErrors.openDate = "개업연월은 필수입니다.";
    if (!formData.businessNumber.trim())
      newErrors.businessNumber = "사업자등록번호는 필수입니다.";
    if (!formData.corporationNumber.trim())
      newErrors.corporationNumber = "법인등록번호는 필수입니다.";
    if (!formData.zipcode.trim())
      newErrors.zipcode = "지점 우편번호는 필수입니다.";
    if (!formData.address.trim()) newErrors.address = "주소는 필수입니다.";
    if (!formData.phone.trim()) newErrors.phone = "지점 전화번호는 필수입니다.";
    if (!formData.email.trim()) newErrors.email = "대표 이메일은 필수입니다.";
    if (!formData.geofenceRadius)
      newErrors.geofenceRadius = "출퇴근 반경은 필수입니다.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "이메일 형식이 올바르지 않습니다.";
    }

    if (
      formData.businessNumber &&
      !/^\d{3}-\d{2}-\d{5}$/.test(formData.businessNumber)
    ) {
      newErrors.businessNumber =
        "사업자등록번호는 nnn-nn-nnnnn 형식이어야 합니다.";
    }

    if (
      formData.corporationNumber &&
      !/^\d{4}-\d{2}-\d{6}-\d{1}$/.test(formData.corporationNumber)
    ) {
      newErrors.corporationNumber =
        "법인등록번호는 nnnn-nn-nnnnnn-n 형식이어야 합니다.";
    }

    if (
      formData.phone &&
      !/^(02-\d{3,4}-\d{4}|0\d{2}-\d{3,4}-\d{4})$/.test(formData.phone)
    ) {
      newErrors.phone = "올바른 전화번호 형식이 아닙니다.";
    }

    if (
      formData.latitude &&
      (formData.latitude < -90 || formData.latitude > 90)
    ) {
      newErrors.latitude = "위도는 -90 ~ 90 범위여야 합니다.";
    }
    if (
      formData.longitude &&
      (formData.longitude < -180 || formData.longitude > 180)
    ) {
      newErrors.longitude = "경도는 -180 ~ 180 범위여야 합니다.";
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
        geofenceRadius: formData.geofenceRadius
          ? parseInt(formData.geofenceRadius)
          : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      await onSubmit(submitData, profileImage);
    } catch (error) {
      console.error("수정 요청 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onClose();
  };

  return (
    <>
      <ModalOverlay>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>지점 정보 수정 요청</ModalTitle>
            <CloseButton onClick={onClose}>
              <Icon path={mdiClose} size={1.2} />
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            <ModalMessage>
              수정하고 싶은 정보를 변경한 후 제출해주세요. 본사 승인 후
              반영됩니다.
            </ModalMessage>

            <Form onSubmit={handleSubmit}>
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
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                        <ImageOverlay>
                          <ChangeText>이미지 변경</ChangeText>
                        </ImageOverlay>
                      </ImagePreview>
                    ) : existingImageUrl ? (
                      <ImagePreview>
                        <img
                          src={existingImageUrl}
                          alt="기존 프로필"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "8px",
                          }}
                        />
                        <ImageOverlay>
                          <ChangeText>이미지 변경</ChangeText>
                        </ImageOverlay>
                      </ImagePreview>
                    ) : (
                      <>
                        <UploadIcon>📁</UploadIcon>
                        <UploadText>이미지 업로드</UploadText>
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
                    {businessDomains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </Select>
                  {errors.businessDomain && (
                    <ErrorText>{errors.businessDomain}</ErrorText>
                  )}
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
                    {ownershipTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {errors.ownershipType && (
                    <ErrorText>{errors.ownershipType}</ErrorText>
                  )}
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
                  {errors.businessNumber && (
                    <ErrorText>{errors.businessNumber}</ErrorText>
                  )}
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
                  {errors.corporationNumber && (
                    <ErrorText>{errors.corporationNumber}</ErrorText>
                  )}
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
                  <Label>출퇴근 반경 * (m)</Label>
                  <Input
                    type="number"
                    name="geofenceRadius"
                    value={formData.geofenceRadius}
                    onChange={handleInputChange}
                    placeholder="출퇴근이 가능한 반경을 설정해주세요."
                    hasError={!!errors.geofenceRadius}
                  />
                  {errors.geofenceRadius && (
                    <ErrorText>{errors.geofenceRadius}</ErrorText>
                  )}
                </FormField>

                <FormField>
                  <Label>대리인명</Label>
                  <Input
                    type="text"
                    name="attorneyName"
                    value={formData.attorneyName}
                    onChange={handleInputChange}
                    placeholder="대리인명을 입력하세요."
                  />
                </FormField>

                <FormField>
                  <Label>대리인 연락처</Label>
                  <Input
                    type="tel"
                    name="attorneyPhoneNumber"
                    value={formData.attorneyPhoneNumber}
                    onChange={handleInputChange}
                    placeholder="대리인 연락처를 입력하세요."
                  />
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
                      {errors.latitude && (
                        <ErrorText>{errors.latitude}</ErrorText>
                      )}
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
                      {errors.longitude && (
                        <ErrorText>{errors.longitude}</ErrorText>
                      )}
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

              <ModalFooter>
                <CancelButton type="button" onClick={handleCancel}>
                  취소
                </CancelButton>
                <SubmitButton type="submit" disabled={isLoading}>
                  {isLoading ? "요청 중..." : "수정 요청"}
                </SubmitButton>
              </ModalFooter>
            </Form>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>

      <InfoModal
        isOpen={showCancelModal}
        onClose={handleConfirmCancel}
        title="안내"
        message="수정 요청을 취소하시겠습니까?"
        buttonText="확인"
        buttonColor="#A87C7C"
      />
    </>
  );
}

export default BranchEditRequestModal;

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
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
`;

const ModalMessage = styled.div`
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 24px;
  color: #1e40af;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const ProfileImageSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
`;

const ProfileImageLabel = styled.label`
  font-weight: 500;
  margin-bottom: 12px;
  color: #374151;
  font-size: 14px;
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
  border-radius: 8px;
  transition: background-color 0.2s;
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
  gap: 16px;
  margin-bottom: 24px;
`;

const FormField = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'fullWidth',
})`
  display: flex;
  flex-direction: column;
  ${(props) => props.fullWidth && "grid-column: 1 / -1;"}
`;

const Label = styled.label`
  font-weight: 500;
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
`;

const Input = styled.input.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasError',
})`
  padding: 10px;
  border: 1px solid ${(props) => (props.hasError ? "#ef4444" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 14px;
  background-color: ${(props) => (props.readOnly ? "#f9fafb" : "white")};
  cursor: ${(props) => (props.readOnly ? "default" : "text")};

  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? "#ef4444" : "#6d28d9")};
    box-shadow: 0 0 0 3px ${(props) => (props.hasError ? "#fef2f2" : "#f3e8ff")};
  }
`;

const Select = styled.select.withConfig({
  shouldForwardProp: (prop) => prop !== 'hasError',
})`
  padding: 10px;
  border: 1px solid ${(props) => (props.hasError ? "#ef4444" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 14px;
  background: white;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.hasError ? "#ef4444" : "#6d28d9")};
    box-shadow: 0 0 0 3px ${(props) => (props.hasError ? "#fef2f2" : "#f3e8ff")};
  }
`;

const TextArea = styled.textarea`
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;

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

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
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
  padding: 10px 20px;
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
  width: 150px;
  height: 150px;
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
`;

const SearchButton = styled.button`
  padding: 10px 16px;
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
  gap: 12px;
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
