import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

export function DonationWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // USDT TRC20 Address
  const address = "TSTtvBTt8qrDE5fFoAp3DzqW58H8dfYwhV";

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex items-end font-sans">
      
      {/* Expanded Modal */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 mb-2 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-100 text-sm font-bold tracking-wide">Support the Project</h3>
            <span className="text-[#26A17B] text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-[#26A17B]/10 rounded border border-[#26A17B]/20">
              USDT
            </span>
          </div>
          
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">
            Send cryptocurrency donations directly via USDT (ERC20 / TRC20) to support development.
          </p>
          
          <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-700/50 shadow-inner group transition-colors hover:border-slate-600">
            <span className="text-slate-300 font-mono text-[11px] truncate flex-1 select-all">{address}</span>
            <button 
              onClick={handleCopy}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Copy Address"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
            <span>Powered by Tether</span>
            <ExternalLink size={12} className="opacity-50" />
          </div>
        </div>
      )}

      {/* Floating Button - Classic Minimalistic USDT Logo */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105 group ${
          isOpen ? 'bg-slate-800 border border-[#50AF95]/50' : 'bg-[#50AF95] border-2 border-transparent hover:border-white/20'
        }`}
        title="Donate USDT"
      >
        <span className={`text-2xl font-bold transition-colors ${
          isOpen ? 'text-[#50AF95]' : 'text-white'
        }`}>
          ₮
        </span>
      </button>
      
    </div>
  );
}
