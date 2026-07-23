import { useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { EffectComposer, Glitch } from '@react-three/postprocessing';
import { GlitchMode } from 'postprocessing';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { ChevronDown, ChevronUp, User, Activity, MapPin, Cpu, ShieldAlert, Heart } from 'lucide-react';
import { DEFAULT_SCENE_CONFIG } from '../types/scene';

function MiniAvatar() {
  const { scene, animations } = useGLTF(import.meta.env.BASE_URL + 'model.glb');
  
  // Use exactly the same lighting as the main scene
  const [sceneConfig, setSceneConfig] = useState(DEFAULT_SCENE_CONFIG);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lab_scene_config_v3');
      if (saved) {
        setSceneConfig({ ...DEFAULT_SCENE_CONFIG, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);
  
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const nameLower = mesh.name.toLowerCase();

        if (
          nameLower.includes('glasses') ||
          nameLower.includes('mask') ||
          nameLower.includes('visor') ||
          nameLower.includes('accessory') ||
          nameLower.includes('wolf3d_glasses')
        ) {
          mesh.visible = false;
        }

        if (mesh.material) {
          const rawMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const mat = rawMat.clone() as THREE.MeshStandardMaterial;

          const isHair = nameLower.includes('hair') || nameLower.includes('headcover') || nameLower.includes('wolf3d_hair');
          const isTop = nameLower.includes('top') || nameLower.includes('outfit_top');
          const isBottom = nameLower.includes('bottom') || nameLower.includes('outfit_bottom') || nameLower.includes('pants');
          const isShoes = nameLower.includes('footwear') || nameLower.includes('shoes');

          if (isHair) {
            mat.color = new THREE.Color('#facc15'); // Golden Blonde Hair
            mat.map = null;
          } else if (isTop) {
            mat.color = new THREE.Color('#141416'); // Sleek Black Athletic Shirt
            mat.map = null;
          } else if (isBottom) {
            mat.color = new THREE.Color('#0a0a0c'); // Black Pants
            mat.map = null;
          } else if (isShoes) {
            mat.color = new THREE.Color('#ffffff'); // Pure White Sneakers
            mat.map = null;
          } else if (mat.map) {
            mat.color = new THREE.Color('#ffffff');
          }
          mesh.material = mat;
        }
      }
    });

    return clone;
  }, [scene]);

  useFrame(() => {
    const mainScene = (window as any).mainCharacterScene;
    if (mainScene && clonedScene) {
      clonedScene.traverse((child: any) => {
        if (child.isBone) {
          const mainBone = mainScene.getObjectByName(child.name);
          if (mainBone) {
            child.position.copy(mainBone.position);
            child.quaternion.copy(mainBone.quaternion);
            child.scale.copy(mainBone.scale);
          }
        }
      });
    }
  });

  return (
    <>
      <color attach="background" args={[sceneConfig.backgroundColor]} />
      <group position={[0, -1.55, 0]}>
        <primitive object={clonedScene} />
      </group>
      
      {/* Exact synced lighting */}
      <ambientLight intensity={sceneConfig.ambientLightIntensity} color={sceneConfig.ambientLightColor} />
      <directionalLight 
        position={[sceneConfig.directionalLightPositionX, sceneConfig.directionalLightPositionY, sceneConfig.directionalLightPositionZ]} 
        intensity={sceneConfig.directionalLightIntensity} 
        color={sceneConfig.directionalLightColor} 
        castShadow={sceneConfig.castShadows}
        shadow-mapSize={[1024, 1024]} 
        shadow-bias={-0.0001}
      />

      <EffectComposer>
        <Glitch 
          delay={new THREE.Vector2(1.5, 3.5)} 
          duration={new THREE.Vector2(0.1, 0.3)} 
          strength={new THREE.Vector2(0.01, 0.05)} 
          mode={GlitchMode.SPORADIC} 
          active
          ratio={0.85}
        />
      </EffectComposer>
    </>
  );
}

