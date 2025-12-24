// services/gps.ts

export type GPSPoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

/**
 * GPS監視開始
 * ※ 東京(35.68,139.76)固定になる場合もここで弾く
 */
export function startGPS(
  onUpdate: (pos: GPSPoint) => void,
  onError?: (err: GeolocationPositionError) => void
): (() => void) | null {
  if (!("geolocation" in navigator)) {
    alert("GPS非対応ブラウザ");
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // ❌ Chromeが権限未確定時に返す「東京ダミー」を除外
      if (
        Math.abs(latitude - 35.681236) < 0.05 &&
        Math.abs(longitude - 139.767125) < 0.05
      ) {
        console.warn("東京ダミー位置を除外");
        return;
      }

      // 精度が悪すぎるものはUIにも出さない
      if (accuracy > 300) return;

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
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 20000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
