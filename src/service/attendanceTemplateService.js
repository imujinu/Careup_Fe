// src/service/attendanceTemplateService.js
// 근무 템플릿(프리셋) CRUD + 브로드캐스트 유틸 (백엔드 스펙 정합)
import axios from '../utils/axiosConfig';

const BASE = '/attendance-template';

// 공통 래퍼 파싱 (CommonResponseDto 호환) + JSON 가드
function unwrap(res) {
  const ct = (res?.headers?.['content-type'] || '').toLowerCase();
  const d = res?.data;

  // ✅ 개발 서버 fallback(HTML)을 200으로 받는 경우를 즉시 감지
  if (typeof d === 'string' && !ct.includes('application/json')) {
    throw new Error('API 응답이 JSON이 아닙니다. baseURL 또는 프록시 설정을 확인하세요.');
  }

  if (d?.result !== undefined) return d.result;
  if (d?.data !== undefined) return d.data;
  return d ?? null;
}

// 페이지 응답 정규화
function normalizePage(body) {
  if (!body) return { content: [], totalPages: 0, totalElements: 0 };
  if (Array.isArray(body)) return { content: body, totalPages: 1, totalElements: body.length };
  if (Array.isArray(body.content)) {
    return {
      content: body.content,
      totalPages: Number.isFinite(body.totalPages) ? body.totalPages : 1,
      totalElements: Number.isFinite(body.totalElements) ? body.totalElements : body.content.length,
    };
  }
  if (Array.isArray(body.items)) {
    return {
      content: body.items,
      totalPages: Number.isFinite(body.totalPages) ? body.totalPages : 1,
      totalElements: Number.isFinite(body.totalElements) ? body.totalElements : body.items.length,
    };
  }
  return { content: [], totalPages: 0, totalElements: 0 };
}

// '09:00' → '09:00:00' 보정
function toHHMMSS(v) {
  if (!v) return null;
  if (typeof v === 'string' && /^\d{2}:\d{2}$/.test(v)) return `${v}:00`;
  return v;
}

/**
 * 템플릿 목록 (페이지)
 * @param {{page?:number,size?:number,sort?:string}} params
 */
export async function listAttendanceTemplates(params = {}) {
  const { page = 0, size = 20, sort = 'name,asc' } = params;
  const q = { page, size, sort };

  const res = await axios.get(`${BASE}/list`, { params: q });
  return normalizePage(unwrap(res));
}

/** 단건 조회 (detail/{id}) */
export async function getAttendanceTemplate(id) {
  const res = await axios.get(`${BASE}/detail/${id}`);
  return unwrap(res);
}

/**
 * 생성 (POST /create)
 * payload: { name, defaultClockIn?, defaultBreakStart?, defaultBreakEnd?, defaultClockOut? }
 */
export async function createAttendanceTemplate(payload) {
  const body = {
    name: payload?.name,
    defaultClockIn: toHHMMSS(payload?.defaultClockIn),
    defaultBreakStart: toHHMMSS(payload?.defaultBreakStart),
    defaultBreakEnd: toHHMMSS(payload?.defaultBreakEnd),
    defaultClockOut: toHHMMSS(payload?.defaultClockOut),
  };
  const res = await axios.post(`${BASE}/create`, body);
  return unwrap(res);
}

/** 수정 (PATCH /update/{id}) */
export async function updateAttendanceTemplate(id, payload) {
  const body = {
    name: payload?.name,
    defaultClockIn: toHHMMSS(payload?.defaultClockIn),
    defaultBreakStart: toHHMMSS(payload?.defaultBreakStart),
    defaultBreakEnd: toHHMMSS(payload?.defaultBreakEnd),
    defaultClockOut: toHHMMSS(payload?.defaultClockOut),
    // 선택 반영 옵션이 있다면 payload에 포함된 필드가 그대로 전달됩니다(백엔드 DTO와 일치 시)
    propagate: payload?.propagate,
    propagateFrom: payload?.propagateFrom,
    propagateTo: payload?.propagateTo,
    strategy: payload?.strategy,
  };
  const res = await axios.patch(`${BASE}/update/${id}`, body);
  return unwrap(res);
}

/** 삭제 (DELETE /delete/{id}) */
export async function deleteAttendanceTemplate(id) {
  const res = await axios.delete(`${BASE}/delete/${id}`);
  return unwrap(res);
}

/** 드롭다운/모달용 간단 목록 */
export async function fetchAttendanceTemplates(limit = 1000) {
  const res = await axios.get(`${BASE}/list`, { params: { page: 0, size: limit, sort: 'name,asc' } });
  const body = unwrap(res);
  if (Array.isArray(body?.content)) return body.content;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

/** 변경 브로드캐스트 */
export function broadcastAttendanceTemplateChanged() {
  try {
    window.dispatchEvent(new Event('attendanceTemplate:changed'));
    localStorage.setItem('attendanceTemplate:ping', String(Date.now()));
    localStorage.removeItem('attendanceTemplate:ping');
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('attendanceTemplate');
      bc.postMessage({ type: 'changed' });
      bc.close();
    }
  } catch {}
}
