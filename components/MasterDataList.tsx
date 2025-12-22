
import React, { useState, useEffect, useRef } from 'react';
import { StopMaster } from '../types';
import { Trash2, PlusCircle, Search, Map as MapIcon, MapPin, Navigation } from 'lucide-react';

declare var L: any;

interface MasterDataListProps {
  masters: StopMaster[];
  onAdd: (m: Omit<StopMaster, 'id'>) => void;
  onDelete: (id: string) => void;
}

interface SearchCandidate {
  display_name: string;
  lat: string;
  lon: string;
}

const MasterDataList: React.FC<MasterDataListProps> = ({ masters, onAdd, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLng, setNewLng] = useState('');
  const [newIsBase, setNewIsBase] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [addressSearch, setAddressSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<SearchCandidate[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const filtered = masters.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (showMapPicker && mapContainerRef.current) {
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([26.2124, 127.6809], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapRef.current);

        mapRef.current.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setNewLat(lat.toFixed(6));
          setNewLng(lng.toFixed(6));
          updateMarker(lat, lng);
        });
      }

      const map = mapRef.current;
      if (newLat && newLng) {
        updateMarker(parseFloat(newLat), parseFloat(newLng));
        map.setView([parseFloat(newLat), parseFloat(newLng)]);
      }
    }
  }, [showMapPicker]);

  const updateMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setNewLat(pos.lat.toFixed(6));
        setNewLng(pos.lng.toFixed(6));
      });
    }
  };

  const selectLocation = (lat: number, lng: number) => {
    setNewLat(lat.toFixed(6));
    setNewLng(lng.toFixed(6));
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 17);
      updateMarker(lat, lng);
    }
    setCandidates([]);
  };

  const handleSearchAddress = async () => {
    if (!addressSearch || isSearching) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}&limit=5&viewbox=127.5,27.0,128.5,26.0`);
      const data = await res.json();
      setCandidates(data || []);
    } catch (e) {
      alert("検索中にエラーが発生しました。");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = () => {
    if (!newName || !newLat || !newLng) return alert("情報を入力してください。");
    onAdd({ name: newName, latitude: parseFloat(newLat), longitude: parseFloat(newLng), isBase: newIsBase });
    resetForm();
  };

  const resetForm = () => {
    setNewName(''); setNewLat(''); setNewLng(''); setNewIsBase(false);
    setIsAdding(false); setShowMapPicker(false); setCandidates([]);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="登録済みマスタを検索..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold shadow-md active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          新規マスタ登録
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-blue-500" />
              地点マスタ登録
            </h3>
            <button 
              onClick={() => setShowMapPicker(!showMapPicker)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${showMapPicker ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-inner' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {showMapPicker ? '地図を閉じる' : '地図から位置を選択'}
            </button>
          </div>

          {showMapPicker && (
            <div className="mb-6 animate-in zoom-in-95 duration-200 space-y-2">
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  placeholder="住所や施設名で検索..."
                  className="flex-1 px-4 py-2 border-2 border-slate-100 rounded-lg text-sm outline-none focus:border-blue-400"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                />
                <button onClick={handleSearchAddress} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold">検索</button>
                {candidates.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-2xl z-[1000] overflow-hidden">
                    {candidates.map((c, i) => (
                      <button key={i} className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-50 text-xs flex items-start gap-2" onClick={() => selectLocation(parseFloat(c.lat), parseFloat(c.lon))}>
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{c.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden relative">
                <div ref={mapContainerRef} className="w-full h-[300px] z-0" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">地点名称</label>
              <input type="text" className="w-full border-2 border-slate-100 rounded-md p-2 outline-none focus:border-blue-400 font-bold" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">緯度/経度</label>
              <div className="flex gap-1">
                <input type="text" readOnly className="w-1/2 bg-slate-50 border border-slate-100 rounded p-1.5 text-[10px] font-mono" value={newLat} />
                <input type="text" readOnly className="w-1/2 bg-slate-50 border border-slate-100 rounded p-1.5 text-[10px] font-mono" value={newLng} />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
             <label className="flex items-center gap-2 cursor-pointer">
               <input type="checkbox" checked={newIsBase} onChange={e => setNewIsBase(e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
               <span className="text-sm font-bold text-slate-600">拠点として登録</span>
             </label>
             <div className="flex gap-2">
               <button onClick={resetForm} className="px-4 py-2 text-slate-400 font-bold hover:bg-slate-50 rounded-lg">キャンセル</button>
               <button onClick={handleAdd} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg">保存</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">地点名称</th>
              <th className="px-6 py-4">種別</th>
              <th className="px-6 py-4">座標</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-700">{m.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${m.isBase ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {m.isBase ? 'BASE' : 'STOP'}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                  {m.latitude.toFixed(4)}, {m.longitude.toFixed(4)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => onDelete(m.id)}
                    className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-all shadow-sm flex items-center justify-center ml-auto"
                    title="地点を削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterDataList;
