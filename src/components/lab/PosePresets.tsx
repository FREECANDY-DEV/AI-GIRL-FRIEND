import { POSE_PRESETS } from '../../data/defaultAnimations';
import { StandingPoseConfig, PosePreset } from '../../types/animation';
import { Shield, Sparkles, Zap, Award, Smile, Trash2, Bookmark } from 'lucide-react';

interface PosePresetsProps {
  onSelectPreset: (pose: StandingPoseConfig) => void;
  customPoses?: PosePreset[];
  onDeleteCustomPose?: (id: string) => void;
}

const PRESET_ICONS: Record<string, any> = {
  natural_idle: Smile,
  hero_stance: Shield,
  combat_ready: Zap,
  hands_raised: Award,
  ninja_stealth: Sparkles,
};

export function PosePresets({ onSelectPreset, customPoses = [], onDeleteCustomPose }: PosePresetsProps) {
  const allPresets = [...POSE_PRESETS, ...customPoses];

  return (
    <div className="flex flex-col gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" />
          Pose Preset Library
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {allPresets.length} Presets
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5 max-h-52 overflow-y-auto pr-1">
        {allPresets.map((preset) => {
          const isCustom = customPoses.some((p) => p.id === preset.id);
          const Icon = isCustom ? Bookmark : PRESET_ICONS[preset.id] || Sparkles;
          return (
            <div
              key={preset.id}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 hover:border-blue-500/50 transition text-left group cursor-pointer"
              onClick={() => onSelectPreset(preset.pose)}
            >
              <div className="flex items-start gap-2 overflow-hidden pr-2">
                <div className={`p-1.5 rounded-md ${isCustom ? 'bg-amber-950/80 text-amber-400 group-hover:bg-amber-500 group-hover:text-white' : 'bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white'} transition shrink-0`}>
                  <Icon size={14} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-200 group-hover:text-white text-[11px] truncate">
                      {preset.name}
                    </span>
                    {isCustom && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Custom</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1">
                    {preset.description}
                  </span>
                </div>
              </div>

              {isCustom && onDeleteCustomPose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCustomPose(preset.id);
                  }}
                  className="p-1 rounded hover:bg-rose-950 hover:text-rose-400 text-slate-500 transition"
                  title="Delete Custom Pose"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
