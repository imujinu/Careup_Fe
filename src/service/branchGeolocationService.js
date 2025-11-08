import axios from '../utils/axiosConfig';

const BASE_URL = (() => {
  const trim = (s) => (s || '').replace(/\/+$/, '');
  const explicit = trim(import.meta.env.VITE_BRANCH_URL);
  if (explicit) return explicit; // e.g. https://server.careup.store/branch-service
  const api =
    trim(import.meta.env.VITE_API_URL) ||
    (typeof window !== 'undefined' ? trim(window.location.origin) : 'http://localhost:8080');
  return `${api}/branch-service`;
})();

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

const toNum = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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

const nestedCandidates = (dto) => {
  const candidates = [];
  if (!dto || typeof dto !== 'object') return candidates;
  const containerKeys = [
    'geofence','geoFence','geo','location','branchGeofence',
    'branchLocation','coordinates','center','position',
  ];
  for (const key of containerKeys) {
    if (dto[key] && typeof dto[key] === 'object') candidates.push(dto[key]);
  }
  return candidates;
};

const mapBranchGeo = (dto = {}) => {
  let lat = pickNumber(dto, ['latitude','lat','branchLat','centerLatitude','centerLat']);
  let lng = pickNumber(dto, ['longitude','lng','lon','long','branchLng','branchLong','centerLongitude','centerLng']);
  let radius = pickNumber(dto, [
    'geofenceRadius','geoFenceRadius','geofenceRadiusMeters','branchRadiusMeters','radiusMeters','radius','r',
  ]);

  if (lat === null || lng === null || radius === null) {
    for (const nest of nestedCandidates(dto)) {
      if (lat === null)   lat = pickNumber(nest, ['latitude','lat','branchLat','centerLatitude','centerLat']);
      if (lng === null)   lng = pickNumber(nest, ['longitude','lng','lon','long','branchLng','branchLong','centerLongitude','centerLng']);
      if (radius === null) radius = pickNumber(nest, [
        'geofenceRadius','geoFenceRadius','geofenceRadiusMeters','branchRadiusMeters','radiusMeters','radius','r',
      ]);
      if (lat !== null && lng !== null && radius !== null) break;
    }
  }

  let address = dto.address ?? dto.branchAddress ?? dto.addr ?? '';
  let addressDetail = dto.addressDetail ?? dto.addrDetail ?? dto.detailAddress ?? '';
  if (!address || !addressDetail) {
    for (const nest of nestedCandidates(dto)) {
      if (!address)      address = nest.address ?? nest.branchAddress ?? nest.addr ?? address;
      if (!addressDetail) addressDetail = nest.addressDetail ?? nest.addrDetail ?? nest.detailAddress ?? addressDetail;
      if (address && addressDetail) break;
    }
  }

  let branchId = dto.id ?? dto.branchId ?? dto.seq ?? dto.branchSeq ?? null;
  let name = dto.name ?? dto.branchName ?? dto.title ?? '';
  if (branchId === null || !name) {
    for (const nest of nestedCandidates(dto)) {
      if (branchId === null) branchId = nest.id ?? nest.branchId ?? nest.seq ?? nest.branchSeq ?? branchId;
      if (!name) name = nest.name ?? nest.branchName ?? nest.title ?? name;
      if (branchId !== null && name) break;
    }
  }

  return { branchId, name, lat, lng, radius, address, addressDetail };
};

const inRange = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);

export const isBranchGeofenceConfigured = (g) => {
  if (!g) return false;
  const latOk = inRange(g.lat, -90, 90);
  const lngOk = inRange(g.lng, -180, 180);
  const rOk = isFiniteNumber(g.radius) && g.radius > 0;
  return latOk && lngOk && rOk;
};

const toRad = (deg) => (deg * Math.PI) / 180;

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

export function distanceFromBranchMeters(userLat, userLng, branchGeo) {
  if (!branchGeo || !isBranchGeofenceConfigured(branchGeo)) return NaN;
  return haversineDistanceMeters(userLat, userLng, branchGeo.lat, branchGeo.lng);
}

export function isInsideGeofence(userLat, userLng, branchGeo, slackMeters = 0) {
  const dist = distanceFromBranchMeters(userLat, userLng, branchGeo);
  if (!Number.isFinite(dist)) return { inside: false, distance: NaN };
  const radius = Number(branchGeo?.radius ?? 0) + Math.max(0, Number(slackMeters) || 0);
  return { inside: dist <= radius, distance: dist };
}

export class ForbiddenError extends Error {
  constructor(message = '권한이 없습니다.') {
    super(message);
    this.name = 'ForbiddenError';
    this.code = 403;
  }
}

export async function fetchMyBranchGeofence() {
  try {
    // 1차: /branch/my
    const res = await axios.get(`${BASE_URL}/branch/my`);
    const dto = unwrap(res) || {};
    const mapped = mapBranchGeo(dto);
    if (isBranchGeofenceConfigured(mapped)) return mapped;
    // 좌표 미포함이면 후속 폴백 시도
  } catch (e) {
    const status = e?.response?.status;
    if (status === 403) throw new ForbiddenError(e?.response?.data?.status_message || '권한이 없습니다.');
    // 404/405/500 등은 폴백 시도
  }
  try {
    // 2차 폴백: /branch/my/geofence (과거/다른 버전 호환)
    const res2 = await axios.get(`${BASE_URL}/branch/my/geofence`);
    const dto2 = unwrap(res2) || {};
    return mapBranchGeo(dto2);
  } catch (e2) {
    const status2 = e2?.response?.status;
    if (status2 === 403) throw new ForbiddenError(e2?.response?.data?.status_message || '권한이 없습니다.');
    throw e2;
  }
}

export async function fetchBranchGeofenceById(branchId) {
  if (!branchId && branchId !== 0) throw new Error('branchId가 필요합니다.');
  const res = await axios.get(`${BASE_URL}/branch/${encodeURIComponent(branchId)}`);
  const dto = unwrap(res) || {};
  return mapBranchGeo(dto);
}

export const toBranchGeo = (raw) => mapBranchGeo(raw);

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
