import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon } from "@mdi/react";
import {
  mdiClose,
  mdiPlus,
  mdiCalendar,
  mdiCurrencyUsd,
  mdiPackageVariant,
  mdiStarOutline,
  mdiChartBar,
  mdiAccountGroup,
  mdiHeartOutline,
  mdiChartLine,
} from "@mdi/js";

const categories = [
  { id: 1, code: "SALES", label: "매출", icon: mdiCurrencyUsd },
  { id: 2, code: "ORDER", label: "주문", icon: mdiPackageVariant },
  { id: 3, code: "REVIEW", label: "리뷰", icon: mdiStarOutline },
  { id: 4, code: "INVENTORY", label: "재고", icon: mdiChartBar },
  { id: 5, code: "ATTENDANCE", label: "출근", icon: mdiAccountGroup },
  {
    id: 6,
    code: "CUSTOMER_SATISFACTION",
    label: "고객만족",
    icon: mdiHeartOutline,
  },
  { id: 7, code: "CUSTOM", label: "커스텀", icon: mdiChartLine },
];

const periods = [
  { value: "DAILY", label: "일간" },
  { value: "WEEKLY", label: "주간" },
  { value: "MONTHLY", label: "월간" },
  { value: "YEARLY", label: "연간" },
];

function KPIAddModal({ isOpen, onClose, onSave, branchId, loading = false }) {
  const [formData, setFormData] = useState({
    kpiId: null,
    branchId: branchId || null,
    name: "",
    category: null,
    targetValue: 0,
    unit: "",
    period: "MONTHLY",
    targetDate: "",
    description: "",
    kpiStatus: "ACTIVE",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        kpiId: null,
        branchId: branchId || null,
        name: "",
        category: null,
        targetValue: 0,
        unit: "",
        period: "MONTHLY",
        targetDate: "",
        description: "",
        kpiStatus: "ACTIVE",
      });
      setErrors({});
    }
  }, [isOpen, branchId]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleCategorySelect = (category) => {
    handleInputChange("category", category);
    handleInputChange("kpiId", category.id);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "KPI 이름을 입력하세요";
    }
    if (!formData.category) {
      newErrors.category = "카테고리를 선택하세요";
    }
    if (!formData.targetValue || formData.targetValue <= 0) {
      newErrors.targetValue = "목표값을 입력하세요";
    }
    if (!formData.unit.trim()) {
      newErrors.unit = "단위를 입력하세요";
    }
    if (!formData.period) {
      newErrors.period = "기간을 선택하세요";
    }
    if (!formData.description.trim()) {
      newErrors.description = "설명을 입력하세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      kpiId: formData.kpiId,
      branchId: formData.branchId,
      targetValue: formData.targetValue,
      currentValue: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: formData.targetDate || null,
      kpiStatus: formData.kpiStatus,
      // 추가 정보는 백엔드에서 처리하거나 별도 필드로 전송
      name: formData.name,
      category: formData.category?.code,
      unit: formData.unit,
      period: formData.period,
      description: formData.description,
    };

    onSave(submitData);
  };

  const handleClose = () => {
    setFormData({
      kpiId: null,
      branchId: branchId || null,
      name: "",
      category: null,
      targetValue: 0,
      unit: "",
      period: "MONTHLY",
      targetDate: "",
      description: "",
      kpiStatus: "ACTIVE",
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <Icon path={mdiPlus} size={1.5} color="#6d28d9" />
            <ModalTitle>새 KPI 추가</ModalTitle>
          </HeaderLeft>
          <CloseButton onClick={handleClose}>
            <Icon path={mdiClose} size={1.2} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormSection>
            <Label required>KPI 이름</Label>
            <Input
              type="text"
              placeholder="예: 월간 매출액"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={errors.name}
            />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}
          </FormSection>

          <FormSection>
            <Label required>카테고리</Label>
            <CategoryGrid>
              {categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  selected={formData.category?.id === category.id}
                >
                  <CategoryIcon>
                    <Icon path={category.icon} size={1.5} />
                  </CategoryIcon>
                  <CategoryLabel>{category.label}</CategoryLabel>
                </CategoryButton>
              ))}
            </CategoryGrid>
            {errors.category && <ErrorText>{errors.category}</ErrorText>}
          </FormSection>

          <FormRow>
            <FormSection>
              <Label required>목표값</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.targetValue}
                onChange={(e) =>
                  handleInputChange(
                    "targetValue",
                    parseFloat(e.target.value) || 0
                  )
                }
                error={errors.targetValue}
              />
              {errors.targetValue && (
                <ErrorText>{errors.targetValue}</ErrorText>
              )}
            </FormSection>

            <FormSection>
              <Label required>단위</Label>
              <Input
                type="text"
                placeholder="예: 원, 건, %, 점"
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                error={errors.unit}
              />
              {errors.unit && <ErrorText>{errors.unit}</ErrorText>}
            </FormSection>
          </FormRow>

          <FormRow>
            <FormSection>
              <Label required>기간</Label>
              <Select
                value={formData.period}
                onChange={(e) => handleInputChange("period", e.target.value)}
                error={errors.period}
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </Select>
              {errors.period && <ErrorText>{errors.period}</ErrorText>}
            </FormSection>

            <FormSection>
              <Label>목표일</Label>
              <DateInputContainer>
                <Input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    handleInputChange("targetDate", e.target.value)
                  }
                />
                <Icon path={mdiCalendar} size={1} color="#6b7280" />
              </DateInputContainer>
            </FormSection>
          </FormRow>

          <FormSection>
            <Label required>설명</Label>
            <TextArea
              placeholder="KPI에 대한 상세 설명을 입력해주세요."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              error={errors.description}
            />
            {errors.description && <ErrorText>{errors.description}</ErrorText>}
          </FormSection>

          <ModalFooter>
            <CancelButton type="button" onClick={handleClose}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              <Icon path={mdiPackageVariant} size={1} />
              {loading ? "생성 중..." : "KPI 생성"}
            </SubmitButton>
          </ModalFooter>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default KPIAddModal;

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
  border-radius: 16px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
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
  margin-bottom: 24px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const Label = styled.label.withConfig({
  shouldForwardProp: (prop) => prop !== "required",
})`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;

  &::after {
    content: ${(props) => (props.required ? '" *"' : '""')};
    color: #dc2626;
  }
`;

