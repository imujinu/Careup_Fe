import React, { useState, useEffect, useImperativeHandle } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Icon } from "@mdi/react";
import {
  mdiCashCheck,
  mdiCashRemove,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiAccountCircleOutline,
  mdiPhoneOutline,
  mdiEmailOutline,
  mdiMapMarkerOutline,
  mdiStoreOutline,
  mdiTrendingUp,
  mdiFilterVariant,
} from "@mdi/js";
import {
  fetchAllRoyalties,
  fetchRoyaltyDetail,
  fetchSettlementHistory,
  setSelectedBranchId,
  setFilterStatus,
} from "../../stores/slices/royaltySlice";
import { branchService } from "../../service/branchService";
import { royaltyService } from "../../service/royaltyService";
import { useToast } from "../../components/common/Toast";

const Container = styled.div`
  padding: 0;
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const FilterTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  min-width: 200px;
  height: 42px;
  box-sizing: border-box;

  &:hover {
    border-color: #6b46c1;
  }

  &:focus {
    outline: none;
    border-color: #6b46c1;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;

  ${(props) => {
    switch (props.$status) {
      case "PENDING":
        return "background: #fef3c7; color: #d97706;";
      case "PAID":
        return "background: #dcfce7; color: #16a34a;";
      case "OVERDUE":
        return "background: #fee2e2; color: #dc2626;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const MethodBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: #ede9fe;
  color: #6b46c1;
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background: #f9fafb;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f9fafb;
    cursor: pointer;
  }
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1f2937;
`;

const SummaryCard = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const SummaryItem = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const DetailCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const DetailTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const DetailItem = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #6b46c1;
`;

const DetailLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
`;

const DetailValue = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
`;

const SkeletonLine = styled.div`
  height: ${(props) => props.$height || "20px"};
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 12px;
  animation: loading 1.5s infinite;

  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const LoadingContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
  }).format(value);
};

const getStatusLabel = (status) => {
  const labels = {
    PENDING: "대기",
    PAID: "완료",
    OVERDUE: "연체",
  };
  return labels[status] || status;
};

const getMethodLabel = (method) => {
  const labels = {
    PERCENTAGE: "정률",
    FIXED: "고정",
    AMOUNT: "금액",
  };
  return labels[method] || method;
};

