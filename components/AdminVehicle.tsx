
import React, { useState } from 'react';
import { Vehicle } from '../types';

const AdminVehicle: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    active: true
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: '1', name: '1号車', active: true, code4_hash: '0000' },
    { id: '2', name: '2号車', active: true, code4_hash: '1234' },
    { id: '3', name: '3号車', active: true, code4_hash: '5678' },
  ]);

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      code: vehicle.code4_hash,
      active: vehicle.active
    });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingVehicle(null);
    setFormData({ name: '', code: '', active: true });
    setIsFormOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('この車両を削除してもよろしいですか？')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleSave = () => {
    if (!formData.name || formData.code.length !== 4) {
      alert('名称と4桁のコードを入力してください');
      return;
    }

    const newVehicle: Vehicle = {
      id: editingVehicle ? editingVehicle.id : `${Date.now()}`,
      name: formData.name,
      active: formData.active,
      code4_hash: formData.code
    };

    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? newVehicle : v));
    } else {
      setVehicles(prev => [...prev, newVehicle]);
    }

    setIsFormOpen(false);
    setEditingVehicle(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            <span>管理者</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            <span className="text-blue-600">車両設定</span>
          </nav>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">車両管理</h2>
        </div>
        <button 
          type="button"
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-100 hover:shadow-2xl hover:shadow-blue-200 transition-all active:scale-95"
        >
          <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          新規車両を追加
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-[2.5rem] border border-blue-200 shadow-2xl overflow-hidden animate-in slide-in-from-top-4 duration-500 p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-800">{editingVehicle ? '車両情報を編集' : '車両情報を追加'}</h3>
            <button type="button" onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">車両名称</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="例: 4号車" 
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-lg font-black outline-none focus:border-blue-400 focus:bg-white transition-all" 
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">ナンバーコード (4桁)</label>
                <input 
                  type="text" 
                  maxLength={4} 
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value.replace(/\D/g, '')})}
                  placeholder="0000" 
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-50 rounded-[1.5rem] text-2xl font-mono font-black outline-none focus:border-blue-400 focus:bg-white transition-all tracking-widest" 
                />
              </div>
              <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" 
                  />
                  <span className="text-sm font-black text-slate-600 group-hover:text-slate-900 transition">運行可能状態にする</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col justify-end gap-5">
              <button 
                type="button"
                onClick={handleSave}
                className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
              >
                {editingVehicle ? '変更を保存する' : '車両を保存する'}
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)} className="w-full py-4 text-sm font-black text-slate-400 uppercase tracking-widest">キャンセル</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <svg className="w-8 h-8 text-blue-600 group-hover:text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 18.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></svg>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => handleEdit(v)} 
                  className="p-2.5 text-slate-300 hover:text-blue-600 transition-all"
                >
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleDelete(e, v.id)} 
                  className="p-2.5 text-slate-300 hover:text-rose-500 transition-all"
                >
                  <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">{v.name}</h3>
            <div className="flex items-center justify-between">
               <span className="text-xl font-mono font-black text-blue-600 tracking-widest">{v.code4_hash}</span>
               <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${v.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                 {v.active ? '有効' : '停止中'}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminVehicle;
