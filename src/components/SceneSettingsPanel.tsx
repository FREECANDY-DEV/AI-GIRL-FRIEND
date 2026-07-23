import React from 'react';
import { Settings2, X, Sun, Moon, Sparkles, SlidersHorizontal, Droplets, Bone, Camera } from 'lucide-react';
import { SceneConfig, DEFAULT_SCENE_CONFIG } from '../types/scene';

interface SceneSettingsPanelProps {
  config: SceneConfig;
  onChange: (config: SceneConfig) => void;
  onClose: () => void;
}

export function SceneSettingsPanel({ config, onChange, onClose }: SceneSettingsPanelProps) {
  const updateField = (field: keyof SceneConfig, value: number | boolean | string) => {
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

        {/* Camera Controls */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Camera size={12} /> Camera & Orbit
          </h3>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Field of View (FOV)</span>
              <span className="font-mono text-emerald-400">{config.cameraFov}</span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="1"
              value={config.cameraFov}
              onChange={(e) => updateField('cameraFov', parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <label className="flex items-center gap-2 text-[11px] cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableAutoRotate}
              onChange={(e) => updateField('enableAutoRotate', e.target.checked)}
              className="accent-emerald-500"
            />
            Enable Auto-Rotate
          </label>

          {config.enableAutoRotate && (
            <div className="space-y-1 pl-4 border-l border-slate-800">
              <div className="flex justify-between text-[11px]">
                <span>Rotate Speed</span>
                <span className="font-mono text-emerald-400">{config.autoRotateSpeed.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.5"
                value={config.autoRotateSpeed}
                onChange={(e) => updateField('autoRotateSpeed', parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          )}
        </section>

        {/* Global Lighting */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sun size={12} /> Ambient & Sky
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] items-center">
              <span>Background Color</span>
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => updateField('backgroundColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
            <div className="flex justify-between text-[11px] items-center">
              <span>Ambient Color</span>
              <input
                type="color"
                value={config.ambientLightColor}
                onChange={(e) => updateField('ambientLightColor', e.target.value)}
                className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Ambient Intensity</span>
              <span className="font-mono text-emerald-400">{config.ambientLightIntensity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={config.ambientLightIntensity}
              onChange={(e) => updateField('ambientLightIntensity', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Star Count</span>
              <span className="font-mono text-emerald-400">{config.starCount}</span>
            </div>
            <input
              type="range"
              min="0"
              max="15000"
              step="500"
              value={config.starCount}
              onChange={(e) => updateField('starCount', parseInt(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Star Speed</span>
              <span className="font-mono text-emerald-400">{config.starSpeed.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={config.starSpeed}
              onChange={(e) => updateField('starSpeed', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </section>

        {/* Directional Light */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sun size={12} /> Directional Sun
          </h3>

          <div className="flex justify-between text-[11px] items-center">
            <span>Sun Color</span>
            <input
              type="color"
              value={config.directionalLightColor}
              onChange={(e) => updateField('directionalLightColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Sun Intensity</span>
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

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">Pos X</div>
              <input
                type="number"
                value={config.directionalLightPositionX}
                onChange={(e) => updateField('directionalLightPositionX', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">Pos Y</div>
              <input
                type="number"
                value={config.directionalLightPositionY}
                onChange={(e) => updateField('directionalLightPositionY', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400">Pos Z</div>
              <input
                type="number"
                value={config.directionalLightPositionZ}
                onChange={(e) => updateField('directionalLightPositionZ', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-[11px] focus:border-emerald-500 outline-none"
              />
            </div>
          </div>
          
          <label className="flex items-center gap-2 text-[11px] cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={config.castShadows}
              onChange={(e) => updateField('castShadows', e.target.checked)}
              className="accent-emerald-500"
            />
            Cast Sun Shadows
          </label>
        </section>

        {/* Shadow Settings */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets size={12} /> Contact Shadows
          </h3>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Shadow Opacity</span>
              <span className="font-mono text-emerald-400">{config.contactShadowOpacity.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.contactShadowOpacity}
              onChange={(e) => updateField('contactShadowOpacity', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Shadow Blur</span>
              <span className="font-mono text-emerald-400">{config.contactShadowBlur.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={config.contactShadowBlur}
              onChange={(e) => updateField('contactShadowBlur', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </section>

        {/* Post Processing */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} /> Post-Processing (CSS)
          </h3>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Color Saturation</span>
              <span className="font-mono text-emerald-400">{config.saturation.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2.5"
              step="0.05"
              value={config.saturation}
              onChange={(e) => updateField('saturation', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Brightness</span>
              <span className="font-mono text-emerald-400">{config.brightness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.05"
              value={config.brightness}
              onChange={(e) => updateField('brightness', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Contrast</span>
              <span className="font-mono text-emerald-400">{config.contrast.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={config.contrast}
              onChange={(e) => updateField('contrast', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Film Grain</span>
              <span className="font-mono text-emerald-400">{config.filmGrain.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.filmGrain}
              onChange={(e) => updateField('filmGrain', parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
