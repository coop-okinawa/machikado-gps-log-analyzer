// src/App.tsx

import React, { useEffect, useState } from "react";
import { startGPS, GPSPoint } from "../services/gps";
import { supabase } from "./lib/supabase";

const App: React.FC = () => {
  const [pos, setPos] = useState<GPSPoint | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stop = startGPS(
      async (p: GPSPoint) => {
        // まずは必ず表示（保存とは切り離す）
        setPos(p);
        console.log("[GPS]", p.lat, p.lng, "accuracy:", p.accuracy);

        // 保存条件：精度 50m 以内のみ
        if (p.accuracy <= 50) {
          const { error } = await supabase.from("gps_logs").insert({
            lat: p.lat,
            lng: p.lng,
            accuracy: p.accuracy,
            timestamp: new Date(p.timestamp).toISOString(),
          });

          if (error) {
            console.error("Supabase insert error:", error);
          } else {
            setSavedCount((c) => c + 1);
          }
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setError("GPS取得エラー");
      }
    );

    return () => {
      stop?.();
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2>まちかど便 GPS ログ</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!pos && <p>GPS取得中…</p>}

      {pos && (
        <>
          <p>緯度: {pos.lat}</p>
          <p>経度: {pos.lng}</p>
          <p>精度: {pos.accuracy} m</p>
          <p>保存件数: {savedCount}</p>
        </>
      )}
    </div>
  );
};

export default App;
