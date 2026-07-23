/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, ContactShadows, Stars } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { useState, useEffect, useRef, Suspense } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Player } from './components/Player';
import { JoystickControls } from './components/JoystickControls';
import { AnimationLab } from './components/AnimationLab';
import { AnimationLibrary } from './components/AnimationLibrary';
import { StreetLightPole } from './components/StreetLightPole';
import { Laptop } from './components/Laptop';
import { Wand2 } from 'lucide-react';
import { SceneSettingsPanel } from './components/SceneSettingsPanel';
import { StandingPoseConfig, AnimationClip, PosePreset } from './types/animation';
import { SceneConfig, DEFAULT_SCENE_CONFIG } from './types/scene';
import { DEFAULT_STANDING_POSE, DEFAULT_CLIPS, POSE_PRESETS } from './data/defaultAnimations';
import { Sparkles, Layers, Gamepad2, Sliders, Move, X, MessageSquare, Send, Volume2, VolumeX, Loader2, Eye, History, Save, ArrowUp, ArrowDown, Check, RotateCcw, Menu } from 'lucide-react';
import { generateGLMResponse, speakFemaleTTS } from './utils/aiCompanion';

export default function App() {
  const [currentView, setCurrentView] = useState<'game' | 'library' | 'lab'>('game');
  const [joystickMove, setJoystickMove] = useState({ x: 0, y: 0 });
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isDragBodyMode, setIsDragBodyMode] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isFreeCamera, setIsFreeCamera] = useState(true);
  const [isCameraZoomedClose, setIsCameraZoomedClose] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isCamControlsOpen, setIsCamControlsOpen] = useState(false);

  // Camera Height & Permanent Save State
  const [camHeight, setCamHeight] = useState<number>(1.45);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Dynamic Touch Screen Detection (Joystick appears only when touching screen)
  const [isTouchActive, setIsTouchActive] = useState(false);

  useEffect(() => {
    let touchTimeout: NodeJS.Timeout;
    const handleTouchStart = () => {
      setIsTouchActive(true);
      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => setIsTouchActive(false), 5000);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      clearTimeout(touchTimeout);
    };
  }, []);

  // Chat History State
  const [chatHistory, setChatHistory] = useState<Array<{ id: string; sender: 'user' | 'ava'; text: string; time: string }>>([]);

  // AI Companion Chat State (Z.AI GLM-4-Flash + Female TTS)
  const [aiChatInput, setAiChatInput] = useState('');
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);

  // Target config when opening the 3D studio lab from the animation library
  const [labConfig, setLabConfig] = useState<{ mode: 'timeline' | 'pose'; clipId?: string; poseId?: string }>({
    mode: 'pose',
  });

  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(() => {
    try {
      const saved = localStorage.getItem('lab_scene_config_v3');
      return saved ? { ...DEFAULT_SCENE_CONFIG, ...JSON.parse(saved) } : DEFAULT_SCENE_CONFIG;
    } catch {
      return DEFAULT_SCENE_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('lab_scene_config_v3', JSON.stringify(sceneConfig));
  }, [sceneConfig]);

  const [isSceneSettingsOpen, setIsSceneSettingsOpen] = useState(false);

  // Standing Pose state (Persisted in LocalStorage)
  const [standingPose, setStandingPose] = useState<StandingPoseConfig>(() => {
    try {
      const saved = localStorage.getItem('lab_standing_pose_v2');
      return saved ? JSON.parse(saved) : DEFAULT_STANDING_POSE;
    } catch {
      return DEFAULT_STANDING_POSE;
    }
  });

  // User Custom Default Base Pose state (Persisted in LocalStorage)
  const [defaultBasePose, setDefaultBasePose] = useState<StandingPoseConfig>(() => {
    try {
      const saved = localStorage.getItem('lab_default_base_pose_v1');
      return saved ? JSON.parse(saved) : DEFAULT_STANDING_POSE;
    } catch {
      return DEFAULT_STANDING_POSE;
    }
  });

  // Custom Animation Clips state (Persisted in LocalStorage)
  const [customClips, setCustomClips] = useState<AnimationClip[]>(() => {
    try {
      const saved = localStorage.getItem('lab_custom_clips_v2');
      if (saved) {
        const parsed: AnimationClip[] = JSON.parse(saved);
        // Ensure default clips like walk_cycle carry the latest keyframe structure if missing
        return parsed.map((clip) => {
          const defaultMatch = DEFAULT_CLIPS.find((d) => d.id === clip.id);
          if (defaultMatch && clip.id === 'walk_cycle' && !clip.keyframes[0]?.positions) {
            return defaultMatch;
          }
          return clip;
        });
      }
      return DEFAULT_CLIPS;
    } catch {
      return DEFAULT_CLIPS;
    }
  });

  // Custom Pose Presets state (Persisted in LocalStorage)
  const [customPoses, setCustomPoses] = useState<PosePreset[]>(() => {
    try {
      const saved = localStorage.getItem('lab_custom_poses_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active Walk Cycle Clip ID for the game character (Persisted in LocalStorage)
  const [activeWalkClipId, setActiveWalkClipId] = useState<string>(() => {
    try {
      return localStorage.getItem('lab_active_walk_clip_v2') || 'walk_cycle';
    } catch {
      return 'walk_cycle';
    }
  });

  // Active Thinking Pose ID (Persisted in LocalStorage)
  const [activeThinkingPoseId, setActiveThinkingPoseId] = useState<string>(() => {
    try {
      return localStorage.getItem('lab_active_thinking_pose_v2') || 'thinking_pose';
    } catch {
      return 'thinking_pose';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lab_active_thinking_pose_v2', activeThinkingPoseId);
    } catch (e) {
      console.error('Failed to save thinking pose id:', e);
    }
  }, [activeThinkingPoseId]);

  useEffect(() => {
    try {
      localStorage.setItem('lab_standing_pose_v2', JSON.stringify(standingPose));
    } catch (e) {
      console.error('Failed to save standing pose:', e);
    }
  }, [standingPose]);

  useEffect(() => {
    try {
      localStorage.setItem('lab_default_base_pose_v1', JSON.stringify(defaultBasePose));
    } catch (e) {
      console.error('Failed to save default base pose:', e);
    }
  }, [defaultBasePose]);

  useEffect(() => {
    try {
      localStorage.setItem('lab_custom_clips_v2', JSON.stringify(customClips));
    } catch (e) {
      console.error('Failed to save animation clips:', e);
    }
  }, [customClips]);

  useEffect(() => {
    try {
      localStorage.setItem('lab_custom_poses_v2', JSON.stringify(customPoses));
    } catch (e) {
      console.error('Failed to save custom poses:', e);
    }
  }, [customPoses]);

  useEffect(() => {
    try {
      localStorage.setItem('lab_active_walk_clip_v2', activeWalkClipId);
    } catch (e) {
      console.error('Failed to save active walk clip ID:', e);
    }
  }, [activeWalkClipId]);

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  // Active walk & idle clip objects used by Player in the game map
  const activeWalkClip = customClips.find((c) => c.id === activeWalkClipId) || customClips[0] || null;
  const activeIdleClip = customClips.find((c) => c.id === 'breathing_idle') || customClips[0] || null;

  // Resolve the active thinking pose
  const allPoses = [...POSE_PRESETS, ...customPoses];
  const activeThinkingPose = allPoses.find(p => p.id === activeThinkingPoseId) || POSE_PRESETS.find(p => p.id === 'thinking_pose') || POSE_PRESETS[0];

  const finalStandingPose = isAiThinking ? activeThinkingPose.pose : standingPose;

  // Keyboard WASD Controls
  useEffect(() => {
    const keys = new Set<string>();

    const updateMovement = () => {
      let x = 0;
      let y = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;

      if (x !== 0 && y !== 0) {
        const length = Math.sqrt(x * x + y * y);
        x /= length;
        y /= length;
      }

      setJoystickMove({ x, y });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys.add(e.code);
      updateMovement();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys.delete(e.code);
      updateMovement();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleResetModelAndCamera = () => {
    // 1. Reset camera mode to default Free View
    setIsFreeCamera(true);

    // 2. Increment resetTrigger so Player resets rigidBody position to origin
    setResetTrigger((prev) => prev + 1);

    // 3. Always set camera position directly in front of her face at eye level (World Y = 1.45m)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.object.position.set(0, 1.45, 1.6);
      orbitControlsRef.current.target.set(0, 1.45, 0);
      orbitControlsRef.current.update();
    }
    setCamHeight(1.45);
    setSaveToast('Model & View Reset to Front Face View!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSaveCurrentCameraView = () => {
    if (orbitControlsRef.current) {
      const pos = orbitControlsRef.current.object.position;
      const target = orbitControlsRef.current.target;
      const data = {
        camPos: [pos.x, pos.y, pos.z],
        targetPos: [target.x, target.y, target.z],
        isFree: isFreeCamera,
      };
      localStorage.setItem('gridmap_custom_cam_position', JSON.stringify(data));
      localStorage.setItem('gridmap_default_cam_preset', 'custom');
      setSaveToast('Camera view saved permanently!');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleHeightSliderChange = (newY: number) => {
    setCamHeight(newY);
    if (orbitControlsRef.current) {
      const pos = orbitControlsRef.current.object.position;
      const target = orbitControlsRef.current.target;
      const deltaY = newY - pos.y;
      pos.y = newY;
      target.y += deltaY;
      orbitControlsRef.current.update();
    }
  };

  const handleOpenLab = (mode: 'timeline' | 'pose', targetId?: string) => {
    setLabConfig({ mode, clipId: mode === 'timeline' ? targetId : undefined, poseId: mode === 'pose' ? targetId : undefined });
    setCurrentView('lab');
  };

  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendAiMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiChatInput.trim() || isAiThinking) return;

    const userText = aiChatInput.trim();
    setAiChatInput('');
    setIsAiThinking(true);

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = Date.now().toString();

    setChatHistory((prev) => [...prev, { id: userMsgId, sender: 'user', text: userText, time: nowTime }]);

    const reply = await generateGLMResponse(userText);
    setIsAiThinking(false);
    setSpeechMessage(reply);

    setChatHistory((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), sender: 'ava', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);

    if (isTtsEnabled) {
      speakFemaleTTS(reply);
    }

    // Auto-disappear after 5 seconds
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    speechTimerRef.current = setTimeout(() => {
      setSpeechMessage(null);
    }, 5000);
  };

  // Render 3D Animation & Pose Laboratory
  if (currentView === 'lab') {
    return (
      <AnimationLab
        onBackToGame={() => setCurrentView('game')}
        standingPose={standingPose}
        onUpdateStandingPose={setStandingPose}
        defaultBasePose={defaultBasePose}
        onUpdateDefaultBasePose={setDefaultBasePose}
        customClips={customClips}
        onUpdateClips={setCustomClips}
        customPoses={customPoses}
        onUpdateCustomPoses={setCustomPoses}
        initialMode={labConfig.mode}
        initialClipId={labConfig.clipId}
        initialPoseId={labConfig.poseId}
      />
    );
  }

  // Render Animated Cards Page Menu / Library
  if (currentView === 'library') {
    return (
      <AnimationLibrary
        customClips={customClips}
        onUpdateClips={setCustomClips}
        standingPose={standingPose}
        onUpdateStandingPose={setStandingPose}
        customPoses={customPoses}
        onUpdateCustomPoses={setCustomPoses}
        activeWalkClipId={activeWalkClipId}
        onSelectActiveWalkClip={setActiveWalkClipId}
        activeThinkingPoseId={activeThinkingPoseId}
        onSelectActiveThinkingPose={setActiveThinkingPoseId}
        onOpenLab={handleOpenLab}
        onBackToGame={() => setCurrentView('game')}
      />
    );
  }

  // Render Main 3D Game Map
  return (
    <div className="w-full h-screen bg-slate-950 relative flex items-center overflow-hidden touch-none select-none">
      {/* Left-Side Chat History Panel */}
      {isHistoryOpen && (
        <aside className="w-80 sm:w-96 shrink-0 h-full bg-slate-900/95 border-r border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col z-20 pointer-events-auto transition-all duration-300">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
            <div className="flex items-center gap-2">
              <History size={18} className="text-blue-400" />
              <h2 className="font-bold text-sm text-slate-100">Chat History</h2>
            </div>
            <button
              onClick={() => setIsHistoryOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close History Panel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {chatHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
                <History size={32} className="mb-2 opacity-40 text-blue-400" />
                <p>No chat history yet.</p>
                <p className="text-[11px] mt-1 text-slate-600">Send a message to Ava to start conversation history.</p>
              </div>
            ) : (
              chatHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col p-2.5 rounded-xl text-xs max-w-[88%] ${
                    item.sender === 'user'
                      ? 'self-end bg-blue-600/20 border border-blue-500/30 text-slate-100'
                      : 'self-start bg-slate-800/80 border border-slate-700/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[9.5px] font-mono mb-1 text-slate-400">
                    <span className="font-bold text-blue-400">{item.sender === 'user' ? 'You' : 'Ava'}</span>
                    <span>{item.time}</span>
                  </div>
                  <p dir="auto" className="leading-snug">{item.text}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Center Main Viewport (Resizes dynamically when left/right panels open) */}
      <main className="flex-1 h-full relative overflow-hidden flex items-center justify-center">
        {/* Top Header Navigation Bar - Minimalist Expandable Toolbar */}
        <div className="absolute top-3 right-3 z-20 pointer-events-auto flex items-center gap-2">
          {/* Main Expand/Collapse Toolbar Toggle Button */}
          <button
            onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
            className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
              isToolbarExpanded
                ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
            }`}
            title={isToolbarExpanded ? 'Collapse Options Menu' : 'Expand Options Menu'}
          >
            <Menu size={18} className={isToolbarExpanded ? 'text-white' : 'text-blue-400'} />
          </button>

          {/* Expanded Options Toolbar Container */}
          {isToolbarExpanded && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-3 duration-200">
              {/* Reset Model Position & Camera View Icon-Only Button */}
              <button
                onClick={handleResetModelAndCamera}
                className="p-2.5 rounded-xl border shadow-xl bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                title="Reset Model Position & Camera View to Saved Starting View"
              >
                <RotateCcw size={18} className="text-amber-400" />
              </button>

              {/* Camera Height & Save View Popover Options Button */}
              <button
                onClick={() => setIsCamControlsOpen(!isCamControlsOpen)}
                className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isCamControlsOpen
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
                }`}
                title="Camera Height & Save View Controls"
              >
                <Sliders size={18} className={isCamControlsOpen ? 'text-white' : 'text-blue-400'} />
              </button>

              {/* History Panel Toggle Button */}
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isHistoryOpen
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
                }`}
                title="Chat History"
              >
                <History size={18} className={isHistoryOpen ? 'text-white' : 'text-blue-400'} />
              </button>

              {/* Free View Camera Mode Icon Button */}
              <button
                onClick={() => setIsFreeCamera(!isFreeCamera)}
                className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isFreeCamera
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
                }`}
                title={isFreeCamera ? 'Free Camera View Active (Click for Over-The-Shoulder)' : 'Over-The-Shoulder View Active (Click for Free Camera View)'}
              >
                <Eye size={18} className={isFreeCamera ? 'text-white' : 'text-blue-400'} />
              </button>

              {/* Scene Settings Button */}
              <button
                onClick={() => setIsSceneSettingsOpen(!isSceneSettingsOpen)}
                className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isSceneSettingsOpen
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
                }`}
                title="Scene & Lighting Settings"
              >
                <Wand2 size={18} className={isSceneSettingsOpen ? 'text-white' : 'text-blue-400'} />
              </button>

              {/* Drag Body Part Mode Minimalist Icon Button */}
              <button
                onClick={() => setIsDragBodyMode(!isDragBodyMode)}
                className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isDragBodyMode
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
                }`}
                title={isDragBodyMode ? 'Drag Body Part Mode Active (Click to disable)' : 'Hold & Drag Body Part Mode'}
              >
                <Move size={18} className={isDragBodyMode ? 'text-white' : 'text-blue-400'} />
              </button>

              {/* Animation & Pose Library Right Drawer Toggle Icon Button */}
              <button
                onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                className={`p-2.5 rounded-xl border shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isLibraryOpen
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/40 shadow-blue-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border-slate-800 backdrop-blur-md'
                }`}
                title="Pose & Animation Library"
              >
                <Layers size={18} className={isLibraryOpen ? 'text-white' : 'text-blue-400'} />
              </button>
            </div>
          )}
        </div>

        <div 
          className="absolute inset-0 z-0 transition-all duration-300 pointer-events-auto"
          style={{
            filter: `brightness(${sceneConfig.brightness}) contrast(${sceneConfig.contrast}) saturate(${sceneConfig.saturation})`
          }}
        >
          <Canvas camera={{ position: [0, 1.45, 1.6], fov: sceneConfig.cameraFov }} shadows>
          <color attach="background" args={[sceneConfig.backgroundColor]} />
          {/* Night Sky Background Stars */}
          <Stars radius={100} depth={50} count={sceneConfig.starCount} factor={4} saturation={0} fade speed={sceneConfig.starSpeed} />

          {/* Balanced Night Ambient Light */}
          <ambientLight intensity={sceneConfig.ambientLightIntensity} color={sceneConfig.ambientLightColor} />

          {/* Moonlight Directional Sunlight */}
          <directionalLight 
            position={[sceneConfig.directionalLightPositionX, sceneConfig.directionalLightPositionY, sceneConfig.directionalLightPositionZ]} 
            intensity={sceneConfig.directionalLightIntensity} 
            color={sceneConfig.directionalLightColor} 
            castShadow={sceneConfig.castShadows}
            shadow-mapSize={[1024, 1024]} 
            shadow-bias={-0.0001}
          />

          <OrbitControls
            ref={orbitControlsRef}
            target={[0, 1.45, 0]}
            enablePan={isFreeCamera}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={isFreeCamera ? Math.PI - 0.01 : Math.PI / 2 - 0.05}
            minDistance={0.6}
            maxDistance={25}
            makeDefault
            autoRotate={sceneConfig.enableAutoRotate}
            autoRotateSpeed={sceneConfig.autoRotateSpeed}
          />

          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]}>
              {/* 3D Street Light Pole (Positioned so lamp lens hangs directly over player spawn) */}
              <StreetLightPole position={[0, 0, 0]} />

              <Player
                joystickMove={joystickMove}
                showSkeleton={sceneConfig.showSkeleton}
                orbitControlsRef={orbitControlsRef}
                standingPose={finalStandingPose}
                activeWalkClip={activeWalkClip}
                activeIdleClip={activeIdleClip}
                isDragMode={isDragBodyMode}
                speechMessage={speechMessage}
                isFreeCamera={isFreeCamera}
                onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
                onZoomChange={setIsCameraZoomedClose}
                hideHeadSpeech={true}
                resetTrigger={resetTrigger}
              />

              {/* Soft Dynamic Contact Shadow under character feet */}
              <ContactShadows
                position={[0, 0.001, 0]}
                opacity={sceneConfig.contactShadowOpacity}
                scale={6}
                blur={sceneConfig.contactShadowBlur}
                far={3.5}
                color="#000000"
              />

              <RigidBody type="fixed">
                <mesh position={[3, 0.5, 3]} castShadow={sceneConfig.castShadows} receiveShadow={sceneConfig.castShadows}>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.2} />
                </mesh>
              </RigidBody>

              {/* Laptop placed on the cube */}
              <Laptop position={[3, 1.0, 3]} />

              <RigidBody type="fixed">
                <mesh position={[-3, 0.5, -2]} castShadow={sceneConfig.castShadows} receiveShadow={sceneConfig.castShadows}>
                  <boxGeometry args={[2, 1, 2]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.1} />
                </mesh>
              </RigidBody>

              {/* Bulletproof 4-Meter Deep Solid Floor Collider to prevent any falling under ground */}
              <RigidBody type="fixed" position={[0, -2, 0]}>
                <CuboidCollider args={[100, 2, 100]} />
                <mesh position={[0, 1.99, 0]} receiveShadow>
                  <boxGeometry args={[100, 0.02, 100]} />
                  <meshStandardMaterial color="#090d16" roughness={0.6} />
                </mesh>
              </RigidBody>
            </Physics>
          </Suspense>

          <Grid
            position={[0, 0.002, 0]}
            args={[40, 40]}
            cellSize={1}
            cellThickness={1}
            cellColor="#1e293b"
            sectionSize={5}
            sectionThickness={1.5}
            sectionColor="#334155"
            fadeDistance={35}
            fadeStrength={1}
            infiniteGrid
          />
          </Canvas>
        </div>

        {/* Ultra-Intense Cinematic Film Grain & Vignette Overlay (Permanent Default) */}
        <div 
          className="absolute inset-0 pointer-events-none z-[15] film-grain-overlay mix-blend-overlay transition-opacity duration-300" 
          style={{ opacity: sceneConfig.filmGrain }}
        />
        <div className="absolute inset-0 pointer-events-none z-[14] film-vignette" />

        {/* Camera Height & Permanent Save View Options Popover Panel */}
        {isCamControlsOpen && (
          <div className="absolute top-14 right-3 sm:right-16 z-30 pointer-events-auto bg-slate-950/95 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-72 flex flex-col gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400">
                  <Sliders size={16} />
                </div>
                <h3 className="font-bold text-xs text-slate-100">Camera Height & View Controls</h3>
              </div>
              <button
                onClick={() => setIsCamControlsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Height Adjustment Scrollbar Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ArrowUp size={13} className="text-blue-400" />
                  <span>Height Scrollbar</span>
                </span>
                <span className="font-mono text-blue-400 font-bold text-xs bg-blue-600/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                  {camHeight.toFixed(2)}m
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={6.0}
                step={0.05}
                value={camHeight}
                onChange={(e) => handleHeightSliderChange(parseFloat(e.target.value))}
                className="w-full h-2 accent-blue-500 cursor-pointer bg-slate-800 rounded-lg"
                title="Scroll Camera Height Up & Down"
              />
            </div>

            {/* Permanent Save View Button */}
            <button
              onClick={() => {
                handleSaveCurrentCameraView();
                setIsCamControlsOpen(false);
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              <Save size={15} />
              <span>Save View Permanently</span>
            </button>
          </div>
        )}

        {/* Saved Camera Toast Feedback Banner */}
        {saveToast && (
          <div className="absolute top-16 right-4 z-30 bg-emerald-600/95 border border-emerald-400 text-white px-3.5 py-2 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Check size={16} />
            <span>{saveToast}</span>
          </div>
        )}

        {/* Custom Touch Joystick (Appears dynamically only when touching screen) */}
        {isTouchActive && (
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-20 pointer-events-auto animate-in fade-in duration-200">
            <JoystickControls
              size={84}
              onMove={(data) => setJoystickMove(data)}
              onStop={() => setJoystickMove({ x: 0, y: 0 })}
            />
          </div>
        )}

        {/* AI Companion Response Speech Bubble Always Floating Directly On Top of Chat Input Bar */}
        {speechMessage && (
          <div className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 md:right-1/2 md:translate-x-1/2 z-30 pointer-events-auto bg-slate-950/95 border border-slate-800/90 p-3 sm:p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl w-[calc(100vw-7rem)] max-w-md sm:max-w-lg flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1">
              <span className="text-blue-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Ava (AI Companion)</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="hover:text-blue-400 text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded transition flex items-center gap-1 font-bold cursor-pointer"
                  title="Open Chat History"
                >
                  <History size={11} />
                  <span>History</span>
                </button>
                <button
                  onClick={() => setSpeechMessage(null)}
                  className="hover:text-white text-slate-400 p-0.5 rounded"
                  title="Dismiss Response"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <p dir="auto" className="leading-snug text-slate-100 text-xs sm:text-sm font-semibold whitespace-normal break-words">
              {speechMessage}
            </p>
          </div>
        )}

        {/* AI Companion Floating Chat Input Bar (Z.AI GLM-4-Flash + Female Voice) */}
        <form
          onSubmit={handleSendAiMessage}
          className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 md:right-1/2 md:translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 bg-slate-900/95 border border-slate-800 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl w-[calc(100vw-7rem)] max-w-md sm:max-w-lg"
        >
          <button
            type="button"
            onClick={() => setIsTtsEnabled(!isTtsEnabled)}
            className={`p-2 rounded-xl border transition ${
              isTtsEnabled
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={isTtsEnabled ? 'Female Voice TTS Enabled' : 'TTS Muted'}
          >
            {isTtsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <input
            type="text"
            value={aiChatInput}
            onChange={(e) => setAiChatInput(e.target.value)}
            placeholder="Talk to Ava (AI Companion)..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-400 text-xs sm:text-sm px-2 focus:outline-none font-medium"
          />

          <button
            type="submit"
            disabled={!aiChatInput.trim() || isAiThinking}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow ${
              aiChatInput.trim() && !isAiThinking
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isAiThinking ? (
              <Loader2 size={14} className="animate-spin text-blue-400" />
            ) : (
              <Send size={14} />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </main>

      {/* Right-Side Animation & Pose Library Panel */}
      {isLibraryOpen && (
        <aside className="w-80 sm:w-[480px] md:w-[540px] shrink-0 h-full bg-slate-900/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col z-20 pointer-events-auto transition-all duration-300">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-blue-400" />
              <h2 className="font-bold text-sm text-slate-100">Animation & Pose Library</h2>
            </div>
            <button
              onClick={() => setIsLibraryOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Close Library Panel"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimationLibrary
              customClips={customClips}
              onUpdateClips={setCustomClips}
              standingPose={standingPose}
              onUpdateStandingPose={setStandingPose}
              customPoses={customPoses}
              onUpdateCustomPoses={setCustomPoses}
              activeWalkClipId={activeWalkClipId}
              onSelectActiveWalkClip={setActiveWalkClipId}
              activeThinkingPoseId={activeThinkingPoseId}
              onSelectActiveThinkingPose={setActiveThinkingPoseId}
              onOpenLab={(mode, id) => {
                setIsLibraryOpen(false);
                handleOpenLab(mode, id);
              }}
              onBackToGame={() => setIsLibraryOpen(false)}
              isPanel={true}
            />
          </div>
        </aside>
      )}

      {/* Scene Settings Modal/Sidebar */}
      {isSceneSettingsOpen && (
        <SceneSettingsPanel
          config={sceneConfig}
          onChange={setSceneConfig}
          onClose={() => setIsSceneSettingsOpen(false)}
        />
      )}
    </div>
  );
}
