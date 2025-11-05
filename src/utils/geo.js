// src/utils/geo.js

/** 지오로케이션 지원 여부 */
export function supportsGeolocation() {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/** 권한 상태 조회: 'granted' | 'denied' | 'prompt' */
export async function requestGeoPermission() {
  try {
    if (!supportsGeolocation()) return 'denied';
    if (!('permissions' in navigator)) return 'prompt';
    const p = await navigator.permissions.query({ name: 'geolocation' });
    return p.state; // 'granted' | 'denied' | 'prompt'
  } catch {
    return 'prompt';
  }
}

/** 현재 좌표 1회 조회 (Promise) */
export function getCurrentCoords(options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }) {
  return new Promise((resolve, reject) => {
    if (!supportsGeolocation()) return reject(new Error('not-supported'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        });
      },
      (err) => reject(err),
      options
    );
  });
}

/** 위치 변경 감시 시작 → 해제 함수 반환 */
export function startWatchPosition(onUpdate, onError, options = { enableHighAccuracy: true, maximumAge: 5000 }) {
  if (!supportsGeolocation()) return () => {};
  const id = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate?.({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
      });
    },
    (err) => onError?.(err),
    options
  );
  return () => {
    try {
      navigator.geolocation.clearWatch(id);
    } catch {}
  };
}

export function toRad(d) {
  return (d * Math.PI) / 180;
}

/** 하버사인 거리(m) */
export function haversineMeters(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const h = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 거리 포맷 */
export function formatMeters(m) {
  if (m == null || Number.isNaN(m)) return '-';
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(2)}km`;
}

/**
 * 반경 내 여부 판단 (정확도 보정 옵션)
 * inflateByAccuracy: true면 radius + accuracy 로 판정
 */
export function isInsideFence(user, center, radius, { inflateByAccuracy = true } = {}) {
  if (!user?.lat || !user?.lng || !center?.lat || !center?.lng || !radius) return false;
  const d = haversineMeters(user.lat, user.lng, center.lat, center.lng);
  const effectiveRadius = inflateByAccuracy && user.accuracy ? radius + user.accuracy : radius;
  return d <= effectiveRadius;
}

/** 거리와 inside를 함께 계산 */
export function computeFenceState(user, center, radius, { inflateByAccuracy = true } = {}) {
  if (!user?.lat || !user?.lng || !center?.lat || !center?.lng || !radius) {
    return { distance: null, inside: false };
  }
  const distance = haversineMeters(user.lat, user.lng, center.lat, center.lng);
  const effectiveRadius = inflateByAccuracy && user.accuracy ? radius + user.accuracy : radius;
  return { distance, inside: distance <= effectiveRadius };
}
