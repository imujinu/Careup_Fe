import axios from "../utils/axiosConfig";

const ROYALTY_API_BASE_URL = import.meta.env.VITE_BRANCH_URL;

// 엑셀 파일 다운로드 헬퍼 함수
const downloadExcelFile = async (url, fileName) => {
  const response = await axios.get(url, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
};

export const royaltyService = {
  // 전체 로열티 조회
  getAllRoyalties: async () => {
    const response = await axios.get(`${ROYALTY_API_BASE_URL}/royalties`);
    return response.data.result || response.data;
  },

  // 로열티 상세 조회
  getRoyaltyDetail: async (royaltyId) => {
    const response = await axios.get(
      `${ROYALTY_API_BASE_URL}/royalties/${royaltyId}`
    );
    return response.data.result || response.data;
  },

  // 선택한 가맹점의 정산 내역 조회 (전체)
  getSettlementHistory: async (branchId) => {
    const response = await axios.get(
      `${ROYALTY_API_BASE_URL}/royalties/branches/${branchId}/settlements`
    );
    return response.data.result || response.data;
  },

  // 선택한 가맹점의 정산 내역 조회 (정산 상태별 필터링)
  getSettlementHistoryByStatus: async (branchId, status) => {
    const response = await axios.get(
      `${ROYALTY_API_BASE_URL}/royalties/branches/${branchId}/settlements/filter`,
      { params: { status } }
    );
    return response.data.result || response.data;
  },

  // 로열티 내역 엑셀 다운로드 (전체 또는 필터링)
  exportToExcel: async ({
    branchId = null,
    status = null,
    startMonth = null,
    endMonth = null,
  }) => {
    const params = new URLSearchParams();
    if (branchId) params.append("branchId", branchId);
    if (status) params.append("status", status);
    if (startMonth) params.append("startMonth", startMonth);
    if (endMonth) params.append("endMonth", endMonth);

    const url = `${ROYALTY_API_BASE_URL}/royalties/export/excel${params.toString() ? "?" + params.toString() : ""}`;
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `로열티내역_${timestamp}.xlsx`;

    await downloadExcelFile(url, fileName);
  },

  // 특정 지점 로열티 내역 엑셀 다운로드
  exportBranchRoyaltyToExcel: async (branchId) => {
    const url = `${ROYALTY_API_BASE_URL}/royalties/branches/${branchId}/export/excel`;
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 10).replace(/-/g, "");
    const fileName = `지점별_로열티내역_${branchId}_${timestamp}.xlsx`;

    await downloadExcelFile(url, fileName);
  },
};
