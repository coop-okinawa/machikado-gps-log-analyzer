
import React from 'react';
import { AnalysisResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDuration, formatDate } from '../utils/geoUtils';
import { Clock, Navigation, MapPin, CheckCircle2 } from 'lucide-react';

interface AnalysisSummaryProps {
  result: AnalysisResult;
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({ result }) => {
  const chartData = result.confirmedStops.map(s => ({
    name: s.matchedMasterName || '不明',
    duration: s.durationMinutes,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Navigation className="w-4 h-4" />
            <span className="text-sm font-medium">総走行距離</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{result.totalDistanceKm.toFixed(1)} <span className="text-sm font-normal text-slate-400">km</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">停留候補(3分+)</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{result.stays.length} <span className="text-sm font-normal text-slate-400">回</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
          <div className="flex items-center gap-3 text-green-600 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">確定停留所</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{result.confirmedStops.length} <span className="text-sm font-normal text-slate-400">箇所</span></div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">データ点数</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{result.totalPoints} <span className="text-sm font-normal text-slate-400">pts</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            停留時間分析
            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">確定停留所のみ</span>
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`${parseFloat(value).toFixed(1)} 分`, '滞在時間']}
                />
                <Bar dataKey="duration" radius={[0, 4, 4, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6">確定停留イベント詳細</h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {result.confirmedStops.map((stop, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all">
                <div className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{stop.matchedMasterName}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(stop.startTime)} 〜 {formatDate(stop.endTime)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-blue-600">{formatDuration(stop.durationMinutes)}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Stay duration</div>
                </div>
              </div>
            ))}
            {result.confirmedStops.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm italic">
                確定停留データはありません
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSummary;
