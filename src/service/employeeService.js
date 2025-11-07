// src/service/employeeService.js

import axios from "../utils/axiosConfig";

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL;

// 직원(점주) 목록 조회
export const fetchEmployeeList = async (params = {}) => {
  const { page = 0, size = 20, sort = "id" } = params;
  const url = `${BASE_URL}/employees/list`;
  const response = await axios.get(url, {
    params: { page, size, sort },
  });
  return response.data?.result || response.data;
};

// 지점별 직원(점주) 목록 조회
export const fetchEmployeeListByBranch = async (branchId, params = {}) => {
  const { page = 0, size = 20, sort = "employmentStatus,asc", ...restParams } = params;
  const url = `${BASE_URL}/employees/list/branch/${branchId}`;
  const response = await axios.get(url, {
    params: { page, size, sort, ...restParams },
  });
  return response.data?.result || response.data;
};

// 직원(점주) 상세 조회
export const getEmployeeDetail = async (employeeId) => {
  const url = `${BASE_URL}/employees/detail/${employeeId}`;
  const response = await axios.get(url);
  return response.data?.result || response.data;
};

// 직원(점주) 등록
export const createEmployee = async (employeeData, profileImage) => {
  const url = `${BASE_URL}/employee/create`;

  console.log("=== 직원 등록 데이터 전송 시작 ===");
  console.log("URL:", url);
  console.log("원본 직원 데이터:", employeeData);
  console.log("프로필 이미지:", profileImage);
  console.log("이미지 파일명:", profileImage?.name);
  console.log("이미지 파일 크기:", profileImage?.size);
  console.log("이미지 파일 타입:", profileImage?.type);

  // 데이터 정제: 빈 문자열을 null로 변환하고 타입 변환
  const cleanedData = { ...employeeData };

  // 선택 필드: 빈 문자열을 null로 변환하거나 제거
  if (cleanedData.terminateDate === "") {
    cleanedData.terminateDate = null;
  }
  if (cleanedData.profileImageUrl === "") {
    cleanedData.profileImageUrl = null;
  }
  if (cleanedData.remark === "") {
    cleanedData.remark = null;
  }
  if (cleanedData.jobGradeId === null || cleanedData.jobGradeId === "") {
    cleanedData.jobGradeId = null;
  }

  // dispatches 배열 처리
  if (cleanedData.dispatches && cleanedData.dispatches.length > 0) {
    cleanedData.dispatches = cleanedData.dispatches.map((dispatch) => {
      const cleanedDispatch = { ...dispatch };

      // branchId를 숫자로 변환 (필수)
      if (
        cleanedDispatch.branchId !== null &&
        cleanedDispatch.branchId !== ""
      ) {
        cleanedDispatch.branchId = Number(cleanedDispatch.branchId);
      } else {
        throw new Error("지점 ID는 필수입니다.");
      }

      // assignedFrom이 빈 문자열이면 에러 (필수)
      if (
        !cleanedDispatch.assignedFrom ||
        cleanedDispatch.assignedFrom === ""
      ) {
        throw new Error("배치 시작일은 필수입니다.");
      }

      // assignedTo가 빈 문자열이면 null로 변환 (선택)
      if (cleanedDispatch.assignedTo === "") {
        cleanedDispatch.assignedTo = null;
      }

      return cleanedDispatch;
    });
  }

  console.log("정제된 직원 데이터:", cleanedData);

  const formData = new FormData();

  // 메타 데이터를 Blob으로 변환하여 추가 (백엔드 @RequestPart가 JSON 객체를 받기 위함)
  const metaBlob = new Blob([JSON.stringify(cleanedData)], {
    type: "application/json",
  });
  formData.append("meta", metaBlob);

  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append("image", profileImage);
  }

  // FormData 내용 확인
  console.log("FormData 내용:");
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}:`, {
        name: value.name,
        size: value.size,
        type: value.type,
        lastModified: value.lastModified,
      });
    } else if (value instanceof Blob) {
      console.log(`${key}:`, {
        type: value.type,
        size: value.size,
      });
    } else {
      console.log(`${key}:`, value);
    }
  }

  // FormData 사용 시 Content-Type을 명시적으로 설정하지 않음
  // 브라우저가 자동으로 multipart/form-data; boundary=... 형태로 설정
  const response = await axios.post(url, formData);

  console.log("응답 데이터:", response.data);
  console.log("=== 직원 등록 데이터 전송 완료 ===");

  return response.data?.result || response.data;
};

// 직원(점주) 수정
export const updateEmployee = async (
  employeeId,
  employeeData,
  profileImage
) => {
  const url = `${BASE_URL}/employee/update/${employeeId}`;

  console.log("=== 직원 수정 데이터 전송 시작 ===");
  console.log("URL:", url);
  console.log("직원 ID:", employeeId);
  console.log("원본 직원 데이터:", employeeData);
  console.log("프로필 이미지:", profileImage);
  console.log("이미지 파일명:", profileImage?.name);
  console.log("이미지 파일 크기:", profileImage?.size);
  console.log("이미지 파일 타입:", profileImage?.type);

  // 데이터 정제: 빈 문자열을 null로 변환하고 타입 변환
  const cleanedData = { ...employeeData };

  // 선택 필드: 빈 문자열을 null로 변환하거나 제거
  if (cleanedData.terminateDate === "") {
    cleanedData.terminateDate = null;
  }
  if (cleanedData.profileImageUrl === "") {
    cleanedData.profileImageUrl = null;
  }
  if (cleanedData.remark === "") {
    cleanedData.remark = null;
  }
  if (cleanedData.jobGradeId === null || cleanedData.jobGradeId === "") {
    cleanedData.jobGradeId = null;
  }

  // 비밀번호가 없으면 제거 (수정 시 선택사항)
  if (!cleanedData.rawPassword || cleanedData.rawPassword === "") {
    delete cleanedData.rawPassword;
  }

  // dispatches 배열 처리 (수정 시에도 있을 수 있음)
  if (cleanedData.dispatches && cleanedData.dispatches.length > 0) {
    cleanedData.dispatches = cleanedData.dispatches.map((dispatch) => {
      const cleanedDispatch = { ...dispatch };

      // branchId를 숫자로 변환
      if (
        cleanedDispatch.branchId !== null &&
        cleanedDispatch.branchId !== ""
      ) {
        cleanedDispatch.branchId = Number(cleanedDispatch.branchId);
      }

      // assignedFrom이 빈 문자열이면 null로 변환
      if (cleanedDispatch.assignedFrom === "") {
        cleanedDispatch.assignedFrom = null;
      }

      // assignedTo가 빈 문자열이면 null로 변환
      if (cleanedDispatch.assignedTo === "") {
        cleanedDispatch.assignedTo = null;
      }

      return cleanedDispatch;
    });
  }

  console.log("정제된 직원 데이터:", cleanedData);

  const formData = new FormData();

  // 메타 데이터를 Blob으로 변환하여 추가 (백엔드 @RequestPart가 JSON 객체를 받기 위함)
  const metaBlob = new Blob([JSON.stringify(cleanedData)], {
    type: "application/json",
  });
  formData.append("meta", metaBlob);

  // 프로필 이미지 파일 추가
  if (profileImage) {
    formData.append("image", profileImage);
  }

  // FormData 내용 확인
  console.log("FormData 내용:");
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}:`, {
        name: value.name,
        size: value.size,
        type: value.type,
        lastModified: value.lastModified,
      });
    } else if (value instanceof Blob) {
      console.log(`${key}:`, {
        type: value.type,
        size: value.size,
      });
    } else {
      console.log(`${key}:`, value);
    }
  }

  // FormData 사용 시 Content-Type을 명시적으로 설정하지 않음
  // 브라우저가 자동으로 multipart/form-data; boundary=... 형태로 설정
  const response = await axios.patch(url, formData);

  console.log("응답 데이터:", response.data);
  console.log("=== 직원 수정 데이터 전송 완료 ===");

  return response.data?.result || response.data;
};

// 직원(점주) 비활성화(퇴사) 처리
export const deactivateEmployee = async (employeeId) => {
  const url = `${BASE_URL}/employee/delete/${employeeId}`;
  const response = await axios.delete(url);
  return response.data;
};

// 직원(점주) 재입사 처리
export const rehireEmployee = async (employeeId) => {
  const url = `${BASE_URL}/employee/rehire/${employeeId}`;
  const response = await axios.patch(url);
  return response.data?.result || response.data;
};

export default {
  fetchEmployeeList,
  fetchEmployeeListByBranch,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  rehireEmployee,
};
