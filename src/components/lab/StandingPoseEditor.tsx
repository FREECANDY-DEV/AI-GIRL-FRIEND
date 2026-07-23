import { useState } from 'react';
import { StandingPoseConfig, PosePreset } from '../../types/animation';
import { PosePresets } from './PosePresets';
import { BoneHierarchyTree } from './BoneHierarchyTree';
import {
  Sliders,
  Save,
  Check,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Compass,
  ArrowUpDown,
  RotateCw,
  Disc3,
  Move,
  Rotate3D,
  Lock,
  Unlock,
  Copy,
  Plus,
  Bookmark,
} from 'lucide-react';

interface StandingPoseEditorProps {
  config: StandingPoseConfig;
  onChangeConfig: (newConfig: StandingPoseConfig) => void;
  onReset: () => void;
  selectedBone?: string;
  onSelectBone?: (boneName: string) => void;
  rotation?: [number, number, number];
  onChangeRotation?: (rot: [number, number, number]) => void;
  onResetBone?: () => void;
  onResetAllBones?: () => void;
  gizmoMode?: 'rotate' | 'translate';
  onToggleGizmoMode?: (mode: 'rotate' | 'translate') => void;
  lockedBones?: Set<string>;
  onToggleLockBone?: (boneName: string) => void;
  tempBoneOverrides?: Record<string, [number, number, number]>;
  isMirrorMode?: boolean;
  onToggleMirrorMode?: (mirror: boolean) => void;
  customPoses?: PosePreset[];
  onSaveCustomPose?: (newPose: PosePreset) => void;
  onDeleteCustomPose?: (id: string) => void;
  defaultBasePose?: StandingPoseConfig;
  onSetAsDefaultBasePose?: (pose: StandingPoseConfig) => void;
}

