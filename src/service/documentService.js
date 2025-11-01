import axios from '../utils/axiosConfig';

const BASE_URL = import.meta.env.VITE_BRANCH_URL;

// 문서 타입 매핑
export const DOCUMENT_TYPES = {
  EMPLOYMENT_CONTRACT: '고용계약서',
  FRANCHISE_CONTRACT: '가맹계약서',
  BUSINESS_REGISTRATION_CERTIFICATE: '사업자등록증',
  CORPORATE_REGISTRATION_CERTIFICATE: '법인등기부등본',
  SHAREHOLDER_REGISTER: '주주명부',
  CORPORATE_SEAL_CERTIFICATE: '법인인감증명서',
  PERSONAL_SEAL_CERTIFICATE: '개인인감증명서',
  IDENTIFICATION_CARD: '신분증',
  BANK_ACCOUNT_PROOF: '통장사본',
  CREDIT_REPORT: '신용조회서',
  ETC: '기타'
};

export const documentService = {
  // 서류 생성(업로드)
  async createDocument(branchId, formData) {
    const url = `${BASE_URL}/documents/branch/${branchId}`;
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.result || response.data;
  },

  // 서류 목록 조회 (페이지네이션)
  async getDocumentsList(branchId, page = 0, size = 10, sort = 'id,desc') {
    const params = { page, size, sort };
    const url = `${BASE_URL}/documents/branch/${branchId}`;
    const response = await axios.get(url, { params });
    return response.data?.result || response.data;
  },

  // 서류 단건 조회
  async getDocument(employeeId, documentId) {
    const url = `${BASE_URL}/documents/${employeeId}/${documentId}`;
    const response = await axios.get(url);
    return response.data?.result || response.data;
  },

  // 서류 수정
  async updateDocument(employeeId, documentId, formData) {
    const url = `${BASE_URL}/documents/${employeeId}/${documentId}`;
    const response = await axios.patch(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.result || response.data;
  },

  // 서류 삭제
  async deleteDocument(employeeId, documentId) {
    const url = `${BASE_URL}/documents/${employeeId}/${documentId}`;
    const response = await axios.delete(url);
    return response.data?.result || response.data;
  },

  // 서류 다운로드 URL 조회
  async getDocumentDownloadUrl(employeeId, documentId) {
    const url = `${BASE_URL}/documents/${employeeId}/${documentId}/download`;
    const response = await axios.get(url);
    return response.data?.result || response.data;
  }
};

export default documentService;
