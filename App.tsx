
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DriverView from './components/DriverView';
import AdminLog from './components/AdminLog';
import AdminMaster from './components/AdminMaster';
import AdminVehicle from './components/AdminVehicle';
import AdminAuth from './components/AdminAuth';
import { ViewMode } from './types';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('driver');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminView, setAdminView] = useState<'log' | 'master' | 'vehicle'>('log');

  const handleAdminAuth = (success: boolean) => {
    if (success) {
      setIsAdminAuthenticated(true);
    } else {
      setViewMode('driver');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header 
        viewMode={viewMode} 
        setViewMode={(mode) => {
          if (mode === 'admin' && !isAdminAuthenticated) {
            setViewMode('admin'); // Show auth modal
          } else {
            setViewMode(mode);
          }
        }} 
      />

      <main className="flex-1">
        {viewMode === 'driver' ? (
          <DriverView />
        ) : !isAdminAuthenticated ? (
          <AdminAuth onAuth={handleAdminAuth} onCancel={() => setViewMode('driver')} />
        ) : (
          <div className="container mx-auto px-4 py-6 max-w-5xl">
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8 w-fit mx-auto">
              <button 
                onClick={() => setAdminView('log')}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${adminView === 'log' ? 'bg-[#0b1222] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                運行ログ
              </button>
              <button 
                onClick={() => setAdminView('master')}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${adminView === 'master' ? 'bg-[#0b1222] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                地点マスタ
              </button>
              <button 
                onClick={() => setAdminView('vehicle')}
                className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${adminView === 'vehicle' ? 'bg-[#0b1222] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                車両管理
              </button>
            </div>
            
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {adminView === 'log' && <AdminLog />}
              {adminView === 'master' && <AdminMaster />}
              {adminView === 'vehicle' && <AdminVehicle />}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 text-center">
        <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">
          © 2025 まちかど便 運行管理システム V1.2
        </p>
      </footer>
    </div>
  );
};

export default App;
