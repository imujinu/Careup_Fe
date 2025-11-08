// src/service/branchGeolocationService.js
// 지점(Branch) 지오펜스 조회/계산 전용 서비스

import axios from '../utils/axiosConfig';

/** 게이트웨이/브랜치 서비스 Base URL (항상 /branch-service 보장) */
const BASE_URL = (() => {
  const trim = (s) => (s || '').replace(/\/+$/, '');
  const withBranch = (u) => (u.endsWith('/branch-service') ? u : `${u}/branch-service`);
  const explicit = trim(import.meta.env.VITE_BRANCH_URL);
  if (explicit) return withBranch(explicit);
  const api = trim(
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080')
  );
  return withBranch(api);
})();

/** CommonSuccessDto / CommonResponseDto 언랩 (비 JSON 방어 포함) */
const unwrap = (res) => {
  try {
    const ct = (res?.headers?.['content-type'] || '').toLowerCase();
    const data = res?.data;
    if (typeof data === 'string' && !ct.includes('application/json')) return null;
    if (data && typeof data === 'object') {
      if ('result' in data) return data.result;
      if ('data' in data) return data.data;
      return data;
    }
    return data ?? null;
  } catch {
    return null;
  }
};

/** 내부: 404/405는 다음 후보 시도 */
const tryGet = async (url) => {
  try {
    const r = await axios.get(url);
    return unwrap(r);
  } catch (e) {
    const st = e?.response?.status;
    if ([404, 405].includes(Number(st))) return null;
    throw e;
  }
};

/** 숫자 파싱(유효하지 않으면 null) */
const toNum = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 객체에서 첫 유효 숫자 필드 선택 */
const pickNumber = (obj, keys = []) => {
  if (!obj) return null;
  for (const k of keys) {
    if (k in obj) {
      const n = toNum(obj[k]);
      if (n !== null) return n;
    }
  }
  return null;
};

/** 중첩 후보 컨테이너 목록 */
const nestedCandidates = (dto) => {
  const candidates = [];
  if (!dto || typeof dto !== 'object') return candidates;
  const containerKeys = [
    'geofence',
    'geoFence',
    'geo',
    'location',
    'branchGeofence',
    'branchLocation',
    'coordinates',
    'center',
    'position',
  ];
  for (const key of containerKeys) {
    if (dto[key] && typeof dto[key] === 'object') candidates.push(dto[key]);
  }
  return candidates;
};

/** DTO → 지오펜스 표준형으로 매핑 */
const mapBranchGeo = (dto = {}) => {
  // 1) 최상위에서 먼저 시도
  let lat = pickNumber(dto, ['latitude', 'lat', 'branchLat', 'centerLatitude', 'centerLat']);
  let lng = pickNumber(dto, ['longitude', 'lng', 'lon', 'long', 'branchLng', 'branchLong', 'centerLongitude', 'centerLng']);
  let radius = pickNumber(dto, [
    'geofenceRadius',
    'geoFenceRadius',
    'geofenceRadiusMeters',
    'branchRadiusMeters',
    'radiusMeters',
    'radius',
    'r',
  ]);

  // 2) 실패 시 중첩 객체들에서 재시도
  if (lat === null || lng === null || radius === null) {
    for (const nest of nestedCandidates(dto)) {
      if (lat === null) {
        lat = pickNumber(nest, ['latitude', 'lat', 'branchLat', 'centerLatitude', 'centerLat']);
      }
      if (lng === null) {
        lng = pickNumber(nest, ['longitude', 'lng', 'lon', 'long', 'branchLng', 'branchLong', 'centerLongitude', 'centerLng']);
      }
      if (radius === null) {
        radius = pickNumber(nest, [
          'geofenceRadius',
          'geoFenceRadius',
          'geofenceRadiusMeters',
          'branchRadiusMeters',
          'radiusMeters',
          'radius',
          'r',
        ]);
      }
      if (lat !== null && lng !== null && radius !== null) break;
    }
  }

  // 주소도 상위 → 중첩 순서로 시도
  let address = dto.address ?? dto.branchAddress ?? dto.addr ?? '';
  let addressDetail = dto.addressDetail ?? dto.addrDetail ?? dto.detailAddress ?? '';
  if (!address || !addressDetail) {
    for (const nest of nestedCandidates(dto)) {
      if (!address) {
        address = nest.address ?? nest.branchAddress ?? nest.addr ?? address;
      }
      if (!addressDetail) {
        addressDetail = nest.addressDetail ?? nest.addrDetail ?? nest.detailAddress ?? addressDetail;
      }
      if (address && addressDetail) break;
    }
  }

  // id/name도 흔한 키들 지원
  let branchId = dto.id ?? dto.branchId ?? dto.seq ?? dto.branchSeq ?? null;
  let name = dto.name ?? dto.branchName ?? dto.title ?? '';

  // 중첩에서 보완
  if (branchId === null || !name) {
    for (const nest of nestedCandidates(dto)) {
      if (branchId === null) {
        branchId = nest.id ?? nest.branchId ?? nest.seq ?? nest.branchSeq ?? branchId;
      }
      if (!name) {
        name = nest.name ?? nest.branchName ?? nest.title ?? name;
      }
      if (branchId !== null && name) break;
    }
  }

  return {
    branchId,
    name,
    lat,
    lng,
    radius,
    radiusMeters: radius, // alias 유지
    address,
    addressDetail,
  };
};

