import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon } from "@mdi/react";
import {
  mdiClose,
  mdiUpload,
  mdiCalendar,
  mdiMagnify,
  mdiEye,
  mdiEyeOff,
} from "@mdi/js";
import BaseModal from "../common/BaseModal";

function EmployeeModal({
  isOpen,
  onClose,
  employee = null,
  onSave,
  loading = false,
  branchId,
}) {
  const [formData, setFormData] = useState({
    employeeNumber: "",
    name: "",
    jobGradeId: null,
    dateOfBirth: "",
    gender: "MALE",
    email: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    mobile: "",
    emergencyTel: "",
    emergencyName: "",
    relationship: "PARENT",
    hireDate: "",
    terminateDate: "",
    authorityType: "FRANCHISE_OWNER",
    employmentStatus: "ACTIVE",
    employmentType: "FULL_TIME",
    profileImageUrl: "",
    remark: "",
    rawPassword: "",
    dispatches: [
      { branchId: branchId || "", assignedFrom: "", assignedTo: "" },
    ],
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const isEdit = !!employee;

  const formatPhoneNumber = (value = "") => {
    const numbersOnly = value.replace(/\D/g, "");
    if (!numbersOnly) {
      return "";
    }

    const limitedNumbers = numbersOnly.slice(0, 11);

    if (limitedNumbers.length <= 3) {
      return limitedNumbers;
    }

    if (limitedNumbers.length <= 7) {
      if (limitedNumbers.startsWith("02")) {
        return `${limitedNumbers.slice(0, 2)}-${limitedNumbers.slice(2)}`;
      }
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`;
    }

    if (limitedNumbers.startsWith("02")) {
      const middleLength = limitedNumbers.length - 6;
      if (middleLength === 3) {
        return `${limitedNumbers.slice(0, 2)}-${limitedNumbers.slice(
          2,
          5
        )}-${limitedNumbers.slice(5)}`;
      }
      return `${limitedNumbers.slice(0, 2)}-${limitedNumbers.slice(
        2,
        6
      )}-${limitedNumbers.slice(6)}`;
    }

    if (limitedNumbers.startsWith("01")) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(
        3,
        7
      )}-${limitedNumbers.slice(7)}`;
    }

    const middleLength = limitedNumbers.length - 7;
    if (middleLength === 3) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(
        3,
        6
      )}-${limitedNumbers.slice(6)}`;
    }

    return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(
      3,
      7
    )}-${limitedNumbers.slice(7)}`;
  };

  // 카카오 주소 API 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        setFormData({
          employeeNumber: employee.employeeNumber || "",
          name: employee.name || "",
          jobGradeId: employee.jobGradeId || null,
          dateOfBirth: employee.dateOfBirth || "",
          gender: employee.gender || "MALE",
          email: employee.email || "",
          zipcode: employee.zipcode || "",
          address: employee.address || "",
          addressDetail: employee.addressDetail || "",
          mobile: formatPhoneNumber(employee.mobile || ""),
          emergencyTel: formatPhoneNumber(employee.emergencyTel || ""),
          emergencyName: employee.emergencyName || "",
          relationship: employee.relationship || "PARENT",
          hireDate: employee.hireDate || "",
          terminateDate: employee.terminateDate || "",
          authorityType: employee.authorityType || "FRANCHISE_OWNER",
          employmentStatus: employee.employmentStatus || "ACTIVE",
          employmentType: employee.employmentType || "FULL_TIME",
          profileImageUrl: employee.profileImageUrl || "",
          remark: employee.remark || "",
          rawPassword: "",
          dispatches: employee.dispatches || [
            { branchId: branchId || "", assignedFrom: "", assignedTo: "" },
          ],
        });
        setProfileImagePreview(employee.profileImageUrl);
      } else {
        // 새 직원 등록 시 초기화
        setFormData({
          employeeNumber: "",
          name: "",
          jobGradeId: null,
          dateOfBirth: "",
          gender: "MALE",
          email: "",
          zipcode: "",
          address: "",
          addressDetail: "",
          mobile: "",
          emergencyTel: "",
          emergencyName: "",
          relationship: "PARENT",
          hireDate: "",
          terminateDate: "",
          authorityType: "FRANCHISE_OWNER",
          employmentStatus: "ACTIVE",
          employmentType: "FULL_TIME",
          profileImageUrl: "",
          remark: "",
          rawPassword: "",
          dispatches: [
            { branchId: branchId || "", assignedFrom: "", assignedTo: "" },
          ],
        });
        setProfileImagePreview(null);
      }
      setProfileImage(null);
      setErrors({});
    }
  }, [isOpen, employee, branchId]);

  const handleInputChange = (field, value) => {
    let formattedValue = value;

    if (field === "mobile" || field === "emergencyTel") {
      formattedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
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

  const handleAddressSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function (data) {
          // 우편번호와 주소 정보를 해당 필드에 넣는다.
          setFormData((prev) => ({
            ...prev,
            zipcode: data.zonecode,
            address: data.address,
          }));

          // 에러 제거
          if (errors.zipcode) {
            setErrors((prev) => ({
              ...prev,
              zipcode: null,
            }));
          }
          if (errors.address) {
            setErrors((prev) => ({
              ...prev,
              address: null,
            }));
          }
        },
      }).open();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.employeeNumber.trim())
      newErrors.employeeNumber = "사번을 입력하세요";
    if (!formData.name.trim()) newErrors.name = "이름을 입력하세요";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "생년월일을 입력하세요";
    if (!formData.email.trim()) newErrors.email = "이메일을 입력하세요";
    if (!formData.zipcode.trim()) newErrors.zipcode = "우편번호를 입력하세요";
    if (!formData.address.trim()) newErrors.address = "주소를 입력하세요";
    if (!formData.addressDetail.trim())
      newErrors.addressDetail = "상세주소를 입력하세요";
    if (!formData.mobile.trim()) newErrors.mobile = "휴대폰번호를 입력하세요";
    if (!formData.emergencyTel.trim())
      newErrors.emergencyTel = "비상연락처를 입력하세요";
    if (!formData.emergencyName.trim())
      newErrors.emergencyName = "비상연락처 이름을 입력하세요";
    if (!formData.hireDate) newErrors.hireDate = "입사일을 입력하세요";
    if (!isEdit && !formData.rawPassword.trim())
      newErrors.rawPassword = "비밀번호를 입력하세요";

    // dispatches 유효성 검사
    if (!formData.dispatches || formData.dispatches.length === 0) {
      newErrors.dispatches = "지점 배치 정보가 필요합니다";
    } else {
      const dispatch = formData.dispatches[0];
      if (!dispatch.branchId || dispatch.branchId === "") {
        newErrors.dispatches = "지점 배치 정보가 필요합니다";
      }
      if (!dispatch.assignedFrom || dispatch.assignedFrom.trim() === "") {
        newErrors.assignedFrom = "배치 시작일을 입력하세요";
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;

    if (!isValid) {
      console.log("=== 유효성 검사 실패 ===");
      console.log("에러 목록:", newErrors);
      // 첫 번째 에러 필드로 스크롤
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(
        `[data-field="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }
    }

    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("=== 등록 버튼 클릭 ===");
    console.log("현재 formData:", formData);
    console.log("branchId:", branchId);
    console.log("isEdit:", isEdit);

    const isValid = validateForm();
    if (!isValid) {
      console.log("유효성 검사 실패 - 제출 중단");
      return;
    }

    // branchId 검증 (등록 시 필수)
    if (!isEdit && (!branchId || branchId === "")) {
      console.log("branchId가 없음 - 제출 중단");
      setErrors((prev) => ({
        ...prev,
        dispatches: "지점 정보가 없습니다. 페이지를 새로고침해주세요.",
      }));
      return;
    }

    console.log("유효성 검사 통과 - 데이터 전송 시작");

    const submitData = { ...formData };

    // dispatches의 branchId가 비어있으면 설정
    if (submitData.dispatches && submitData.dispatches.length > 0) {
      if (
        !submitData.dispatches[0].branchId ||
        submitData.dispatches[0].branchId === ""
      ) {
        submitData.dispatches[0].branchId = branchId;
      }
    }

    // 수정 시 비밀번호가 비어있으면 제거
    if (isEdit && !submitData.rawPassword) {
      delete submitData.rawPassword;
    }

    console.log("=== EmployeeModal 데이터 전송 준비 ===");
    console.log("모드:", isEdit ? "수정" : "등록");
    console.log("전송할 데이터:", submitData);
    console.log("프로필 이미지:", profileImage);
    console.log("이미지 파일명:", profileImage?.name);
    console.log("이미지 파일 크기:", profileImage?.size);
    console.log("이미지 파일 타입:", profileImage?.type);
    console.log("=== EmployeeModal 데이터 전송 시작 ===");

    onSave(submitData, profileImage);
  };

  const handleClose = () => {
    setFormData({
      employeeNumber: "",
      name: "",
      jobGradeId: null,
      dateOfBirth: "",
      gender: "MALE",
      email: "",
      zipcode: "",
      address: "",
      addressDetail: "",
          mobile: "",
          emergencyTel: "",
      emergencyName: "",
      relationship: "PARENT",
      hireDate: "",
      terminateDate: "",
      authorityType: "FRANCHISE_OWNER",
      employmentStatus: "ACTIVE",
      employmentType: "FULL_TIME",
      profileImageUrl: "",
      remark: "",
      rawPassword: "",
      dispatches: [
        { branchId: branchId || "", assignedFrom: "", assignedTo: "" },
      ],
    });
    setProfileImage(null);
    setProfileImagePreview(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={handleClose}
      maxWidth="800px"
      allowBackdropClose={false}
    >
      <ModalHeader>
        <ModalTitle>{isEdit ? "직원 정보 수정" : "직원 등록"}</ModalTitle>
        <ModalSubtitle>
          {isEdit ? "직원 정보를 수정합니다" : "새로운 직원을 등록합니다"}
        </ModalSubtitle>
        <CloseButton onClick={handleClose}>
          <Icon path={mdiClose} size={1.2} />
        </CloseButton>
      </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle>프로필 이미지</SectionTitle>
            <ProfileImageSection>
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
            </ProfileImageSection>
          </FormSection>

          <FormSection>
            <SectionTitle>기본 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>사번</Label>
                <Input
                  type="text"
                  placeholder="사번을 입력하세요"
                  value={formData.employeeNumber}
                  onChange={(e) =>
                    handleInputChange("employeeNumber", e.target.value)
                  }
                  error={errors.employeeNumber}
                  data-field="employeeNumber"
                />
                {errors.employeeNumber && (
                  <ErrorText>{errors.employeeNumber}</ErrorText>
                )}
              </FormGroup>

              <FormGroup>
                <Label required>직원 이름</Label>
                <Input
                  type="text"
                  placeholder="직원 이름을 입력하세요"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
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
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  error={errors.dateOfBirth}
                />
                {errors.dateOfBirth && (
                  <ErrorText>{errors.dateOfBirth}</ErrorText>
                )}
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label required>성별</Label>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                >
                  <option value="MALE">남성</option>
                  <option value="FEMALE">여성</option>
                </Select>
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
                  onChange={(e) => handleInputChange("email", e.target.value)}
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
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  error={errors.mobile}
                />
                {errors.mobile && <ErrorText>{errors.mobile}</ErrorText>}
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label required>비상연락처</Label>
                <Input
                  type="tel"
                  placeholder="010-9876-5432"
                  value={formData.emergencyTel}
                  onChange={(e) =>
                    handleInputChange("emergencyTel", e.target.value)
                  }
                  error={errors.emergencyTel}
                />
                {errors.emergencyTel && (
                  <ErrorText>{errors.emergencyTel}</ErrorText>
                )}
              </FormGroup>

              <FormGroup>
                <Label required>비상연락처 이름</Label>
                <Input
                  type="text"
                  placeholder="비상연락처 이름을 입력하세요"
                  value={formData.emergencyName}
                  onChange={(e) =>
                    handleInputChange("emergencyName", e.target.value)
                  }
                  error={errors.emergencyName}
                />
                {errors.emergencyName && (
                  <ErrorText>{errors.emergencyName}</ErrorText>
                )}
              </FormGroup>

              <FormGroup>
                <Label required>관계</Label>
                <Select
                  value={formData.relationship}
                  onChange={(e) =>
                    handleInputChange("relationship", e.target.value)
                  }
                >
                  <option value="PARENT">부모</option>
                  <option value="SIBLING">형제자매</option>
                  <option value="SPOUSE">배우자</option>
                  <option value="CHILD">자녀</option>
                  <option value="FRIEND">친구</option>
                  <option value="NEIGHBOR">이웃</option>
                  <option value="OTHER">기타</option>
                </Select>
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>주소 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>우편번호</Label>
                <AddressInputContainer>
                  <Input
                    type="text"
                    placeholder="06292"
                    value={formData.zipcode}
                    readOnly
                    error={errors.zipcode}
                  />
                  <AddressSearchButton
                    type="button"
                    onClick={handleAddressSearch}
                  >
                    <Icon path={mdiMagnify} size={1} />
                    주소 검색
                  </AddressSearchButton>
                </AddressInputContainer>
                {errors.zipcode && <ErrorText>{errors.zipcode}</ErrorText>}
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label required>주소</Label>
              <Input
                type="text"
                placeholder="서울특별시 강남구 테헤란로 123"
                value={formData.address}
                readOnly
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
                onChange={(e) =>
                  handleInputChange("addressDetail", e.target.value)
                }
                error={errors.addressDetail}
              />
              {errors.addressDetail && (
                <ErrorText>{errors.addressDetail}</ErrorText>
              )}
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>고용 정보</SectionTitle>
            <FormRow>
              <FormGroup>
                <Label required>입사일</Label>
                <Input
                  type="date"
                  placeholder="연도-월-일"
                  value={formData.hireDate}
                  onChange={(e) =>
                    handleInputChange("hireDate", e.target.value)
                  }
                  error={errors.hireDate}
                />
                {errors.hireDate && <ErrorText>{errors.hireDate}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>퇴사일</Label>
                <Input
                  type="date"
                  placeholder="연도-월-일"
                  value={formData.terminateDate}
                  onChange={(e) =>
                    handleInputChange("terminateDate", e.target.value)
                  }
                />
              </FormGroup>
            </FormRow>

            <FormRow>
              <FormGroup>
                <Label required>권한 유형</Label>
                <Select
                  value={formData.authorityType}
                  onChange={(e) =>
                    handleInputChange("authorityType", e.target.value)
                  }
                >
                  <option value="HQ_ADMIN">본점(본사) 관리자</option>
                  <option value="BRANCH_ADMIN">지점(직영점) 관리자</option>
                  <option value="FRANCHISE_OWNER">가맹점주 (관리자)</option>
                  <option value="STAFF">직원</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label required>고용 상태</Label>
                <Select
                  value={formData.employmentStatus}
                  onChange={(e) =>
                    handleInputChange("employmentStatus", e.target.value)
                  }
                >
                  <option value="ACTIVE">재직</option>
                  <option value="ON_LEAVE">휴직</option>
                  <option value="TERMINATED">퇴사</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label required>고용 유형</Label>
                <Select
                  value={formData.employmentType}
                  onChange={(e) =>
                    handleInputChange("employmentType", e.target.value)
                  }
                >
                  <option value="FULL_TIME">정규직</option>
                  <option value="PART_TIME">계약직</option>
                </Select>
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>지점 배치 정보</SectionTitle>
            {errors.dispatches && (
              <ErrorText
                style={{
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: "#dc2626",
                }}
              >
                {errors.dispatches}
              </ErrorText>
            )}
            <FormRow>
              <FormGroup>
                <Label required>배치 시작일</Label>
                <Input
                  type="date"
                  placeholder="연도-월-일"
                  value={formData.dispatches[0]?.assignedFrom || ""}
                  onChange={(e) =>
                    handleInputChange("dispatches", [
                      {
                        ...formData.dispatches[0],
                        assignedFrom: e.target.value,
                      },
                    ])
                  }
                  error={errors.assignedFrom}
                  data-field="assignedFrom"
                />
                {errors.assignedFrom && (
                  <ErrorText>{errors.assignedFrom}</ErrorText>
                )}
              </FormGroup>

              <FormGroup>
                <Label>배치 종료일</Label>
                <Input
                  type="date"
                  placeholder="연도-월-일"
                  value={formData.dispatches[0]?.assignedTo || ""}
                  onChange={(e) =>
                    handleInputChange("dispatches", [
                      {
                        ...formData.dispatches[0],
                        assignedTo: e.target.value,
                      },
                    ])
                  }
                  error={errors.assignedTo}
                />
                {errors.assignedTo && (
                  <ErrorText>{errors.assignedTo}</ErrorText>
                )}
              </FormGroup>
            </FormRow>
          </FormSection>

          <FormSection>
            <SectionTitle>계정 정보</SectionTitle>
            {!isEdit && (
              <FormGroup>
                <Label required>비밀번호</Label>
                <PasswordInputContainer>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="8자 이상 입력하세요"
                    value={formData.rawPassword}
                    onChange={(e) =>
                      handleInputChange("rawPassword", e.target.value)
                    }
                    error={errors.rawPassword}
                  />
                  <PasswordToggleButton
                    type="button"
                    onClick={togglePasswordVisibility}
                  >
                    <Icon path={showPassword ? mdiEyeOff : mdiEye} size={1} />
                  </PasswordToggleButton>
                </PasswordInputContainer>
                {errors.rawPassword && (
                  <ErrorText>{errors.rawPassword}</ErrorText>
                )}
              </FormGroup>
            )}

            {isEdit && (
              <FormGroup>
                <Label>비밀번호 변경 (선택사항)</Label>
                <PasswordInputContainer>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
                    value={formData.rawPassword}
                    onChange={(e) =>
                      handleInputChange("rawPassword", e.target.value)
                    }
                  />
                  <PasswordToggleButton
                    type="button"
                    onClick={togglePasswordVisibility}
                  >
                    <Icon path={showPassword ? mdiEyeOff : mdiEye} size={1} />
                  </PasswordToggleButton>
                </PasswordInputContainer>
              </FormGroup>
            )}
          </FormSection>

          <FormSection>
            <SectionTitle>비고</SectionTitle>
            <FormGroup>
              <TextArea
                placeholder="추가 정보나 메모를 입력하세요"
                value={formData.remark}
                onChange={(e) => handleInputChange("remark", e.target.value)}
                rows={3}
              />
            </FormGroup>
          </FormSection>

          <ModalFooter>
            <CancelButton type="button" onClick={handleClose}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              {loading ? "처리 중..." : isEdit ? "수정하기" : "등록하기"}
            </SubmitButton>
          </ModalFooter>
        </Form>
    </BaseModal>
  );
}

export default EmployeeModal;

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

const Label = styled.label.withConfig({
  shouldForwardProp: (prop) => prop !== "required",
})`
  font-size: 14px;
  font-weight: 500;
  color: #374151;

  &::after {
    content: ${(props) => (props.required ? '" *"' : '""')};
    color: #dc2626;
  }
`;

const Input = styled.input.withConfig({
  shouldForwardProp: (prop) => prop !== "error",
})`
  padding: 12px 16px;
  border: 2px solid ${(props) => (props.error ? "#dc2626" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.error ? "#dc2626" : "#8b5cf6")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.error ? "rgba(220, 38, 38, 0.1)" : "rgba(139, 92, 246, 0.1)"};
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
  width: 150px;
  height: 150px;
  border: 2px dashed #d1d5db;
  border-radius: 50%;
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

const AddressInputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`;

const AddressSearchButton = styled.button`
  padding: 12px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
  }
`;

const ProfileImageSection = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
`;

const PasswordInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  input {
    padding-right: 48px;
  }
`;

const PasswordToggleButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }

  &:focus {
    outline: none;
    color: #8b5cf6;
  }
`;
