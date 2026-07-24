import { X, Terminal, Folder, Chrome, LayoutGrid, User, Minus, Square } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { resolvePath, getNodeAtPath } from '../utils/mockFileSystem';
import { Game2048 } from './Game2048';

interface UbuntuDesktopProps {
  onClose: () => void;
}

type AppType = 'terminal' | 'files' | 'image' | 'game2048';

interface WindowState {
  id: string;
  type: AppType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMaximized?: boolean;
  data?: any; // e.g., image src
}

export function UbuntuDesktop({ onClose }: UbuntuDesktopProps) {
  const [time, setTime] = useState<string>('');
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Window Manager State
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeZIndex, setActiveZIndex] = useState(10);

  // App Specific Global States (so they persist while moving/resizing)
  const [terminalHistory, setTerminalHistory] = useState<{ type: 'command' | 'output'; text: string }[]>([
    { type: 'output', text: 'Welcome to the Ubuntu OS integration!' },
    { type: 'output', text: 'Type "help" to see available commands.' }
  ]);
  const [terminalDir, setTerminalDir] = useState('/home/user');
  const [terminalInput, setTerminalInput] = useState('');
  
  const [filesDir, setFilesDir] = useState('/home/user');

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

  // ---- Window Manager Functions ----
  const bringToFront = (id: string) => {
    setActiveZIndex(prev => prev + 1);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: activeZIndex + 1 } : w));
  };

  const openApp = (type: AppType, data?: any) => {
    const existing = windows.find(w => w.type === type && type !== 'image'); // allow multiple images, but single instances of others
    if (existing) {
      bringToFront(existing.id);
      return;
    }

    const newZIndex = activeZIndex + 1;
    setActiveZIndex(newZIndex);

    const newWindow: WindowState = {
      id: `${type}-${Date.now()}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      x: 100 + (windows.length * 30),
      y: 50 + (windows.length * 30),
      width: type === 'game2048' ? 360 : type === 'terminal' ? 600 : 700,
      height: type === 'game2048' ? 480 : 450,
      zIndex: newZIndex,
      data
    };
    setWindows(prev => [...prev, newWindow]);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const updateWindowPosSize = (id: string, x: number, y: number, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y, width, height } : w));
  };

  // ---- Terminal Logic ----
  const executeTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalHistory(prev => [...prev, { type: 'command', text: `user@ubuntu:${terminalDir === '/home/user' ? '~' : terminalDir}$ ${cmd}` }]);
    setTerminalInput('');

    const args = cmd.split(' ').filter(Boolean);
    const command = args[0].toLowerCase();

    setTimeout(() => {
      let output = '';
      
      switch (command) {
        case 'clear':
          setTerminalHistory([]);
          return;
        case 'pwd':
          output = terminalDir;
          break;
        case 'whoami':
          output = 'user';
          break;
        case 'echo':
          output = args.slice(1).join(' ');
          break;
        case 'cd': {
          const target = args[1] || '/home/user';
          const newPath = resolvePath(terminalDir, target);
          if (!newPath) {
            output = `cd: ${target}: No such file or directory`;
          } else {
            const node = getNodeAtPath(newPath);
            if (!node || node.type !== 'dir') {
              output = `cd: ${target}: No such file or directory`;
            } else {
              setTerminalDir(newPath);
              return;
            }
          }
          break;
        }
        case 'ls': {
          let target = '.';
          for (let i = 1; i < args.length; i++) {
            if (!args[i].startsWith('-')) target = args[i];
          }
          const targetPath = resolvePath(terminalDir, target);
          if (!targetPath) {
             output = `ls: cannot access '${target}': No such file or directory`;
          } else {
            const node = getNodeAtPath(targetPath);
            if (!node) {
              output = `ls: cannot access '${target}': No such file or directory`;
            } else if (node.type === 'file') {
              output = target;
            } else {
              let children = Object.keys(node.children).filter(c => !c.startsWith('.'));
              output = children.map(c => node.children[c].type === 'dir' ? `${c}/` : c).join('  ');
            }
          }
          break;
        }
        case 'cat':
        case 'open': {
          if (!args[1]) {
            output = `${command}: missing operand`;
            break;
          }
          const targetPath = resolvePath(terminalDir, args[1]);
          if (!targetPath) {
             output = `${command}: ${args[1]}: No such file or directory`;
          } else {
            const node = getNodeAtPath(targetPath);
            if (!node || node.type === 'dir') {
              output = `${command}: ${args[1]}: No such file`;
            } else {
              output = node.content;
              if (args[1].includes('vacation4_feets.png')) window.dispatchEvent(new CustomEvent('avaFeetPicFound'));
            }
          }
          break;
        }
        case 'help':
          output = 'Available commands: cd, ls, cat, pwd, echo, clear, whoami, help';
          break;
        default:
          output = `${command}: command not found`;
      }

      if (output) {
        setTerminalHistory(prev => [...prev, { type: 'output', text: output }]);
      }
    }, 50);
  };

  // ---- Renders ----
  if (isLocked) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto bg-slate-900 font-sans animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 to-slate-950/90" />
        
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
      </div>
    );
  }

  const renderWindowContent = (win: WindowState) => {
    switch (win.type) {
      case 'terminal':
        return (
          <div className="flex-1 bg-[#2d0922] font-mono text-sm text-slate-300 flex flex-col h-full rounded-b-lg overflow-hidden">
            <div className="flex-1 p-2 overflow-y-auto" onClick={() => document.getElementById(`term-${win.id}`)?.focus()}>
              {terminalHistory.map((item, idx) => (
                <div key={idx} className={`whitespace-pre-wrap ${item.type === 'command' ? 'text-[#85c010] font-semibold' : 'text-slate-300'} mb-1 leading-snug`}>
                  {item.text}
                </div>
              ))}
              <form onSubmit={executeTerminalCommand} className="flex mt-1">
                <span className="text-[#85c010] font-semibold mr-2 shrink-0">
                  user@ubuntu:{terminalDir === '/home/user' ? '~' : terminalDir}$
                </span>
                <input 
                  id={`term-${win.id}`}
                  type="text" 
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-300 caret-slate-300"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            </div>
          </div>
        );
      
      case 'files':
        return (
          <div className="flex-1 flex bg-[#fafafa] overflow-hidden rounded-b-lg h-full">
            <div className="w-40 bg-[#f6f6f6] border-r border-[#d3d3d3] p-2 flex flex-col gap-1">
              <button onClick={() => setFilesDir('/home/user')} className="flex items-center gap-2 text-sm text-[#4d4d4d] hover:bg-[#e0e0e0] p-1.5 rounded transition">
                <Folder size={16} className="text-[#e95420]" /> Home
              </button>
              <button onClick={() => setFilesDir('/home/user/Desktop')} className="flex items-center gap-2 text-sm text-[#4d4d4d] hover:bg-[#e0e0e0] p-1.5 rounded transition">
                <Folder size={16} className="text-[#e95420]" /> Desktop
              </button>
              <button onClick={() => setFilesDir('/home/user/Pictures')} className="flex items-center gap-2 text-sm text-[#4d4d4d] hover:bg-[#e0e0e0] p-1.5 rounded transition">
                <Folder size={16} className="text-[#e95420]" /> Pictures
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setFilesDir(filesDir.split('/').slice(0, -1).join('/') || '/home/user')}
                  className="p-1 border border-[#d3d3d3] bg-white hover:bg-slate-50 rounded"
                >←</button>
                <div className="text-sm bg-white border border-[#d3d3d3] px-2 py-1 rounded flex-1 text-slate-600 shadow-inner">
                  {filesDir}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {(() => {
                  const node = getNodeAtPath(filesDir);
                  if (!node || node.type !== 'dir') return <div className="col-span-4 text-slate-500 text-center mt-10">Folder empty.</div>;
                  
                  return Object.keys(node.children).map(childName => {
                    const childNode = node.children[childName];
                    if (childName.startsWith('.')) return null; 
                    
                    return (
                      <div 
                        key={childName}
                        className="flex flex-col items-center gap-1 cursor-pointer p-2 hover:bg-[#e95420]/10 rounded border border-transparent hover:border-[#e95420]/30 transition"
                        onDoubleClick={() => {
                          if (childNode.type === 'dir') {
                            setFilesDir(`${filesDir}/${childName}`);
                          } else if (childNode.type === 'file' && childNode.isImage) {
                            openApp('image', childNode.content);
                          }
                        }}
                      >
                        <div className="w-12 h-12 flex items-center justify-center mb-1">
                          {childNode.type === 'dir' ? (
                            <Folder size={40} className="text-[#e95420] fill-[#e95420]/80" />
                          ) : childNode.isImage ? (
                            <img src={childNode.content} alt={childName} className="w-10 h-10 object-cover shadow-sm border border-slate-300 bg-white" />
                          ) : (
                            <div className="w-8 h-10 bg-white border border-slate-300 shadow-sm" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-800 text-center w-full truncate leading-tight">{childName}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex-1 bg-[#1e1e1e] rounded-b-lg flex items-center justify-center p-2 overflow-hidden h-full">
            <img src={win.data} alt="Viewer" className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        );

      case 'game2048':
        return (
          <div className="flex-1 rounded-b-lg overflow-hidden h-full">
            <Game2048 />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col pointer-events-auto bg-slate-900 text-slate-800 font-sans animate-in zoom-in-95 duration-200 overflow-hidden">
      {/* Background Wallpaper */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920')] bg-cover bg-center opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-orange-500/10 mix-blend-overlay" />

      {/* Top Panel - Yaru Theme */}
      <div className="relative z-[9000] h-7 bg-[#111111] text-[#f2f2f2] text-sm flex items-center justify-between px-4 shadow-md select-none">
        <div className="flex items-center gap-4 font-medium">
          <span className="hover:text-white cursor-pointer">Activities</span>
        </div>
        <div className="font-semibold cursor-pointer hover:text-white">
          {time}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full bg-[#f2f2f2]/20 flex items-center justify-center text-[10px] font-bold">EN</span>
            <div className="flex gap-2">
              <span className="opacity-80">📶</span>
              <span className="opacity-80">🔊</span>
              <span className="opacity-80">🔋</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:text-[#e95420] transition" title="Power Off (Close)">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Desktop Area */}
      <div className="relative z-0 flex-1 flex">
        {/* Left Dock - Ubuntu Yaru style */}
        <div className="w-[72px] h-full bg-[#111111]/90 flex flex-col items-center py-2 gap-2 shadow-[2px_0_10px_rgba(0,0,0,0.5)] z-[8000] backdrop-blur-sm">
          
          <button className="w-12 h-12 rounded hover:bg-white/10 transition flex items-center justify-center group relative">
            <Chrome size={28} className="text-[#e95420] drop-shadow-sm" />
            <span className="absolute left-14 bg-[#111] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-[#333] text-white z-[9999]">Firefox Browser</span>
          </button>
          
          <button onClick={() => openApp('files')} className="w-12 h-12 rounded hover:bg-white/10 transition flex items-center justify-center group relative">
            <Folder size={28} className="text-[#e95420] fill-[#e95420]/20 drop-shadow-sm" />
            <span className="absolute left-14 bg-[#111] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-[#333] text-white z-[9999]">Files</span>
            {windows.some(w => w.type === 'files') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#e95420] rounded-r-md"></div>}
          </button>
          
          <button onClick={() => openApp('terminal')} className="w-12 h-12 rounded hover:bg-white/10 transition flex items-center justify-center group relative">
            <Terminal size={28} className="text-[#333333] fill-[#e5e5e5] drop-shadow-sm" />
            <span className="absolute left-14 bg-[#111] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-[#333] text-white z-[9999]">Terminal</span>
            {windows.some(w => w.type === 'terminal') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#e95420] rounded-r-md"></div>}
          </button>
          
          <button onClick={() => openApp('game2048')} className="w-12 h-12 rounded hover:bg-white/10 transition flex items-center justify-center group relative">
            <div className="w-7 h-7 bg-[#edc22e] rounded text-white font-bold flex items-center justify-center text-[10px] shadow-sm">2048</div>
            <span className="absolute left-14 bg-[#111] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-[#333] text-white z-[9999]">2048 Game</span>
            {windows.some(w => w.type === 'game2048') && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#e95420] rounded-r-md"></div>}
          </button>
          
          <div className="mt-auto pt-2 w-full flex justify-center">
            <button className="w-12 h-12 rounded hover:bg-white/10 transition flex items-center justify-center group relative">
              <LayoutGrid size={24} className="text-white/70 group-hover:text-white transition" />
              <span className="absolute left-14 bg-[#111] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-md border border-[#333] text-white z-[9999]">Show Applications</span>
            </button>
          </div>
        </div>

        {/* Window Manager Area */}
        <div className="flex-1 relative overflow-hidden">
          {windows.map(win => (
            <Rnd
              key={win.id}
              default={{
                x: win.x,
                y: win.y,
                width: win.width,
                height: win.height,
              }}
              minWidth={300}
              minHeight={200}
              bounds="parent"
              dragHandleClassName="window-drag-handle"
              onDragStart={() => bringToFront(win.id)}
              onDragStop={(e, d) => updateWindowPosSize(win.id, d.x, d.y, win.width, win.height)}
              onResizeStop={(e, direction, ref, delta, position) => {
                updateWindowPosSize(win.id, position.x, position.y, parseInt(ref.style.width), parseInt(ref.style.height));
              }}
              onMouseDown={() => bringToFront(win.id)}
              style={{ zIndex: win.zIndex, position: 'absolute' }}
              className="flex flex-col shadow-2xl rounded-lg bg-white overflow-hidden border border-[#333]/20"
            >
              {/* Window Title Bar - Yaru Theme */}
              <div className="window-drag-handle h-9 bg-gradient-to-b from-[#3d3d3d] to-[#363636] flex items-center justify-between px-3 shrink-0 cursor-move rounded-t-lg select-none border-b border-[#222]">
                
                <div className="text-[#dfdfdf] font-medium text-xs tracking-wide flex-1 text-center font-sans drop-shadow-sm">
                  {win.type === 'terminal' ? 'user@ubuntu: ~' : win.title}
                </div>

                <div className="flex gap-2 items-center absolute right-3">
                  <div className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer text-[#a5a5a5] hover:text-white transition" onClick={() => {}}>
                    <Minus size={12} />
                  </div>
                  <div className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer text-[#a5a5a5] hover:text-white transition" onClick={() => {}}>
                    <Square size={10} />
                  </div>
                  <div className="w-5 h-5 rounded-full hover:bg-[#e95420] bg-transparent flex items-center justify-center cursor-pointer text-[#a5a5a5] hover:text-white transition group" onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}>
                    <X size={12} className="group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                
              </div>
              
              {/* Window Content */}
              {renderWindowContent(win)}
            </Rnd>
          ))}
        </div>
      </div>
    </div>
  );
}
