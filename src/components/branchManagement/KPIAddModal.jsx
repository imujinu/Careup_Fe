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
  mdiCheck,
  mdiAlertCircle,
  mdiPlay,
  mdiHelpCircle,
  mdiChevronDown,
  mdiChevronUp,
} from "@mdi/js";
import { branchKpiService } from "../../service/branchKpiService";
import { useToast } from "../common/Toast";
import BaseModal from "../common/BaseModal";

const categories = [
  { id: 1, code: "SALES", label: "매출", icon: mdiCurrencyUsd },
  { id: 2, code: "ORDER", label: "주문", icon: mdiPackageVariant },
  { id: 3, code: "REVIEW", label: "리뷰", icon: mdiStarOutline },
  { id: 4, code: "INVENTORY", label: "재고", icon: mdiChartBar },
  { id: 5, code: "ATTENDANCE", label: "출근", icon: mdiAccountGroup },
  {
    id: 6,
    code: "CUSTOMER",
    label: "고객만족",
    icon: mdiHeartOutline,
  },
  { id: 7, code: "CUSTOM", label: "커스텀", icon: mdiChartLine },
];

const periods = [
  { value: "DAILY", label: "일간" },
  { value: "WEEKLY", label: "주간" },
  { value: "MONTHLY", label: "월간" },
  { value: "QUARTERLY", label: "분기" },
  { value: "YEARLY", label: "연간" },
];

