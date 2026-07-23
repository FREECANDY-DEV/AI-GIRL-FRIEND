import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Suspense } from 'react';
import { LabModel } from './lab/LabModel';
import { Timeline } from './lab/Timeline';
import { BoneInspector } from './lab/BoneInspector';
import { StandingPoseEditor } from './lab/StandingPoseEditor';
import { AnimationClip, StandingPoseConfig, PosePreset } from '../types/animation';
import { DEFAULT_CLIPS, DEFAULT_STANDING_POSE } from '../data/defaultAnimations';
import { getMirroredBone, getInterpolatedBoneRotation } from '../utils/humanPhysics';
import { BONE_LABELS } from './lab/LabModel';
import {
  ArrowLeft,
  Eye,
  Grid3X3,
  Layers,
  Sliders,
  Play,
  Sparkles,
  Download,
  Plus,
  Check,
  PanelLeftClose,
  PanelLeft,
  MousePointerClick,
  Upload,
  RotateCcw,
  Copy,
  Save,
  Undo2,
  Redo2,
} from 'lucide-react';

interface AnimationLabProps {
  onBackToGame: () => void;
  standingPose: StandingPoseConfig;
  onUpdateStandingPose: (pose: StandingPoseConfig) => void;
  defaultBasePose?: StandingPoseConfig;
  onUpdateDefaultBasePose?: (pose: StandingPoseConfig) => void;
  customClips: AnimationClip[];
  onUpdateClips: (clips: AnimationClip[]) => void;
  customPoses?: PosePreset[];
  onUpdateCustomPoses?: (poses: PosePreset[]) => void;
  initialMode?: 'timeline' | 'pose';
  initialClipId?: string;
}