export function StandingPoseEditor({
  config,
  onChangeConfig,
  onReset,
  selectedBone = 'RightArm',
  onSelectBone,
  rotation = [0, 0, 0],
  onChangeRotation,
  onResetBone,
  onResetAllBones,
  gizmoMode = 'rotate',
  onToggleGizmoMode,
  lockedBones = new Set(),
  onToggleLockBone,
  tempBoneOverrides = {},
  isMirrorMode = false,
  onToggleMirrorMode,
  customPoses = [],
  onSaveCustomPose,
  onDeleteCustomPose,
  defaultBasePose,
  onSetAsDefaultBasePose,
}: StandingPoseEditorProps) {
  const [savedNotifier, setSavedNotifier] = useState(false);
  const [defaultPoseNotifier, setDefaultPoseNotifier] = useState(false);
  const [copyCodeNotifier, setCopyCodeNotifier] = useState(false);
  const [presetTitle, setPresetTitle] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [isAdjustmentsCollapsed, setIsAdjustmentsCollapsed] = useState(false);
  const [isBodyTransformCollapsed, setIsBodyTransformCollapsed] = useState(false);

  const [rx, ry, rz] = rotation;
  const isLocked = lockedBones.has(selectedBone);

  const updateField = (key: keyof StandingPoseConfig, val: number) => {
    onChangeConfig({
      ...config,
      [key]: val,
    });
  };

  const handleSliderChange = (axisIndex: number, val: number) => {
    if (isLocked || !onChangeRotation) return;
    const nextRot: [number, number, number] = [...rotation];
    nextRot[axisIndex] = val;
    onChangeRotation(nextRot);
  };

  const adjustAxis = (axisIndex: number, delta: number) => {
    if (isLocked || !onChangeRotation) return;
    const nextRot: [number, number, number] = [...rotation];
    nextRot[axisIndex] = Math.min(180, Math.max(-180, nextRot[axisIndex] + delta));
    onChangeRotation(nextRot);
  };

  const buildMergedPoseConfig = (): StandingPoseConfig => {
    const poseRotations: Record<string, [number, number, number]> = {
      RightUpLeg: [0, 0, -config.stanceWidth * 50],
      LeftUpLeg: [0, 0, config.stanceWidth * 50],
      RightArm: [0, 0, config.armSpread * 50],
      LeftArm: [0, 0, -config.armSpread * 50],
      Spine1: [config.chestSpineTilt * 30, 0, 0],
      Head: [config.headTilt * 30, 0, 0],
      RightLeg: [config.kneeFlex * 40, 0, 0],
      LeftLeg: [config.kneeFlex * 40, 0, 0],
      ...(config.customBoneRotations || {}),
      ...tempBoneOverrides,
    };
    if (selectedBone && rotation) {
      poseRotations[selectedBone] = rotation;
    }
    return {
      ...config,
      customBoneRotations: poseRotations,
    };
  };

  const handleSavePose = () => {
    const merged = buildMergedPoseConfig();
    onChangeConfig(merged);
    setSavedNotifier(true);
    setTimeout(() => setSavedNotifier(false), 1800);
  };

  const handleCreateNewPreset = () => {
    if (!presetTitle.trim()) return;
    const merged = buildMergedPoseConfig();
    const newPreset: PosePreset = {
      id: `pose_${Date.now()}`,
      name: presetTitle.trim(),
      description: 'Custom user pose created in 3D Studio',
      pose: merged,
    };

    if (onSaveCustomPose) {
      onSaveCustomPose(newPreset);
    }
    onChangeConfig(merged);
    setPresetTitle('');
    setShowSavePresetInput(false);
    setSavedNotifier(true);
    setTimeout(() => setSavedNotifier(false), 1800);
  };

  const handleCopyCode = () => {
    const merged = buildMergedPoseConfig();
    const tsCode = `export const DEFAULT_STANDING_POSE: StandingPoseConfig = ${JSON.stringify(merged, null, 2)};`;
    navigator.clipboard.writeText(tsCode);
    setCopyCodeNotifier(true);
    setTimeout(() => setCopyCodeNotifier(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 text-slate-100 rounded-xl p-2.5 sm:p-3 border border-slate-800 shadow-xl flex flex-col gap-2.5 text-xs">
      {/* Studio Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Sliders size={14} className="text-emerald-400" />
          <span>Standing Pose Studio</span>
        </div>
        <button
          onClick={() => {
            onReset();
            onResetAllBones?.();
          }}
          title="Reset 3D camera view to default"
          className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition"
        >
          Reset All
        </button>
      </div>

      <p className="text-[10px] text-slate-400 leading-tight">
        Customize posture micro-adjustments or select individual body parts to transform pose.
      </p>

      {/* Preset Library */}
      <PosePresets
        onSelectPreset={(p) => onChangeConfig(p)}
        customPoses={customPoses}
        onDeleteCustomPose={onDeleteCustomPose}
      />

      {/* Save as Custom Preset Block */}
      <div className="flex flex-col gap-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1">
            <Bookmark size={13} className="text-amber-400" />
            Save Custom Pose Preset
          </span>
          <button
            onClick={() => setShowSavePresetInput(!showSavePresetInput)}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
          >
            <Plus size={12} />
            <span>New Preset</span>
          </button>
        </div>

        {showSavePresetInput && (
          <div className="flex flex-col gap-2 mt-1 pt-1 border-t border-slate-800/80">
            <input
              type="text"
              placeholder="e.g. Hero Guard Pose"
              value={presetTitle}
              onChange={(e) => setPresetTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleCreateNewPreset}
              disabled={!presetTitle.trim()}
              className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded font-bold text-xs flex items-center justify-center gap-1 shadow"
            >
              <Save size={13} />
              <span>Save to Preset Library</span>
            </button>
          </div>
        )}
      </div>

      {/* Body Part Transform Settings */}
      <div className="flex flex-col gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div
          onClick={() => setIsBodyTransformCollapsed(!isBodyTransformCollapsed)}
          className="flex items-center justify-between cursor-pointer select-none pb-1 border-b border-slate-800/60"
        >
          <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-[11px]">
            <Compass size={13} className="text-blue-400" />
            <span>Body Part Transforms</span>
          </div>
          <button className="text-slate-400 p-0.5">
            {isBodyTransformCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {!isBodyTransformCollapsed && (
          <div className="flex flex-col gap-2 mt-1">
            {/* Rig Anatomy Tree Selector */}
            {onSelectBone && (
              <BoneHierarchyTree
                selectedBone={selectedBone}
                onSelectBone={onSelectBone}
                lockedBones={lockedBones}
                onToggleLockBone={onToggleLockBone}
              />
            )}

            {/* Transform Gizmo Mode Switcher & Lock Toggle */}
            <div className="flex items-center justify-between bg-slate-900/90 p-1.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToggleGizmoMode?.('rotate')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                    gizmoMode === 'rotate'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                  }`}
                  title="3D Rotation Ring Gizmo"
                >
                  <Rotate3D size={12} />
                  <span>Rotate</span>
                </button>

                <button
                  onClick={() => onToggleGizmoMode?.('translate')}
                  className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                    gizmoMode === 'translate'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                  }`}
                  title="Free Move Position Gizmo"
                >
                  <Move size={12} />
                  <span>Free Move</span>
                </button>

                {onToggleMirrorMode && (
                  <button
                    onClick={() => onToggleMirrorMode(!isMirrorMode)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition border ${
                      isMirrorMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950 border-slate-800'
                    }`}
                    title="Mirror / Symmetry Mode: Automatically reflect transforms to opposite limb"
                  >
                    <span>🪞</span>
                    <span>Mirror</span>
                  </button>
                )}
              </div>

              {onToggleLockBone && (
                <button
                  onClick={() => onToggleLockBone(selectedBone)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 border transition ${
                    isLocked
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                  <span>{isLocked ? 'Locked' : 'Lock'}</span>
                </button>
              )}
            </div>

            {/* Selected Bone Axis Controls */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[10.5px] text-slate-300">
                  Active Part: <span className="text-amber-400 font-mono font-bold">{selectedBone}</span>
                </span>
                {onResetBone && (
                  <button
                    onClick={onResetBone}
                    className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                    title="Zero out selected bone angle"
                  >
                    <RotateCcw size={10} />
                    <span>Zero</span>
                  </button>
                )}
              </div>

              {/* Pitch (X Axis) */}
              <div className="flex flex-col gap-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <ArrowUpDown size={11} />
                    Pitch (X Axis)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isLocked}
                      onClick={() => adjustAxis(0, -5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px]"
                    >
                      -5
                    </button>
                    <span className="font-mono text-slate-200 w-9 text-center font-semibold">
                      {Math.round(rx)}°
                    </span>
                    <button
                      disabled={isLocked}
                      onClick={() => adjustAxis(0, 5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px]"
                    >
                      +5
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  disabled={isLocked}
                  min={-180}
                  max={180}
                  step={1}
                  value={rx}
                  onChange={(e) => handleSliderChange(0, parseFloat(e.target.value))}
                  className="w-full accent-red-500 bg-slate-800 h-1 rounded cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Yaw (Y Axis) */}
              <div className="flex flex-col gap-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <RotateCw size={11} />
                    Yaw (Y Axis)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isLocked}
                      onClick={() => adjustAxis(1, -5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px]"
                    >
                      -5
                    </button>
                    <span className="font-mono text-slate-200 w-9 text-center font-semibold">
                      {Math.round(ry)}°
                    </span>
                    <button
                      disabled={isLocked}
                      onClick={() => adjustAxis(1, 5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px]"
                    >
                      +5
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  disabled={isLocked}
                  min={-180}
                  max={180}
                  step={1}
                  value={ry}
                  onChange={(e) => handleSliderChange(1, parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-1 rounded cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Roll (Z Axis) */}
              <div className="flex flex-col gap-1 bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-blue-400 font-bold flex items-center gap-1">
                    <Disc3 size={11} />
                    Roll (Z Axis)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={isLocked}
                      onClick={() => adjustAxis(2, -5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px]"
                    >
                      -5
                    </button>
                    <span className="font-mono text-slate-200 w-9 text-center font-semibold">
                      {Math.round(rz)}°
                    </span>
                    <button
                      disabled={isLocked}
                      onClick={() => adjustAxis(2, 5)}
                      className="w-4 h-4 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center justify-center font-mono font-bold text-[9px]"
                    >
                      +5
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  disabled={isLocked}
                  min={-180}
                  max={180}
                  step={1}
                  value={rz}
                  onChange={(e) => handleSliderChange(2, parseFloat(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1 rounded cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posture Sliders */}
      <div className="flex flex-col gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div
          onClick={() => setIsAdjustmentsCollapsed(!isAdjustmentsCollapsed)}
          className="flex items-center justify-between cursor-pointer select-none pb-1 border-b border-slate-800/60"
        >
          <span className="font-semibold text-slate-300 text-[11px]">Posture Micro-adjustments</span>
          <button className="text-slate-400 p-0.5">
            {isAdjustmentsCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {!isAdjustmentsCollapsed && (
          <div className="flex flex-col gap-2.5 mt-1">
            {/* Stance Width */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-medium">Stance Width</span>
                <span className="font-mono text-emerald-400">{(config.stanceWidth * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={-0.1}
                max={0.25}
                step={0.01}
                value={config.stanceWidth}
                onChange={(e) => updateField('stanceWidth', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded cursor-pointer"
              />
            </div>

            {/* Arm Spread */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-medium">Arm Relaxation</span>
                <span className="font-mono text-emerald-400">{(config.armSpread * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={-0.5}
                max={0.2}
                step={0.01}
                value={config.armSpread}
                onChange={(e) => updateField('armSpread', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded cursor-pointer"
              />
            </div>

            {/* Chest Spine Tilt */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-medium">Spine Tilt</span>
                <span className="font-mono text-emerald-400">{(config.chestSpineTilt * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={-0.3}
                max={0.3}
                step={0.01}
                value={config.chestSpineTilt}
                onChange={(e) => updateField('chestSpineTilt', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded cursor-pointer"
              />
            </div>

            {/* Head Pitch */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-medium">Head Pitch</span>
                <span className="font-mono text-emerald-400">{(config.headTilt * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={-0.3}
                max={0.3}
                step={0.01}
                value={config.headTilt}
                onChange={(e) => updateField('headTilt', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded cursor-pointer"
              />
            </div>

            {/* Knee Flex */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-300 font-medium">Knee Flex</span>
                <span className="font-mono text-emerald-400">{(config.kneeFlex * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={0.3}
                step={0.01}
                value={config.kneeFlex}
                onChange={(e) => updateField('kneeFlex', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 bg-slate-800 h-1 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Standing Pose & Copy Code Buttons */}
      <div className="flex flex-col gap-1.5 mt-1">
        <button
          onClick={handleSavePose}
          className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg ${
            savedNotifier
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {savedNotifier ? <Check size={13} /> : <Save size={13} />}
          <span>{savedNotifier ? 'Pose & Transforms Saved!' : 'Save Pose to Project'}</span>
        </button>

        <button
          onClick={handleCopyCode}
          className="w-full py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center gap-1.5 transition"
        >
          {copyCodeNotifier ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>{copyCodeNotifier ? 'Copied TS Code to Clipboard!' : 'Copy TS Code for defaultAnimations.ts'}</span>
        </button>
      </div>
    </div>
  );
}


