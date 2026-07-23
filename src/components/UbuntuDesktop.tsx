import { X, Terminal, Folder, Chrome, LayoutGrid, Unlock, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UbuntuDesktopProps {
  onClose: () => void;
}

export function UbuntuDesktop({ onClose }: UbuntuDesktopProps) {
  const [time, setTime] = useState<string>('');
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === 'kira123') {
      setIsLocked(false);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto bg-slate-900 font-sans animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950 opacity-80" />
        
        <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 text-center">
          <div className="text-6xl font-light text-white mb-12 drop-shadow-md">
            {time.split(',')[0]}
          </div>
          
          <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6 shadow-xl border-2 border-slate-600">
            <User size={48} className="text-slate-300" />
          </div>
          
          <h2 className="text-xl font-medium text-white mb-6">Ava</h2>
          
          <form onSubmit={handleLogin} className="w-full relative">
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-600 rounded-md py-2.5 px-4 text-white text-center focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-inner backdrop-blur-sm transition-all"
              autoFocus
            />
            {errorMsg && (
              <div className="absolute top-full left-0 w-full mt-2 text-red-400 text-sm animate-pulse">
                {errorMsg}
              </div>
            )}
            <button type="submit" className="hidden">Login</button>
          </form>
        </div>
        
        <div className="absolute top-4 right-4 flex gap-4 text-white/80">
          <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">EN</span>
          <span>📶</span>
          <span>🔋</span>
          <button onClick={onClose} className="hover:text-red-400 transition ml-2">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col pointer-events-auto bg-slate-100 text-slate-800 font-sans animate-in zoom-in-95 duration-300">
      {/* Background Wallpaper Gradient - Light Grey/White */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-100 to-slate-200 pointer-events-none" />

      {/* Top Panel - Light Theme */}
      <div className="relative z-10 h-7 bg-white/80 text-sm flex items-center justify-between px-4 border-b border-slate-300 shadow-sm backdrop-blur-md">
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          <span className="hover:text-black cursor-pointer">Activities</span>
        </div>
        <div className="font-semibold text-slate-800">
          {time}
        </div>
        <div className="flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px] font-bold">EN</span>
            <div className="flex gap-2">
              <span className="opacity-80">📶</span>
              <span className="opacity-80">🔊</span>
              <span className="opacity-80">🔋</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-red-500 transition" title="Power Off (Close)">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Desktop Area */}
      <div className="relative z-0 flex-1 flex">
        {/* Left Dock - Light Theme */}
        <div className="w-16 h-full bg-white/60 flex flex-col items-center py-4 gap-4 border-r border-slate-300 backdrop-blur-md shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
          <button className="p-2.5 rounded-xl hover:bg-slate-200/80 transition group relative">
            <Chrome size={28} className="text-blue-500 drop-shadow-sm" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-slate-200 text-slate-700 font-medium">Web Browser</span>
          </button>
          <button className="p-2.5 rounded-xl hover:bg-slate-200/80 transition group relative">
            <Folder size={28} className="text-blue-600 fill-blue-500/20 drop-shadow-sm" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-slate-200 text-slate-700 font-medium">Files</span>
          </button>
          <button className="p-2.5 rounded-xl hover:bg-slate-200/80 transition group relative">
            <Terminal size={28} className="text-slate-700 drop-shadow-sm" />
            <span className="absolute left-14 bg-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-slate-200 text-slate-700 font-medium">Terminal</span>
          </button>
          
          <div className="mt-auto pt-4 border-t border-slate-300 w-full flex justify-center">
            <button className="p-2.5 rounded-xl hover:bg-slate-200/80 transition group relative">
              <LayoutGrid size={28} className="text-slate-500 group-hover:text-slate-800 transition" />
              <span className="absolute left-14 bg-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-slate-200 text-slate-700 font-medium">Show Applications</span>
            </button>
          </div>
        </div>

        {/* Desktop Workspace */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto mt-20 bg-white border border-slate-300 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Window Header */}
            <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 justify-between">
              <div className="text-sm font-semibold text-slate-700">Terminal</div>
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 hover:bg-slate-400 transition cursor-pointer"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 hover:bg-slate-400 transition cursor-pointer"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-red-400 flex items-center justify-center cursor-pointer hover:bg-red-500 transition group" onClick={onClose}>
                  <X size={10} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>
            {/* Window Body */}
            <div className="p-4 font-mono text-sm text-slate-800 h-64 overflow-y-auto bg-white">
              <div>user@ubuntu:~$ echo "Welcome to the Ubuntu OS integration!"</div>
              <div className="text-slate-600">Welcome to the Ubuntu OS integration!</div>
              <div className="mt-2">user@ubuntu:~$ _<span className="animate-pulse">|</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
