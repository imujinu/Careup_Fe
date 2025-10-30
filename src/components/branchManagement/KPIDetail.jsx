import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon } from "@mdi/react";
import {
  mdiArrowLeft,
  mdiCurrencyUsd,
  mdiPencil,
  mdiDelete,
  mdiCheck,
  mdiClose,
  mdiCalendar,
  mdiCog,
  mdiClockOutline,
  mdiPackageVariant,
  mdiStarOutline,
  mdiChartBar,
  mdiAccountGroup,
  mdiHeartOutline,
  mdiChartTimelineVariant,
  mdiTarget,
  mdiAlertCircle,
  mdiPlay,
  mdiHelpCircle,
  mdiChartLine,
  mdiChevronDown,
} from "@mdi/js";
import { branchKpiService } from "../../service/branchKpiService";
import { useToast } from "../common/Toast";
import DeleteConfirmModal from "../common/DeleteConfirmModal";
import BaseModal from "../common/BaseModal";

const categories = [
  { code: "SALES", label: "매출", icon: mdiCurrencyUsd },
  { code: "ORDER", label: "주문", icon: mdiPackageVariant },
  { code: "REVIEW", label: "리뷰", icon: mdiStarOutline },
  { code: "INVENTORY", label: "재고", icon: mdiChartBar },
  { code: "ATTENDANCE", label: "출근", icon: mdiAccountGroup },
  { code: "CUSTOMER", label: "고객만족", icon: mdiHeartOutline },
  { code: "CUSTOM", label: "커스텀", icon: mdiChartTimelineVariant },
];

const periods = {
  DAILY: "일간",
  WEEKLY: "주간",
  MONTHLY: "월간",
  QUARTERLY: "분기",
  YEARLY: "연간",
};