export function CharacterProfile() {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isCardOpen) {
    return (
      <div 
        onClick={() => setIsCardOpen(true)}
        className="fixed top-6 left-6 z-[100] w-10 h-10 flex items-center justify-center cursor-pointer transition-all hover:scale-105 group"
      >
        <User size={26} className="text-slate-300 group-hover:text-blue-400 transition-colors drop-shadow-xl" />
        <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full border border-slate-900 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
      </div>
    );
  }

  return (
    <div className={`fixed top-6 left-6 z-[100] transition-all duration-500 ease-out flex flex-col w-80 animate-in fade-in slide-in-from-left-4`}>
      {/* Main Square Card */}
      <div 
        className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative h-64"
      >
        {/* Full Box Live Feed Background */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 0.55], fov: 45 }} shadows>
            <MiniAvatar />
          </Canvas>
          {/* CSS Camera Feed Overlay Effects */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none mix-blend-overlay z-10">
            <filter id="noiseFilterProfile">
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noiseFilterProfile)" />
          </svg>
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50 z-10"></div>
        </div>

        {/* Header Overlay */}
        <div className="relative z-10 bg-gradient-to-b from-slate-900/90 to-transparent px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-200 text-sm font-semibold drop-shadow-md">
            <User size={14} />
            <span>Profile</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-300 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700/50 rounded p-1"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button 
              onClick={() => setIsCardOpen(false)}
              className="text-slate-400 hover:text-red-400 transition-colors bg-slate-800/50 hover:bg-slate-700/50 rounded p-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 pointer-events-none"></div>

        {/* Footer Info Overlay */}
        <div className="relative z-10 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent p-4 pb-5 flex flex-col items-center gap-1 pointer-events-none">
          <div className="absolute bottom-6 right-5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
          
          <h2 className="text-white font-bold text-2xl flex items-center justify-center gap-2 drop-shadow-lg">
            Ava <span className="text-blue-400 text-[10px] px-1.5 py-0.5 bg-blue-900/60 border border-blue-500/30 rounded font-mono shadow-inner">v2.0</span>
          </h2>
          <div className="text-slate-300 text-xs flex items-center justify-center gap-2 font-medium drop-shadow-md">
            <span>Age: 24</span>
            <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span className="text-green-400 font-mono tracking-wider">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Expanded Details Window (Underneath) */}
      <div 
        className={`transition-all duration-500 ease-out origin-top overflow-hidden mt-2 ${
          isExpanded ? 'opacity-100 max-h-[calc(100vh-100px)] scale-y-100' : 'max-h-0 opacity-0 scale-y-95'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl overflow-y-auto h-full flex flex-col p-1 custom-scrollbar">
          
          {/* Database Header */}
          <div className="bg-slate-800/80 rounded-t-xl p-2 border-b border-slate-700 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Database // Profile_Data</span>
            <span className="text-xs font-mono text-blue-400">REC_FOUND</span>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-800/40 rounded p-2 border border-slate-700/50 flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Current Status</span>
                <div className="flex items-center gap-1.5 text-sm text-slate-200">
                  <Activity size={14} className="text-blue-400" /> Optimal
                </div>
              </div>
              <div className="bg-slate-800/40 rounded p-2 border border-slate-700/50 flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Location Node</span>
                <div className="flex items-center gap-1.5 text-sm text-slate-200">
                  <MapPin size={14} className="text-purple-400" /> Gridmap Lab
                </div>
              </div>
            </div>

            {/* Rigid Key-Value Database Rows */}
            <div className="flex flex-col border border-slate-700/50 rounded overflow-hidden">
              <div className="flex border-b border-slate-700/50 bg-slate-800/20">
                <div className="w-1/3 p-2 bg-slate-800/40 border-r border-slate-700/50 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Cpu size={12}/> Role
                </div>
                <div className="w-2/3 p-2 text-xs text-slate-300">
                  Primary Systems Operator. Oversees local terminal routing and kinematics mapping.
                </div>
              </div>
              
              <div className="flex border-b border-slate-700/50 bg-slate-800/20">
                <div className="w-1/3 p-2 bg-slate-800/40 border-r border-slate-700/50 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <Heart size={12}/> Profile
                </div>
                <div className="w-2/3 p-2 text-xs text-slate-300">
                  High charm/wit matrix. Exhibits protective anomalies around '/LaptopFiles/'.
                </div>
              </div>

              <div className="flex bg-slate-800/20">
                <div className="w-1/3 p-2 bg-slate-800/40 border-r border-slate-700/50 flex items-center gap-2 text-xs font-semibold text-slate-400">
                  <ShieldAlert size={12}/> Access
                </div>
                <div className="w-2/3 p-2 text-xs text-slate-300 font-mono flex flex-col">
                  <span className="text-blue-400">LEVEL 5 ADMIN</span>
                  <span>KEY: Kira123</span>
                </div>
              </div>
            </div>
            
            {/* Database Footer */}
            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-mono px-1">
              <span>LAST_SYNC: {new Date().toISOString().split('T')[0]}</span>
              <span>END_OF_RECORD</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + 'model.glb');
