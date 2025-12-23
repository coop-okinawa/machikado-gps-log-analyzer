
import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, StopMaster, WeatherData, ForecastItem, DetectedStop } from '../types';
import { calculateDistance } from '../utils/geo';

const WeatherIcon = ({ type, className }: { type: string, className?: string }) => {
  if (type === '晴れ' || type.includes('晴')) return (
    <svg className={`${className} text-amber-500 drop-shadow-sm`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
    </svg>
  );
  if (type === '曇り' || type.includes('曇')) return (
    <svg className={`${className} text-slate-400 drop-shadow-sm`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
    </svg>
  );
  return (
    <svg className={`${className} text-blue-500 drop-shadow-sm`} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM9 13c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1zm3 2c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1zm3-2c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1v-2c0-.55.45-1 1-1z"/>
    </svg>
  );
};

const DriverView: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [codeEntry, setCodeEntry] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [arrivalHistory, setArrivalHistory] = useState<{name: string, time: string, duration?: number}[]>([]);
  
  const lastProcessedTime = useRef<number>(0);
  const lastPoint = useRef<{lat: number, lon: number} | null>(null);
  const stillStartTime = useRef<number | null>(null);
  const isRecordingStop = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  const GPS_INTERVAL_MS = 30000;
  const STAY_DISTANCE_THRESHOLD = 10;
  const STAY_TIME_THRESHOLD_MIN = 3;

  const vehicles: Vehicle[] = [
    { id: '1', name: '1号車', active: true, code4_hash: '0000' },
    { id: '2', name: '2号車', active: true, code4_hash: '0000' },
    { id: '3', name: '3号車', active: true, code4_hash: '0000' },
  ];

  const mockStops: StopMaster[] = [
    { id: 'm1', name: '中央配送センター', lat: 35.6812, lon: 139.7671, type: 'BASE', radius_m: 30 },
    { id: 'm2', name: '新宿北ステーション', lat: 35.6938, lon: 139.7034, type: 'STOP', radius_m: 30 },
  ];

  const trafficInfo = [
    { type: 'warning', title: '国道20号線 (甲州街道)', detail: '新宿三丁目付近で工事。車線規制中。', time: '10分前' },
    { type: 'danger', title: '周辺規制情報', detail: '配送拠点B手前、水道管破裂により一部通行止め。', time: '30分前' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setWeather({ 
        temp: 24, 
        rainProb: 10, 
        forecast: '晴れ',
        locationName: '東京都新宿区付近',
        upcoming: [
          { time: '15:00', temp: 26, rainProb: 0, forecast: '晴れ' },
          { time: '18:00', temp: 22, rainProb: 20, forecast: '曇り' },
          { time: '21:00', temp: 19, rainProb: 40, forecast: '雨' },
        ]
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleVehicleSelect = (v: Vehicle) => {
    if (isStarted) return;
    setSelectedVehicle(v);
    setCodeEntry('');
    setIsModalOpen(true);
  };

  const handleVerify = () => {
    if (selectedVehicle && codeEntry === selectedVehicle.code4_hash) {
      setIsVerified(true);
      setIsModalOpen(false);
    } else {
      alert('車両コードが一致しません');
      setCodeEntry('');
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setGpsError('このデバイスはGPSをサポートしていません');
      return;
    }
    
    setIsStarted(true);
    setGpsError('GPS信号を探しています...');
    lastProcessedTime.current = 0;
    
    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const now = Date.now();
        if (accuracy > 100) console.warn('GPS精度低:', accuracy);
        if (now - lastProcessedTime.current < GPS_INTERVAL_MS) return;
        
        lastProcessedTime.current = now;
        setLastSyncTime(new Date().toLocaleTimeString('ja-JP'));
        setGpsError(null);

        if (lastPoint.current) {
          const dist = calculateDistance(lastPoint.current.lat, lastPoint.current.lon, latitude, longitude);
          if (dist < STAY_DISTANCE_THRESHOLD) {
            if (!stillStartTime.current) {
              stillStartTime.current = now;
            } else {
              const duration = (now - stillStartTime.current) / 1000 / 60;
              if (duration >= STAY_TIME_THRESHOLD_MIN && !isRecordingStop.current) {
                const matchingStop = mockStops.find(s => calculateDistance(s.lat, s.lon, latitude, longitude) <= 30);
                if (matchingStop) {
                  isRecordingStop.current = true;
                  setArrivalHistory(prev => [{
                    name: matchingStop.name,
                    time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
                    duration: Math.round(duration)
                  }, ...prev]);
                }
              }
            }
          } else {
            stillStartTime.current = null;
            isRecordingStop.current = false;
          }
        }
        lastPoint.current = { lat: latitude, lon: longitude };
      },
      (err) => {
        let msg = 'GPS情報の取得に失敗しました。';
        switch (err.code) {
          case err.PERMISSION_DENIED: msg = '位置情報の利用が拒否されました。'; break;
          case err.POSITION_UNAVAILABLE: msg = '位置情報が利用できません。'; break;
          case err.TIMEOUT: msg = 'GPSの取得がタイムアウトしました。'; break;
        }
        setGpsError(msg);
      },
      options
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    const totalStops = arrivalHistory.length;
    alert(`運行を終了しました。\n停留検知: ${totalStops}件`);
    setIsStarted(false);
    setIsVerified(false);
    setSelectedVehicle(null);
    setArrivalHistory([]);
    lastPoint.current = null;
    stillStartTime.current = null;
    setGpsError(null);
  };

  return (
    <div className="bg-[#f0f4f8] min-h-screen pb-12">
      <div className="container mx-auto px-5 py-6 max-w-lg space-y-6">
        
        {/* 車両選択カード */}
        <div className={`bg-white rounded-[2rem] p-7 shadow-sm border border-slate-100 transition-opacity ${isStarted ? 'opacity-50 pointer-events-none' : ''}`}>
          <p className="text-sm font-bold text-slate-400 mb-5 pl-1 tracking-wider uppercase">担当車両を選択</p>
          <div className="grid grid-cols-3 gap-3">
            {vehicles.map(v => (
              <button
                key={v.id}
                onClick={() => handleVehicleSelect(v)}
                className={`py-6 rounded-2xl text-base font-black border-2 transition-all active:scale-95 ${isVerified && selectedVehicle?.id === v.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-[#f8fafc] border-[#f1f5f9] text-[#94a3b8] hover:border-blue-200 hover:bg-white'}`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>

        {/* メインアクション */}
        <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-50 flex flex-col items-center justify-center relative min-h-[450px]">
          {!isVerified ? (
            <div className="flex flex-col items-center space-y-8 text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-[#fbbf24] rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-2xl font-black text-[#64748b] tracking-tight">担当車両を選択してください</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-8 w-full animate-in zoom-in duration-300">
              {!isStarted ? (
                <div className="flex flex-col items-center space-y-8">
                  <div className="text-center">
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">準備完了</p>
                    <p className="text-3xl font-black text-slate-800">{selectedVehicle?.name}</p>
                  </div>
                  <button onClick={startTracking} className="w-52 h-52 bg-white border-8 border-blue-50 rounded-full flex flex-col items-center justify-center text-blue-600 shadow-2xl active:scale-95 transition-all">
                    <svg className="w-20 h-20 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    <span className="text-2xl font-black tracking-widest">出発</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-10 w-full">
                  <div className="w-52 h-52 bg-green-500 rounded-full flex flex-col items-center justify-center text-white shadow-2xl animate-pulse ring-8 ring-green-50">
                    <span className="text-2xl font-black tracking-widest">運行中</span>
                    <span className="text-sm font-bold mt-2 opacity-80">{selectedVehicle?.name}</span>
                  </div>
                  <div className="w-full px-4 space-y-4">
                    <button onClick={stopTracking} className="w-full bg-[#0b1222] text-white py-6 rounded-[1.8rem] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                      到着 (運行終了)
                    </button>
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">到着を押すと運行データが確定されます</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 運行支援情報 */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-7 py-5 flex items-center justify-between border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">運行支援情報: <span className="text-blue-600">{weather?.locationName || '取得中...'}</span></p>
                {lastSyncTime && <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">GPS同期: {lastSyncTime}</p>}
              </div>
            </div>
          </div>

          <div className="p-7 space-y-8">
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-[#f8fafc] p-6 rounded-[2rem] flex flex-col items-center gap-2 border border-[#f1f5f9]">
                <WeatherIcon type={weather?.forecast || '晴れ'} className="w-14 h-14 mb-1" />
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-slate-700">{weather?.temp ?? '--'}</span>
                  <span className="text-xs text-slate-400 mb-1 font-bold">°C</span>
                </div>
              </div>
              <div className="bg-[#f8fafc] p-6 rounded-[2rem] flex flex-col items-center gap-2 border border-[#f1f5f9]">
                <svg className="w-12 h-12 text-blue-600 mb-2 mt-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.5C8.41 21.5 5.5 18.59 5.5 15c0-3.32 5.08-10.37 5.75-11.25.37-.48 1.13-.48 1.5 0 .67.88 5.75 7.93 5.75 11.25 0 3.59-2.91 6.5-6.5 6.5z"/></svg>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black text-blue-600">{weather?.rainProb ?? '--'}</span>
                  <span className="text-xs text-blue-400 mb-1 font-bold">%</span>
                </div>
              </div>
            </div>

            {/* 周辺規制状況 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-black text-slate-400 px-1 uppercase tracking-widest">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                周辺の交通・規制状況
              </div>
              <div className="space-y-3">
                {trafficInfo.map((info, i) => (
                  <div key={i} className={`p-5 rounded-2xl border flex gap-4 ${info.type === 'danger' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${info.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                      {info.type === 'danger' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-black text-sm ${info.type === 'danger' ? 'text-rose-900' : 'text-amber-900'}`}>{info.title}</p>
                        <span className="text-[9px] font-black text-slate-400 bg-white/50 px-2 py-0.5 rounded-full">{info.time}</span>
                      </div>
                      <p className={`text-[13px] font-bold leading-relaxed ${info.type === 'danger' ? 'text-rose-700' : 'text-amber-700'}`}>{info.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {gpsError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 px-6 py-4 rounded-2xl flex items-center gap-3">
                <p className="text-[11px] font-black leading-tight uppercase tracking-wide">{gpsError}</p>
              </div>
            )}
          </div>
        </div>

        {/* 到着履歴 */}
        <div className="bg-[#0b1222] rounded-[2.5rem] p-9 text-white shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h3 className="font-black text-xl tracking-tight">直近の到着履歴</h3>
          </div>
          <div className="space-y-5">
            {arrivalHistory.length === 0 ? (
              <p className="text-slate-500 font-bold italic opacity-60">履歴はありません</p>
            ) : (
              arrivalHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 p-6 rounded-[1.8rem] border border-white/5">
                  <div className="flex items-center gap-5">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                    <span className="text-lg font-black">{h.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-bold">{h.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#0b1222]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md p-12">
            <h2 className="text-3xl font-black text-slate-800 text-center mb-10">車両コード入力</h2>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={codeEntry}
              onChange={(e) => setCodeEntry(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-5xl font-mono py-10 rounded-[2.5rem] bg-slate-50 border-4 border-slate-50 focus:border-blue-500 outline-none transition-all tracking-[0.5em]"
              placeholder="****"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-5 mt-10">
              <button onClick={() => { setIsModalOpen(false); setSelectedVehicle(null); }} className="py-6 rounded-3xl text-sm font-black text-slate-400 uppercase tracking-widest">戻る</button>
              <button onClick={handleVerify} className="py-6 rounded-3xl bg-blue-600 text-white font-black text-xl shadow-xl active:scale-95 transition-all">確定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverView;
