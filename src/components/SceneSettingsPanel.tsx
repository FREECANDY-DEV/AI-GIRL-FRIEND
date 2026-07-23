import React from 'react';
import { Settings2, X, Sun, Moon, Sparkles, SlidersHorizontal, Droplets, Bone } from 'lucide-react';
import { SceneConfig, DEFAULT_SCENE_CONFIG } from '../types/scene';

interface SceneSettingsPanelProps {
  config: SceneConfig;
  onChange: (config: SceneConfig) => void;
  onClose: () => void;
}

export function SceneSettingsPanel({ config, onChange, onClose }: SceneSettingsPanelProps) {
  const updateField = (field: keyof SceneConfig, value: number | boolean) => {
    onChange({ ...config, [field]: value });
  };

  const resetSettings = () => {
    onChange({ ...DEFAULT_SCENE_CONFIG });
  };

  return (
    <div className="h-full w-80 shrink-0 bg-slate-900/95 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-[100] flex flex-col font-sans text-slate-200 transition-all duration-300">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Settings2 size={16} className="text-emerald-400" />
          Scene & Camera Settings
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetSettings}
            className="text-[10px] text-slate-400 hover:text-slate-200 uppercase font-bold px-2 py-1 bg-slate-800 rounded"
          >
            Reset
          </button>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Debug */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bone size={12} /> Debug & View
          </h3>
          <label className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition">
            <span className="text-xs font-semibold">Show Full Skeleton</span>
            <div className={`w-8 h-4 rounded-full transition-colors relative ${config.showSkeleton ? 'bg-emerald-500' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow ${config.showSkeleton ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
            <input type="checkbox" className="hidden" checked={config.showSkeleton} onChange={(e) => updateField('showSkeleton', e.target.checked)} />
          </label>
        </section>

        {/* Lighting */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sun size={12} /> Environment Lighting
          </h3>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Ambient Light</span>
              <span className="font-mono text-emerald-400">{config.ambientLightIntensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={config.ambientLightIntensity}
              onChange={(e) => updateField('ambientLightIntensity', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Directional Light</span>
              <span className="font-mono text-emerald-400">{config.directionalLightIntensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={config.directionalLightIntensity}
              onChange={(e) => updateField('directionalLightIntensity', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
