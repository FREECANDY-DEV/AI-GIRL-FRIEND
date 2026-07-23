import { X, Terminal, Folder, Chrome, LayoutGrid, Unlock, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { resolvePath, getNodeAtPath } from '../utils/mockFileSystem';

interface UbuntuDesktopProps {
  onClose: () => void;
}

export function UbuntuDesktop({ onClose }: UbuntuDesktopProps) {
  const [time, setTime] = useState<string>('');
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Terminal State
  const [terminalHistory, setTerminalHistory] = useState<{ type: 'command' | 'output'; text: string }[]>([
    { type: 'output', text: 'Welcome to the Ubuntu OS integration!' },
    { type: 'output', text: 'Type "help" to see available commands.' }
  ]);
  const [currentDir, setCurrentDir] = useState('/home/user');
  const [commandInput, setCommandInput] = useState('');

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

  const executeCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    setTerminalHistory(prev => [...prev, { type: 'command', text: `user@ubuntu:${currentDir === '/home/user' ? '~' : currentDir}$ ${cmd}` }]);
    setCommandInput('');

    const args = cmd.split(' ').filter(Boolean);
    const command = args[0].toLowerCase();

    setTimeout(() => {
      let output = '';
      
      switch (command) {
        case 'clear':
          setTerminalHistory([]);
          return;
        case 'pwd':
          output = currentDir;
          break;
        case 'whoami':
          output = 'user';
          break;
        case 'echo':
          output = args.slice(1).join(' ');
          break;
        case 'cd': {
          const target = args[1] || '/home/user';
          const newPath = resolvePath(currentDir, target);
          if (!newPath) {
            output = `cd: ${target}: No such file or directory`;
          } else {
            const node = getNodeAtPath(newPath);
            if (!node) {
              output = `cd: ${target}: No such file or directory`;
            } else if (node.type !== 'dir') {
              output = `cd: ${target}: Not a directory`;
            } else {
              setCurrentDir(newPath);
              return; // Successful cd has no output
            }
          }
          break;
        }
        case 'ls': {
          const target = args[1] || '.';
          const targetPath = resolvePath(currentDir, target);
          if (!targetPath) {
             output = `ls: cannot access '${target}': No such file or directory`;
          } else {
            const node = getNodeAtPath(targetPath);
            if (!node) {
              output = `ls: cannot access '${target}': No such file or directory`;
            } else if (node.type === 'file') {
              output = target;
            } else {
              const children = Object.keys(node.children);
              // Simple formatting: space-separated
              output = children.map(c => {
                const childNode = node.children[c];
                // if we want to differentiate dirs, maybe add trailing slash or colors.
                return childNode.type === 'dir' ? `${c}/` : c;
              }).join('  ');
            }
          }
          break;
        }
        case 'cat': {
          if (!args[1]) {
            output = 'cat: missing operand';
            break;
          }
          const targetPath = resolvePath(currentDir, args[1]);
          if (!targetPath) {
             output = `cat: ${args[1]}: No such file or directory`;
          } else {
            const node = getNodeAtPath(targetPath);
            if (!node) {
              output = `cat: ${args[1]}: No such file or directory`;
            } else if (node.type === 'dir') {
              output = `cat: ${args[1]}: Is a directory`;
            } else {
              output = node.content;
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
          <div className="max-w-3xl mx-auto mt-10 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            {/* Window Header */}
            <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 justify-between shrink-0">
              <div className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Terminal size={14} /> user@ubuntu:~
              </div>
              <div className="flex gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-600 hover:bg-slate-500 transition cursor-pointer"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-slate-600 hover:bg-slate-500 transition cursor-pointer"></div>
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 flex items-center justify-center cursor-pointer hover:bg-red-500 transition group" onClick={onClose}>
                  <X size={10} className="text-white opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            </div>
            {/* Window Body */}
            <div 
              className="flex-1 p-4 font-mono text-sm text-slate-300 overflow-y-auto bg-slate-900 flex flex-col"
              onClick={() => document.getElementById('terminal-input')?.focus()}
            >
              {terminalHistory.map((item, idx) => (
                <div key={idx} className={`whitespace-pre-wrap ${item.type === 'command' ? 'text-green-400 font-semibold' : 'text-slate-300'} mb-1`}>
                  {item.text}
                </div>
              ))}
              
              <form onSubmit={executeCommand} className="flex mt-1">
                <span className="text-green-400 font-semibold mr-2 shrink-0">
                  user@ubuntu:{currentDir === '/home/user' ? '~' : currentDir}$
                </span>
                <input 
                  id="terminal-input"
                  type="text" 
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-300 caret-slate-300"
                  autoFocus
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
