// App.tsx

import React, { useEffect, useState } from "react";
import { startGPS, GPSPoint } from "./services/gps";
import { supabase } from "./lib/supabase";

const App: React.FC = () => {
  const [currentPos, setCurrentPos] = useState<GPSPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const stop = startGPS(
      async (pos: GPSPoint) => {
        // 🔍 まずは必ず表示・確認
        setCurrentPos(pos);
        console.log(
          "[GPS]",
          pos.lat,
          pos.lng,
          "accuracy:",
          pos.accuracy
        );

        /**
         * 🔑 保存条件（ここだけ）
         * ・屋外実運用想定：50m以下
         * ・停留判定は後工程でさらに厳しく
         */
        if (pos.accuracy <= 50) {
          const { error } = await supabase.from("gps_logs").insert({
            lat: pos.lat,
            lng: pos.lng,
            accuracy: pos.accuracy,
            timestamp: new Date(pos.timestamp).toISOString(),
          });

          if (error) {
            console.error("Supabase insert error:", error);
          } else {
            setSavedCount((c) => c + 1);
          }
        }
      },
      (err) => {
        console.error(err);
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