function KPIDetail({ kpi: initialKpi, branchId, onBack, onUpdate }) {
  const { addToast } = useToast();
  const [kpi, setKpi] = useState(initialKpi);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    periodType: "MONTHLY",
    calculationFormula: "",
  });

  // Formula assist states
  const [variables, setVariables] = useState({});
  const [examples, setExamples] = useState({});
  const [showVariablesModal, setShowVariablesModal] = useState(false);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name || "",
        description: kpi.description || "",
        category: kpi.category || "",
        periodType: kpi.periodType || "MONTHLY",
        calculationFormula: kpi.calculationFormula || "",
      });
    }
  }, [kpi]);

  // Load formula helper data once
  useEffect(() => {
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
      }
    };
    loadFormulaData();
  }, []);

  const fetchKpiDetail = async () => {
    try {
      const data = await branchKpiService.getBranchKpi(kpi.id);
      setKpi(data);
    } catch (error) {
      console.error("KPI 상세 조회 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "KPI 정보를 불러오는데 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset validation/test when formula changes
    if (field === "calculationFormula") {
      setValidationResult(null);
      setTestResult(null);
    }
  };

  // Extract variable tokens from a formula
  const extractVariablesFromFormula = (formula) => {
    if (!formula) return [];
    const tokens = formula.match(/[a-z_]+/g) || [];
    const keywords = new Set([
      "abs","sqrt","sin","cos","log","ceil","floor","max","min",
      "and","or","not",
    ]);
    return Array.from(new Set(tokens.filter((t) => !keywords.has(t))));
  };

  const handleVariableInsert = (variable) => {
    const current = formData.calculationFormula || "";
    const next = current + (current ? " " : "") + variable;
    handleInputChange("calculationFormula", next);
  };

  const handleExampleSelect = (exampleFormula) => {
    handleInputChange("calculationFormula", exampleFormula);
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

    const allowedVariables = Object.keys(variables || {});
    const usedInFormula = extractVariablesFromFormula(formData.calculationFormula);
    const unknownVars = usedInFormula.filter((v) => !allowedVariables.includes(v));
    if (unknownVars.length > 0) {
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
        addToast({ type: "success", title: "성공", message: "유효한 공식입니다.", duration: 3000 });
      } else {
        addToast({ type: "error", title: "오류", message: result.message || "잘못된 공식입니다.", duration: 3000 });
      }
    } catch (error) {
      console.error("공식 검증 실패:", error);
      addToast({ type: "error", title: "오류", message: "공식 검증에 실패했습니다.", duration: 3000 });
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

    if (!validationResult || validationResult?.valid === false) {
      await validateFormula();
      if (!validationResult || validationResult?.valid === false) return;
    }

    setIsTesting(true);
    try {
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
        acc[key] = defaults[key] ?? 1;
        return acc;
      }, {});

      const result = await branchKpiService.testFormula(formData.calculationFormula, testVariables);
      setTestResult(result);
      if (result.success) {
        addToast({ type: "success", title: "성공", message: `계산 결과: ${result.result}` , duration: 3000 });
      } else {
        addToast({ type: "error", title: "오류", message: result.message || "공식 계산에 실패했습니다.", duration: 3000 });
      }
    } catch (error) {
      console.error("공식 테스트 실패:", error);
      addToast({ type: "error", title: "오류", message: "공식 테스트에 실패했습니다.", duration: 3000 });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        periodType: formData.periodType,
        calculationFormula: formData.calculationFormula,
      };

      await branchKpiService.updateBranchKpi(kpi.id, updateData);

      addToast({
        type: "success",
        title: "성공",
        message: "KPI가 수정되었습니다.",
        duration: 3000,
      });

      setIsEditing(false);
      await fetchKpiDetail();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("KPI 수정 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message:
          error.response?.data?.status_message || "KPI 수정에 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await branchKpiService.deleteBranchKpi(kpi.id);
      addToast({
        type: "success",
        title: "성공",
        message: "KPI가 삭제되었습니다.",
        duration: 3000,
      });
      setShowDeleteModal(false);
      if (onBack) onBack();
    } catch (error) {
      console.error("KPI 삭제 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message:
          error.response?.data?.status_message || "KPI 삭제에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: kpi.name || "",
      description: kpi.description || "",
      category: kpi.category || "",
      periodType: kpi.periodType || "MONTHLY",
      calculationFormula: kpi.calculationFormula || "",
    });
    setIsEditing(false);
  };

  const getCategoryIcon = (categoryCode) => {
    const category = categories.find((c) => c.code === categoryCode);
    return category?.icon || mdiChartBar;
  };

  const getCategoryLabel = (categoryCode) => {
    const category = categories.find((c) => c.code === categoryCode);
    return category?.label || categoryCode;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    // LocalDate 형식 (YYYY-MM-DD) 또는 ISO 형식 처리
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // 날짜 파싱 실패 시 원본 반환
      return dateString;
    }
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <Container>
      {/* 헤더 */}
      <HeaderSection>
        <BackButton onClick={onBack}>
          <Icon path={mdiArrowLeft} size={1} />
          목록으로
        </BackButton>
        <HeaderContent>
          <HeaderLeft>
            <HeaderIcon>
              <Icon path={getCategoryIcon(kpi?.category)} size={1.5} />
            </HeaderIcon>
            <HeaderTitle>
              <TitleText>{kpi?.name || "KPI 이름"}</TitleText>
            </HeaderTitle>
            <HeaderDescription>{kpi?.description || "설명"}</HeaderDescription>
          </HeaderLeft>
          <HeaderActions>
            {!isEditing ? (
              <>
                <EditButton onClick={() => setIsEditing(true)}>
                  <Icon path={mdiPencil} size={0.8} />
                  수정
                </EditButton>
                <DeleteButton onClick={() => setShowDeleteModal(true)}>
                  <Icon path={mdiDelete} size={0.8} />
                  삭제
                </DeleteButton>
              </>
            ) : (
              <>
                <CancelButton onClick={handleCancel}>
                  <Icon path={mdiClose} size={0.8} />
                  취소
                </CancelButton>
                <SaveButton onClick={handleSave} disabled={loading}>
                  <Icon path={mdiCheck} size={0.8} />
                  저장
                </SaveButton>
              </>
            )}
          </HeaderActions>
        </HeaderContent>
      </HeaderSection>

      {/* KPI 정보 */}
      <KPISection>
        <SectionTitle>KPI 정보</SectionTitle>
        <KPIContent>
          <KPIInfo>
            <KPIItem>
              <KPILabel>카테고리</KPILabel>
              <KPIValue>{getCategoryLabel(kpi?.category) || "-"}</KPIValue>
            </KPIItem>
            <KPIItem>
              <KPILabel>기간</KPILabel>
              <KPIValue>{periods[kpi?.periodType] || kpi?.periodType || "-"}</KPIValue>
            </KPIItem>
            <KPIItem>
              <KPILabel>계산 공식</KPILabel>
              <KPIValue>{kpi?.calculationFormula || "-"}</KPIValue>
            </KPIItem>
          </KPIInfo>
        </KPIContent>
      </KPISection>

      {/* KPI 설정 */}
      <SettingsSection>
        <SectionTitle>
          <Icon path={mdiCog} size={1} />
          KPI 설정
        </SectionTitle>
        <SettingsGrid>
          <SettingItem>
            <SettingLabel>KPI 이름</SettingLabel>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            ) : (
              <SettingValue>{kpi?.name || "-"}</SettingValue>
            )}
          </SettingItem>

          <SettingItem>
            <SettingLabel>카테고리</SettingLabel>
            {isEditing ? (
              <Select
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.code} value={cat.code}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            ) : (
              <SettingValue>
                {getCategoryLabel(kpi?.category) || "-"}
              </SettingValue>
            )}
          </SettingItem>

          <SettingItem>
            <SettingLabel>기간</SettingLabel>
            {isEditing ? (
              <Select
                value={formData.periodType}
                onChange={(e) => handleInputChange("periodType", e.target.value)}
              >
                <option value="DAILY">일간</option>
                <option value="WEEKLY">주간</option>
                <option value="MONTHLY">월간</option>
                <option value="QUARTERLY">분기</option>
                <option value="YEARLY">연간</option>
              </Select>
            ) : (
              <SettingValue>
                {periods[kpi?.periodType] || kpi?.periodType || "-"}
              </SettingValue>
            )}
          </SettingItem>

          <SettingItem>
            <SettingLabel>계산 공식</SettingLabel>
            {isEditing ? (
              <>
                <FormulaInputContainer>
                  <FormulaInput
                    value={formData.calculationFormula}
                    onChange={(e) => handleInputChange("calculationFormula", e.target.value)}
                    placeholder="예: total_sales / 1000000"
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

                {testResult && (
                  <TestResult success={testResult.success}>
                    <Icon
                      path={testResult.success ? mdiCheck : mdiAlertCircle}
                      size={1}
                      color={testResult.success ? "#10b981" : "#ef4444"}
                    />
                    <span>
                      {testResult.success ? `계산 결과: ${testResult.result}` : testResult.message}
                    </span>
                  </TestResult>
                )}

                <VariablesSection>
                  <VariablesHeader onClick={() => setShowVariablesModal(true)}>
                    <Icon path={mdiHelpCircle} size={1} />
                    <span>사용 가능한 변수</span>
                    <Icon path={mdiChevronDown} size={1} />
                  </VariablesHeader>
                </VariablesSection>

                <ExamplesSection>
                  <ExamplesHeader onClick={() => setShowExamplesModal(true)}>
                    <Icon path={mdiChartLine} size={1} />
                    <span>공식 예제</span>
                    <Icon path={mdiChevronDown} size={1} />
                  </ExamplesHeader>
                </ExamplesSection>
              </>
            ) : (
              <SettingValue>{kpi?.calculationFormula || "-"}</SettingValue>
            )}
          </SettingItem>

          <SettingItem fullWidth>
            <SettingLabel>설명</SettingLabel>
            {isEditing ? (
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
              />
            ) : (
              <SettingValue>{kpi?.description || "-"}</SettingValue>
            )}
          </SettingItem>
        </SettingsGrid>
      </SettingsSection>

      {/* 메타 정보 */}
      <MetaSection>
        <SectionTitle>
          <Icon path={mdiClockOutline} size={1} />
          메타 정보
        </SectionTitle>
        <MetaGrid>
          <MetaItem>
            <MetaIcon>
              <Icon path={mdiCalendar} size={1} />
            </MetaIcon>
            <MetaContent>
              <MetaLabel>생성일</MetaLabel>
              <MetaValue>{formatDate(kpi?.createdAt)}</MetaValue>
            </MetaContent>
          </MetaItem>

          <MetaItem>
            <MetaIcon>
              <Icon path={mdiPencil} size={1} />
            </MetaIcon>
            <MetaContent>
              <MetaLabel>수정일</MetaLabel>
              <MetaValue>{formatDate(kpi?.updatedAt || kpi?.modifiedAt)}</MetaValue>
            </MetaContent>
          </MetaItem>
        </MetaGrid>
      </MetaSection>

      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="KPI 삭제"
          message="해당 KPI를 삭제하시겠습니까?"
          itemName={kpi?.name || "KPI"}
        />
      )}

      {/* 변수 목록 모달 */}
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
              <VariableItem key={key} onClick={() => { handleVariableInsert(key); setShowVariablesModal(false); }}>
                <VariableName>{key}</VariableName>
                <VariableDescription>{description}</VariableDescription>
              </VariableItem>
            ))}
          </VariablesGrid>
        </SubModalBody>
      </BaseModal>

      {/* 공식 예제 모달 */}
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
              <ExampleItem key={name} onClick={() => { handleExampleSelect(formula); setShowExamplesModal(false); }}>
                <ExampleName>{name}</ExampleName>
                <ExampleFormula>{formula}</ExampleFormula>
              </ExampleItem>
            ))}
          </ExamplesList>
        </SubModalBody>
      </BaseModal>
    </Container>
  );
}