function KPIAddModal({ isOpen, onClose, onSave, branchId, loading = false }) {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: null,
    periodType: "MONTHLY",
    calculationFormula: "",
  });

  const [errors, setErrors] = useState({});
  const [variables, setVariables] = useState({});
  const [examples, setExamples] = useState({});
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        description: "",
        category: null,
        periodType: "MONTHLY",
        calculationFormula: "",
      });
      setErrors({});
      setValidationResult(null);
      setTestResult(null);
      loadFormulaData();
    }
  }, [isOpen, branchId]);

  const loadFormulaData = async () => {
    try {
      const [variablesData, examplesData] = await Promise.all([
        branchKpiService.getFormulaVariables(),
        branchKpiService.getFormulaExamples(),
      ]);
      
      setVariables(variablesData || {});
      setExamples(examplesData || {});
    } catch (error) {
      console.error("공식 데이터 로드 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "공식 데이터를 불러오는데 실패했습니다.",
        duration: 3000,
      });
    }
  };

  // 공식에서 변수 토큰 추출 (영문 소문자, 언더스코어로 구성된 토큰)
  const extractVariablesFromFormula = (formula) => {
    if (!formula) return [];
    const tokens = formula.match(/[a-z_]+/g) || [];
    // 연산자/함수 키워드 필터링 (간단 화이트리스트 방식: 변수 후보만 남김)
    const keywords = new Set([
      "abs","sqrt","sin","cos","log","ceil","floor","max","min",
      "and","or","not"
    ]);
    return Array.from(new Set(tokens.filter(t => !keywords.has(t))));
  };

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

    // 공식이 변경되면 검증 결과 초기화
    if (field === "calculationFormula") {
      setValidationResult(null);
      setTestResult(null);
    }
  };

  const handleCategorySelect = (category) => {
    handleInputChange("category", category.code);
  };

  const handleExampleSelect = (exampleFormula) => {
    handleInputChange("calculationFormula", exampleFormula);
  };

  const handleVariableInsert = (variable) => {
    const currentFormula = formData.calculationFormula;
    const newFormula = currentFormula + (currentFormula ? " " : "") + variable;
    handleInputChange("calculationFormula", newFormula);
  };

  const validateFormula = async () => {
    if (!formData.calculationFormula.trim()) {
      addToast({
        type: "warning",
        title: "알림",
        message: "검증할 공식을 입력하세요.",
        duration: 3000,
      });
      return;
    }

    // 프론트 사전 검증: 허용 변수 목록과 비교
    const allowedVariables = Object.keys(variables || {});
    const usedInFormula = extractVariablesFromFormula(formData.calculationFormula);
    const unknownVars = usedInFormula.filter(v => !allowedVariables.includes(v));
    
    if (unknownVars.length > 0) {
      console.warn("[KPI] Unknown variables detected:", unknownVars);
      const msg = `알 수 없는 변수: ${unknownVars.join(", ")}`;
      setValidationResult({ valid: false, usedVariables: usedInFormula, message: msg });
      addToast({ type: "error", title: "오류", message: msg, duration: 3000 });
      return;
    }

    setIsValidating(true);
    try {
      
      const result = await branchKpiService.validateFormula(formData.calculationFormula);
      
      setValidationResult(result);
      
      if (result.valid) {
        addToast({
          type: "success",
          title: "성공",
          message: "유효한 공식입니다.",
          duration: 3000,
        });
      } else {
        addToast({
          type: "error",
          title: "오류",
          message: result.message || "잘못된 공식입니다.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("공식 검증 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "공식 검증에 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const testFormula = async () => {
    if (!formData.calculationFormula.trim()) {
      addToast({
        type: "warning",
        title: "알림",
        message: "테스트할 공식을 입력하세요.",
        duration: 3000,
      });
      return;
    }

    // 검증 선행 (없거나 유효하지 않으면 검증부터)
    if (!validationResult || validationResult?.valid === false) {
      await validateFormula();
      if (!validationResult || validationResult?.valid === false) {
        return;
      }
    }

    setIsTesting(true);
    try {
      // 사용된 변수 기반으로 테스트 변수 동적 구성
      const defaults = {
        total_sales: 1000000,
        avg_order_value: 50000,
        total_orders: 20,
        completed_orders: 18,
        cancelled_orders: 2,
        purchase_order_count: 5,
        total_purchase_amount: 500000,
        approved_order_count: 4,
        rejected_order_count: 1,
        avg_purchase_amount: 100000,
        purchase_approval_rate: 80,
        total_purchase_quantity: 100,
        total_approved_quantity: 80,
        quantity_approval_rate: 80,
        inventory_turnover: 2.5,
        total_work_days: 30,
        total_work_hours: 240,
        late_count: 2,
        absent_count: 1,
      };

      const used = validationResult?.usedVariables && validationResult.valid
        ? validationResult.usedVariables
        : extractVariablesFromFormula(formData.calculationFormula);

      const testVariables = used.reduce((acc, key) => {
        acc[key] = defaults[key] ?? 1; // 기본값 1로 채움
        return acc;
      }, {});

      
      const result = await branchKpiService.testFormula(formData.calculationFormula, testVariables);
      
      setTestResult(result);
      
      if (result.success) {
        addToast({
          type: "success",
          title: "성공",
          message: `계산 결과: ${result.result}`,
          duration: 3000,
        });
      } else {
        addToast({
          type: "error",
          title: "오류",
          message: result.message || "공식 계산에 실패했습니다.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("공식 테스트 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "공식 테스트에 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "KPI 이름을 입력하세요";
    }
    if (!formData.category) {
      newErrors.category = "카테고리를 선택하세요";
    }
    if (!formData.description.trim()) {
      newErrors.description = "설명을 입력하세요";
    }
    if (!formData.calculationFormula.trim()) {
      newErrors.calculationFormula = "계산 공식을 입력하세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    const isValid = validateForm();
    
    
    if (!isValid) {
      
      return;
    }

    const submitData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      periodType: formData.periodType,
      calculationFormula: formData.calculationFormula,
    };

    
    
    try {
      await onSave(submitData);
      
    } catch (error) {
      // 에러는 onSave에서 이미 처리하므로 여기서는 로그만 남김
      console.error("KPI 생성 중 에러:", error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      category: null,
      periodType: "MONTHLY",
      calculationFormula: "",
    });
    setErrors({});
    setValidationResult(null);
    setTestResult(null);
    setShowVariablesModal(false);
    setShowExamplesModal(false);
    onClose();
  };

  if (!isOpen) {
    
    return null;
  }

  

  return (
    <>
    <BaseModal 
      isOpen={isOpen} 
      onClose={handleClose}
      maxWidth="900px"
      allowBackdropClose={false}
    >
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
                  selected={formData.category === category.code}
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

          <FormSection>
            <Label required>기간</Label>
            <Select
              value={formData.periodType}
              onChange={(e) => handleInputChange("periodType", e.target.value)}
              error={errors.periodType}
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </Select>
            {errors.periodType && <ErrorText>{errors.periodType}</ErrorText>}
          </FormSection>

          <FormSection>
            <Label required>계산 공식</Label>
            <FormulaInputContainer>
              <FormulaInput
                type="text"
                placeholder="예: total_sales / 1000000"
                value={formData.calculationFormula}
                onChange={(e) => handleInputChange("calculationFormula", e.target.value)}
                error={errors.calculationFormula}
              />
              <FormulaButtons>
                <FormulaButton
                  type="button"
                  onClick={validateFormula}
                  disabled={isValidating || !formData.calculationFormula.trim()}
                  variant="validate"
                >
                  <Icon path={mdiCheck} size={0.8} />
                  {isValidating ? "검증 중..." : "검증"}
                </FormulaButton>
                <FormulaButton
                  type="button"
                  onClick={testFormula}
                  disabled={isTesting || !formData.calculationFormula.trim()}
                  variant="test"
                >
                  <Icon path={mdiPlay} size={0.8} />
                  {isTesting ? "테스트 중..." : "테스트"}
                </FormulaButton>
              </FormulaButtons>
            </FormulaInputContainer>
            
            {/* 검증 결과 */}
            {validationResult && (
              <ValidationResult valid={validationResult.valid}>
                <Icon 
                  path={validationResult.valid ? mdiCheck : mdiAlertCircle} 
                  size={1} 
                  color={validationResult.valid ? "#10b981" : "#ef4444"}
                />
                <span>{validationResult.message}</span>
                {validationResult.usedVariables && (
                  <div className="used-variables">
                    사용된 변수: {validationResult.usedVariables.join(", ")}
                  </div>
                )}
              </ValidationResult>
            )}

            {/* 테스트 결과 */}
            {testResult && (
              <TestResult success={testResult.success}>
                <Icon 
                  path={testResult.success ? mdiCheck : mdiAlertCircle} 
                  size={1} 
                  color={testResult.success ? "#10b981" : "#ef4444"}
                />
                <span>
                  {testResult.success 
                    ? `계산 결과: ${testResult.result}` 
                    : testResult.message
                  }
                </span>
              </TestResult>
            )}

            {/* 변수 목록 */}
            <VariablesSection>
              <VariablesHeader onClick={() => setShowVariablesModal(true)}>
                <Icon path={mdiHelpCircle} size={1} />
                <span>사용 가능한 변수</span>
                <Icon path={mdiChevronDown} size={1} />
              </VariablesHeader>
            </VariablesSection>

            {/* 공식 예제 */}
            <ExamplesSection>
              <ExamplesHeader onClick={() => setShowExamplesModal(true)}>
                <Icon path={mdiChartLine} size={1} />
                <span>공식 예제</span>
                <Icon path={mdiChevronDown} size={1} />
              </ExamplesHeader>
            </ExamplesSection>

            {errors.calculationFormula && <ErrorText>{errors.calculationFormula}</ErrorText>}
          </FormSection>

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
    </BaseModal>

    {/* 변수 목록 모달창 */}
    <BaseModal 
      isOpen={showVariablesModal} 
      onClose={() => setShowVariablesModal(false)}
      maxWidth="800px"
      allowBackdropClose={false}
    >
      <SubModalHeader>
        <SubModalTitle>사용 가능한 변수</SubModalTitle>
        <CloseButton onClick={() => setShowVariablesModal(false)}>
          <Icon path={mdiClose} size={1.2} />
        </CloseButton>
      </SubModalHeader>
      <SubModalBody>
        <VariablesGrid>
          {Object.entries(variables).map(([key, description]) => (
            <VariableItem key={key} onClick={() => {
              handleVariableInsert(key);
              setShowVariablesModal(false);
            }}>
              <VariableName>{key}</VariableName>
              <VariableDescription>{description}</VariableDescription>
            </VariableItem>
          ))}
        </VariablesGrid>
      </SubModalBody>
    </BaseModal>

    {/* 공식 예제 모달창 */}
    <BaseModal 
      isOpen={showExamplesModal} 
      onClose={() => setShowExamplesModal(false)}
      maxWidth="800px"
      allowBackdropClose={false}
    >
      <SubModalHeader>
        <SubModalTitle>공식 예제</SubModalTitle>
        <CloseButton onClick={() => setShowExamplesModal(false)}>
          <Icon path={mdiClose} size={1.2} />
        </CloseButton>
      </SubModalHeader>
      <SubModalBody>
        <ExamplesList>
          {Object.entries(examples).map(([name, formula]) => (
            <ExampleItem key={name} onClick={() => {
              handleExampleSelect(formula);
              setShowExamplesModal(false);
            }}>
              <ExampleName>{name}</ExampleName>
              <ExampleFormula>{formula}</ExampleFormula>
            </ExampleItem>
          ))}
        </ExamplesList>
      </SubModalBody>
    </BaseModal>
    </>
  );
}

export default KPIAddModal;

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

// 공식 관련 스타일 컴포넌트들
const FormulaInputContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: stretch;
`;

const FormulaInput = styled(Input)`
  flex: 1;
  height: 48px;
`;

const FormulaButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const FormulaButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "variant",
})`
  padding: 12px 16px;
  background: ${props => props.variant === "validate" ? "#10b981" : "#3b82f6"};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
  white-space: nowrap;
  height: 48px;

  &:hover:not(:disabled) {
    background: ${props => props.variant === "validate" ? "#059669" : "#2563eb"};
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ValidationResult = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "valid",
})`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: ${props => props.valid ? "#d1fae5" : "#fee2e2"};
  border: 1px solid ${props => props.valid ? "#10b981" : "#ef4444"};
  border-radius: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: ${props => props.valid ? "#065f46" : "#991b1b"};

  .used-variables {
    font-size: 12px;
    margin-top: 4px;
    color: #6b7280;
  }
`;

const TestResult = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "success",
})`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: ${props => props.success ? "#d1fae5" : "#fee2e2"};
  border: 1px solid ${props => props.success ? "#10b981" : "#ef4444"};
  border-radius: 8px;
  margin-top: 8px;
  font-size: 14px;
  color: ${props => props.success ? "#065f46" : "#991b1b"};
`;

const VariablesSection = styled.div`
  margin-top: 16px;
`;

const ExamplesSection = styled.div`
  margin-top: 16px;
`;

const VariablesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #374151;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
`;

const ExamplesHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #374151;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }
`;

// 새로운 모달창 스타일들
const SubModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid #e5e7eb;
`;

const SubModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const SubModalBody = styled.div`
  padding: 32px;
`;

const VariablesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
`;

const VariableItem = styled.div`
  padding: 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #6d28d9;
    background: #f5f3ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(109, 40, 217, 0.15);
  }
`;

const VariableName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #6d28d9;
  margin-bottom: 4px;
`;

const VariableDescription = styled.div`
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
`;

const ExamplesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ExampleItem = styled.div`
  padding: 16px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #6d28d9;
    background: #f5f3ff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(109, 40, 217, 0.15);
  }
`;

const ExampleName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const ExampleFormula = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-family: 'Courier New', monospace;
  background: #f1f5f9;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
`;
