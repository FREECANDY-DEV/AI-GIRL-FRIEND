import { useState } from 'react';
import { BoneHierarchyTree } from './BoneHierarchyTree';
import {
  RotateCcw,
  Compass,
  ArrowUpDown,
  RotateCw,
  Disc3,
  Move,
  Rotate3D,
  Lock,
  Unlock,
  Save,
  ChevronDown,
  ChevronRight,
  Sliders,
  Check,
} from 'lucide-react';

interface BoneInspectorProps {
  selectedBone: string;
  onSelectBone: (boneName: string) => void;
  rotation: [number, number, number];
  onChangeRotation: (rot: [number, number, number]) => void;
  onResetBone: () => void;
  onResetAllBones: () => void;
  onSaveCurrentBone?: () => void;
  gizmoMode?: 'rotate' | 'translate';
  onToggleGizmoMode?: (mode: 'rotate' | 'translate') => void;
  lockedBones?: Set<string>;
  onToggleLockBone?: (boneName: string) => void;
  isMirrorMode?: boolean;
  onToggleMirrorMode?: (mirror: boolean) => void;
}

export function BoneInspector({
  selectedBone,
  onSelectBone,
  rotation,
  onChangeRotation,
  onResetBone,
  onResetAllBones,
  onSaveCurrentBone,
  gizmoMode = 'rotate',
  onToggleGizmoMode,
  lockedBones = new Set(),
  onToggleLockBone,
  isMirrorMode = false,
  onToggleMirrorMode,
}: BoneInspectorProps) {
  const [rx, ry, rz] = rotation;
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const isLocked = lockedBones.has(selectedBone);

  const handleSliderChange = (axisIndex: number, val: number) => {
    if (isLocked) return;
    const nextRot: [number, number, number] = [...rotation];
    nextRot[axisIndex] = val;
    onChangeRotation(nextRot);
  };

  const adjustAxis = (axisIndex: number, delta: number) => {
    if (isLocked) return;
    const nextRot: [number, number, number] = [...rotation];
    nextRot[axisIndex] = Math.min(180, Math.max(-180, nextRot[axisIndex] + delta));
    onChangeRotation(nextRot);
  };

  const handleSaveClick = () => {
    if (onSaveCurrentBone) {
      onSaveCurrentBone();
      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 1800);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 text-slate-100 rounded-xl p-2.5 sm:p-3 border border-slate-800 shadow-xl flex flex-col gap-2 text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-200">
          <Compass size={14} className="text-blue-400" />
          <span>Bone Inspector</span>
        </div>

        <button
          onClick={onResetAllBones}
          title="Reset 3D camera view to default"
          className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded transition"
        >
          Reset All
        </button>
      </div>

      {/* Visual Skeleton Bone Hierarchy Tree */}
      <BoneHierarchyTree
        selectedBone={selectedBone}
        onSelectBone={onSelectBone}
        lockedBones={lockedBones}
        onToggleLockBone={onToggleLockBone}
      />

      {/* Transform Mode Switcher & Lock Toggle */}
      <div className="flex items-center justify-between bg-slate-950/90 p-1.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleGizmoMode?.('rotate')}
            className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
              gizmoMode === 'rotate'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
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
                : 'text-slate-400 hover:text-slate-200 bg-slate-900'
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
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
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
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
            <span>{isLocked ? 'Locked' : 'Lock'}</span>
          </button>
        )}
      </div>

      {/* Rotation Axis Sliders & Fine Step Dials */}
      <div className="flex flex-col gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        {/* Accordion Header */}
        <div
          onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
          className="flex items-center justify-between cursor-pointer select-none pb-1 border-b border-slate-800/60"
        >
          <div className="flex items-center gap-1.5">
            <Sliders size={13} className="text-amber-400" />
            <span className="font-semibold text-[11px] text-slate-200">
              <span className="text-amber-400 font-mono">{selectedBone}</span> Angles
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResetBone();
              }}
              className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
              title="Reset selected bone"
            >
              <RotateCcw size={10} />
              <span>Zero</span>
            </button>

            <button className="text-slate-400 p-0.5">
              {isControlsCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </div>

        {!isControlsCollapsed && (
          <div className="flex flex-col gap-2 mt-1">
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

            {/* Explicit Save Bone Change Button */}
            <button
              onClick={handleSaveClick}
              className={`w-full py-1.5 mt-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-lg ${
                savedNotification
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {savedNotification ? <Check size={13} /> : <Save size={13} />}
              <span>{savedNotification ? 'Changes Saved!' : 'Save Bone Pose'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