const Royalty = React.forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const {
    allRoyalties,
    settlementHistory,
    royaltyDetail,
    selectedBranchId,
    filterStatus,
    loading,
    error,
  } = useSelector((state) => state.royalty);
  const toast = useToast();

  const [branches, setBranches] = useState([]);
  const [selectedRoyaltyId, setSelectedRoyaltyId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 지점 목록 가져오기
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchService.fetchBranches({ size: 100 });
        setBranches(response.data || []);
      } catch (err) {
        console.error("지점 목록 가져오기 실패:", err);
      }
    };
    fetchBranches();
  }, []);

  // 전체 로열티 조회
  useEffect(() => {
    dispatch(fetchAllRoyalties());
  }, [dispatch]);

  // 선택한 지점의 정산 내역 조회
  useEffect(() => {
    if (selectedBranchId) {
      dispatch(
        fetchSettlementHistory({
          branchId: selectedBranchId,
          status: filterStatus,
        })
      );
    }
  }, [dispatch, selectedBranchId, filterStatus]);

  const handleRowClick = async (royaltyId) => {
    setSelectedRoyaltyId(royaltyId);
    setShowDetail(true);
    await dispatch(fetchRoyaltyDetail(royaltyId));
  };

  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedRoyaltyId(null);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await royaltyService.exportToExcel({
        branchId: selectedBranchId,
        status: filterStatus,
      });

      toast.addToast({
        type: "success",
        title: "다운로드 완료",
        message: "엑셀 파일이 다운로드되었습니다.",
      });
    } catch (error) {
      toast.addToast({
        type: "error",
        title: "다운로드 실패",
        message: error.message || "엑셀 파일 다운로드에 실패했습니다.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportExcel: handleExportExcel,
    isExporting,
  }));

  // 통계 계산
  const calculateStats = () => {
    if (!allRoyalties || allRoyalties.length === 0) {
      return {
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        pendingCount: 0,
        paidCount: 0,
        overdueCount: 0,
      };
    }

    const stats = allRoyalties.reduce(
      (acc, royalty) => {
        acc.totalAmount += royalty.amount || 0;

        if (royalty.settlementStatus === "PENDING") {
          acc.pendingAmount += royalty.amount || 0;
          acc.pendingCount += 1;
        } else if (royalty.settlementStatus === "PAID") {
          acc.paidAmount += royalty.amount || 0;
          acc.paidCount += 1;
        } else if (royalty.settlementStatus === "OVERDUE") {
          acc.overdueAmount += royalty.amount || 0;
          acc.overdueCount += 1;
        }

        return acc;
      },
      {
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        overdueAmount: 0,
        pendingCount: 0,
        paidCount: 0,
        overdueCount: 0,
      }
    );

    return stats;
  };

  const stats = calculateStats();

  if (showDetail && royaltyDetail) {
    return (
      <Container>
        <DetailCard>
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={handleBackToList}
              style={{
                padding: "8px 16px",
                background: "#f3f4f6",
                color: "#6b7280",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ← 목록으로
            </button>
          </div>

          <DetailTitle>로열티 상세 정보</DetailTitle>

          <DetailGrid>
            <DetailItem>
              <DetailLabel>로열티 ID</DetailLabel>
              <DetailValue>{royaltyDetail.royaltyId}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>적용 월</DetailLabel>
              <DetailValue>{royaltyDetail.applicableMonth}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>계산 방식</DetailLabel>
              <DetailValue>
                <MethodBadge>
                  {getMethodLabel(royaltyDetail.calculationMethod)}
                </MethodBadge>
              </DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>로열티 금액</DetailLabel>
              <DetailValue>
                {formatCurrency(royaltyDetail.amount || 0)}
              </DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>마감일</DetailLabel>
              <DetailValue>{royaltyDetail.dueDate}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>정산 상태</DetailLabel>
              <DetailValue>
                <StatusBadge $status={royaltyDetail.settlementStatus}>
                  {getStatusLabel(royaltyDetail.settlementStatus)}
                </StatusBadge>
              </DetailValue>
            </DetailItem>
          </DetailGrid>

          {royaltyDetail.percentage && (
            <DetailItem style={{ marginTop: "16px" }}>
              <DetailLabel>적용 비율</DetailLabel>
              <DetailValue>
                {(royaltyDetail.percentage * 100).toFixed(2)}%
              </DetailValue>
            </DetailItem>
          )}

          {royaltyDetail.fixedAmount && (
            <DetailItem style={{ marginTop: "16px" }}>
              <DetailLabel>고정 금액</DetailLabel>
              <DetailValue>
                {formatCurrency(royaltyDetail.fixedAmount)}
              </DetailValue>
            </DetailItem>
          )}

          {royaltyDetail.paymentDate && (
            <DetailItem style={{ marginTop: "16px" }}>
              <DetailLabel>결제 일시</DetailLabel>
              <DetailValue>
                {format(
                  new Date(royaltyDetail.paymentDate),
                  "yyyy-MM-dd HH:mm",
                  { locale: ko }
                )}
              </DetailValue>
            </DetailItem>
          )}
        </DetailCard>

        <DetailCard>
          <DetailTitle>지점 정보</DetailTitle>

          <DetailGrid>
            <DetailItem>
              <DetailLabel>지점 ID</DetailLabel>
              <DetailValue>{royaltyDetail.branchId}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>지점명</DetailLabel>
              <DetailValue>{royaltyDetail.branchName}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>사업자등록번호</DetailLabel>
              <DetailValue>{royaltyDetail.businessNumber}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>전화번호</DetailLabel>
              <DetailValue>{royaltyDetail.phone}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>이메일</DetailLabel>
              <DetailValue>{royaltyDetail.email}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>주소</DetailLabel>
              <DetailValue>{royaltyDetail.address}</DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>자영업 여부</DetailLabel>
              <DetailValue>
                {royaltyDetail.ownershipType === "YES" ? "자영업" : "직영"}
              </DetailValue>
            </DetailItem>
            <DetailItem>
              <DetailLabel>총 매출</DetailLabel>
              <DetailValue>
                {formatCurrency(royaltyDetail.totalSales || 0)}
              </DetailValue>
            </DetailItem>
          </DetailGrid>
        </DetailCard>
      </Container>
    );
  }

  return (
    <Container>
      <SummaryCard>
        <SummaryItem>
          <SummaryLabel>
            <Icon path={mdiTrendingUp} size={1} />총 로열티 금액
          </SummaryLabel>
          <SummaryValue>{formatCurrency(stats.totalAmount)}</SummaryValue>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>
            <Icon path={mdiAlertCircle} size={1} />
            대기 중
          </SummaryLabel>
          <SummaryValue>{formatCurrency(stats.pendingAmount)}</SummaryValue>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            {stats.pendingCount}건
          </div>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>
            <Icon path={mdiCheckCircle} size={1} />
            완료
          </SummaryLabel>
          <SummaryValue>{formatCurrency(stats.paidAmount)}</SummaryValue>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            {stats.paidCount}건
          </div>
        </SummaryItem>
        <SummaryItem>
          <SummaryLabel>
            <Icon path={mdiCashRemove} size={1} />
            연체
          </SummaryLabel>
          <SummaryValue>{formatCurrency(stats.overdueAmount)}</SummaryValue>
          <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
            {stats.overdueCount}건
          </div>
        </SummaryItem>
      </SummaryCard>

      <FiltersSection>
        <FilterTitle>
          <Icon path={mdiFilterVariant} size={1} />
          필터
        </FilterTitle>
        <FilterRow>
          <Select
            value={selectedBranchId || ""}
            onChange={(e) => {
              const branchId = e.target.value ? Number(e.target.value) : null;
              dispatch(setSelectedBranchId(branchId));
            }}
          >
            <option value="">전체 지점</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branchName || branch.name}
              </option>
            ))}
          </Select>
          <Select
            value={filterStatus || ""}
            onChange={(e) => {
              const status = e.target.value || null;
              dispatch(setFilterStatus(status));
            }}
          >
            <option value="">전체 상태</option>
            <option value="PENDING">대기</option>
            <option value="PAID">완료</option>
            <option value="OVERDUE">연체</option>
          </Select>
        </FilterRow>
      </FiltersSection>

      {loading ? (
        <LoadingContainer>
          <SkeletonLine height="24px" />
          <SkeletonLine height="400px" />
        </LoadingContainer>
      ) : error ? (
        <div style={{ padding: "24px", color: "#dc2626" }}>
          에러가 발생했습니다: {error}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>지점명</TableHeaderCell>
              <TableHeaderCell>적용 월</TableHeaderCell>
              <TableHeaderCell>계산 방식</TableHeaderCell>
              <TableHeaderCell>로열티 금액</TableHeaderCell>
              <TableHeaderCell>마감일</TableHeaderCell>
              <TableHeaderCell>정산 상태</TableHeaderCell>
              <TableHeaderCell>상세</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRoyalties && allRoyalties.length > 0 ? (
              allRoyalties
                .filter((royalty) => {
                  if (selectedBranchId && royalty.branchId !== selectedBranchId)
                    return false;
                  if (filterStatus && royalty.settlementStatus !== filterStatus)
                    return false;
                  return true;
                })
                .map((royalty) => (
                  <TableRow
                    key={royalty.royaltyId}
                    onClick={() => handleRowClick(royalty.royaltyId)}
                  >
                    <TableCell>{royalty.branchName}</TableCell>
                    <TableCell>{royalty.applicableMonth}</TableCell>
                    <TableCell>
                      <MethodBadge>
                        {getMethodLabel(royalty.calculationMethod)}
                      </MethodBadge>
                    </TableCell>
                    <TableCell>{formatCurrency(royalty.amount || 0)}</TableCell>
                    <TableCell>{royalty.dueDate}</TableCell>
                    <TableCell>
                      <StatusBadge $status={royalty.settlementStatus}>
                        {getStatusLabel(royalty.settlementStatus)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>보기</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: "48px",
                    color: "#6b7280",
                  }}
                >
                  로열티 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {selectedBranchId &&
        settlementHistory &&
        settlementHistory.length > 0 && (
          <DetailCard style={{ marginTop: "24px" }}>
            <DetailTitle>정산 내역</DetailTitle>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>적용 월</TableHeaderCell>
                  <TableHeaderCell>계산 방식</TableHeaderCell>
                  <TableHeaderCell>로열티 금액</TableHeaderCell>
                  <TableHeaderCell>마감일</TableHeaderCell>
                  <TableHeaderCell>정산 상태</TableHeaderCell>
                  <TableHeaderCell>결제 일시</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlementHistory.map((history) => (
                  <TableRow key={history.royaltyId}>
                    <TableCell>{history.applicableMonth}</TableCell>
                    <TableCell>
                      <MethodBadge>
                        {getMethodLabel(history.calculationMethod)}
                      </MethodBadge>
                    </TableCell>
                    <TableCell>{formatCurrency(history.amount || 0)}</TableCell>
                    <TableCell>{history.dueDate}</TableCell>
                    <TableCell>
                      <StatusBadge $status={history.settlementStatus}>
                        {getStatusLabel(history.settlementStatus)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      {history.paymentDate
                        ? format(
                            new Date(history.paymentDate),
                            "yyyy-MM-dd HH:mm",
                            { locale: ko }
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DetailCard>
        )}
    </Container>
  );
});

export default Royalty;
