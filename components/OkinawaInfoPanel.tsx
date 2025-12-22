
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  AlertTriangle, 
  Info, 
  Loader2, 
  RefreshCw, 
  Droplets,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind
} from 'lucide-react';

interface ForecastItem {
  time: string;
  condition: string;
  temp: string;
}

interface WeatherInfo {
  locationName: string;
  currentCondition: string;
  currentTemp: string;
  precipProb: string;
  forecast: ForecastItem[];
}

interface TrafficInfo {
  summary: string;
  accidents: string[];
}

const OkinawaInfoPanel: React.FC = () => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [traffic, setTraffic] = useState<TrafficInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchCurrentInfo = async () => {
    setLoading(true);
    setError(false);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      const { latitude, longitude } = position.coords;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        現在地（緯度: ${latitude}, 経度: ${longitude}, 沖縄県内想定）の最新の気象情報と交通情報を取得してください。
        以下のJSON形式のみで回答してください:
        {
          "weather": {
            "locationName": "〇〇市付近",
            "currentCondition": "晴れ/曇り/雨/雷雨",
            "currentTemp": "25",
            "precipProb": "20",
            "forecast": [
              {"time": "3時間後", "condition": "曇り", "temp": "24"},
              {"time": "6時間後", "condition": "雨", "temp": "22"},
              {"time": "9時間後", "condition": "晴れ", "temp": "20"}
            ]
          },
          "traffic": {
            "summary": "交通概況を簡潔に",
            "accidents": ["事故情報や規制情報があれば"]
          }
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        },
      });

      const data = JSON.parse(response.text || '{}');
      if (data.weather) setWeather(data.weather);
      if (data.traffic) setTraffic(data.traffic);
    } catch (err) {
      console.error("Failed to fetch location-based info:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentInfo();
    const timer = setInterval(fetchCurrentInfo, 30 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('晴')) return <Sun className="w-7 h-7 text-orange-500" />;
    if (condition.includes('雷')) return <CloudLightning className="w-7 h-7 text-yellow-500" />;
    if (condition.includes('雨')) return <CloudRain className="w-7 h-7 text-blue-500" />;
    if (condition.includes('曇')) return <Cloud className="w-7 h-7 text-slate-400" />;
    return <Wind className="w-7 h-7 text-slate-300" />;
  };

  if (loading && !weather) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <div className="text-center">
          <p className="text-sm font-black text-slate-600">運行支援情報を準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <h3 className="font-black text-slate-800 text-xs tracking-tight uppercase">
            現在地の運行支援情報: <span className="text-blue-600 ml-1">{weather?.locationName || '取得中...'}</span>
          </h3>
        </div>
        <button 
          onClick={fetchCurrentInfo} 
          disabled={loading}
          className="p-1.5 hover:bg-white rounded-full transition-all border border-transparent hover:border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Current Weather Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-gradient-to-br from-blue-50/30 to-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                {getWeatherIcon(weather?.currentCondition || '')}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">現在の天気</span>
                <span className="text-xs font-black text-slate-700 truncate leading-tight">{weather?.currentCondition}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-0.5 ml-2">
              <span className="text-2xl font-black text-slate-900 leading-none">{weather?.currentTemp}</span>
              <span className="text-[10px] font-bold text-slate-400">°C</span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/5 p-2 rounded-full border border-blue-100/20 shrink-0">
                <Droplets className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-500 truncate">降水確率</span>
              </div>
            </div>
            <div className="flex items-baseline gap-0.5 ml-2">
              <span className="text-2xl font-black text-blue-600 leading-none">{weather?.precipProb}</span>
              <span className="text-[10px] font-bold text-blue-400">%</span>
            </div>
          </div>
        </div>

        {/* Forecast Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">今後の天気予測</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {weather?.forecast.map((f, i) => (
              <div key={i} className="flex-1 min-w-[90px] bg-slate-50/30 p-3 rounded-xl border border-slate-100 flex flex-col items-center gap-2 transition-all hover:bg-white hover:shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{f.time}</span>
                {getWeatherIcon(f.condition)}
                <span className="text-sm font-black text-slate-700">{f.temp}°</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Info */}
        <div className="space-y-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2 px-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">交通・事故情報</span>
          </div>
          <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/30">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {traffic?.summary || "交通状況は現在安定しています。"}
            </p>
          </div>
          {traffic?.accidents && traffic.accidents.length > 0 ? (
            <div className="space-y-2">
              {traffic.accidents.map((acc, i) => (
                <div key={i} className="flex items-start gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-xs font-bold text-red-700">{acc}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2.5 flex items-center gap-2 text-[10px] font-black text-green-600 bg-green-50 rounded-xl border border-green-100/50">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              周辺道路に重大な規制情報はありません
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 text-center border-t border-amber-100">
          <p className="text-[9px] text-amber-600 font-bold italic flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            GPS情報の取得に失敗しました。位置情報を許可してください。
          </p>
        </div>
      )}
    </div>
  );
};

export default OkinawaInfoPanel;
