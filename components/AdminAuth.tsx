
import React, { useState } from 'react';

interface AdminAuthProps {
  onAuth: (success: boolean) => void;
  onCancel: () => void;
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onAuth, onCancel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '0000') {
      onAuth(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b1222]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-12">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">管理者認証</h2>
            <p className="text-sm text-slate-400 font-bold leading-relaxed">
              システム設定へアクセスするには<br/>パスワードを入力してください。
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full text-center text-5xl font-mono py-10 rounded-[2.5rem] border-4 transition-all outline-none bg-slate-50 tracking-[0.2em] ${error ? 'border-rose-500 bg-rose-50 ring-8 ring-rose-100' : 'border-slate-50 group-hover:border-slate-100 focus:border-blue-500 focus:bg-white focus:ring-12 focus:ring-blue-50'}`}
                placeholder="****"
                autoFocus
              />
              {error && (
                <div className="absolute -bottom-8 left-0 right-0 text-center">
                  <p className="text-xs text-rose-600 font-black uppercase tracking-widest animate-bounce">パスワードが正しくありません</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-5 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="py-6 rounded-3xl text-sm font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="py-6 rounded-3xl bg-blue-600 text-white font-black text-xl shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.5)] active:scale-95 transition-all uppercase tracking-widest"
              >
                認証
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
