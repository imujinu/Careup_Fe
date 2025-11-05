// src/hooks/useGeofence.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  requestGeoPermission,
  getCurrentCoords,
  startWatchPosition,
  computeFenceState,
} from '../utils/geo';

export function useGeofence(center = { lat: null, lng: null, radius: null }, options = {}) {
  const { autoStart = true, inflateByAccuracy = true } = options;
  const [permission, setPermission] = useState('prompt');
  const [coords, setCoords] = useState({ lat: null, lng: null, accuracy: null });
  const [loading, setLoading] = useState(false);
  const stopRef = useRef(null);

  const { distance, inside } = useMemo(
    () => computeFenceState(coords, center, center?.radius, { inflateByAccuracy }),
    [coords, center, inflateByAccuracy]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getCurrentCoords();
      setCoords(p);
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(async () => {
    const state = await requestGeoPermission();
    setPermission(state);
    if (stopRef.current) return;
    stopRef.current = startWatchPosition(
      (p) => setCoords(p),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }, []);

  const stop = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!autoStart) return;
    start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  useEffect(() => {
    (async () => {
      const state = await requestGeoPermission();
      setPermission(state);
    })();
  }, []);

  return {
    permission, // 'granted'|'denied'|'prompt'
    coords,     // { lat, lng, accuracy }
    distance,   // meters or null
    inside,     // boolean
    loading,    // refresh 진행중
    refresh,    // 수동 1회 갱신
    start,      // 감시 시작
    stop,       // 감시 중지
  };
}
