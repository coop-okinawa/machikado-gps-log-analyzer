// services/gps.ts

export type GPSPoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

/**
 * GPSの監視を開始する
 * @param onUpdate 位置が更新されたとき
 * @param onError エラー時（任意）
 * @returns 停止用の関数（cleanup）
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

      // 🔑 初動を殺さないため緩めにする
      // 屋外で安定すると 10〜30m になる
      if (accuracy > 300) return;

      onUpdate({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error("GPS error", error);
      onError?.(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );

  // 🔑 呼び出し側で確実に止められるようにする
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