export function AnimationLab({
  onBackToGame,
  standingPose,
  onUpdateStandingPose,
  defaultBasePose,
  onUpdateDefaultBasePose,
  customClips,
  onUpdateClips,
  customPoses = [],
  onUpdateCustomPoses,
  initialMode = 'timeline',
  initialClipId,
}: AnimationLabProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'pose'>(initialMode);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // OrbitControls reference for disabling during gizmo drag on touch devices
  const orbitControlsRef = useRef<any>(null);

  // Display toggles
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showMesh, setShowMesh] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'female' | 'male'>('female');

  // Expandable left sidebar panel toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Clips state
  const [clips, setClips] = useState<AnimationClip[]>(
    customClips.length > 0 ? customClips : DEFAULT_CLIPS
  );
  const [selectedClipId, setSelectedClipId] = useState<string>(
    initialClipId && clips.some((c) => c.id === initialClipId)
      ? initialClipId
      : clips[0]?.id || 'walk_cycle'
  );

  const activeClip = clips.find((c) => c.id === selectedClipId) || clips[0];

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Bone Inspector, Free Move Translation & Gizmo state
  const [selectedBone, setSelectedBone] = useState<string>('RightUpLeg');
  const [tempBoneOverrides, setTempBoneOverrides] = useState<Record<string, [number, number, number]>>({});
  const [tempBonePosOverrides, setTempBonePosOverrides] = useState<Record<string, [number, number, number]>>({});
  const [gizmoMode, setGizmoMode] = useState<'rotate' | 'translate'>('rotate');
  const [lockedBones, setLockedBones] = useState<Set<string>>(new Set());
  const [isMirrorMode, setIsMirrorMode] = useState<boolean>(true);

  // Human Body Physics & Collision States
  const [enablePhysics, setEnablePhysics] = useState(true);
  const [preventStretch, setPreventStretch] = useState(true);
  const [clampLimits, setClampLimits] = useState(true);
  const [enableSelfCollision, setEnableSelfCollision] = useState(true);
  const [detectedCollisions, setDetectedCollisions] = useState<any[]>([]);

  const [copyNotification, setCopyNotification] = useState(false);

  // Undo / Redo History Stack
  interface HistorySnapshot {
    clips: AnimationClip[];
    standingPose: StandingPoseConfig;
    customPoses: PosePreset[];
  }

  const historyRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistorySnapshot = (
    newClips?: AnimationClip[],
    newStandingPose?: StandingPoseConfig,
    newCustomPoses?: PosePreset[]
  ) => {
    const snapshot: HistorySnapshot = {
      clips: JSON.parse(JSON.stringify(newClips || clips)),
      standingPose: JSON.parse(JSON.stringify(newStandingPose || standingPose)),
      customPoses: JSON.parse(JSON.stringify(newCustomPoses || customPoses)),
    };

    const updated = historyRef.current.slice(0, historyIndexRef.current + 1);
    updated.push(snapshot);

    if (updated.length > 50) {
      updated.shift();
    }

    historyRef.current = updated;
    historyIndexRef.current = updated.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  useEffect(() => {
    if (historyRef.current.length === 0) {
      pushHistorySnapshot(clips, standingPose, customPoses);
    }
  }, []);

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const target = historyRef.current[historyIndexRef.current];
      if (target) {
        setClips(target.clips);
        onUpdateStandingPose(target.standingPose);
        if (onUpdateCustomPoses) onUpdateCustomPoses(target.customPoses);
        setTempBoneOverrides({});
        setTempBonePosOverrides({});
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const target = historyRef.current[historyIndexRef.current];
      if (target) {
        setClips(target.clips);
        onUpdateStandingPose(target.standingPose);
        if (onUpdateCustomPoses) onUpdateCustomPoses(target.customPoses);
        setTempBoneOverrides({});
        setTempBonePosOverrides({});
      }
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear temp bone overrides when scrubbing time or changing clips in timeline mode
  // so keyframe edits remain completely isolated to their respective keyframes!
  useEffect(() => {
    if (activeTab === 'timeline') {
      setTempBoneOverrides({});
      setTempBonePosOverrides({});
    }
  }, [currentTime, selectedClipId, activeTab]);

  const handleToggleLockBone = (bName: string) => {
    setLockedBones((prev) => {
      const next = new Set(prev);
      if (next.has(bName)) {
        next.delete(bName);
      } else {
        next.add(bName);
      }
      return next;
    });
  };

  // Sync clips back to parent
  useEffect(() => {
    onUpdateClips(clips);
  }, [clips, onUpdateClips]);

  // Playback timer loop
  const lastTimeRef = useRef<number>(performance.now());
  useEffect(() => {
    let animFrame: number;

    const tick = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying && activeClip) {
        setCurrentTime((prev) => {
          let next = prev + delta * speed;
          if (next >= activeClip.duration) {
            if (activeClip.loop) {
              next = next % activeClip.duration;
            } else {
              next = activeClip.duration;
              setIsPlaying(false);
            }
          }
          return next;
        });
      }

      animFrame = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, activeClip, speed]);

  useEffect(() => {
    if (isPlaying) {
      setTempBoneOverrides({});
      setTempBonePosOverrides({});
    }
  }, [isPlaying]);

  // Keyframe editing handlers
  const updateActiveClipKeyframeTransform = (
    bName: string,
    deg: [number, number, number]
  ) => {
    if (!activeClip) return;

    const activeKfIndex = activeClip.keyframes.findIndex(
      (kf) => Math.abs(kf.time - currentTime) < 0.05
    );

    let updatedKfs = [...activeClip.keyframes];
    const mirrorInfo = isMirrorMode ? getMirroredBone(bName, deg) : null;

    if (activeKfIndex !== -1) {
      const kf = updatedKfs[activeKfIndex];
      const newTransforms = { ...kf.transforms, [bName]: deg };
      if (mirrorInfo) {
        newTransforms[mirrorInfo.mirrorName] = mirrorInfo.mirrorDeg;
      }
      updatedKfs[activeKfIndex] = {
        ...kf,
        transforms: newTransforms,
      };
    } else {
      const baseTransforms: Record<string, [number, number, number]> = {};
      const knownBones = new Set(
        activeClip.keyframes.flatMap((k) => Object.keys(k.transforms))
      );
      knownBones.forEach((b) => {
        baseTransforms[b] = getInterpolatedBoneRotation(activeClip, currentTime, b);
      });
      baseTransforms[bName] = deg;
      if (mirrorInfo) {
        baseTransforms[mirrorInfo.mirrorName] = mirrorInfo.mirrorDeg;
      }

      const newKf = {
        id: `kf_${Date.now()}`,
        time: Number(currentTime.toFixed(2)),
        transforms: baseTransforms,
      };
      updatedKfs.push(newKf);
      updatedKfs.sort((a, b) => a.time - b.time);
    }

    const updatedClip: AnimationClip = {
      ...activeClip,
      keyframes: updatedKfs,
    };

    setClips(clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)));
  };

  const updateActiveClipKeyframePosition = (
    bName: string,
    pos: [number, number, number]
  ) => {
    if (!activeClip) return;

    const activeKfIndex = activeClip.keyframes.findIndex(
      (kf) => Math.abs(kf.time - currentTime) < 0.05
    );

    let updatedKfs = [...activeClip.keyframes];

    if (activeKfIndex !== -1) {
      const kf = updatedKfs[activeKfIndex];
      const newPositions = { ...(kf.positions || {}), [bName]: pos };
      updatedKfs[activeKfIndex] = {
        ...kf,
        positions: newPositions,
      };
    } else {
      const baseTransforms: Record<string, [number, number, number]> = {};
      const knownBones = new Set(
        activeClip.keyframes.flatMap((k) => Object.keys(k.transforms))
      );
      knownBones.forEach((b) => {
        baseTransforms[b] = getInterpolatedBoneRotation(activeClip, currentTime, b);
      });

      const newKf = {
        id: `kf_${Date.now()}`,
        time: Number(currentTime.toFixed(2)),
        transforms: baseTransforms,
        positions: { [bName]: pos },
      };
      updatedKfs.push(newKf);
      updatedKfs.sort((a, b) => a.time - b.time);
    }

    const updatedClip: AnimationClip = {
      ...activeClip,
      keyframes: updatedKfs,
    };

    setClips(clips.map((c) => (c.id === updatedClip.id ? updatedClip : c)));
  };

  const handleBoneRotate = (bName: string, deg: [number, number, number]) => {
    setTempBoneOverrides((prev) => {
      const next = { ...prev, [bName]: deg };
      if (isMirrorMode) {
        const mirror = getMirroredBone(bName, deg);
        if (mirror) {
          next[mirror.mirrorName] = mirror.mirrorDeg;
        }
      }
      return next;
    });

    if (activeTab === 'timeline' && activeClip) {
      updateActiveClipKeyframeTransform(bName, deg);
    }
  };

  const handleBoneTranslate = (bName: string, deltaPos: [number, number, number]) => {
    setTempBonePosOverrides((prev) => {
      const next = { ...prev, [bName]: deltaPos };
      if (isMirrorMode) {
        let mirrorName = '';
        if (bName.startsWith('Left')) mirrorName = bName.replace('Left', 'Right');
        else if (bName.startsWith('Right')) mirrorName = bName.replace('Right', 'Left');
        if (mirrorName) {
          next[mirrorName] = [-deltaPos[0], deltaPos[1], deltaPos[2]];
        }
      }
      return next;
    });

    if (activeTab === 'timeline' && activeClip) {
      updateActiveClipKeyframePosition(bName, deltaPos);
    }
  };

  const handleZeroSelectedBone = () => {
    if (!selectedBone) return;

    setTempBoneOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedBone];
      if (isMirrorMode) {
        let mirrorName = '';
        if (selectedBone.startsWith('Left')) mirrorName = selectedBone.replace('Left', 'Right');
        else if (selectedBone.startsWith('Right')) mirrorName = selectedBone.replace('Right', 'Left');
        if (mirrorName) delete next[mirrorName];
      }
      return next;
    });

    setTempBonePosOverrides((prev) => {
      const next = { ...prev };
      delete next[selectedBone];
      if (isMirrorMode) {
        let mirrorName = '';
        if (selectedBone.startsWith('Left')) mirrorName = selectedBone.replace('Left', 'Right');
        else if (selectedBone.startsWith('Right')) mirrorName = selectedBone.replace('Right', 'Left');
        if (mirrorName) delete next[mirrorName];
      }
      return next;
    });

    if (standingPose.customBoneRotations) {
      const nextRotations = { ...standingPose.customBoneRotations };
      delete nextRotations[selectedBone];
      onUpdateStandingPose({
        ...standingPose,
        customBoneRotations: nextRotations,
      });
    }

    if (activeClip) {
      updateActiveClipKeyframeTransform(selectedBone, [0, 0, 0]);
      updateActiveClipKeyframePosition(selectedBone, [0, 0, 0]);
    }
  };

  const handleResetAllBonesAndPose = () => {
    setTempBoneOverrides({});
    setTempBonePosOverrides({});
    onUpdateStandingPose(DEFAULT_STANDING_POSE);
    if (activeTab === 'timeline' && activeClip) {
      const factoryMatch = DEFAULT_CLIPS.find((d) => d.id === activeClip.id);
      if (factoryMatch) {
        setClips(clips.map((c) => (c.id === factoryMatch.id ? factoryMatch : c)));
      }
    }
    setSelectedBone('Hips');
    handleResetCameraView();
  };

  const handleAddKeyframe = () => {
    if (!activeClip) return;

    // 1. Capture base standing pose bone rotations
    const poseRotations: Record<string, [number, number, number]> = {
      RightUpLeg: [0, 0, -standingPose.stanceWidth * 50],
      LeftUpLeg: [0, 0, standingPose.stanceWidth * 50],
      RightArm: [0, 0, standingPose.armSpread * 50],
      LeftArm: [0, 0, -standingPose.armSpread * 50],
      Spine1: [standingPose.chestSpineTilt * 30, 0, 0],
      Head: [standingPose.headTilt * 30, 0, 0],
      RightLeg: [standingPose.kneeFlex * 40, 0, 0],
      LeftLeg: [standingPose.kneeFlex * 40, 0, 0],
      ...(standingPose.customBoneRotations || {}),
    };

    // 2. Base transforms from active keyframe or fallback
    const activeKf = activeClip.keyframes.find(
      (kf) => Math.abs(kf.time - currentTime) < 0.03
    );

    const baseTransforms = activeKf
      ? { ...activeKf.transforms }
      : { ...(activeClip.keyframes[0]?.transforms || {}) };

    const basePositions = activeKf
      ? { ...activeKf.positions }
      : { ...(activeClip.keyframes[0]?.positions || {}) };

    // 3. Merge pose + keyframe transforms + temporary overrides
    const updatedTransforms = {
      ...poseRotations,
      ...baseTransforms,
      ...tempBoneOverrides,
    };

    const updatedPositions = {
      ...basePositions,
      ...tempBonePosOverrides,
    };

    const newKf = {
      id: `kf_${Date.now()}`,
      time: Number(currentTime.toFixed(2)),
      transforms: updatedTransforms,
      positions: updatedPositions,
    };

    // Filter out close keyframe if updating existing
    const updatedKfs = activeClip.keyframes
      .filter((kf) => Math.abs(kf.time - currentTime) >= 0.03)
      .concat(newKf)
      .sort((a, b) => a.time - b.time);

    const updatedClip: AnimationClip = {
      ...activeClip,
      keyframes: updatedKfs,
    };

    const nextClips = clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
    setClips(nextClips);
    setTempBoneOverrides({});
    setTempBonePosOverrides({});
    pushHistorySnapshot(nextClips);
  };

  const handleDeleteKeyframe = (keyframeId: string) => {
    if (!activeClip) return;
    const updatedClip: AnimationClip = {
      ...activeClip,
      keyframes: activeClip.keyframes.filter((kf) => kf.id !== keyframeId),
    };
    const nextClips = clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
    setClips(nextClips);
    pushHistorySnapshot(nextClips);
  };

  const handleMoveKeyframe = (keyframeId: string, newTime: number) => {
    if (!activeClip) return;
    const clampedTime = Number(Math.min(activeClip.duration, Math.max(0, newTime)).toFixed(2));

    const updatedKfs = activeClip.keyframes
      .map((kf) => (kf.id === keyframeId ? { ...kf, time: clampedTime } : kf))
      .sort((a, b) => a.time - b.time);

    const updatedClip: AnimationClip = {
      ...activeClip,
      keyframes: updatedKfs,
    };

    const nextClips = clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
    setClips(nextClips);
    setCurrentTime(clampedTime);
    pushHistorySnapshot(nextClips);
  };

  const handleCopyPoseFromKeyframe = (sourceKfId: string) => {
    if (!activeClip) return;
    const sourceKf = activeClip.keyframes.find((k) => k.id === sourceKfId);
    if (!sourceKf) return;

    const copiedTransforms = JSON.parse(JSON.stringify(sourceKf.transforms));
    const copiedPositions = sourceKf.positions ? JSON.parse(JSON.stringify(sourceKf.positions)) : {};

    const existingKfIndex = activeClip.keyframes.findIndex(
      (kf) => Math.abs(kf.time - currentTime) < 0.05
    );

    let updatedKfs = [...activeClip.keyframes];

    if (existingKfIndex !== -1) {
      updatedKfs[existingKfIndex] = {
        ...updatedKfs[existingKfIndex],
        transforms: copiedTransforms,
        positions: copiedPositions,
      };
    } else {
      const newKf = {
        id: `kf_${Date.now()}`,
        time: Number(currentTime.toFixed(2)),
        transforms: copiedTransforms,
        positions: copiedPositions,
      };
      updatedKfs.push(newKf);
      updatedKfs.sort((a, b) => a.time - b.time);
    }

    const updatedClip = { ...activeClip, keyframes: updatedKfs };
    const nextClips = clips.map((c) => (c.id === updatedClip.id ? updatedClip : c));
    setClips(nextClips);
    setTempBoneOverrides({});
    setTempBonePosOverrides({});
    pushHistorySnapshot(nextClips);
  };

  const handleCreateNewClip = () => {
    const newClip: AnimationClip = {
      id: `clip_${Date.now()}`,
      name: `New Motion ${clips.length + 1}`,
      duration: 1.0,
      fps: 30,
      loop: true,
      keyframes: [
        {
          id: `kf_start_${Date.now()}`,
          time: 0.0,
          transforms: { RightArm: [0, 0, 0], LeftArm: [0, 0, 0] },
        },
        {
          id: `kf_end_${Date.now()}`,
          time: 1.0,
          transforms: { RightArm: [0, 0, 0], LeftArm: [0, 0, 0] },
        },
      ],
    };

    setClips([...clips, newClip]);
    setSelectedClipId(newClip.id);
    setCurrentTime(0);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(clips, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'animation_presets.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 2000);
  };

  const handleCopyTSCode = () => {
    const tsCode = `export const DEFAULT_CLIPS: AnimationClip[] = ${JSON.stringify(clips, null, 2)};`;
    navigator.clipboard.writeText(tsCode);
    setCopyNotification(true);
    setTimeout(() => setCopyNotification(false), 2000);
  };

  const handleSaveCustomPose = (newPose: PosePreset) => {
    if (onUpdateCustomPoses) {
      onUpdateCustomPoses([...customPoses, newPose]);
    }
  };

  const handleDeleteCustomPose = (id: string) => {
    if (onUpdateCustomPoses) {
      onUpdateCustomPoses(customPoses.filter((p) => p.id !== id));
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].keyframes) {
          setClips(parsed);
          setSelectedClipId(parsed[0].id);
          setCurrentTime(0);
        } else {
          alert('Invalid animation JSON format. Please upload a valid exported clips JSON file.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all animation clips to factory defaults?')) {
      setClips(DEFAULT_CLIPS);
      setSelectedClipId(DEFAULT_CLIPS[0].id);
      setCurrentTime(0);
    }
  };

  const handleSaveToProjectFiles = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/save-animations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clips,
          poses: customPoses,
          standingPose,
        }),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
        return;
      }
    } catch (err) {
      console.warn('API save route unavailable, using local sync:', err);
    }
    localStorage.setItem('lab_custom_clips_v2', JSON.stringify(clips));
    localStorage.setItem('lab_custom_poses_v2', JSON.stringify(customPoses));
    localStorage.setItem('lab_standing_pose_v2', JSON.stringify(standingPose));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleResetCameraView = () => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(0, 0.9, 0);
      orbitControlsRef.current.object.position.set(0, 1.8, 3.2);
      orbitControlsRef.current.update();
    }
  };

  const handleRestartAllBodyPosition = handleResetCameraView;

  // Get current rotation for selected bone
  const interpolatedRot =
    activeTab === 'timeline' && activeClip
      ? getInterpolatedBoneRotation(activeClip, currentTime, selectedBone)
      : [0, 0, 0];

  const tempRot = tempBoneOverrides[selectedBone];
  const customRot = standingPose.customBoneRotations?.[selectedBone];

  const currentBoneRot: [number, number, number] = tempRot
    ? [tempRot[0], tempRot[1], tempRot[2]]
    : activeTab === 'timeline'
    ? [interpolatedRot[0], interpolatedRot[1], interpolatedRot[2]]
    : customRot
    ? [customRot[0], customRot[1], customRot[2]]
    : [0, 0, 0];

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-12 sm:h-14 bg-slate-900 border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToGame}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition border border-slate-700 shadow-md"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Game Map</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-blue-400" />
            <h1 className="font-bold text-xs sm:text-sm tracking-wide text-white">3D Studio Lab</h1>
            <span className="hidden lg:flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Saved locally
            </span>
          </div>
        </div>

        {/* Display Toggles & Model Switcher */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 sm:p-1 rounded-lg border border-slate-800 text-[11px]">
          {/* Single Compact Model Gender Switcher - Background-less with Cool Symbols */}
          <button
            onClick={() => setSelectedModel(selectedModel === 'female' ? 'male' : 'female')}
            className="flex items-center gap-1.5 px-2 py-0.5 text-slate-300 hover:text-white transition group mr-1.5 cursor-pointer"
            title={`Toggle Character Model (Current: ${selectedModel === 'female' ? 'Female ♀' : 'Male ♂'})`}
          >
            <span className={`text-sm font-black transition-transform duration-200 group-hover:scale-125 ${
              selectedModel === 'female' ? 'text-pink-400' : 'text-cyan-400'
            }`}>
              {selectedModel === 'female' ? '♀' : '♂'}
            </span>
            <span className="text-[11px] font-semibold text-slate-300 group-hover:text-slate-100">
              {selectedModel === 'female' ? 'Female' : 'Male'}
            </span>
          </button>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium flex items-center gap-1 transition ${
              showSkeleton ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Skeleton Joints"
          >
            <Eye size={12} />
            <span className="hidden md:inline">Skeleton</span>
          </button>

          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium flex items-center gap-1 transition ${
              showMesh ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Body Mesh"
          >
            <Layers size={12} />
            <span className="hidden md:inline">Mesh</span>
          </button>

          <button
            onClick={() => setWireframe(!wireframe)}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium transition ${
              wireframe ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">Wireframe</span>
            <span className="sm:hidden">Wire</span>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium flex items-center gap-1 transition ${
              showGrid ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid3X3 size={12} />
            <span className="hidden md:inline">Grid</span>
          </button>
        </div>

        {/* Import/Export / Undo-Redo / Sidebar Toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Undo and Redo Action Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              title="Undo Last Action (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
              title="Redo Action (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo2 size={14} />
            </button>
          </div>

          <label
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-2 py-1 sm:py-1.5 rounded-lg font-medium transition cursor-pointer"
            title="Import Animation JSON file"
          >
            <Upload size={13} />
            <span className="hidden xl:inline">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <button
            onClick={handleSaveToProjectFiles}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow-md border border-blue-500/40 transition cursor-pointer disabled:opacity-50"
            title="Save created animations and pose presets directly to project files (src/data/defaultAnimations.ts)"
          >
            {saveStatus === 'saving' ? (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : saveStatus === 'saved' ? (
              <Check size={13} className="text-white font-bold" />
            ) : (
              <Save size={13} />
            )}
            <span>
              {saveStatus === 'saving'
                ? 'Saving...'
                : saveStatus === 'saved'
                ? 'Saved to Project!'
                : 'Save to Project Files'}
            </span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 text-xs px-2 py-1 sm:py-1.5 rounded-lg font-medium transition"
            title="Export Animations to JSON"
          >
            {copyNotification ? <Check size={13} className="text-emerald-400" /> : <Download size={13} />}
            <span className="hidden sm:inline">{copyNotification ? 'Exported!' : 'Export JSON'}</span>
          </button>

          <button
            onClick={handleCopyTSCode}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs px-2 py-1 sm:py-1.5 rounded-lg font-medium transition"
            title="Copy Animation Clips TS Code for defaultAnimations.ts"
          >
            <Copy size={13} />
            <span className="hidden sm:inline">Copy TS Code</span>
          </button>

          {/* Expandable Left Panel Header Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Toggle Left Inspector Panel"
          >
            {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
        </div>
      </header>

      {/* Main Workspace (Expandable Left Sidebar + Viewport) */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Left Sidebar Expandable Tool Panel */}
        {sidebarOpen ? (
          <aside className="absolute sm:relative inset-y-0 left-0 w-full sm:w-80 max-h-full bg-slate-900/95 border-r border-slate-800 p-2.5 sm:p-3 flex flex-col gap-2.5 overflow-y-auto z-30 custom-scrollbar backdrop-blur-md shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="font-bold text-xs uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Sliders size={13} className="text-blue-400" />
                Bone Inspector & Controls
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Collapse Inspector Panel"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>

            {/* Mode Tabs Inside Left Sidebar */}
            <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'timeline'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play size={12} />
                <span>Timeline</span>
              </button>

              <button
                onClick={() => setActiveTab('pose')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'pose'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders size={12} />
                <span>Pose Preset</span>
              </button>
            </div>

            {activeTab === 'timeline' ? (
              <>
                {/* Animation Clip Selector */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">Animation Clip</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleResetDefaults}
                        className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded transition"
                        title="Restore Factory Clips"
                      >
                        <RotateCcw size={10} />
                        <span>Reset</span>
                      </button>
                      <button
                        onClick={handleCreateNewClip}
                        className="flex items-center gap-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition"
                      >
                        <Plus size={11} />
                        <span>New Clip</span>
                      </button>
                    </div>
                  </div>

                  <select
                    value={selectedClipId}
                    onChange={(e) => {
                      setSelectedClipId(e.target.value);
                      setCurrentTime(0);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {clips.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.keyframes.length} KFs)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bone Inspector Panel */}
                <BoneInspector
                  selectedBone={selectedBone}
                  onSelectBone={setSelectedBone}
                  rotation={currentBoneRot}
                  onChangeRotation={(rot) => handleBoneRotate(selectedBone, rot)}
                  onResetBone={handleZeroSelectedBone}
                  onResetAllBones={handleResetAllBonesAndPose}
                  onSaveCurrentBone={handleAddKeyframe}
                  gizmoMode={gizmoMode}
                  onToggleGizmoMode={(m) => setGizmoMode(m)}
                  lockedBones={lockedBones}
                  onToggleLockBone={handleToggleLockBone}
                  isMirrorMode={isMirrorMode}
                  onToggleMirrorMode={setIsMirrorMode}
                />
              </>
            ) : (
              /* Standing Pose Editor */
              <StandingPoseEditor
                config={standingPose}
                onChangeConfig={onUpdateStandingPose}
                onReset={handleResetCameraView}
                selectedBone={selectedBone}
                onSelectBone={setSelectedBone}
                rotation={currentBoneRot}
                onChangeRotation={(rot) => handleBoneRotate(selectedBone, rot)}
                onResetBone={handleZeroSelectedBone}
                onResetAllBones={handleResetAllBonesAndPose}
                gizmoMode={gizmoMode}
                onToggleGizmoMode={(m) => setGizmoMode(m)}
                lockedBones={lockedBones}
                onToggleLockBone={handleToggleLockBone}
                tempBoneOverrides={tempBoneOverrides}
                isMirrorMode={isMirrorMode}
                onToggleMirrorMode={setIsMirrorMode}
                defaultBasePose={defaultBasePose}
                onSetAsDefaultBasePose={onUpdateDefaultBasePose}
                customPoses={customPoses}
                onSaveCustomPose={handleSaveCustomPose}
                onDeleteCustomPose={handleDeleteCustomPose}
              />
            )}
          </aside>
        ) : (
          /* Expand Floating Drawer Button on Top-Left Edge */
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md transition-all group"
            title="Expand Bone Inspector Panel"
          >
            <PanelLeft size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold">Bone Inspector</span>
          </button>
        )}

        {/* 3D Canvas Viewport */}
        <div className="flex-1 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <Canvas camera={{ position: [0, 1.8, 3.2], fov: 45 }}>
            <color attach="background" args={['#0f172a']} />
            <ambientLight intensity={0.9} />
            <directionalLight position={[10, 15, 5]} intensity={1.8} castShadow />
            <directionalLight position={[-10, 5, -5]} intensity={0.6} color="#3b82f6" />

            <OrbitControls ref={orbitControlsRef} enablePan enableDamping dampingFactor={0.08} target={[0, 1, 0]} />

            <Suspense fallback={null}>
              <LabModel
                showSkeleton={showSkeleton}
                showMesh={showMesh}
                wireframe={wireframe}
                selectedBoneName={selectedBone}
                onSelectBone={setSelectedBone}
                activeClip={activeClip}
                currentTime={currentTime}
                standingPose={standingPose}
                activeMode={activeTab}
                tempBoneOverrides={tempBoneOverrides}
                tempBonePosOverrides={tempBonePosOverrides}
                onBoneRotate={handleBoneRotate}
                onBoneTranslate={handleBoneTranslate}
                gizmoMode={gizmoMode}
                lockedBones={lockedBones}
                controlsRef={orbitControlsRef}
                modelPath={selectedModel === 'female' ? '/female.glb' : '/male.glb'}
                enablePhysics={enablePhysics}
                preventStretch={preventStretch}
                clampLimits={clampLimits}
                enableSelfCollision={enableSelfCollision}
                onDetectedCollisions={setDetectedCollisions}
                isPlaying={isPlaying}
              />

              {showGrid && (
                <Grid
                  position={[0, 0.002, 0]}
                  args={[30, 30]}
                  cellSize={0.2}
                  cellThickness={1}
                  cellColor="#334155"
                  sectionSize={1}
                  sectionThickness={1.5}
                  sectionColor="#475569"
                  fadeDistance={25}
                  fadeStrength={1}
                  infiniteGrid
                />
              )}
            </Suspense>
          </Canvas>

          {/* Clean Human Body Physics Controls HUD */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shadow-xl backdrop-blur text-[10.5px]">
            <button
              onClick={handleResetCameraView}
              className="px-2.5 py-1 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow flex items-center gap-1 transition transform active:scale-95 cursor-pointer"
              title="Reset 3D camera view"
            >
              <RotateCcw size={12} />
              <span>Reset Camera</span>
            </button>

            <button
              onClick={() => setIsMirrorMode(!isMirrorMode)}
              className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition ${
                isMirrorMode
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Symmetry Mode: Automatically mirror edits to opposite limb"
            >
              <span>🪞</span>
              <span>Mirror</span>
            </button>

            <button
              onClick={() => setPreventStretch(!preventStretch)}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                preventStretch
                  ? 'bg-emerald-600/90 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Prevent Bone Stretching"
            >
              <span>Rigid Sockets</span>
            </button>

            <button
              onClick={() => setClampLimits(!clampLimits)}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                clampLimits
                  ? 'bg-blue-600/90 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Anatomical Range of Motion Limits"
            >
              <span>Anatomical Limits</span>
            </button>

            <button
              onClick={() => setEnablePhysics(!enablePhysics)}
              className={`px-2 py-1 rounded-lg font-medium transition ${
                enablePhysics
                  ? 'bg-purple-600/90 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Soft Physics Dynamics"
            >
              <span>Soft Physics</span>
            </button>
          </div>

          {/* Sleek Minimalist Active Selection Viewport HUD */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2.5 bg-slate-950/90 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-200 backdrop-blur shadow-2xl">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
              <span>{BONE_LABELS[selectedBone] || selectedBone}</span>
            </div>
            <span className="font-mono text-[10.5px] text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              [{currentBoneRot.join('°, ')}°]
            </span>
            {isMirrorMode && (
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold flex items-center gap-1">
                <span>🪞</span>
                <span>Mirrored</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Timeline Bar */}
      {activeTab === 'timeline' && activeClip && (
        <Timeline
          clip={activeClip}
          currentTime={currentTime}
          isPlaying={isPlaying}
          speed={speed}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onSeek={(time) => setCurrentTime(time)}
          onRestart={handleResetCameraView}
          onChangeSpeed={(s) => setSpeed(s)}
          onToggleLoop={() => {
            const updated = { ...activeClip, loop: !activeClip.loop };
            setClips(clips.map((c) => (c.id === updated.id ? updated : c)));
          }}
          onAddKeyframe={handleAddKeyframe}
          onDeleteKeyframe={handleDeleteKeyframe}
          onMoveKeyframe={handleMoveKeyframe}
          onCopyPoseFromKeyframe={handleCopyPoseFromKeyframe}
          onChangeDuration={(dur) => {
            const updated = { ...activeClip, duration: dur };
            setClips(clips.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />
      )}
    </div>
  );
}
