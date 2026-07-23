import { useState, useRef, useEffect } from 'react';
import { AnimationClip } from '../../types/animation';
import { Play, Pause, RotateCcw, Plus, Trash2, FastForward, Repeat, Copy, ChevronLeft, ChevronRight, Move } from 'lucide-react';

interface TimelineProps {
  clip: AnimationClip;
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onRestart?: () => void;
  onChangeSpeed: (speed: number) => void;
  onToggleLoop: () => void;
  onAddKeyframe: () => void;
  onDeleteKeyframe: (keyframeId: string) => void;
  onMoveKeyframe?: (keyframeId: string, newTime: number) => void;
  onChangeDuration: (duration: number) => void;
  onCopyPoseFromKeyframe?: (sourceKfId: string) => void;
}

export function Timeline({
  clip,
  currentTime,
  isPlaying,
  speed,
  onTogglePlay,
  onSeek,
  onRestart,
  onChangeSpeed,
  onToggleLoop,
  onAddKeyframe,
  onDeleteKeyframe,
  onMoveKeyframe,
  onChangeDuration,
  onCopyPoseFromKeyframe,
}: TimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingKfId, setDraggingKfId] = useState<string | null>(null);
  const [selectedSourceKfId, setSelectedSourceKfId] = useState<string>(
    clip.keyframes[0]?.id || ''
  );
  // Check if current seek time is near a keyframe
  const activeKf = clip.keyframes.find(
    (kf) => Math.abs(kf.time - currentTime) < 0.03
  );

  // Handle continuous smooth mouse/touch dragging of keyframes along the track
  useEffect(() => {
    if (!draggingKfId || !onMoveKeyframe) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

      const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const newTime = Number(((relativeX / rect.width) * clip.duration).toFixed(2));

      onMoveKeyframe(draggingKfId, newTime);
      onSeek(newTime);
    };

    const handlePointerUp = () => {
      setDraggingKfId(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingKfId, clip.duration, onMoveKeyframe, onSeek]);

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800 text-slate-100 p-3 sm:p-4 flex flex-col gap-2.5 select-none shadow-2xl backdrop-blur-lg">
      {/* Top Bar: Play controls + Clip Info + Keyframe Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        {/* Left: Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`p-2 rounded-lg font-bold flex items-center justify-center transition ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
            }`}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>

          <button
            onClick={() => {
              onSeek(0);
              if (onRestart) onRestart();
            }}
            className="p-1.5 px-2.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-bold transition flex items-center gap-1.5 text-xs shadow"
            title="Restart animation & reset body position to default starting position"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Restart Position</span>
          </button>

          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
              clip.loop
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Loop"
          >
            <Repeat size={13} />
            <span className="hidden sm:inline">Loop</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px]">
            {[0.25, 0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded font-mono font-bold transition ${
                  speed === s
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Current Time & Duration */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-blue-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {currentTime.toFixed(2)}s
          </span>
          <span className="text-slate-500">/</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0.2}
              max={10}
              step={0.1}
              value={clip.duration}
              onChange={(e) => onChangeDuration(Math.max(0.2, parseFloat(e.target.value) || 1))}
              className="w-12 bg-slate-950 border border-slate-800 text-slate-300 rounded px-1 text-center text-xs focus:outline-none focus:border-blue-500"
            />
            <span className="text-slate-400 text-[11px]">sec</span>
          </div>
        </div>

        {/* Right: Keyframe Management Actions & Copy Pose Selector */}
        <div className="flex items-center gap-2">
          {clip.keyframes.length > 0 && onCopyPoseFromKeyframe && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium px-1 hidden lg:inline">
                Copy Pose From:
              </span>
              <select
                value={selectedSourceKfId || clip.keyframes[0]?.id || ''}
                onChange={(e) => setSelectedSourceKfId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-1.5 py-1 focus:outline-none focus:border-blue-500 font-mono"
              >
                {clip.keyframes.map((kf, idx) => (
                  <option key={kf.id} value={kf.id}>
                    KF #{idx + 1} ({kf.time.toFixed(2)}s)
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const targetKfId = selectedSourceKfId || clip.keyframes[0]?.id;
                  if (targetKfId) {
                    onCopyPoseFromKeyframe(targetKfId);
                  }
                }}
                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded transition shadow cursor-pointer"
                title="Set current frame to exact pose and position of selected keyframe"
              >
                <Copy size={12} />
                <span>Apply Pose</span>
              </button>
            </div>
          )}

          <button
            onClick={onAddKeyframe}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow transition"
          >
            <Plus size={14} />
            <span>Keyframe</span>
          </button>

          {/* Keyframe Move Controls when active keyframe selected */}
          {activeKf && onMoveKeyframe && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold px-1 flex items-center gap-1">
                <Move size={11} />
                <span className="hidden sm:inline">Move KF:</span>
              </span>
              <button
                onClick={() => onMoveKeyframe(activeKf.id, Math.max(0, activeKf.time - 0.05))}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[11px]"
                title="Nudge keyframe earlier (-0.05s)"
              >
                <ChevronLeft size={12} />
              </button>
              <input
                type="number"
                min={0}
                max={clip.duration}
                step={0.01}
                value={activeKf.time}
                onChange={(e) => onMoveKeyframe(activeKf.id, parseFloat(e.target.value) || 0)}
                className="w-14 bg-slate-900 border border-slate-700 text-slate-200 rounded px-1 py-0.5 text-center text-xs font-mono focus:outline-none focus:border-blue-500 font-bold"
              />
              <button
                onClick={() => onMoveKeyframe(activeKf.id, Math.min(clip.duration, activeKf.time + 0.05))}
                className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[11px]"
                title="Nudge keyframe later (+0.05s)"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}

          <button
            onClick={onAddKeyframe}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow transition"
          >
            <Plus size={14} />
            <span>Keyframe</span>
          </button>

          {activeKf && (
            <button
              onClick={() => onDeleteKeyframe(activeKf.id)}
              className="flex items-center gap-1 bg-red-600/80 hover:bg-red-500 text-white text-xs font-medium px-2 py-1.5 rounded-lg transition cursor-pointer"
              title="Delete Keyframe at Current Time"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Track & Timeline Scrub Bar */}
      <div className="relative w-full pt-1 pb-2">
        {/* Timeline track background */}
        <div
          ref={trackRef}
          className="relative w-full h-8 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center px-2"
        >
          {/* Ticks and Keyframe dots */}
          <div className="relative w-full h-full flex items-center">
            {/* Timeline progress highlight */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-blue-500/10 border-r border-blue-500 pointer-events-none"
              style={{ width: `${(currentTime / clip.duration) * 100}%` }}
            />

            {/* Keyframe Markers */}
            {clip.keyframes.map((kf) => {
              const posPercent = (kf.time / clip.duration) * 100;
              const isSelected = activeKf?.id === kf.id;
              const isBeingDragged = draggingKfId === kf.id;
              return (
                <button
                  key={kf.id}
                  onClick={() => onSeek(kf.time)}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setDraggingKfId(kf.id);
                    onSeek(kf.time);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    setDraggingKfId(kf.id);
                    onSeek(kf.time);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4.5 h-4.5 rotate-45 border transition-all z-30 cursor-grab active:cursor-grabbing ${
                    isBeingDragged
                      ? 'bg-amber-300 border-white scale-150 shadow-2xl shadow-amber-300 ring-4 ring-amber-400/50 z-40'
                      : isSelected
                      ? 'bg-amber-400 border-white scale-125 shadow-lg shadow-amber-400/60 ring-2 ring-amber-400/40'
                      : 'bg-blue-500 border-blue-300 hover:scale-110'
                  }`}
                  style={{ left: `${posPercent}%` }}
                  title={`Keyframe at ${kf.time.toFixed(2)}s (Click & drag to move)`}
                />
              );
            })}
          </div>

          {/* Scrub Range Input */}
          <input
            type="range"
            min={0}
            max={clip.duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => {
              const newTime = parseFloat(e.target.value);
              if (draggingKfId && onMoveKeyframe) {
                onMoveKeyframe(draggingKfId, newTime);
              } else {
                onSeek(newTime);
              }
            }}
            onMouseUp={() => setDraggingKfId(null)}
            onTouchEnd={() => setDraggingKfId(null)}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-20"
          />
        </div>
      </div>
    </div>
  );
}
