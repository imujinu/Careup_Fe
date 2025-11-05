import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useParams, useNavigate } from "react-router-dom";
import {
  getBranchUpdateRequest,
  approveBranchUpdateRequest,
  rejectBranchUpdateRequest,
  getBranchDetail,
} from "../../service/branchService";
import { useToast } from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import BaseModal from "../../components/common/BaseModal";

function BranchUpdateRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [request, setRequest] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // "approve" or "reject"
  });

  useEffect(() => {
    if (requestId) {
      fetchRequestDetail();
    } else {
      setError("요청 ID가 올바르지 않습니다.");
      setLoading(false);
    }
  }, [requestId]);

  const fetchRequestDetail = async () => {
    if (!requestId) {
      setError("요청 ID가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const requestData = await getBranchUpdateRequest(requestId);
      setRequest(requestData);

      // 현재 지점 정보도 조회 (비교를 위해)
      // requestData에 branchId가 있다고 가정
      if (requestData.branchId) {
        try {
          const branchData = await getBranchDetail(requestData.branchId);
          setCurrentBranch(branchData);
        } catch (err) {
          console.warn("현재 지점 정보 조회 실패:", err);
        }
      }
    } catch (err) {
      console.error("지점 수정 요청 상세 조회 실패:", err);
      setError(err.message || "지점 수정 요청 상세 정보를 불러오는데 실패했습니다.");
      addToast({
        type: "error",
        title: "오류",
        message: "지점 수정 요청 상세 정보를 불러오는데 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!requestId) {
      addToast({
        type: "error",
        title: "오류",
        message: "요청 ID가 올바르지 않습니다.",
        duration: 3000,
      });
      return;
    }

    try {
      await approveBranchUpdateRequest(requestId);
      
      // Optimistic update: 즉시 로컬 상태 업데이트
      setRequest((prevRequest) => 
        prevRequest ? { ...prevRequest, status: "APPROVED" } : prevRequest
      );
      
      addToast({
        type: "success",
        title: "승인 완료",
        message: "지점 수정 요청이 승인되었습니다.",
        duration: 3000,
      });
      setConfirmModal({ isOpen: false, type: null });
      
      // 상태 갱신을 위해 상세 정보 다시 불러오기
      setTimeout(() => {
        fetchRequestDetail();
      }, 500);
    } catch (err) {
      console.error("승인 실패:", err);
      addToast({
        type: "error",
        title: "오류",
        message: err.response?.data?.status_message || "승인 처리에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const handleReject = async () => {
    if (!requestId) {
      addToast({
        type: "error",
        title: "오류",
        message: "요청 ID가 올바르지 않습니다.",
        duration: 3000,
      });
      return;
    }

    try {
      await rejectBranchUpdateRequest(requestId);
      
      // Optimistic update: 즉시 로컬 상태 업데이트
      setRequest((prevRequest) => 
        prevRequest ? { ...prevRequest, status: "REJECTED" } : prevRequest
      );
      
      addToast({
        type: "success",
        title: "거부 완료",
        message: "지점 수정 요청이 거부되었습니다.",
        duration: 3000,
      });
      setConfirmModal({ isOpen: false, type: null });
      
      // 상태 갱신을 위해 상세 정보 다시 불러오기
      setTimeout(() => {
        fetchRequestDetail();
      }, 500);
    } catch (err) {
      console.error("거부 실패:", err);
      addToast({
        type: "error",
        title: "오류",
        message: err.response?.data?.status_message || "거부 처리에 실패했습니다.",
        duration: 3000,
      });
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "예" : "아니오";
    return String(value);
  };

  const getFieldLabel = (key) => {
    const labels = {
      name: "지점명",
      businessDomain: "업종",
      ownershipType: "직영여부",
      openDate: "개업연월",
      businessNumber: "사업자등록번호",
      corporationNumber: "법인등록번호",
      zipcode: "우편번호",
      address: "주소",
      addressDetail: "상세 주소",
      phone: "전화번호",
      email: "이메일",
      latitude: "위도",
      longitude: "경도",
      geofenceRadius: "출퇴근 가능 반경(미터)",
      remark: "비고",
      attorneyName: "대리인명",
      attorneyPhoneNumber: "대리인 연락처",
    };
    return labels[key] || key;
  };

  const getFieldValue = (key, value) => {
    if (key === "ownershipType") {
      return value === "YES" ? "직영" : value === "NO" ? "가맹점" : value;
    }
    if (key === "openDate" && value) {
      return value.split("T")[0];
    }
    return formatValue(value);
  };

  const getChangedFields = () => {
    if (!request || !currentBranch) return [];

    const fields = [
      "name",
      "businessDomain",
      "ownershipType",
      "openDate",
      "businessNumber",
      "corporationNumber",
      "zipcode",
      "address",
      "addressDetail",
      "phone",
      "email",
      "latitude",
      "longitude",
      "geofenceRadius",
      "remark",
      "attorneyName",
      "attorneyPhoneNumber",
    ];

    return fields
      .map((key) => {
        const currentValue = currentBranch[key];
        const requestValue = request[key];
        const hasChanged =
          formatValue(currentValue) !== formatValue(requestValue);
        return {
          key,
          label: getFieldLabel(key),
          current: getFieldValue(key, currentValue),
          requested: getFieldValue(key, requestValue),
          changed: hasChanged,
        };
      })
      .filter((field) => field.changed);
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate("/branch/update-requests")}>
            ← 목록으로
          </BackButton>
          <Title>지점 수정 요청 상세</Title>
        </Header>
        <LoadingContainer>로딩 중...</LoadingContainer>
      </Container>
    );
  }

  if (error || !request) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate("/branch/update-requests")}>
            ← 목록으로
          </BackButton>
          <Title>지점 수정 요청 상세</Title>
        </Header>
        <ErrorContainer>
          <ErrorMessage>{error || "지점 수정 요청을 찾을 수 없습니다."}</ErrorMessage>
        </ErrorContainer>
      </Container>
    );
  }

  const changedFields = getChangedFields();
  const isPending = request.status !== "APPROVED" && request.status !== "REJECTED";

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate("/branch/update-requests")}>
          ← 목록으로
        </BackButton>
        <Title>지점 수정 요청 상세</Title>
      </Header>

      <Content>
        <Section>
          <SectionTitle>기본 정보</SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>지점명</InfoLabel>
              <InfoValue>{request.name || "-"}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>상태</InfoLabel>
              <StatusBadge $status={request.status || "PENDING"}>
                {request.status === "PENDING" || !request.status || request.status === null
                  ? "대기중"
                  : request.status === "APPROVED"
                  ? "승인됨"
                  : request.status === "REJECTED"
                  ? "거부됨"
                  : request.status || "대기중"}
              </StatusBadge>
            </InfoItem>
          </InfoGrid>
        </Section>

        {changedFields.length > 0 && (
          <Section>
            <SectionTitle>변경 사항</SectionTitle>
            <ChangesList>
              {changedFields.map((field) => (
                <ChangeItem key={field.key}>
                  <ChangeLabel>{field.label}</ChangeLabel>
                  <ChangeValues>
                    <ChangeValue>
                      <ChangeValueLabel>현재</ChangeValueLabel>
                      <ChangeValueText $isCurrent>{field.current}</ChangeValueText>
                    </ChangeValue>
                    <ChangeArrow>→</ChangeArrow>
                    <ChangeValue>
                      <ChangeValueLabel>요청</ChangeValueLabel>
                      <ChangeValueText $isRequest>{field.requested}</ChangeValueText>
                    </ChangeValue>
                  </ChangeValues>
                </ChangeItem>
              ))}
            </ChangesList>
          </Section>
        )}

        {changedFields.length === 0 && (
          <Section>
            <SectionTitle>변경 사항 없음</SectionTitle>
            <EmptyMessage>변경된 필드가 없습니다.</EmptyMessage>
          </Section>
        )}

        <Section>
          <SectionTitle>요청 상세 정보</SectionTitle>
          <DetailGrid>
            {Object.keys(request).map((key) => {
              if (
                key === "id" ||
                key === "status" ||
                key === "branchId" ||
                key === "requestId" ||
                key === "createdAt" ||
                key === "updatedAt" ||
                key === "requesterId" ||
                key === "branchName" ||
                key === "approverId"
              )
                return null;
              return (
                <InfoItem key={key}>
                  <InfoLabel>{getFieldLabel(key)}</InfoLabel>
                  <InfoValue>{getFieldValue(key, request[key])}</InfoValue>
                </InfoItem>
              );
            })}
          </DetailGrid>
        </Section>

        {isPending && (
          <Actions>
            <ApproveButton onClick={() => setConfirmModal({ isOpen: true, type: "approve" })}>
              승인
            </ApproveButton>
            <RejectButton onClick={() => setConfirmModal({ isOpen: true, type: "reject" })}>
              거부
            </RejectButton>
          </Actions>
        )}
      </Content>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null })}
        onConfirm={confirmModal.type === "approve" ? handleApprove : handleReject}
        title={
          confirmModal.type === "approve"
            ? "지점 수정 요청 승인"
            : "지점 수정 요청 거부"
        }
        message={
          confirmModal.type === "approve"
            ? `${request.name || "해당 지점"}의 수정 요청을 승인하시겠습니까?`
            : `${request.name || "해당 지점"}의 수정 요청을 거부하시겠습니까?`
        }
        confirmText={confirmModal.type === "approve" ? "승인" : "거부"}
        cancelText="취소"
        confirmColor={confirmModal.type === "approve" ? "#10b981" : "#ef4444"}
      />
    </Container>
  );
}