/** 합리적 범위 검증 */
const inRange = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

/** 지점 지오펜스 설정 유효성 */
export const isBranchGeofenceConfigured = (g) => {
  if (!g) return false;
  const latOk = inRange(g.lat, -90, 90);
  const lngOk = inRange(g.lng, -180, 180);
  const rOk = isFiniteNumber(g.radius) && g.radius > 0;
  return latOk && lngOk && rOk;
};

/** 라디안 변환 */
const toRad = (deg) => (deg * Math.PI) / 180;

/** 하버사인 거리(m) */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => !isFiniteNumber(v))) return NaN;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon1 - lon2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0, R * c);
}

/** 사용자 좌표 → 지점까지 거리(m) */
export function distanceFromBranchMeters(userLat, userLng, branchGeo) {
  if (!branchGeo || !isBranchGeofenceConfigured(branchGeo)) return NaN;
  return haversineDistanceMeters(userLat, userLng, branchGeo.lat, branchGeo.lng);
}

/**
 * 반경 안/밖 여부 판정
 */
export function isInsideGeofence(userLat, userLng, branchGeo, slackMeters = 0) {
  const dist = distanceFromBranchMeters(userLat, userLng, branchGeo);
  if (!Number.isFinite(dist)) return { inside: false, distance: NaN };
  const radius = Number(branchGeo?.radius ?? 0) + Math.max(0, Number(slackMeters) || 0);
  return { inside: dist <= radius, distance: dist };
}

/** 명시적 403 에러 타입 */
export class ForbiddenError extends Error {
  constructor(message = '권한이 없습니다.') {
    super(message);
    this.name = 'ForbiddenError';
    this.code = 403;
  }
}

/** 내 소속 지점 지오펜스 조회 (후보 경로 자동 시도) */
export async function fetchMyBranchGeofence() {
  const candidates = [
    `${BASE_URL}/branch/my/geofence`,
    `${BASE_URL}/branch/geofence/my`,
    `${BASE_URL}/branch/my-branch/geofence`,
    `${BASE_URL}/branch/geofence?scope=me`,
    `${BASE_URL}/branch/my`, // 일반 브랜치 DTO도 파싱 시도
  ];
  let lastErr = null;

  for (const url of candidates) {
    try {
      const raw = await tryGet(url);
      if (!raw) continue;
      const mapped = mapBranchGeo(raw);
      // 좌표만 있어도 반환, 반경은 0일 수 있음
      if (mapped && (Number.isFinite(mapped.lat) && Number.isFinite(mapped.lng))) {
        return mapped;
      }
    } catch (e) {
      const st = e?.response?.status;
      if (st === 403) throw new ForbiddenError(e?.response?.data?.status_message || '권한이 없습니다.');
      lastErr = e;
      continue;
    }
  }

  if (lastErr) throw lastErr;
  return { branchId: null, name: '', lat: null, lng: null, radius: null, radiusMeters: null, address: '', addressDetail: '' };
}

/** 특정 지점 지오펜스 조회 */
export async function fetchBranchGeofenceById(branchId) {
  if (!branchId && branchId !== 0) throw new Error('branchId가 필요합니다.');
  const res = await axios.get(`${BASE_URL}/branch/${encodeURIComponent(branchId)}`);
  const dto = unwrap(res) || {};
  return mapBranchGeo(dto);
}

/** (선택) 공용: 표준형 생성 헬퍼 */
export const toBranchGeo = (raw) => mapBranchGeo(raw);

/** 기본 export */
export default {
  BASE_URL,
  unwrap,
  toBranchGeo,
  isBranchGeofenceConfigured,
  haversineDistanceMeters,
  distanceFromBranchMeters,
  isInsideGeofence,
  fetchMyBranchGeofence,
  fetchBranchGeofenceById,
  ForbiddenError,
};