export default KPIDetail;

const Container = styled.div`
  padding: 24px;
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
`;

const HeaderLeft = styled.div`
  flex: 1;
`;

const HeaderIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f5f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6d28d9;
  margin-bottom: 16px;
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const TitleText = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const HeaderDescription = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditButton = styled.button`
  padding: 10px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }
`;

const DeleteButton = styled.button`
  padding: 10px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
  }
`;

const CancelButton = styled.button`
  padding: 10px 16px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
  }
`;

const SaveButton = styled.button`
  padding: 10px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #059669;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const KPISection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const KPIContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const KPIInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;

const KPIItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
`;

const KPILabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

const KPIValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const SettingsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
`;

const SettingItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "fullWidth",
})`
  display: flex;
  flex-direction: column;
  gap: 8px;
  ${(props) => props.fullWidth && "grid-column: 1 / -1;"}
`;

const SettingLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

const SettingValue = styled.div`
  font-size: 16px;
  color: #1f2937;
  padding: 12px 0;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
  }
`;

// 공식 관련 스타일 컴포넌트들 (KPIAddModal과 일관 유지)
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
  background: 
    ${props => props.variant === "validate" ? "#10b981" : "#3b82f6"};
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

// Sub modal styles reused
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
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
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
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
  }
`;

const MetaSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
`;

const MetaIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const MetaContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const MetaValue = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
`;
