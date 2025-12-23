export type GPSPoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

export function startGPS(
  onUpdate: (pos: GPSPoint) => void,
  onError?: (err: GeolocationPositionError) => void
) {
  if (!navigator.geolocation) {
    alert("このブラウザはGPSに対応していません");
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // 精度が悪すぎる値を除外（ズレ対策）
      if (accuracy > 50) return;

      onUpdate({
        lat: latitude,
        lng: longitude,
        accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error("GPS error", error);
      if (onError) onError(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    }
  );

  return watchId;
}

export function stopGPS(watchId: number | null) {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
  }
}
