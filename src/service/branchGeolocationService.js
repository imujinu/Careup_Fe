// src/service/branchGeolocationService.js
// 지점(Branch) 지오펜스 조회/계산 전용 서비스

import axios from '../utils/axiosConfig';

/** 게이트웨이/브랜치 서비스 Base URL */
const BASE_URL = (() => {
  const explicit = (import.meta.env.VITE_BRANCH_URL || '').replace(/\/$/, '');
  if (explicit) return explicit;
  const api = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
  return `${api}/branch-service`;
})();

/** CommonSuccessDto 언랩 */
const unwrap = (res) => {
  const data = res?.data;
  if (data && typeof data === 'object' && 'result' in data) return data.result;
  return data;
};

/** 숫자 파싱(유효하지 않으면 null) */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** DTO → 지오펜스 표준형으로 매핑 */
const mapBranchGeo = (dto = {}) => {
  const lat = toNum(dto.latitude ?? dto.lat ?? dto.branchLat);
  const lng = toNum(
    dto.longitude ?? dto.lng ?? dto.lon ?? dto.long ?? dto.branchLng ?? dto.branchLong
  );
  const radius = toNum(dto.geofenceRadius ?? dto.geofenceRadiusMeters ?? dto.branchRadiusMeters);

  return {
    branchId: dto.id ?? dto.branchId ?? null,
    name: dto.name ?? dto.branchName ?? '',
    lat,
    lng,
    radius,
    address: dto.address ?? '',
    addressDetail: dto.addressDetail ?? '',
  };
};

/** 지점 지오펜스 설정 유효성 */
export const isBranchGeofenceConfigured = (g) => {
  if (!g) return false;
  const latOk = typeof g.lat === 'number' && Number.isFinite(g.lat);
  const lngOk = typeof g.lng === 'number' && Number.isFinite(g.lng);
  const rOk = typeof g.radius === 'number' && Number.isFinite(g.radius) && g.radius > 0;
  return latOk && lngOk && rOk;
};

/** 라디안 변환 */
const toRad = (deg) => (deg * Math.PI) / 180;

/** 하버사인 거리(m) */
export function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
    return NaN;
  }
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
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
 * @param {number} userLat
 * @param {number} userLng
 * @param {{lat:number,lng:number,radius:number}} branchGeo
 * @param {number} slackMeters (선택) 허용 오차(m)
 * @returns {{inside:boolean, distance:number}}
 */
export function isInsideGeofence(userLat, userLng, branchGeo, slackMeters = 0) {
  const dist = distanceFromBranchMeters(userLat, userLng, branchGeo);
  if (!Number.isFinite(dist)) return { inside: false, distance: NaN };
  const radius = Number(branchGeo?.radius ?? 0) + Math.max(0, Number(slackMeters) || 0);
  return { inside: dist <= radius, distance: dist };
}

/** 내 소속 지점 지오펜스 조회 */
export async function fetchMyBranchGeofence() {
  const res = await axios.get(`${BASE_URL}/branch/my`);
  const dto = unwrap(res) || {};
  return mapBranchGeo(dto);
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
};
