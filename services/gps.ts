// services/gps.ts

export type GPSPoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

/**
 * GPS監視を開始
 * - 取得は無条件
 * - 精度判断は呼び出し側で行う
 */
export function startGPS(
  onUpdate: (pos: GPSPoint) => void,
  onError?: (err: GeolocationPositionError) => void
): (() => void) | null {
  if (!navigator.geolocation) {
    alert("このブラウザはGPSに対応していません");
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      onUpdate({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error("GPS error:", error);
      onError?.(error);
    },
    {
      enableHighAccuracy: true, // ← 必須
      timeout: 20000,
      maximumAge: 0,
    }
  );

  // cleanup
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
