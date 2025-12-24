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
    alert("このブラウザはGPS非対応");
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      onUpdate({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    },
    (err) => {
      onError?.(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}