const Input = styled.input.withConfig({
  shouldForwardProp: (prop) => prop !== "error",
})`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${(props) => (props.error ? "#dc2626" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.error ? "#dc2626" : "#6d28d9")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.error ? "rgba(220, 38, 38, 0.1)" : "rgba(109, 40, 217, 0.1)"};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Select = styled.select.withConfig({
  shouldForwardProp: (prop) => prop !== "error",
})`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${(props) => (props.error ? "#dc2626" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.error ? "#dc2626" : "#6d28d9")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.error ? "rgba(220, 38, 38, 0.1)" : "rgba(109, 40, 217, 0.1)"};
  }
`;

const TextArea = styled.textarea.withConfig({
  shouldForwardProp: (prop) => prop !== "error",
})`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid ${(props) => (props.error ? "#dc2626" : "#e5e7eb")};
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.error ? "#dc2626" : "#6d28d9")};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.error ? "rgba(220, 38, 38, 0.1)" : "rgba(109, 40, 217, 0.1)"};
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
  margin-bottom: 8px;
`;

const CategoryButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "selected",
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border: 2px solid ${(props) => (props.selected ? "#6d28d9" : "#e5e7eb")};
  border-radius: 12px;
  background: ${(props) => (props.selected ? "#f5f3ff" : "white")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #6d28d9;
    background: #f5f3ff;
  }
`;

const CategoryIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d28d9;
`;

const CategoryLabel = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #374151;
`;

const DateInputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  input {
    padding-right: 40px;
  }

  svg {
    position: absolute;
    right: 12px;
    pointer-events: none;
  }
`;

const ErrorText = styled.span`
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
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
  background: #6d28d9;
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
    background: #5b21b6;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;
