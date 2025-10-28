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
} from "@mdi/js";
import { branchKpiService } from "../../service/branchKpiService";
import { useToast } from "../common/Toast";
import DeleteConfirmModal from "../common/DeleteConfirmModal";

const categories = [
  { code: "SALES", label: "매출", icon: mdiCurrencyUsd },
  { code: "ORDER", label: "주문", icon: mdiPackageVariant },
  { code: "REVIEW", label: "리뷰", icon: mdiStarOutline },
  { code: "INVENTORY", label: "재고", icon: mdiChartBar },
  { code: "ATTENDANCE", label: "출근", icon: mdiAccountGroup },
  { code: "CUSTOMER_SATISFACTION", label: "고객만족", icon: mdiHeartOutline },
  { code: "CUSTOM", label: "커스텀", icon: mdiChartTimelineVariant },
];

const periods = {
  DAILY: "일간",
  WEEKLY: "주간",
  MONTHLY: "월간",
  YEARLY: "연간",
};

const statuses = {
  ACTIVE: "활성",
  ACHIEVED: "달성",
  EXPIRED: "만료",
};

function KPIDetail({ kpi: initialKpi, branchId, onBack, onUpdate }) {
  const { addToast } = useToast();
  const [kpi, setKpi] = useState(initialKpi);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    targetValue: 0,
    unit: "",
    period: "MONTHLY",
    kpiStatus: "ACTIVE",
    description: "",
  });

  useEffect(() => {
    if (kpi) {
      setFormData({
        name: kpi.name || kpi.kpiName || "",
        category: kpi.category || "",
        targetValue: kpi.targetValue || 0,
        unit: kpi.unit || "",
        period: kpi.period || "MONTHLY",
        kpiStatus: kpi.kpiStatus || "ACTIVE",
        description: kpi.description || "",
      });
    }
  }, [kpi]);

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
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updateData = {
        kpiId: kpi.kpiId,
        branchId: kpi.branchId,
        targetValue: formData.targetValue,
        currentValue: kpi.currentValue || 0,
        startDate: kpi.startDate || new Date().toISOString().split("T")[0],
        endDate: kpi.endDate || null,
        kpiStatus: formData.kpiStatus,
      };

      await branchKpiService.updateBranchKpi(kpi.id, updateData);

      // 이름, 설명 등 추가 정보는 별도 처리 필요 (백엔드 API 확인 필요)
      // 일단 기본 정보만 업데이트

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
      name: kpi.name || kpi.kpiName || "",
      category: kpi.category || "",
      targetValue: kpi.targetValue || 0,
      unit: kpi.unit || "",
      period: kpi.period || "MONTHLY",
      kpiStatus: kpi.kpiStatus || "ACTIVE",
      description: kpi.description || "",
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

  const formatValue = (value, unit) => {
    if (unit === "원" || unit === "KRW") {
      return `${Number(value).toLocaleString()}원`;
    }
    return `${Number(value).toLocaleString()}${unit || ""}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const achievementRate = kpi?.achievementRate || 0;
  const isAchieved = achievementRate >= 100;

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
              <TitleText>{kpi?.name || kpi?.kpiName || "KPI 이름"}</TitleText>
              {kpi?.kpiStatus === "ACTIVE" && (
                <Icon path={mdiCheck} size={1} color="#10b981" />
              )}
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

      {/* 달성률 현황 */}
      <AchievementSection>
        <SectionTitle>달성률 현황</SectionTitle>
        <AchievementContent>
          <CurrentValue>
            {formatValue(kpi?.currentValue || 0, kpi?.unit || "")}
          </CurrentValue>
          <TargetValue>
            목표: {formatValue(kpi?.targetValue || 0, kpi?.unit || "")}
          </TargetValue>
          <ProgressContainer>
            <ProgressBar progress={achievementRate} isAchieved={isAchieved} />
            <ProgressText isAchieved={isAchieved}>
              {achievementRate.toFixed(1)}%
            </ProgressText>
          </ProgressContainer>
          <StatusMessageBox isAchieved={isAchieved}>
            {isAchieved
              ? `${kpi?.name || kpi?.kpiName || "KPI"} 목표를 달성했습니다!`
              : `${kpi?.name || kpi?.kpiName || "KPI"} 목표 달성률이 ${achievementRate.toFixed(
                  0
                )}% 입니다. 조금만 더 노력하세요! 💪`}
          </StatusMessageBox>
        </AchievementContent>
      </AchievementSection>

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
            <SettingLabel>목표값</SettingLabel>
            {isEditing ? (
              <Input
                type="number"
                value={formData.targetValue}
                onChange={(e) =>
                  handleInputChange(
                    "targetValue",
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            ) : (
              <SettingValue>
                {formatValue(kpi?.targetValue || 0, kpi?.unit || "")}
              </SettingValue>
            )}
          </SettingItem>

          <SettingItem>
            <SettingLabel>단위</SettingLabel>
            {isEditing ? (
              <Input
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
              />
            ) : (
              <SettingValue>{kpi?.unit || "-"}</SettingValue>
            )}
          </SettingItem>

          <SettingItem>
            <SettingLabel>기간</SettingLabel>
            {isEditing ? (
              <Select
                value={formData.period}
                onChange={(e) => handleInputChange("period", e.target.value)}
              >
                <option value="DAILY">일간</option>
                <option value="WEEKLY">주간</option>
                <option value="MONTHLY">월간</option>
                <option value="YEARLY">연간</option>
              </Select>
            ) : (
              <SettingValue>
                {periods[kpi?.period] || kpi?.period || "-"}
              </SettingValue>
            )}
          </SettingItem>

          <SettingItem>
            <SettingLabel>상태</SettingLabel>
            {isEditing ? (
              <Select
                value={formData.kpiStatus}
                onChange={(e) => handleInputChange("kpiStatus", e.target.value)}
              >
                <option value="ACTIVE">활성</option>
                <option value="ACHIEVED">달성</option>
                <option value="EXPIRED">만료</option>
              </Select>
            ) : (
              <SettingValue>
                {statuses[kpi?.kpiStatus] || kpi?.kpiStatus || "-"}
              </SettingValue>
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
              <MetaValue>{formatDate(kpi?.startDate)}</MetaValue>
            </MetaContent>
          </MetaItem>

          <MetaItem>
            <MetaIcon>
              <Icon path={mdiPencil} size={1} />
            </MetaIcon>
            <MetaContent>
              <MetaLabel>수정일</MetaLabel>
              <MetaValue>{formatDate(kpi?.endDate)}</MetaValue>
            </MetaContent>
          </MetaItem>

          <MetaItem>
            <MetaIcon>
              <Icon path={mdiTarget} size={1} />
            </MetaIcon>
            <MetaContent>
              <MetaLabel>목표일</MetaLabel>
              <MetaValue>{formatDate(kpi?.endDate)}</MetaValue>
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
          itemName={kpi?.name || kpi?.kpiName || "KPI"}
        />
      )}
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

const AchievementSection = styled.div`
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

const AchievementContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CurrentValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
`;

const TargetValue = styled.div`
  font-size: 16px;
  color: #6b7280;
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "progress" && prop !== "isAchieved",
})`
  flex: 1;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${(props) => Math.min(props.progress, 100)}%;
    background: ${(props) => (props.isAchieved ? "#10b981" : "#f59e0b")};
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== "isAchieved",
})`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => (props.isAchieved ? "#10b981" : "#f59e0b")};
  min-width: 60px;
`;

const StatusMessageBox = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isAchieved",
})`
  padding: 16px;
  background: ${(props) => (props.isAchieved ? "#d1fae5" : "#fed7aa")};
  border-radius: 8px;
  font-size: 14px;
  color: ${(props) => (props.isAchieved ? "#065f46" : "#92400e")};
  line-height: 1.6;
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