export default BranchUpdateRequestDetail;

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
`;

const BackButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div`
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: #1f2937;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  background: ${(props) =>
    props.$status === "PENDING"
      ? "#f59e0b20"
      : props.$status === "APPROVED"
      ? "#10b98120"
      : "#ef444420"};
  color: ${(props) =>
    props.$status === "PENDING"
      ? "#f59e0b"
      : props.$status === "APPROVED"
      ? "#10b981"
      : "#ef4444"};
  border: 1px solid
    ${(props) =>
      props.$status === "PENDING"
        ? "#f59e0b40"
        : props.$status === "APPROVED"
        ? "#10b98140"
        : "#ef444440"};
`;

const ChangesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ChangeItem = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const ChangeLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
`;

const ChangeValues = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ChangeValue = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ChangeValueLabel = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const ChangeValueText = styled.span`
  font-size: 14px;
  color: ${(props) => (props.$isCurrent ? "#6b7280" : "#1f2937")};
  font-weight: ${(props) => (props.$isRequest ? "600" : "400")};
  padding: 8px 12px;
  background: ${(props) => (props.$isRequest ? "#dbeafe" : "#f3f4f6")};
  border-radius: 6px;
`;

const ChangeArrow = styled.span`
  font-size: 20px;
  color: #8b5cf6;
  font-weight: bold;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
`;

const ApproveButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #10b981;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #059669;
  }
`;

const RejectButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #ef4444;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
  }
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
`;

const ErrorMessage = styled.div`
  color: #b91c1c;
  font-size: 14px;
`;

const EmptyMessage = styled.div`
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  padding: 20px;
`;

