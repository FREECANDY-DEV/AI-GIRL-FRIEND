import { useState } from 'react';
import { Camera, Check, User, Eye, Compass, Sparkles, X } from 'lucide-react';

export interface CameraPresetOption {
  id: string;
  name: string;
  description: string;
  camPos: [number, number, number];
  targetPos: [number, number, number];
  isFreeCamera: boolean;
  icon: React.ReactNode;
}

export const CAMERA_PRESETS: CameraPresetOption[] = [
  {
    id: 'front-face',
    name: 'Front Face Close-up',
    description: 'Framed directly in front of Ava at face level.',
    camPos: [0, 1.38, 1.35],
    targetPos: [0, 1.28, 0],
    isFreeCamera: true,
    icon: <User size={20} className="text-blue-400" />,
  },
  {
    id: 'front-body',
    name: 'Full Body Front View',
    description: 'Framing her entire body from the front.',
    camPos: [0, 1.15, 3.1],
    targetPos: [0, 0.95, 0],
    isFreeCamera: true,
    icon: <Eye size={20} className="text-emerald-400" />,
  },
  {
    id: 'over-shoulder',
    name: 'Over-The-Right-Shoulder',
    description: 'TPS view following her facing direction.',
    camPos: [0.45, 1.55, -2.2],
    targetPos: [0.35, 1.45, 1.2],
    isFreeCamera: false,
    icon: <Compass size={20} className="text-purple-400" />,
  },
  {
    id: 'cinematic-iso',
    name: 'Cinematic Overhead 3D',
    description: 'High isometric perspective of the 3D map.',
    camPos: [2.8, 3.8, 3.8],
    targetPos: [0, 1.0, 0],
    isFreeCamera: true,
    icon: <Sparkles size={20} className="text-amber-400" />,
  },
];

interface CameraSetupModalProps {
  currentPresetId: string;
  onPreviewPreset: (preset: CameraPresetOption) => void;
  onConfirmPreset: (presetId: string) => void;
  onClose: () => void;
}

export function CameraSetupModal({
  currentPresetId,
  onPreviewPreset,
  onConfirmPreset,
  onClose,
}: CameraSetupModalProps) {
  const [selectedId, setSelectedId] = useState(currentPresetId);

  const handleSelect = (preset: CameraPresetOption) => {
    setSelectedId(preset.id);
    onPreviewPreset(preset);
  };

  const handleSave = () => {
    onConfirmPreset(selectedId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100 tracking-wide">Select Starting Camera View</h2>
              <p className="text-xs text-slate-400 mt-0.5">Pick your preferred default camera angle for startup.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Close Setup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets Grid Options */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {CAMERA_PRESETS.map((preset) => {
            const isSelected = selectedId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset)}
                className={`flex flex-col p-3.5 rounded-xl border transition-all text-left cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/80 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 p-1 rounded-full bg-blue-500 text-white">
                    <Check size={12} />
                  </div>
                )}
                <div className="mb-2">{preset.icon}</div>
                <h3 className="font-bold text-xs text-slate-100">{preset.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{preset.description}</p>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/90 gap-3">
          <span className="text-[11px] text-slate-500 font-mono">Click options above for live preview</span>
          <button
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={15} />
            <span>Confirm & Save Default</span>
          </button>
        </div>
      </div>
    </div>
  );
}
