import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../stores/hooks";
import { getMyBranch, requestBranchUpdate } from "../../service/branchService";
import BranchDetailHeader from "../../components/branchManagement/BranchDetailHeader";
import BranchDetailTabs from "../../components/branchManagement/BranchDetailTabs";
import BranchDetailModal from "../../components/branchManagement/BranchDetailModal";
import BranchEditRequestModal from "../../components/branchManagement/BranchEditRequestModal";
import { useToast } from "../../components/common/Toast";
import InfoModal from "../../components/common/InfoModal";
import styled from "styled-components";

function MyBranchDetail() {
  const { branchId, userType, role: rawRole } = useAppSelector((state) => state.auth);
  const role = String(rawRole || "").replace(/^ROLE_/, "").toUpperCase();
  const isStaffReadOnly = role === "STAFF";
  const { addToast } = useToast();
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (branchId) {
      fetchMyBranch();
    }
  }, [branchId]);

  const fetchMyBranch = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyBranch();

      // MyBranchDto를 기존 BranchDto 형식으로 변환
      const transformedData = {
        id: data.branchId,
        name: data.branchName,
        businessDomain: data.businessDomain,
        ownershipType: data.ownershipType,
        status: data.status,
        openDate: data.openDate,
        phone: data.phone,
        businessNumber: data.businessNumber,
        corporationNumber: data.corporationNumber,
        zipcode: data.zipcode,
        address: data.address,
        addressDetail: data.addressDetail,
        profileImageUrl: data.profileImageUrl,
        email: data.email,
        geofenceRadius: data.geofenceRadius,
        latitude: data.latitude,
        longitude: data.longitude,
        remark: data.remark,
        attorneyName:
          data.attorneyName || data.ownerInfo?.name || "지점장 정보 없음",
        attorneyPhoneNumber:
          data.attorneyPhoneNumber || data.ownerInfo?.mobile || "연락처 없음",
        ownerInfo: data.ownerInfo, // 점주 정보도 함께 전달
      };

      setBranchData(transformedData);
    } catch (err) {
      console.error("내 지점 정보 조회 실패:", err);
      setError("지점 정보를 불러오는데 실패했습니다.");
      addToast({
        type: "error",
        title: "오류",
        message: "지점 정보를 불러오는데 실패했습니다.",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = () => {
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
  };

  const handleShowEditModal = () => {
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  const handleEditRequest = async (updatedData, profileImage) => {
    try {
      await requestBranchUpdate(updatedData, profileImage);
      setShowEditModal(false);
      setShowSuccessModal(true);
      fetchMyBranch(); // 데이터 갱신
    } catch (err) {
      console.error("수정 요청 실패:", err);
      addToast({
        type: "error",
        title: "오류",
        message: "수정 요청에 실패했습니다. 다시 시도해주세요.",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>로딩 중...</LoadingSpinner>
      </Container>
    );
  }

  if (error || !branchData) {
    return (
      <Container>
        <ErrorMessage>
          <h3>오류가 발생했습니다</h3>
          <p>{error || "지점 정보를 찾을 수 없습니다."}</p>
        </ErrorMessage>
      </Container>
    );
  }

  return (
    <Container>
      <BranchDetailHeader
        branch={branchData}
        onShowDetail={handleShowDetail}
        onEdit={handleShowEditModal}
        showEditButton={true}
        userType={userType}
      />

      <BranchDetailTabs 
        branchId={branchData.id || branchData.branchId} 
        branch={branchData} 
        userType={userType} 
        readOnly={isStaffReadOnly}
      />

      {showDetailModal && (
        <BranchDetailModal
          branch={branchData}
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
        />
      )}

      {showEditModal && (
        <BranchEditRequestModal
          branch={branchData}
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onSubmit={handleEditRequest}
        />
      )}

      {showSuccessModal && (
        <InfoModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="수정 요청 완료"
          message="본사에 수정 요청이 성공적으로 전송되었습니다. 승인까지 기다려주시기 바랍니다."
          buttonText="확인"
          buttonColor="#10b981"
        />
      )}
    </Container>
  );
}

export default MyBranchDetail;

const Container = styled.div`
  min-height: 100vh;
  background-color: #f8fafc;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;

  h3 {
    color: #dc2626;
    margin-bottom: 16px;
  }

  p {
    color: #6b7280;
    margin-bottom: 24px;
  }
`;
