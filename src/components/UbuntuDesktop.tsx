import { X, Terminal, Folder, Chrome, LayoutGrid } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UbuntuDesktopProps {
  onClose: () => void;
}

export function UbuntuDesktop({ onClose }: UbuntuDesktopProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col pointer-events-auto bg-[#300a24] text-white font-sans animate-in zoom-in-95 duration-300">
      {/* Background Wallpaper Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e95420]/20 via-[#77216f]/40 to-[#2c001e]/80 pointer-events-none" />

      {/* Top Panel */}
      <div className="relative z-10 h-7 bg-black/90 text-sm flex items-center justify-between px-4 border-b border-white/10 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-4 text-slate-300 font-semibold">
          <span className="hover:text-white cursor-pointer">Activities</span>
        </div>
        <div className="font-bold text-slate-200">
          {time}
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center text-[10px]">EN</span>
            <div className="flex gap-2">
              <span className="opacity-80">📶</span>
              <span className="opacity-80">🔊</span>
              <span className="opacity-80">🔋</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-red-400 transition" title="Power Off (Close)">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Desktop Area */}
      <div className="relative z-0 flex-1 flex">
        {/* Left Dock */}
        <div className="w-16 h-full bg-black/60 flex flex-col items-center py-4 gap-4 border-r border-white/5 backdrop-blur-sm">
          <button className="p-2.5 rounded-xl hover:bg-white/10 transition group relative">
            <Chrome size={28} className="text-orange-400 drop-shadow-md" />
            <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Web Browser</span>
          </button>
          <button className="p-2.5 rounded-xl hover:bg-white/10 transition group relative">
            <Folder size={28} className="text-[#e95420] fill-[#e95420] drop-shadow-md" />
            <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Files</span>
          </button>
          <button className="p-2.5 rounded-xl hover:bg-white/10 transition group relative">
            <Terminal size={28} className="text-slate-300 drop-shadow-md" />
            <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Terminal</span>
          </button>
          
          <div className="mt-auto pt-4 border-t border-white/10 w-full flex justify-center">
            <button className="p-2.5 rounded-xl hover:bg-white/10 transition group relative">
              <LayoutGrid size={28} className="text-slate-400 group-hover:text-white transition" />
              <span className="absolute left-14 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">Show Applications</span>
            </button>
          </div>
        </div>

        {/* Desktop Workspace */}
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto mt-20 bg-[#2c001e]/80 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
            <div className="h-10 bg-[#3d3d3d] border-b border-black flex items-center px-4 justify-between">
              <div className="text-sm font-bold text-slate-300">Terminal</div>
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-600"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-600"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center cursor-pointer hover:bg-orange-400" onClick={onClose}>
                  <X size={10} className="text-black opacity-0 hover:opacity-100" />
                </div>
              </div>
            </div>
            <div className="p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto">
              <div>user@ubuntu:~$ echo "Welcome to the Ubuntu OS integration!"</div>
              <div>Welcome to the Ubuntu OS integration!</div>
              <div className="mt-2">user@ubuntu:~$ _<span className="animate-pulse">|</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
