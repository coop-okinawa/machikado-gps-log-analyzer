import React, { useEffect, useState } from "react";
import { startGPS, GPSPoint } from "./services/gps";
import { supabase } from "./lib/supabase";

const App: React.FC = () => {
  const [currentPos, setCurrentPos] = useState<GPSPoint | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // GPS開始
    const cleanup = startGPS(
      async (pos: GPSPoint) => {
        setCurrentPos(pos);

        // Supabase に保存（非同期）
        const { error } = await supabase.from("gps_logs").insert({
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          timestamp: new Date(pos.timestamp).toISOString(),
        });

        if (error) {
          console.error("Supabase insert error", error);
        }
      },
      (err) => {
        console.error(err);
        setError("GPS取得エラー");
      }
    );

    // アンマウント時に確実に停止
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>まちかど便 GPS ログ</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {currentPos ? (
        <ul>
          <li>緯度: {currentPos.lat}</li>
          <li>経度: {currentPos.lng}</li>
          <li>精度: {currentPos.accuracy}m</li>
          <li>
            時刻: {new Date(currentPos.timestamp).toLocaleString()}
          </li>
        </ul>
      ) : (
        <p>GPS取得中…</p>
      )}
    </div>
  );
};

export default App;
