
import React, { useState, useEffect, useRef } from 'react';
import { AppView, VehicleId, OperationEvent, StopMaster, DEFAULT_MASTERS, VehiclePins } from './types';
import { RealtimeTracker } from './services/analyzerService';
import MasterDataList from './components/MasterDataList';
import OkinawaInfoPanel from './components/OkinawaInfoPanel';
import { 
  Download, 
  Play, 
  Square, 
  Clock,
  ChevronRight,
  Building2,
  Trash2,
  ShieldAlert,
  Lock,
  KeyRound,
  Filter,
  Truck,
  Fingerprint,
  AlertCircle
} from 'lucide-react';
import { formatDate, calculateDistance } from './utils/geoUtils';

const DEFAULT_PINS: VehiclePins = {
  '1号車': '0000',
  '2号車': '0000',
  '3号車': '0000'
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DRIVER);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId | null>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [logs, setLogs] = useState<OperationEvent[]>([]);
  const [masters, setMasters] = useState<StopMaster[]>(DEFAULT_MASTERS);
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
  const [vehiclePins, setVehiclePins] = useState<VehiclePins>(DEFAULT_PINS);
  
  // PIN Auth states
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetVehicle, setTargetVehicle] = useState<VehicleId | null>(null);
  const [inputPin, setInputPin] = useState('');

  // Admin Log Filter state
  const [adminLogFilter, setAdminLogFilter] = useState<VehicleId | 'ALL'>('ALL');

  // Auth states
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [adminPassword, setAdminPassword] = useState('1234'); 
  const [showPwPrompt, setShowPwPrompt] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  const trackerRef = useRef<RealtimeTracker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const savedLogs = localStorage.getItem('machikado_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs).map((l: any) => ({...l, timestamp: new Date(l.timestamp)})));
    }
    const savedMasters = localStorage.getItem('machikado_masters');
    if (savedMasters) {
      setMasters(JSON.parse(savedMasters));
    }
    const savedPw = localStorage.getItem('machikado_admin_pw');
    if (savedPw) {
      setAdminPassword(savedPw);
    }
    const savedPins = localStorage.getItem('machikado_vehicle_pins');
    if (savedPins) {
      setVehiclePins(JSON.parse(savedPins));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('machikado_logs', JSON.stringify(logs));
  }, [logs]);

  // 車両ナンバー認証の自動実行
  useEffect(() => {
    if (inputPin.length === 4 && targetVehicle) {
      const timer = setTimeout(() => {
        if (inputPin === vehiclePins[targetVehicle]) {
          setSelectedVehicle(targetVehicle);
          setShowPinModal(false);
          setInputPin('');
          setTargetVehicle(null);
        } else {
          alert('車両ナンバーが正しくありません');
          setInputPin('');
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [inputPin, targetVehicle, vehiclePins]);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isShiftActive && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isShiftActive]);

  const getNearestBaseName = (lat: number, lng: number): string => {
    const bases = masters.filter(m => m.isBase);
    let nearest: StopMaster | null = null;
    let minDistance = 200;

    bases.forEach(b => {
      const d = calculateDistance(lat, lng, b.latitude, b.longitude);
      if (d < minDistance) {
        minDistance = d;
        nearest = b;
      }
    });

    return nearest ? nearest.name : '不明な拠点';
  };

  const addLogEvent = (eventData: Omit<OperationEvent, 'id'>) => {
    const newEvent: OperationEvent = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setLogs(prev => [newEvent, ...prev]);
  };

  const startShift = async () => {
    if (!selectedVehicle) {
      alert("車両を選択してください");
      return;
    }
    if (!navigator.geolocation) {
      alert("GPSがサポートされていません");
      return;
    }
    await requestWakeLock();
    navigator.geolocation.getCurrentPosition((pos) => {
      const baseName = getNearestBaseName(pos.coords.latitude, pos.coords.longitude);
      addLogEvent({
        vehicleId: selectedVehicle,
        type: 'SHIFT_START',
        locationName: baseName,
        timestamp: new Date(),
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      trackerRef.current = new RealtimeTracker(selectedVehicle, masters, addLogEvent);
      watchIdRef.current = navigator.geolocation.watchPosition((p) => {
        setCurrentPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        trackerRef.current?.processPoint({
          timestamp: new Date(p.timestamp),
          latitude: p.coords.latitude,
          longitude: p.coords.longitude
        });
      }, (err) => {
        console.error("GPS Error:", err);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      setIsShiftActive(true);
    }, (err) => alert("位置情報を取得できませんでした。"));
  };

  const endShift = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    navigator.geolocation.getCurrentPosition((pos) => {
      if (!selectedVehicle) return;
      const baseName = getNearestBaseName(pos.coords.latitude, pos.coords.longitude);
      addLogEvent({
        vehicleId: selectedVehicle,
        type: 'SHIFT_END',
        locationName: baseName,
        timestamp: new Date(),
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      setIsShiftActive(false);
      trackerRef.current = null;
    });
  };

  const handleVehicleSelectionClick = (v: VehicleId) => {
    if (isShiftActive) return;
    setTargetVehicle(v);
    setInputPin('');
    setShowPinModal(true);
  };

  const handleAdminAccess = () => {
    if (isAuthorized) {
      setView(AppView.ADMIN_LOGS);
    } else {
      setShowPwPrompt(true);
    }
  };

  const checkPassword = () => {
    if (password === adminPassword) {
      setIsAuthorized(true);
      setShowPwPrompt(false);
      setView(AppView.ADMIN_LOGS);
      setPassword('');
    } else {
      alert('パスワードが違います');
      setPassword('');
    }
  };

  const updatePassword = () => {
    if (newPassword.length < 4) {
      alert('パスワードは4文字以上で設定してください');
      return;
    }
    setAdminPassword(newPassword);
    localStorage.setItem('machikado_admin_pw', newPassword);
    setIsChangingPw(false);
    setNewPassword('');
    alert('パスワードを更新しました');
  };

  const updateVehiclePin = (v: VehicleId, newPin: string) => {
    const val = newPin.replace(/\D/g, '').slice(0, 4);
    const updated = { ...vehiclePins, [v]: val };
    setVehiclePins(updated);
    localStorage.setItem('machikado_vehicle_pins', JSON.stringify(updated));
  };

  const downloadCSV = () => {
    const baseLogs = logs.filter(l => l.type === 'ARRIVAL');
    const filteredLogs = adminLogFilter === 'ALL' 
      ? baseLogs 
      : baseLogs.filter(l => l.vehicleId === adminLogFilter);

    if (filteredLogs.length === 0) return;

    const headers = ['車両ID', '日付', '地点名', '到着時刻'];
    const rows = filteredLogs.map(l => [
      l.vehicleId, 
      l.timestamp.toLocaleDateString('ja-JP'), 
      l.locationName, 
      formatDate(l.timestamp).split(" ")[1]
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const vehicleLabel = adminLogFilter === 'ALL' ? '全車両' : adminLogFilter;
    link.setAttribute("download", `まちかど便_${vehicleLabel}_運行ログ_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const arrivalOnlyLogs = logs.filter(l => l.type === 'ARRIVAL');
  const filteredAdminLogs = adminLogFilter === 'ALL' 
    ? arrivalOnlyLogs 
    : arrivalOnlyLogs.filter(l => l.vehicleId === adminLogFilter);

  const getVehicleBadgeColor = (v: VehicleId) => {
    switch(v) {
      case '1号車': return 'bg-blue-100 text-blue-700 border-blue-200';
      case '2号車': return 'bg-purple-100 text-purple-700 border-purple-200';
      case '3号車': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-4 shadow-lg flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl flex items-center justify-center shadow-sm">
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">まちかど便</h1>
            <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">運行判定システム</p>
          </div>
        </div>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setView(AppView.DRIVER)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === AppView.DRIVER ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            ドライバー
          </button>
          <button 
            onClick={handleAdminAccess}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === AppView.ADMIN_LOGS || view === AppView.MASTER_DATA ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            管理者
          </button>
        </div>
      </header>

      {/* Vehicle PIN Auth Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-5">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Fingerprint className="w-8 h-8 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-800">{targetVehicle} を選択</h2>
                <p className="text-xs text-slate-500 font-bold">車両ナンバー4桁を入力してください</p>
              </div>
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={4}
                autoFocus
                className="w-full text-center text-3xl tracking-[0.6em] border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-amber-500 transition-all font-mono placeholder:text-slate-100"
                placeholder="0000"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
              />
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setShowPinModal(false);
                    setInputPin('');
                    setTargetVehicle(null);
                  }} 
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPwPrompt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">管理者認証</h2>
              <p className="text-sm text-slate-500">管理者パスワードを入力してください</p>
              <input 
                type="password" 
                autoFocus
                className="w-full text-center text-2xl tracking-[0.5em] border-2 border-slate-100 rounded-xl p-3 outline-none focus:border-blue-500 transition-all font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
              />
              <div className="flex gap-2 pt-4">
                <button onClick={() => setShowPwPrompt(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">キャンセル</button>
                <button onClick={checkPassword} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-100">認証</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full pb-20">
        {view === AppView.DRIVER && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {isShiftActive && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-3 text-amber-800 text-xs font-bold animate-pulse">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                スリープ防止が有効です。アプリを閉じずに走行してください。
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">担当車両を選択</label>
              <div className="grid grid-cols-3 gap-3">
                {(['1号車', '2号車', '3号車'] as VehicleId[]).map(v => (
                  <button
                    key={v}
                    disabled={isShiftActive}
                    onClick={() => handleVehicleSelectionClick(v)}
                    className={`py-3 rounded-xl font-bold border-2 transition-all ${
                      selectedVehicle === v 
                        ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-inner' 
                        : 'border-slate-100 text-slate-400 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center space-y-8">
              {!isShiftActive ? (
                <>
                  <div className="space-y-2">
                    {selectedVehicle ? (
                      <>
                        <h2 className="text-2xl font-black text-slate-800">業務を開始しますか？</h2>
                        <p className="text-slate-500 text-sm">【{selectedVehicle}】で出発ボタンを押すと記録を開始します。</p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <AlertCircle className="w-10 h-10 text-amber-400" />
                        <p className="text-slate-500 font-bold">担当車両を選択してください</p>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={startShift} 
                    disabled={!selectedVehicle}
                    className={`w-full aspect-square max-w-[200px] mx-auto rounded-full flex flex-col items-center justify-center gap-2 transition-all border-8 ${
                      selectedVehicle 
                        ? 'bg-green-500 hover:bg-green-600 active:scale-95 text-white shadow-xl shadow-green-200 border-green-50' 
                        : 'bg-slate-100 text-slate-300 border-slate-50 cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Play className="w-12 h-12 fill-current" />
                    <span className="text-xl font-black">出発</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold animate-pulse">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      運行記録中 ({selectedVehicle})
                    </div>
                    {currentPos && (
                      <p className="text-[10px] font-mono text-slate-400">
                        LAT: {currentPos.lat.toFixed(5)} / LNG: {currentPos.lng.toFixed(5)}
                      </p>
                    )}
                  </div>
                  <button onClick={endShift} className="w-full aspect-square max-w-[200px] mx-auto bg-red-500 hover:bg-red-600 active:scale-95 text-white rounded-full flex flex-col items-center justify-center gap-2 shadow-xl shadow-red-200 transition-all border-8 border-red-50">
                    <Square className="w-12 h-12 fill-current" />
                    <span className="text-xl font-black">到着</span>
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              <OkinawaInfoPanel />
              
              <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-lg">
                 <h3 className="font-bold mb-4 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-blue-400" />
                   直近の到着履歴 (停留所のみ)
                 </h3>
                 <div className="space-y-4 relative z-10">
                   {selectedVehicle ? (
                     arrivalOnlyLogs.filter(l => l.vehicleId === selectedVehicle).slice(0, 10).map((l, i) => (
                       <div key={l.id} className="flex items-center gap-3 text-sm border-l-2 border-blue-500/50 pl-3">
                         <span className="text-slate-400 text-xs font-mono">{formatDate(l.timestamp).split(" ")[1]}</span>
                         <span className="font-bold truncate">{l.locationName}</span>
                         <span className="text-[9px] bg-blue-500/20 px-1.5 py-0.5 rounded text-blue-300 font-bold uppercase ml-auto">ARRIVAL</span>
                       </div>
                     ))
                   ) : (
                     <p className="text-slate-500 text-xs italic">車両を選択すると履歴が表示されます</p>
                   )}
                   {selectedVehicle && arrivalOnlyLogs.filter(l => l.vehicleId === selectedVehicle).length === 0 && (
                     <p className="text-slate-500 text-xs italic">到着記録はありません</p>
                   )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.ADMIN_LOGS && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">運行ログ管理</h2>
                <div className="flex gap-2">
                  <button onClick={() => setView(AppView.MASTER_DATA)} className="bg-white border border-slate-200 p-2 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                    <Building2 className="w-5 h-5" />
                    <span className="hidden md:inline text-sm font-bold">マスタ編集</span>
                  </button>
                  <button 
                    onClick={downloadCSV} 
                    disabled={filteredAdminLogs.length === 0} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    CSV出力
                  </button>
                </div>
              </div>

              <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                {(['ALL', '1号車', '2号車', '3号車'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setAdminLogFilter(v)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      adminLogFilter === v 
                        ? 'bg-slate-900 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {v === 'ALL' ? '全車両' : v}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                {filteredAdminLogs.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-4 py-3">到着時刻</th>
                        <th className="px-4 py-3">車両</th>
                        <th className="px-4 py-3">地点</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminLogs.map(log => (
                        <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap font-mono text-xs text-slate-500">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getVehicleBadgeColor(log.vehicleId)}`}>
                              {log.vehicleId}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-800">{log.locationName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-16 text-center">
                    <Filter className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm italic">該当する到着データはありません</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
              <button onClick={() => setIsChangingPw(!isChangingPw)} className="text-xs font-bold text-slate-400 hover:text-blue-500 flex items-center gap-1 uppercase tracking-wider transition-colors">
                <KeyRound className="w-3.5 h-3.5" />
                パスワード変更
              </button>
              <button 
                onClick={() => { if(confirm("表示中の運行ログを消去しますか？（※フィルターに関わらず全てのログが対象です）")) { setLogs([]); localStorage.removeItem('machikado_logs'); } }}
                className="flex items-center gap-1 text-[10px] text-red-400 font-bold hover:text-red-600 uppercase tracking-tighter transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                ログをリセット
              </button>
            </div>

            {isChangingPw && (
              <div className="bg-slate-100 p-4 rounded-xl space-y-3 animate-in slide-in-from-bottom-2 duration-200 shadow-inner">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">新しいパスワードを設定</h4>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="4文字以上..."
                    className="flex-1 border-2 border-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 shadow-sm"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button onClick={updatePassword} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-slate-900 transition-all">保存</button>
                  <button onClick={() => setIsChangingPw(false)} className="px-4 py-2 text-xs font-bold text-slate-400">閉じる</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === AppView.MASTER_DATA && (
          <div className="space-y-10 animate-in fade-in duration-300">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setView(AppView.ADMIN_LOGS)} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-medium transition-colors">
                  管理者
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className="font-bold text-slate-800">地点マスタ設定</span>
              </div>
              <MasterDataList 
                masters={masters} 
                onAdd={(m) => {
                  const newM = { ...m, id: Math.random().toString(36).substr(2, 9) };
                  const updated = [...masters, newM];
                  setMasters(updated);
                  localStorage.setItem('machikado_masters', JSON.stringify(updated));
                }} 
                onDelete={(id) => {
                  const updated = masters.filter(m => m.id !== id);
                  setMasters(updated);
                  localStorage.setItem('machikado_masters', JSON.stringify(updated));
                }} 
              />
            </div>

            <div className="pt-6 border-t border-slate-200">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                 <Truck className="w-5 h-5 text-blue-500" />
                 車両ナンバー設定（誤選択防止）
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {(['1号車', '2号車', '3号車'] as VehicleId[]).map(v => (
                   <div key={v} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                     <div className="flex items-center justify-between">
                       <span className={`px-2.5 py-1 rounded-md text-xs font-black border ${getVehicleBadgeColor(v)}`}>{v}</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auth Code</span>
                     </div>
                     <input 
                       type="text" 
                       maxLength={4}
                       placeholder="0000"
                       className="w-full text-center text-xl font-mono py-2 border-2 border-slate-50 rounded-xl outline-none focus:border-blue-400 transition-all bg-slate-50"
                       value={vehiclePins[v]}
                       onChange={(e) => updateVehiclePin(v, e.target.value)}
                     />
                     <p className="text-[9px] text-slate-400 text-center leading-tight">
                       車両選択時に入力する<br/>4桁の数字を設定してください。
                     </p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-auto">
        &copy; 2025 まちかど便 運行管理 v1.1
      </footer>
    </div>
  );
};

export default App;
