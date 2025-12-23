
import React, { useState, useMemo } from 'react';
import { DetectedStop } from '../types';

const AdminLog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | '1' | '2' | '3'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [selectedDate, setSelectedDate] = useState<string>('');
  
  const mockLogs: DetectedStop[] = [
    {
      id: 'l1',
      vehicle_id: '1',
      vehicle_name: '1号車',
      stop_master_id: 'm1',
      stop_name: '中央配送センター',
      start_at: '2025-05-20T08:00:00Z',
      end_at: '2025-05-20T08:15:00Z',
      duration_sec: 900,
      center_lat: 35.6812,
      center_lon: 139.7671
    },
    {
      id: 'l2',
      vehicle_id: '2',
      vehicle_name: '2号車',
      stop_master_id: 'm2',
      stop_name: '新宿北ステーション',
      start_at: '2025-05-20T10:30:00Z',
      end_at: '2025-05-20T10:45:00Z',
      duration_sec: 900,
      center_lat: 35.6938,
      center_lon: 139.7034
    }
  ];

  const filteredLogs = useMemo(() => {
    return mockLogs.filter(log => {
      const logMonthStr = log.start_at.substring(0, 7);
      const logDateStr = log.start_at.substring(0, 10);
      const vehicleMatch = activeTab === 'all' || log.vehicle_id === activeTab;
      const monthMatch = !selectedMonth || logMonthStr === selectedMonth;
      const dateMatch = !selectedDate || logDateStr === selectedDate;
      return vehicleMatch && monthMatch && dateMatch;
    });
  }, [activeTab, selectedMonth, selectedDate]);

  const monthOptions = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">運行ログ管理</h2>
        <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
          CSV出力
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">表示月の選択</label>
            <select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDate(''); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700">
              <option value="">全ての期間</option>
              {monthOptions.map(m => ( <option key={m} value={m}>{m.replace('-', '年')}月</option> ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">日付を指定</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700" />
          </div>
        </div>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {['all', '1', '2', '3'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-[#0b1222] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab === 'all' ? '全車両' : `${tab}号車`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">日付 / 時刻</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">車両</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">停留所</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">滞在</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => {
                const d = new Date(log.start_at);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <span className="text-[13px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                          {d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                        </span>
                        <span className="text-xl font-mono font-black text-slate-700">
                          {d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase">{log.vehicle_name}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{log.stop_name}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-black text-blue-600">{Math.round(log.duration_sec / 60)}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">分間</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminLog;
