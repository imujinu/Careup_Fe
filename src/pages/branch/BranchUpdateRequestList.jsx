import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import {
  getBranchUpdateRequests,
  approveBranchUpdateRequest,
  rejectBranchUpdateRequest,
} from "../../service/branchService";
import { useToast } from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";

function BranchUpdateRequestList() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null); // null: 전체, "PENDING": 대기, "APPROVED": 승인, "REJECTED": 거부
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // "approve" or "reject"
    requestId: null,
    requestName: null,
  });

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, currentPage]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBranchUpdateRequests({
        page: currentPage,
        size: 10,
        status: statusFilter,
      });

      // 응답 구조 처리
      const data = response?.data || response || [];
      const pageInfo = {
        currentPage: response?.currentPage ?? currentPage,
        totalPages: response?.totalPages ?? 1,
        totalElements: response?.totalElements ?? data.length,
      };

      setRequests(Array.isArray(data) ? data : []);
      setCurrentPage(pageInfo.currentPage);
      setTotalPages(pageInfo.totalPages);
      setTotalElements(pageInfo.totalElements);
    } catch (err) {
      console.error("지점 수정 요청 목록 조회 실패:", err);
      setError(err.message || "지점 수정 요청 목록을 불러오는데 실패했습니다.");
      addToast({
        type: "error",
        title: "오류",
        message: "지점 수정 요청 목록을 불러오는데 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirmModal.requestId) return;

    try {
      await approveBranchUpdateRequest(confirmModal.requestId);
      
      // Optimistic update: 즉시 로컬 상태 업데이트
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          (req.id === confirmModal.requestId || req.requestId === confirmModal.requestId)
            ? { ...req, status: "APPROVED" }
            : req
        )
      );
      
      addToast({
        type: "success",
        title: "승인 완료",
        message: "지점 수정 요청이 승인되었습니다.",
        duration: 3000,
      });
      setConfirmModal({ isOpen: false, type: null, requestId: null, requestName: null });
      
      // 상태 갱신을 위해 목록 다시 불러오기
      setTimeout(() => {
        fetchRequests();
      }, 500);
    } catch (err) {
      console.error("승인 실패:", err);
      // 실패 시 원래 상태로 복구하기 위해 목록 다시 불러오기
      fetchRequests();
      addToast({
        type: "error",
        title: "오류",
        message: err.response?.data?.status_message || "승인 처리에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const handleReject = async () => {
    if (!confirmModal.requestId) return;

    try {
      await rejectBranchUpdateRequest(confirmModal.requestId);
      
      // Optimistic update: 즉시 로컬 상태 업데이트
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          (req.id === confirmModal.requestId || req.requestId === confirmModal.requestId)
            ? { ...req, status: "REJECTED" }
            : req
        )
      );
      
      addToast({
        type: "success",
        title: "거부 완료",
        message: "지점 수정 요청이 거부되었습니다.",
        duration: 3000,
      });
      setConfirmModal({ isOpen: false, type: null, requestId: null, requestName: null });
      
      // 상태 갱신을 위해 목록 다시 불러오기
      setTimeout(() => {
        fetchRequests();
      }, 500);
    } catch (err) {
      console.error("거부 실패:", err);
      // 실패 시 원래 상태로 복구하기 위해 목록 다시 불러오기
      fetchRequests();
      addToast({
        type: "error",
        title: "오류",
        message: err.response?.data?.status_message || "거부 처리에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const openConfirmModal = (type, requestId, requestName) => {
    setConfirmModal({
      isOpen: true,
      type,
      requestId,
      requestName,
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "대기중",
      APPROVED: "승인됨",
      REJECTED: "거부됨",
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      PENDING: "#f59e0b",
      APPROVED: "#10b981",
      REJECTED: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  if (loading && requests.length === 0) {
    return (
      <Container>
        <Header>
          <Title>지점 수정 요청 관리</Title>
        </Header>
        <LoadingContainer>로딩 중...</LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>지점 수정 요청 관리</Title>
      </Header>

      <Filters>
        <FilterButton
          $active={statusFilter === null}
          onClick={() => {
            setStatusFilter(null);
            setCurrentPage(0);
          }}
        >
          전체 ({totalElements})
        </FilterButton>
        <FilterButton
          $active={statusFilter === "PENDING"}
          onClick={() => {
            setStatusFilter("PENDING");
            setCurrentPage(0);
          }}
        >
          대기중
        </FilterButton>
        <FilterButton
          $active={statusFilter === "APPROVED"}
          onClick={() => {
            setStatusFilter("APPROVED");
            setCurrentPage(0);
          }}
        >
          승인됨
        </FilterButton>
        <FilterButton
          $active={statusFilter === "REJECTED"}
          onClick={() => {
            setStatusFilter("REJECTED");
            setCurrentPage(0);
          }}
        >
          거부됨
        </FilterButton>
      </Filters>

      {error && (
        <ErrorContainer>
          <ErrorMessage>{error}</ErrorMessage>
        </ErrorContainer>
      )}

      {requests.length === 0 ? (
        <EmptyContainer>
          <EmptyMessage>지점 수정 요청이 없습니다.</EmptyMessage>
        </EmptyContainer>
      ) : (
        <>
          <RequestList>
            {requests.map((request) => (
              <RequestCard
                key={request.id || request.requestId}
                onClick={() => navigate(`/branch/update-requests/${request.id || request.requestId}`)}
              >
                <CardHeader>
                  <CardTitle>{request.name || "지점명 없음"}</CardTitle>
                  <StatusBadge $color={getStatusBadgeColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </StatusBadge>
                </CardHeader>
                <CardBody>
                  <InfoRow>
                    <InfoLabel>업종:</InfoLabel>
                    <InfoValue>{request.businessDomain || "-"}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>직영여부:</InfoLabel>
                    <InfoValue>{request.ownershipType === "YES" ? "직영" : "가맹점"}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>주소:</InfoLabel>
                    <InfoValue>
                      {request.address || "-"} {request.addressDetail || ""}
                    </InfoValue>
                  </InfoRow>
                </CardBody>
                {request.status !== "APPROVED" && request.status !== "REJECTED" && (
                  <CardActions onClick={(e) => e.stopPropagation()}>
                    <ApproveButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirmModal("approve", request.id || request.requestId, request.name);
                      }}
                    >
                      승인
                    </ApproveButton>
                    <RejectButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openConfirmModal("reject", request.id || request.requestId, request.name);
                      }}
                    >
                      거부
                    </RejectButton>
                  </CardActions>
                )}
              </RequestCard>
            ))}
          </RequestList>

          {totalPages > 1 && (
            <Pagination>
              <PageButton
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </PageButton>
              <PageInfo>
                {currentPage + 1} / {totalPages}
              </PageInfo>
              <PageButton
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </PageButton>
            </Pagination>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({ isOpen: false, type: null, requestId: null, requestName: null })
        }
        onConfirm={confirmModal.type === "approve" ? handleApprove : handleReject}
        title={
          confirmModal.type === "approve"
            ? "지점 수정 요청 승인"
            : "지점 수정 요청 거부"
        }
        message={
          confirmModal.type === "approve"
            ? `${confirmModal.requestName || "해당 지점"}의 수정 요청을 승인하시겠습니까?`
            : `${confirmModal.requestName || "해당 지점"}의 수정 요청을 거부하시겠습니까?`
        }
        confirmText={confirmModal.type === "approve" ? "승인" : "거부"}
        cancelText="취소"
        confirmColor={confirmModal.type === "approve" ? "#10b981" : "#ef4444"}
      />
    </Container>
  );
}

export default BranchUpdateRequestList;

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Filters = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: ${(props) => (props.$active ? "#111827" : "#ffffff")};
  color: ${(props) => (props.$active ? "#ffffff" : "#374151")};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#111827" : "#f9fafb")};
  }
`;

const RequestList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const RequestCard = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #8b5cf6;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) => props.$color}20;
  color: ${(props) => props.$color};
  border: 1px solid ${(props) => props.$color}40;
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 8px;
  font-size: 14px;
`;

const InfoLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
  min-width: 80px;
`;

const InfoValue = styled.span`
  color: #1f2937;
  flex: 1;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const ApproveButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #10b981;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }
`;

const RejectButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: #ef4444;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f9fafb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 14px;
  color: #6b7280;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  color: #6b7280;
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  padding: 20px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const ErrorMessage = styled.div`
  color: #b91c1c;
  font-size: 14px;
`;

const EmptyContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
`;

const EmptyMessage = styled.div`
  color: #6b7280;
  font-size: 16px;
`;

