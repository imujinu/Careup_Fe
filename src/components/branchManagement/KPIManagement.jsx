import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Icon } from "@mdi/react";
import {
  mdiPlus,
  mdiMagnify,
  mdiChevronDown,
  mdiPencil,
  mdiDelete,
  mdiChartBar,
  mdiCheckCircle,
  mdiTarget,
  mdiChartLine,
  mdiCheck,
  mdiAlertCircle,
  mdiCurrencyUsd,
  mdiPackageVariant,
  mdiStarOutline,
  mdiAccountGroup,
  mdiHeartOutline,
  mdiChartTimelineVariant,
  mdiArrowLeft,
} from "@mdi/js";
import { branchKpiService } from "../../service/branchKpiService";
import { useToast } from "../common/Toast";
import KPIAddModal from "./KPIAddModal";
import DeleteConfirmModal from "../common/DeleteConfirmModal";
import KPIDetail from "./KPIDetail";

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

function KPIManagement({ branchId }) {
  const { addToast } = useToast();
  const [kpis, setKpis] = useState([]);
  const [filteredKpis, setFilteredKpis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'detail'
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 10,
  });

  useEffect(() => {
    if (branchId) {
      fetchKpis();
    }
  }, [branchId]);

  useEffect(() => {
    filterKpis();
  }, [kpis, searchTerm, categoryFilter, statusFilter]);

  const fetchKpis = async () => {
    try {
      setLoading(true);
      const response = await branchKpiService.getBranchKpiList({
        page: pagination.currentPage,
        size: pagination.size,
      });

      if (response?.data) {
        setKpis(response.data);
        setPagination({
          currentPage: response.currentPage || 0,
          totalPages: response.totalPages || 0,
          totalElements: response.totalElements || 0,
          size: response.size || 10,
        });
      } else {
        setKpis([]);
      }
    } catch (error) {
      console.error("KPI 목록 조회 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message: "KPI 목록을 불러오는데 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const filterKpis = () => {
    let filtered = [...kpis];

    if (searchTerm) {
      filtered = filtered.filter(
        (kpi) =>
          (kpi.name || kpi.kpiName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (kpi.description || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "ALL") {
      // category 필터는 백엔드 데이터 구조에 따라 조정 필요
      // filtered = filtered.filter((kpi) => kpi.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((kpi) => kpi.kpiStatus === statusFilter);
    }

    setFilteredKpis(filtered);
  };

  const handleAddKpi = async (formData) => {
    try {
      await branchKpiService.createBranchKpi(formData);
      addToast({
        type: "success",
        title: "성공",
        message: "KPI가 성공적으로 생성되었습니다.",
        duration: 3000,
      });
      setShowAddModal(false);
      fetchKpis();
    } catch (error) {
      console.error("KPI 생성 실패:", error);
      addToast({
        type: "error",
        title: "오류",
        message:
          error.response?.data?.status_message || "KPI 생성에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const handleDeleteKpi = async () => {
    if (!selectedKpi) return;

    try {
      await branchKpiService.deleteBranchKpi(selectedKpi.id);
      addToast({
        type: "success",
        title: "성공",
        message: "KPI가 삭제되었습니다.",
        duration: 3000,
      });
      setShowDeleteModal(false);
      setSelectedKpi(null);
      fetchKpis();
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

  const handleViewDetail = (kpi) => {
    setSelectedKpi(kpi);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setSelectedKpi(null);
    fetchKpis();
  };

  const getCategoryIcon = (categoryCode) => {
    const category = categories.find((c) => c.code === categoryCode);
    return category?.icon || mdiChartBar;
  };

  const calculateStats = () => {
    const total = kpis.length;
    const active = kpis.filter((k) => k.kpiStatus === "ACTIVE").length;
    const achieved = kpis.filter((k) => k.kpiStatus === "ACHIEVED").length;
    const avgAchievement =
      kpis.length > 0
        ? (
            kpis.reduce((sum, k) => sum + (k.achievementRate || 0), 0) /
            kpis.length
          ).toFixed(1)
        : 0;

    return { total, active, achieved, avgAchievement };
  };

  const stats = calculateStats();

  if (viewMode === "detail" && selectedKpi) {
    return (
      <KPIDetail
        kpi={selectedKpi}
        branchId={branchId}
        onBack={handleBackToList}
        onUpdate={fetchKpis}
      />
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingMessage>로딩 중...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      {/* 요약 카드 */}
      <SummaryCards>
        <SummaryCard>
          <CardIcon color="#6d28d9">
            <Icon path={mdiChartBar} size={1.5} />
          </CardIcon>
          <CardContent>
            <CardLabel>전체 KPI</CardLabel>
            <CardValue>{stats.total}</CardValue>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon color="#10b981">
            <Icon path={mdiCheckCircle} size={1.5} />
          </CardIcon>
          <CardContent>
            <CardLabel>활성 KPI</CardLabel>
            <CardValue>{stats.active}</CardValue>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon color="#6d28d9">
            <Icon path={mdiTarget} size={1.5} />
          </CardIcon>
          <CardContent>
            <CardLabel>달성률</CardLabel>
            <CardValue>{stats.avgAchievement}%</CardValue>
          </CardContent>
        </SummaryCard>

        <SummaryCard>
          <CardIcon color="#6d28d9">
            <Icon path={mdiChartLine} size={1.5} />
          </CardIcon>
          <CardContent>
            <CardLabel>완료</CardLabel>
            <CardValue>{stats.achieved}</CardValue>
          </CardContent>
        </SummaryCard>
      </SummaryCards>

      {/* 검색 및 필터 */}
      <FilterSection>
        <SearchContainer>
          <SearchIcon>
            <Icon path={mdiMagnify} size={1} />
          </SearchIcon>
          <SearchInput
            placeholder="Q KPI 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>

        <FilterSelect
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="ALL">전체 카테고리</option>
          {categories.map((cat) => (
            <option key={cat.code} value={cat.code}>
              {cat.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="ACHIEVED">달성</option>
          <option value="EXPIRED">만료</option>
        </FilterSelect>

        <AddButton onClick={() => setShowAddModal(true)}>
          <Icon path={mdiPlus} size={1} />
          KPI 추가
        </AddButton>
      </FilterSection>

      {/* KPI 카드 리스트 */}
      <KPICardsGrid>
        {filteredKpis.length === 0 ? (
          <EmptyState>
            <Icon path={mdiTarget} size={3} color="#9ca3af" />
            <EmptyText>등록된 KPI가 없습니다.</EmptyText>
            <EmptySubtext>새 KPI를 추가하여 시작하세요.</EmptySubtext>
          </EmptyState>
        ) : (
          filteredKpis.map((kpi) => (
            <KPICard key={kpi.id}>
              <CardHeader>
                <CardIconSmall color="#6d28d9">
                  <Icon path={getCategoryIcon(kpi.category)} size={1.2} />
                </CardIconSmall>
                <CardTitleContainer>
                  <CardTitle>{kpi.name || kpi.kpiName || "KPI 이름"}</CardTitle>
                  {kpi.kpiStatus === "ACTIVE" && (
                    <Icon path={mdiCheck} size={0.8} color="#10b981" />
                  )}
                </CardTitleContainer>
                <CardActions>
                  <ActionButton
                    onClick={() => handleViewDetail(kpi)}
                    color="#10b981"
                  >
                    <Icon path={mdiPencil} size={1} />
                    수정
                  </ActionButton>
                  <ActionButton
                    onClick={() => {
                      setSelectedKpi(kpi);
                      setShowDeleteModal(true);
                    }}
                    color="#ef4444"
                  >
                    <Icon path={mdiDelete} size={1} />
                    삭제
                  </ActionButton>
                </CardActions>
              </CardHeader>

              <CardBody>
                <CurrentValue>
                  {formatValue(kpi.currentValue || 0, kpi.unit || "")}
                </CurrentValue>
                <TargetValue>
                  목표: {formatValue(kpi.targetValue || 0, kpi.unit || "")}
                </TargetValue>

                <ProgressBarContainer>
                  <ProgressBar
                    progress={kpi.achievementRate || 0}
                    isAchieved={(kpi.achievementRate || 0) >= 100}
                  />
                  <ProgressText isAchieved={(kpi.achievementRate || 0) >= 100}>
                    {kpi.achievementRate?.toFixed(1) || 0}%
                  </ProgressText>
                </ProgressBarContainer>

                <KPIMeta>
                  <MetaItem>
                    <MetaLabel>기간:</MetaLabel>
                    <MetaValue>
                      {periods[kpi.period] || kpi.period || "월간"}
                    </MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>설명:</MetaLabel>
                    <MetaValue>{kpi.description || "-"}</MetaValue>
                  </MetaItem>
                </KPIMeta>

                <StatusMessage isAchieved={(kpi.achievementRate || 0) >= 100}>
                  {(kpi.achievementRate || 0) >= 100
                    ? `${kpi.name || kpi.kpiName || "KPI"} 목표를 달성했습니다!`
                    : `${kpi.name || kpi.kpiName || "KPI"} 목표 달성률이 ${(
                        kpi.achievementRate || 0
                      ).toFixed(0)}% 입니다. 조금만 더 노력하세요! 💪`}
                </StatusMessage>
              </CardBody>
            </KPICard>
          ))
        )}
      </KPICardsGrid>

      {showAddModal && (
        <KPIAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddKpi}
          branchId={branchId}
        />
      )}

      {showDeleteModal && selectedKpi && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedKpi(null);
          }}
          onConfirm={handleDeleteKpi}
          title="KPI 삭제"
          message="해당 KPI를 삭제하시겠습니까?"
          itemName={selectedKpi.name || selectedKpi.kpiName || "KPI"}
        />
      )}
    </Container>
  );
}

const formatValue = (value, unit) => {
  if (unit === "원" || unit === "KRW") {
    return `${Number(value).toLocaleString()}원`;
  }
  return `${Number(value).toLocaleString()}${unit || ""}`;
};

export default KPIManagement;

const Container = styled.div`
  padding: 24px;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const CardIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "color",
})`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${(props) => `${props.color}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.color};
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
`;

const CardValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 300px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #6d28d9;
    box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 150px;
`;

const AddButton = styled.button`
  padding: 12px 24px;
  background: #6d28d9;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: #5b21b6;
  }
`;

const KPICardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
`;

const KPICard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const CardIconSmall = styled(CardIcon)`
  width: 40px;
  height: 40px;
`;

const CardTitleContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== "color",
})`
  padding: 8px 12px;
  background: ${(props) => props.color};
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

  &:hover {
    opacity: 0.9;
  }
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CurrentValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
`;

const TargetValue = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const ProgressBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ProgressBar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "progress" && prop !== "isAchieved",
})`
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
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
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => (props.isAchieved ? "#10b981" : "#f59e0b")};
  min-width: 50px;
`;

const KPIMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetaItem = styled.div`
  display: flex;
  gap: 8px;
`;

const MetaLabel = styled.span`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const MetaValue = styled.span`
  font-size: 13px;
  color: #374151;
`;

const StatusMessage = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isAchieved",
})`
  padding: 12px;
  background: ${(props) => (props.isAchieved ? "#d1fae5" : "#fed7aa")};
  border-radius: 8px;
  font-size: 13px;
  color: ${(props) => (props.isAchieved ? "#065f46" : "#92400e")};
  line-height: 1.5;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
`;

const EmptyText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-top: 16px;
`;

const EmptySubtext = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-top: 8px;
`;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #6b7280;
`;
