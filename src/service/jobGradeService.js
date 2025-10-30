// src/service/jobGradeService.js
import axios from '../utils/axiosConfig';

const BASE_URL =
  import.meta.env.VITE_BRANCH_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8080';

const sanitizeSort = (sort) => {
  if (!sort) return null;
  // ✅ orderIndex 허용
  const allowed = new Set(['orderIndex', 'id', 'name', 'authorityType', 'createdAt', 'updatedAt']);
  const [field, dir] = String(sort).split(',');
  if (!allowed.has(field)) return null;
  const d = (dir || 'asc').toLowerCase();
  return `${field},${d === 'desc' ? 'DESC' : 'ASC'}`;
};

// ✅ 정렬 오류 시 'orderIndex,asc'로 1차 재시도 → 그래도 실패 시 sort 제거
const getWithRetrySansSort = async (url, params = {}) => {
  try {
    return await axios.get(url, { params });
  } catch (e) {
    const hadSort = Object.prototype.hasOwnProperty.call(params, 'sort');
    const status = e?.response?.status;

    if (hadSort && (status === 400 || status === 500)) {
      // 1차: orderIndex,asc 강제 재시도
      const p2 = { ...params, sort: 'orderIndex,asc' };
      try {
        return await axios.get(url, { params: p2 });
      } catch (_) {
        // 2차: sort 제거 후 최후 재시도
        const p3 = { ...params };
        delete p3.sort;
        return await axios.get(url, { params: p3 });
      }
    }
    throw e;
  }
};

export const listJobGrades = async (params = {}) => {
  const qp = { ...params };
  const clean = sanitizeSort(qp.sort);
  if (clean) qp.sort = clean;
  else delete qp.sort;

  const res = await getWithRetrySansSort(`${BASE_URL}/job-grades/list`, qp);
  return res?.data?.result || res?.data?.data || res?.data;
};

export const createJobGrade = (payload) =>
  axios.post(`${BASE_URL}/job-grades/create`, payload);

export const updateJobGrade = (id, payload) =>
  axios.patch(`${BASE_URL}/job-grades/update/${id}`, payload);

export const deleteJobGrade = (id) =>
  axios.delete(`${BASE_URL}/job-grades/delete/${id}`);

// ✅ 옵션도 항상 orderIndex 오름차순으로 가져와 드롭다운과 서버 순서를 일치
export const fetchJobGradeOptions = (noCache = false) =>
  axios.get(`${BASE_URL}/job-grades/options`, {
    params: { sort: 'orderIndex,asc', ...(noCache ? { t: Date.now() } : {}) },
  });

/** 직급 데이터 변경 브로드캐스트(같은 탭/다른 탭/다른 라우트 모두 수신) */
export const broadcastJobGradeChanged = () => {
  try {
    // 같은 탭 내 커스텀 이벤트
    window.dispatchEvent(new CustomEvent('jobGrade:changed'));
    // 다른 탭 감지(storage)
    localStorage.setItem('jobGrade:ping', String(Date.now()));
    // BroadcastChannel
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('jobGrade');
      bc.postMessage({ type: 'changed', ts: Date.now() });
      bc.close();
    }
  } catch {
    // no-op
  }
};

// ===== 순서 이동/재정렬 =====
export const moveJobGrade = (id, direction) =>
  axios.patch(`${BASE_URL}/job-grades/${id}/move`, null, { params: { direction } });

export const reorderJobGrades = (ids) =>
  axios.put(`${BASE_URL}/job-grades/reorder`, ids);
