// src/App.tsx
import React, { useEffect, useState } from "react";
import { startGPS, GPSPoint } from "../services/gps";
import { supabase } from "./lib/supabase";

const App: React.FC = () => {
  const [currentPos, setCurrentPos] = useState<GPSPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const stop = startGPS(
      async (pos: GPSPoint) => {
        setCurrentPos(pos);
        console.log("[GPS]", pos.lat, pos.lng, "accuracy:", pos.accuracy);

        // 保存条件：精度50m以下のみ
        if (pos.accuracy <= 50) {
          const { error } = await supabase.from("gps_logs").insert({
            lat: pos.lat,
            lng: pos.lng,
            accuracy: pos.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          });

          if (!error) {
            setSavedCount((c) => c + 1);
          } else {
            console.error("Supabase insert error", error);
          }
        }
      },
      () => setError("GPS取得エラー")
    );

    return () => stop?.();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>まちかど便 GPS ログ</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!currentPos && <p>GPS取得中…</p>}

      {currentPos && (
        <>
          <p>緯度: {currentPos.lat}</p>
          <p>経度: {currentPos.lng}</p>
          <p>精度: {currentPos.accuracy} m</p>
          <p>保存件数: {savedCount}</p>
        </>
      )}
    </div>
  );
};

export default App;
