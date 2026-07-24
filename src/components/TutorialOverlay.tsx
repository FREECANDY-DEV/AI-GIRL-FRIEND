import React, { useState, useEffect } from 'react';
import { X, Terminal, Chrome, Folder, LayoutGrid, Minus, Square } from 'lucide-react';

interface TutorialOverlayProps {
  onClose?: () => void;
  command?: string;
  inline?: boolean;
}

export function TutorialOverlay({ onClose, command = 'ls -la', inline = false }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [showOutput, setShowOutput] = useState(false);

  // Fake desktop loop animation sequence
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let isCancelled = false;

    const runSequence = async () => {
      if (isCancelled) return;
      
      // Step 0: Initial state (desktop showing), wait 1s
      setStep(0);
      setTypedText('');
      setShowOutput(false);
      await new Promise(r => { timeout = setTimeout(r, 1000) });
      if (isCancelled) return;

      // Step 1: Mouse moves to Terminal icon (simulated via css highlight), wait 0.5s
      setStep(1);
      await new Promise(r => { timeout = setTimeout(r, 500) });
      if (isCancelled) return;

      // Step 2: Terminal Window Opens, wait 0.8s
      setStep(2);
      await new Promise(r => { timeout = setTimeout(r, 800) });
      if (isCancelled) return;

      // Step 3: Type command character by character
      setStep(3);
      for (let i = 0; i <= command.length; i++) {
        if (isCancelled) return;
        setTypedText(command.substring(0, i));
        await new Promise(r => { timeout = setTimeout(r, 100 + Math.random() * 50) });
      }
      
      // Wait a moment after typing
      await new Promise(r => { timeout = setTimeout(r, 300) });
      if (isCancelled) return;

      // Step 4: Press enter (show output)
      setStep(4);
      setShowOutput(true);
      
      // Wait 3 seconds, then restart
      await new Promise(r => { timeout = setTimeout(r, 4000) });
      if (!isCancelled) {
        runSequence(); // loop
      }
    };

    runSequence();

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [command]);

  const baseClasses = "bg-slate-900 rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden z-[200] font-ubuntu flex flex-col pointer-events-auto animate-in fade-in";
  const layoutClasses = inline
    ? "relative w-full h-48 mt-2" // Inline styles for chat bubble
    : "fixed bottom-6 right-6 w-96 h-64 slide-in-from-bottom-4 duration-300"; // PiP styles

  return (
    <div className={`${baseClasses} ${layoutClasses}`}>
      
      {/* Mini Titlebar */}
      <div className="h-8 bg-slate-800 flex items-center justify-between px-3 border-b border-slate-700 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-300">AI Simulation</span>
        </div>
        {!inline && onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Mini Desktop Area */}
      <div className="relative flex-1 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070')] bg-cover bg-center overflow-hidden">
        
        {/* Left Sidebar Dock */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-black/60 backdrop-blur-md flex flex-col items-center py-2 gap-3 z-10 border-r border-white/10">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center hover:bg-orange-500/40 cursor-default">
            <Chrome size={18} className="text-orange-400" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/40 cursor-default">
            <Folder size={18} className="text-blue-400" />
          </div>
          <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${step >= 1 ? 'bg-slate-500/60 ring-2 ring-white/50' : 'bg-slate-700/50'}`}>
            <Terminal size={18} className="text-slate-200" />
            {step >= 2 && <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-orange-500" />}
          </div>
          <div className="mt-auto w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-default">
            <LayoutGrid size={18} className="text-white/60" />
          </div>
        </div>

        {/* Fake Terminal Window */}
        {step >= 2 && (
          <div className="absolute top-4 left-16 right-4 bottom-4 bg-[#300a24] rounded-lg shadow-2xl border border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Terminal Header */}
            <div className="h-6 bg-[#4a4947] flex items-center justify-between px-2">
              <span className="text-[10px] text-slate-300 font-bold">user@ubuntu: ~</span>
              <div className="flex gap-1.5">
                <Minus size={10} className="text-slate-400" />
                <Square size={10} className="text-slate-400" />
                <X size={10} className="text-slate-400" />
              </div>
            </div>
            {/* Terminal Content */}
            <div className="flex-1 p-2 font-mono text-[11px] text-white overflow-hidden">
              <div className="flex items-center">
                <span className="text-green-400 font-bold mr-2">user@ubuntu:~$</span>
                <span>{typedText}</span>
                {step === 3 && <span className="w-1.5 h-3 bg-white ml-0.5 animate-pulse" />}
              </div>
              
              {showOutput && (
                <div className="mt-1 space-y-0.5 opacity-90">
                  <div className="flex gap-2">
                    <span className="text-blue-400 font-bold">Documents</span>
                    <span className="text-blue-400 font-bold">Downloads</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-400 font-bold">Music</span>
                    <span className="text-blue-400 font-bold">Pictures</span>
                  </div>
                  <div className="flex gap-2">
                    <span>file.txt</span>
                    <span className="text-green-400 font-bold">script.sh</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="text-green-400 font-bold mr-2">user@ubuntu:~$</span>
                    <span className="w-1.5 h-3 bg-white ml-0.5 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
