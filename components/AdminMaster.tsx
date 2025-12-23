
import React, { useState, useEffect } from 'react';
import { StopMaster } from '../types';

const AdminMaster: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState<StopMaster | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', lat: '', lon: '', type: 'STOP' as 'BASE' | 'STOP' });
  const [masters, setMasters] = useState<StopMaster[]>([
    { id: 'm1', name: '中央配送センター', lat: 35.6812, lon: 139.7671, type: 'BASE', radius_m: 30 },
    { id: 'm2', name: '新宿北ステーション', lat: 35.6938, lon: 139.7034, type: 'STOP', radius_m: 30 },
  ]);

  useEffect(() => {
    if (isFormOpen && (window as any).L) {
      const initialLat = editingMaster ? editingMaster.lat : 35.6812;
      const initialLon = editingMaster ? editingMaster.lon : 139.7671;
      
      const container = document.getElementById('master-map');
      if (container) {
        // すでにマップがある場合は一度破棄して再作成（Leafletの仕様）
        const map = (window as any).L.map('master-map').setView([initialLat, initialLon], 13);
        (window as any).L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        let marker = editingMaster ? (window as any).L.marker([editingMaster.lat, editingMaster.lon]).addTo(map) : null;

        map.on('click', (e: any) => {
          if (marker) map.removeLayer(marker);
          marker = (window as any).L.marker(e.latlng).addTo(map);
          setFormData(prev => ({ ...prev, lat: e.latlng.lat.toFixed(6), lon: e.latlng.lng.toFixed(6) }));
        });

        return () => map.remove();
      }
    }
  }, [isFormOpen, editingMaster]);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('この地点を削除してもよろしいですか？')) {
      setMasters(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.lat || !formData.lon) {
      alert('すべての項目を入力してください');
      return;
    }

    const newMaster: StopMaster = {
      id: editingMaster ? editingMaster.id : `m${Date.now()}`,
      name: formData.name,
      lat: parseFloat(formData.lat),
      lon: parseFloat(formData.lon),
      type: formData.type,
      radius_m: 30
    };

    if (editingMaster) {
      setMasters(prev => prev.map(m => m.id === editingMaster.id ? newMaster : m));
    } else {
      setMasters(prev => [...prev, newMaster]);
    }
    
    setIsFormOpen(false);
    setEditingMaster(null);
  };

  const filteredMasters = masters.filter(m => m.name.includes(searchQuery));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <nav className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            <span>管理者</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            <span className="text-blue-600">地点マスタ設定</span>
          </nav>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">地点マスタ</h2>
        </div>
        <button onClick={() => { setEditingMaster(null); setFormData({name:'', lat:'', lon:'', type:'STOP'}); setIsFormOpen(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95">
          新規マスタ登録
        </button>
      </div>

      <div className="relative group">
        <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="地点名称で検索…"
          className="w-full pl-16 pr-6 py-5 bg-white rounded-3xl border border-slate-200 focus:border-blue-500 outline-none transition-all shadow-sm text-lg font-bold"
        />
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-[2.5rem] border border-blue-200 shadow-2xl overflow-hidden p-8 animate-in slide-in-from-top-4 duration-500">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800">{editingMaster ? '地点情報を編集' : '新規地点を登録'}</h3>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">地点名称</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold outline-none focus:border-blue-400 transition-all" 
                  placeholder="名称を入力"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">緯度</label>
                  <input type="text" value={formData.lat} onChange={(e) => setFormData({...formData, lat: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono outline-none" placeholder="35.xxxx" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">経度</label>
                  <input type="text" value={formData.lon} onChange={(e) => setFormData({...formData, lon: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono outline-none" placeholder="139.xxxx" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={formData.type === 'BASE'}
                  onChange={(e) => setFormData({...formData, type: e.target.checked ? 'BASE' : 'STOP'})}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <span className="text-sm font-black text-slate-600">拠点(BASE)として登録</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div id="master-map" className="h-[250px] bg-slate-100 rounded-[2rem] border-2 border-slate-100 overflow-hidden"></div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 text-sm font-black text-slate-400 uppercase tracking-widest">キャンセル</button>
                <button type="button" onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all">保存する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">地点名称</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">種別</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMasters.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{m.name}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${m.type === 'BASE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{m.type}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditingMaster(m); setFormData({ name: m.name, lat: m.lat.toString(), lon: m.lon.toString(), type: m.type }); setIsFormOpen(true); }} className="p-3 text-slate-300 hover:text-blue-600 transition-all">
                        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button onClick={(e) => handleDelete(e, m.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all">
                        <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMaster;
