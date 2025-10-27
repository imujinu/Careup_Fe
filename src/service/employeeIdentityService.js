// src/service/employeeIdentityService.js
import branchPublicAxios from "../utils/branchPublicAxios";

/**
 * 직원 아이디 찾기 서비스
 * - 게이트웨이: /public/auth/employees/id/find → branch-service
 * - mask=true 시 이메일/휴대폰 일부 마스킹
 */
export async function findEmployeeId({ name, dateOfBirth, employeeNumber, mask = true }) {
  const qs = mask ? "?mask=true" : "";
  const payload = {
    name: String(name || "").trim(),
    dateOfBirth,                  // YYYY-MM-DD
    employeeNumber: String(employeeNumber || "").trim(),
  };

  const { data } = await branchPublicAxios.post(`/public/auth/employees/id/find${qs}`, payload);

  // 서버가 { result: {...} } 혹은 {...} 둘 다 올 수 있으니 모두 대응
  return data?.result ?? data;
}

const employeeIdService = { findEmployeeId };
export default employeeIdService;
