// src/hooks/useGeofence.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const toRad = (d) => (d * Math.PI) / 180;
function haversineMeters(a, b) {
  if (!a || !b) return NaN;
  const R = 6371000; // m
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const q = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
}

function hasGeo() {
  return typeof navigator !== 'undefined' && !!navigator.geolocation;
}

async function getOnce(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(err),
      options
    );
  });
}

/**
 * useGeofence
 * - branchGeo: { lat, lng, radius }
 * - opts:
 *    - autoStart (default true)
 *    - inflateByAccuracy (default true)
 *    - timeoutMs (default 15000)
 *    - acceptStaleMs (default 180000) // 캐시 허용
 */
export function useGeofence(branchGeo, opts = {}) {
  const {
    autoStart = true,
    inflateByAccuracy = true,
    timeoutMs = 15000,
    acceptStaleMs = 180000,
  } = opts;

  const [permission, setPermission] = useState('prompt');
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [distance, setDistance] = useState(NaN);
  const [inside, setInside] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // GeolocationPositionError
  const [timedOut, setTimedOut] = useState(false);
  const [stale, setStale] = useState(false);

  const geoRef = useRef({ cancel: false });

  // 권한 추적 (지원 브라우저 한정)
  useEffect(() => {
    let perm;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((p) => {
          perm = p;
          setPermission(p.state);
          p.onchange = () => setPermission(p.state);
        })
        .catch(() => {});
    }
    return () => {
      if (perm) perm.onchange = null;
    };
  }, []);

  const compute = useCallback(
    (pos) => {
      if (!branchGeo?.lat || !branchGeo?.lng || !branchGeo?.radius || !pos) {
        setDistance(NaN);
        setInside(false);
        return;
      }
      const current = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      const d = haversineMeters(current, {
        lat: Number(branchGeo.lat),
        lng: Number(branchGeo.lng),
      });
      const acc = Number(pos.coords.accuracy || 0);
      const effRadius = Number(branchGeo.radius) + (inflateByAccuracy ? acc : 0);

      setDistance(d);
      setInside(Number.isFinite(d) && d <= effRadius);
    },
    [branchGeo, inflateByAccuracy]
  );

  const refresh = useCallback(async () => {
    if (!hasGeo()) {
      setError({ code: 2, message: 'Geolocation unsupported' });
      setCoords(null);
      setDistance(NaN);
      setInside(false);
      setTimedOut(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setTimedOut(false);
    setStale(false);

    try {
      // 1) 빠른 캐시 / 저정밀 먼저 (최대 acceptStaleMs)
      const cached = await getOnce({
        enableHighAccuracy: false,
        timeout: Math.min(8000, timeoutMs),
        maximumAge: acceptStaleMs,
      }).catch(() => null);

      if (cached) {
        setCoords({
          lat: cached.coords.latitude,
          lng: cached.coords.longitude,
          accuracy: cached.coords.accuracy,
        });
        setStale(
          typeof cached.timestamp === 'number'
            ? Date.now() - cached.timestamp > acceptStaleMs
            : false
        );
        compute(cached);
      }

      // 2) 고정밀 시도 (실패해도 cached가 있으면 그 상태 유지)
      const precise = await getOnce({
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      });

      setCoords({
        lat: precise.coords.latitude,
        lng: precise.coords.longitude,
        accuracy: precise.coords.accuracy,
      });
      compute(precise);
    } catch (e) {
      setError(e);
      if (e?.code === 3) setTimedOut(true); // TIMEOUT
      // cached가 아예 없으면 inside=false 그대로
    } finally {
      if (!geoRef.current.cancel) setLoading(false);
    }
  }, [timeoutMs, acceptStaleMs, compute]);

  // auto start
  useEffect(() => {
    if (!autoStart) return;
    if (!branchGeo?.lat || !branchGeo?.lng || !branchGeo?.radius) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, branchGeo?.lat, branchGeo?.lng, branchGeo?.radius]);

  // branchGeo 변경 시 거리/포함 여부 재계산
  useEffect(() => {
    if (coords && branchGeo?.lat && branchGeo?.lng && branchGeo?.radius) {
      compute({
        coords: {
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.accuracy || 0,
        },
      });
    } else {
      setDistance(NaN);
      setInside(false);
    }
  }, [coords, branchGeo, compute]);

  useEffect(() => {
    return () => {
      geoRef.current.cancel = true;
    };
  }, []);

  return useMemo(
    () => ({
      permission,
      coords,
      distance,
      inside,
      loading,
      refresh,
      error,
      timedOut,
      stale,
    }),
    [permission, coords, distance, inside, loading, refresh, error, timedOut, stale]
  );
}
