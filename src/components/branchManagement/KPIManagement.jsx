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
  mdiTrendingUp,
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
    first: true,
    last: false,
  });

  useEffect(() => {
    fetchKpis();
  }, [pagination.currentPage]);

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

      // API 응답 구조: response.data.result 또는 response.result
      const result = response?.data || response?.result || response;
      
      if (result?.data && Array.isArray(result.data)) {
        setKpis(result.data);
        setPagination({
          currentPage: result.currentPage ?? 0,
          totalPages: result.totalPages ?? 0,
          totalElements: result.totalElements ?? 0,
          size: result.size ?? 10,
          first: result.first ?? false,
          last: result.last ?? false,
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
      filtered = filtered.filter((kpi) => kpi.category === categoryFilter);
    }

    if (statusFilter !== "ALL") {
      // 상태 필터링은 필요시 구현
      // filtered = filtered.filter((kpi) => kpi.kpiStatus === statusFilter);
    }

    setFilteredKpis(filtered);
  };

  const handleAddKpi = async (formData) => {
    console.log("[KPIManagement] handleAddKpi called with:", formData);
    try {
      const response = await branchKpiService.createBranchKpi(formData);
      console.log("[KPIManagement] KPI creation response:", response);
      addToast({
        type: "success",
        title: "성공",
        message: "KPI가 성공적으로 생성되었습니다.",
        duration: 3000,
      });
      setShowAddModal(false);
      await fetchKpis();
    } catch (error) {
      console.error("KPI 생성 실패:", error);
      console.error("KPI 생성 실패 상세:", error.response?.data);
      addToast({
        type: "error",
        title: "오류",
        message:
          error.response?.data?.status_message || "KPI 생성에 실패했습니다.",
        duration: 3000,
      });
      throw error; // 에러를 다시 throw하여 KPIAddModal에서도 처리 가능하도록
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

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleFirstPage = () => {
    handlePageChange(0);
  };

  const handleLastPage = () => {
    handlePageChange(pagination.totalPages - 1);
  };

  const handlePrevPage = () => {
    if (pagination.currentPage > 0) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.currentPage < pagination.totalPages - 1) {
      handlePageChange(pagination.currentPage + 1);
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

  const getStatusMessage = (kpi) => {
    const achievementRate = kpi.averageAchievementRate || 0;
    const achievedCount = kpi.achievedBranchCount || 0;
    const totalCount = kpi.totalBranchCount || 0;
    const activeCount = kpi.activeBranchCount || 0;

    if (achievementRate >= 100) {
      return `${kpi.name || "KPI"} 목표를 달성했습니다!`;
    } else if (achievementRate >= 80) {
      return `${kpi.name || "KPI"} 목표 달성률이 80% 이상입니다. 조금만 더 노력하세요!`;
    } else {
      return `${kpi.name || "KPI"} 목표 달성을 위해 더 노력이 필요합니다.`;
    }
  };

  const formatNumber = (num) => {
    if (num == null) return "-";
    return num.toLocaleString("ko-KR");
  };

  const calculateStats = () => {
    const total = kpis.length;
    const active = kpis.reduce((sum, k) => sum + (k.activeBranchCount || 0), 0);
    const achieved = kpis.reduce((sum, k) => sum + (k.achievedBranchCount || 0), 0);
    const avgAchievement =
      kpis.length > 0
        ? (
            kpis.reduce((sum, k) => sum + (k.averageAchievementRate || 0), 0) /
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

        <AddButton onClick={() => {
          console.log("[KPIManagement] Add button clicked");
          setShowAddModal(true);
        }}>
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
                  <CardTitle>{kpi.name || "KPI 이름"}</CardTitle>
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
                {/* 통계 정보 */}
                <StatSection>
                  <StatValue>
                    달성 {formatNumber(kpi.achievedBranchCount || 0)} 지점
                  </StatValue>
                  <StatTarget>
                    목표 {formatNumber(kpi.totalBranchCount || 0)} 지점
                  </StatTarget>
                </StatSection>

                {/* 진행률 바 */}
                <ProgressSection>
                  <ProgressBarContainer>
                    <ProgressBar
                      percentage={Math.min(
                        ((kpi.achievedBranchCount || 0) / (kpi.totalBranchCount || 1)) * 100,
                        100
                      )}
                    />
                  </ProgressBarContainer>
                  <ProgressPercentage>
                    {(
                      ((kpi.achievedBranchCount || 0) / (kpi.totalBranchCount || 1)) * 100
                    ).toFixed(1)}%
                    <TrendIcon>
                      <Icon path={mdiTrendingUp} size={0.8} />
                    </TrendIcon>
                  </ProgressPercentage>
                </ProgressSection>

                {/* 기간 및 평균 달성률 */}
                <InfoSection>
                  <PeriodBadge>
                    {periods[kpi.periodType] || kpi.periodType || "월간"}
                  </PeriodBadge>
                  <AvgRate>
                    평균 달성률: {(kpi.averageAchievementRate || 0).toFixed(1)}%
                  </AvgRate>
                </InfoSection>

                {/* 상태 정보 */}
                <StatusInfo>
                  달성 {kpi.achievedBranchCount || 0} / 진행중 {kpi.activeBranchCount || 0} / 전체 {kpi.totalBranchCount || 0}
                </StatusInfo>

                {/* 상태 메시지 */}
                <StatusMessage>
                  {getStatusMessage(kpi)}
                </StatusMessage>
              </CardBody>
            </KPICard>
          ))
        )}
      </KPICardsGrid>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <PaginationContainer>
          <PaginationInfo>
            총 {pagination.totalElements}개 중 {pagination.currentPage * pagination.size + 1}-{Math.min((pagination.currentPage + 1) * pagination.size, pagination.totalElements)}개 표시
          </PaginationInfo>
          <PaginationButtons>
            <PaginationButton
              onClick={handleFirstPage}
              disabled={pagination.first}
            >
              첫 페이지
            </PaginationButton>
            <PaginationButton
              onClick={handlePrevPage}
              disabled={pagination.first}
            >
              이전
            </PaginationButton>
            <PageNumber>
              {pagination.currentPage + 1} / {pagination.totalPages}
            </PageNumber>
            <PaginationButton
              onClick={handleNextPage}
              disabled={pagination.last}
            >
              다음
            </PaginationButton>
            <PaginationButton
              onClick={handleLastPage}
              disabled={pagination.last}
            >
              마지막 페이지
            </PaginationButton>
          </PaginationButtons>
        </PaginationContainer>
      )}

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
          itemName={selectedKpi.name || "KPI"}
        />
      )}
    </Container>
  );
}

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

const StatSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const StatTarget = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const ProgressSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const ProgressBarContainer = styled.div`
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressBar = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "percentage",
})`
  height: 100%;
  background: linear-gradient(90deg, #6d28d9 0%, #8b5cf6 100%);
  width: ${(props) => props.percentage}%;
  transition: width 0.3s ease;
  border-radius: 4px;
`;

const ProgressPercentage = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
`;

const TrendIcon = styled.span`
  color: #10b981;
  display: flex;
  align-items: center;
`;

const InfoSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PeriodBadge = styled.span`
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const AvgRate = styled.div`
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
`;

const StatusInfo = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
`;

const StatusMessage = styled.div`
  padding: 12px;
  background: #d1fae5;
  border-radius: 8px;
  font-size: 13px;
  color: #065f46;
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


const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PaginationInfo = styled.div`
  font-size: 14px;
  color: #6b7280;
`;

const PaginationButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PaginationButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.disabled ? '#f3f4f6' : '#6d28d9'};
  color: ${props => props.disabled ? '#9ca3af' : 'white'};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #5b21b6;
  }
`;

const PageNumber = styled.div`
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  min-width: 80px;
  text-align: center;
`;
