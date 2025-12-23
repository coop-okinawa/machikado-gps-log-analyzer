
import React from 'react';
import { ViewMode } from '../types';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode }) => {
  return (
    <header className="bg-[#0b1222] text-white px-5 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-white p-2 rounded-xl shadow-sm">
          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none tracking-tight">まちかど便</h1>
          <p className="text-[10px] text-blue-300 font-bold tracking-widest mt-1 opacity-80 uppercase">運行判定システム</p>
        </div>
      </div>

      <div className="flex bg-[#1f2937]/50 p-1 rounded-xl">
        <button
          onClick={() => setViewMode('driver')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${viewMode === 'driver' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          ドライバー
        </button>
        <button
          onClick={() => setViewMode('admin')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${viewMode === 'admin' ? 'bg-[#2563eb] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          管理者
        </button>
      </div>
    </header>
  );
};

export default Header;
