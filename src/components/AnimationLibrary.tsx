import { useState } from 'react';
import { AnimationClip, StandingPoseConfig, PosePreset } from '../types/animation';
import { POSE_PRESETS } from '../data/defaultAnimations';
import { CardPreviewCanvas } from './CardPreviewCanvas';
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Check,
  Play,
  Layers,
  Sliders,
  Search,
  Gamepad2,
  ArrowRight,
  Bookmark,
  Activity,
  Brain,
} from 'lucide-react';

interface AnimationLibraryProps {
  customClips: AnimationClip[];
  onUpdateClips: (clips: AnimationClip[]) => void;
  standingPose: StandingPoseConfig;
  onUpdateStandingPose: (pose: StandingPoseConfig) => void;
  customPoses: PosePreset[];
  onUpdateCustomPoses: (poses: PosePreset[]) => void;
  activeWalkClipId: string;
  onSelectActiveWalkClip: (clipId: string) => void;
  activeThinkingPoseId: string;
  onSelectActiveThinkingPose: (id: string) => void;
  onOpenLab: (mode: 'timeline' | 'pose', targetId?: string) => void;
  onBackToGame: () => void;
  isPanel?: boolean;
}

export function AnimationLibrary({
  customClips,
  onUpdateClips,
  standingPose,
  onUpdateStandingPose,
  customPoses,
  onUpdateCustomPoses,
  activeWalkClipId,
  onSelectActiveWalkClip,
  activeThinkingPoseId,
  onSelectActiveThinkingPose,
  onOpenLab,
  onBackToGame,
  isPanel = false,
}: AnimationLibraryProps) {
  const [filter, setFilter] = useState<'all' | 'clips' | 'poses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotifier, setActionNotifier] = useState<string | null>(null);

  // Combine standard preset poses and user-created custom poses
  const allPoses: PosePreset[] = [...POSE_PRESETS, ...customPoses];

  // Helper notice banner
  const triggerNotifier = (msg: string) => {
    setActionNotifier(msg);
    setTimeout(() => setActionNotifier(null), 2000);
  };

  // Delete Custom Clip
  const handleDeleteClip = (id: string) => {
    const updated = customClips.filter((c) => c.id !== id);
    onUpdateClips(updated);
    setDeleteConfirmId(null);
    triggerNotifier('Animation clip deleted');
  };

  // Delete Custom Pose
  const handleDeletePose = (id: string) => {
    const updated = customPoses.filter((p) => p.id !== id);
    onUpdateCustomPoses(updated);
    setDeleteConfirmId(null);
    triggerNotifier('Pose preset deleted');
  };

  // Clone Clip
  const handleCloneClip = (clip: AnimationClip) => {
    const newId = `clip_${Date.now()}`;
    const cloned: AnimationClip = {
      ...clip,
      id: newId,
      name: `${clip.name} (Copy)`,
      keyframes: clip.keyframes.map((kf) => ({
        ...kf,
        id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        transforms: { ...kf.transforms },
      })),
    };
    onUpdateClips([...customClips, cloned]);
    triggerNotifier(`Cloned as "${cloned.name}"`);
  };

  // Clone Pose
  const handleClonePose = (preset: PosePreset) => {
    const newId = `pose_${Date.now()}`;
    const cloned: PosePreset = {
      id: newId,
      name: `${preset.name} (Copy)`,
      description: `Customized copy of ${preset.name}`,
      pose: {
        ...preset.pose,
        customBoneRotations: { ...(preset.pose.customBoneRotations || {}) },
      },
    };
    onUpdateCustomPoses([...customPoses, cloned]);
    triggerNotifier(`Cloned pose "${cloned.name}"`);
  };

  // Filter items
  const filteredClips = customClips.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPoses = allPoses.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`w-full text-slate-100 flex flex-col font-sans select-none ${isPanel ? 'h-full bg-slate-900 overflow-y-auto p-4' : 'min-h-screen bg-slate-950 overflow-y-auto'}`}>
      {/* Top Header Bar (Only rendered in full page mode) */}
      {!isPanel && (
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Pose & Animation Library
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {customClips.length + allPoses.length} Total
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Browse, preview 3D animated cards, edit or create custom character poses and walk cycles.
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            <button
              onClick={() => onOpenLab('timeline')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md transition transform hover:scale-102 active:scale-98"
            >
              <Plus size={15} />
              <span>New Clip</span>
            </button>

            <button
              onClick={() => onOpenLab('pose')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md transition transform hover:scale-102 active:scale-98"
            >
              <Sliders size={15} />
              <span>New Pose</span>
            </button>

            <button
              onClick={onBackToGame}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              <Gamepad2 size={16} />
              <span>Play Game Map</span>
            </button>
          </div>
        </header>
      )}

      {/* Panel Action Bar for + New Motion and + New Pose */}
      {isPanel && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => onOpenLab('timeline')}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus size={14} />
            <span>+ New Clip</span>
          </button>
          <button
            onClick={() => onOpenLab('pose')}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow transition cursor-pointer"
          >
            <Sliders size={14} />
            <span>+ New Pose</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto flex flex-col gap-4 ${isPanel ? 'p-0' : 'max-w-7xl p-4 sm:p-6 md:p-8 gap-6'}`}>
        {/* Toast Notifier */}
        {actionNotifier && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce">
            <Check size={16} />
            <span>{actionNotifier}</span>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto max-w-full custom-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({customClips.length + allPoses.length})
            </button>
            <button
              onClick={() => setFilter('clips')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filter === 'clips'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity size={13} />
              <span>Animation Clips ({customClips.length})</span>
            </button>
            <button
              onClick={() => setFilter('poses')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filter === 'poses'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bookmark size={13} />
              <span>Standing Poses ({allPoses.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search poses & clips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* SECTION 1: ANIMATION CLIPS GRID */}
        {(filter === 'all' || filter === 'clips') && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-blue-400" />
                <h2 className="text-sm font-bold text-slate-200">3D Animation Clips</h2>
                <span className="text-xs text-slate-500 font-medium">({filteredClips.length})</span>
              </div>
              <button
                onClick={() => onOpenLab('timeline')}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Create New Clip</span>
              </button>
            </div>

            {filteredClips.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-slate-400">No animation clips match your search query.</p>
              </div>
            ) : (
              <div className={isPanel ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                {filteredClips.map((clip) => {
                  const isActiveGameWalk = activeWalkClipId === clip.id;
                  const isCustomClip = !['walk_cycle', 'athletic_sprint', 'wave_hello', 'boxing_combo', 'breathing_idle'].includes(
                    clip.id
                  );

                  return (
                    <div
                      key={clip.id}
                      className={`group relative bg-slate-900/80 rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden shadow-xl hover:shadow-2xl ${
                        isActiveGameWalk
                          ? 'border-blue-500/80 ring-2 ring-blue-500/30'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Active Game Walk Indicator Badge */}
                      {isActiveGameWalk && (
                        <div className="absolute top-2.5 left-2.5 z-10 bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1">
                          <Check size={12} />
                          <span>Active Walk Clip</span>
                        </div>
                      )}

                      {/* 3D Animated Card Canvas */}
                      <div className="w-full h-48 relative cursor-pointer" onClick={() => onOpenLab('timeline', clip.id)}>
                        <CardPreviewCanvas clip={clip} autoRotate={true} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 pointer-events-none" />
                        <div className="absolute bottom-2 right-2 z-10 bg-slate-950/80 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800">
                          {clip.duration}s • {clip.keyframes.length} KFs
                        </div>
                      </div>

                      {/* Card Content & Action Bar */}
                      <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between bg-slate-900/90 border-t border-slate-800/60">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs text-slate-100 group-hover:text-blue-400 transition">
                              {clip.name}
                            </h3>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {isCustomClip ? 'Custom' : 'Preset'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                            FPS: {clip.fps || 30} • Loop: {clip.loop ? 'Yes' : 'No'}
                          </p>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => onOpenLab('timeline', clip.id)}
                            className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition"
                            title="Edit this clip keyframes in Laboratory"
                          >
                            <Edit3 size={12} />
                            <span>Edit Clip</span>
                          </button>

                          {!isActiveGameWalk && (
                            <button
                              onClick={() => {
                                onSelectActiveWalkClip(clip.id);
                                triggerNotifier(`Set "${clip.name}" as Game Walk Clip`);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[11px] flex items-center gap-1 transition"
                              title="Set as character walking animation in Game Map"
                            >
                              <Play size={12} />
                              <span>Set Walk</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleCloneClip(clip)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Duplicate / Clone Clip"
                          >
                            <Copy size={12} />
                          </button>

                          {isCustomClip && (
                            <button
                              onClick={() => {
                                if (deleteConfirmId === clip.id) {
                                  handleDeleteClip(clip.id);
                                } else {
                                  setDeleteConfirmId(clip.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition ${
                                deleteConfirmId === clip.id
                                  ? 'bg-red-600 text-white font-bold text-[10px] px-2'
                                  : 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                              }`}
                              title="Delete Clip"
                            >
                              {deleteConfirmId === clip.id ? 'Confirm?' : <Trash2 size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SECTION 2: STANDING POSES GRID */}
        {(filter === 'all' || filter === 'poses') && (
          <section className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Bookmark size={16} className="text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-200">3D Standing Poses</h2>
                <span className="text-xs text-slate-500 font-medium">({filteredPoses.length})</span>
              </div>
              <button
                onClick={() => onOpenLab('pose')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Create New Pose</span>
              </button>
            </div>

            {filteredPoses.length === 0 ? (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 p-8 rounded-2xl text-center flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-slate-400">No standing poses match your search query.</p>
              </div>
            ) : (
              <div className={isPanel ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}>
                {filteredPoses.map((preset) => {
                  const isCustomPose = customPoses.some((p) => p.id === preset.id);

                  return (
                    <div
                      key={preset.id}
                      className="group relative bg-slate-900/80 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all duration-200 flex flex-col overflow-hidden shadow-xl hover:shadow-2xl"
                    >
                      {/* 3D Animated Card Canvas */}
                      <div className="w-full h-48 relative cursor-pointer" onClick={() => {
                        onUpdateStandingPose(preset.pose);
                        onOpenLab('pose', preset.id);
                      }}>
                        <CardPreviewCanvas pose={preset.pose} autoRotate={true} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 pointer-events-none" />
                      </div>

                      {/* Card Content & Action Bar */}
                      <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between bg-slate-900/90 border-t border-slate-800/60">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xs text-slate-100 group-hover:text-emerald-400 transition">
                              {preset.name}
                            </h3>
                            <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {isCustomPose ? 'Custom' : 'Preset'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              onUpdateStandingPose(preset.pose);
                              onOpenLab('pose', preset.id);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition"
                            title="Edit this pose in 3D Studio Laboratory"
                          >
                            <Edit3 size={12} />
                            <span>Edit Pose</span>
                          </button>

                          <button
                            onClick={() => {
                              onUpdateStandingPose(preset.pose);
                              triggerNotifier(`Applied "${preset.name}" to Game Map Character`);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] flex items-center gap-1 transition"
                            title="Apply this stance to character in Game Map"
                          >
                            <Check size={12} />
                            <span>Idle</span>
                          </button>

                          <button
                            onClick={() => {
                              onSelectActiveThinkingPose(preset.id);
                              triggerNotifier(`Set "${preset.name}" as Active AI Thinking Pose`);
                            }}
                            className={`px-2 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 transition ${activeThinkingPoseId === preset.id ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-amber-400'}`}
                            title="Apply this stance to character when AI is thinking"
                          >
                            <Brain size={12} />
                            <span>Thinking</span>
                          </button>

                          <button
                            onClick={() => handleClonePose(preset)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Duplicate / Clone Pose"
                          >
                            <Copy size={12} />
                          </button>

                          {isCustomPose && (
                            <button
                              onClick={() => {
                                if (deleteConfirmId === preset.id) {
                                  handleDeletePose(preset.id);
                                } else {
                                  setDeleteConfirmId(preset.id);
                                }
                              }}
                              className={`p-1.5 rounded-lg transition ${
                                deleteConfirmId === preset.id
                                  ? 'bg-red-600 text-white font-bold text-[10px] px-2'
                                  : 'bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                              }`}
                              title="Delete Pose"
                            >
                              {deleteConfirmId === preset.id ? 'Confirm?' : <Trash2 size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
