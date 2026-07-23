import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { ChevronDown, ChevronUp, Activity, MapPin, Cpu, ShieldAlert, Heart } from 'lucide-react';

function MiniAvatar() {
  const { scene } = useGLTF(import.meta.env.BASE_URL + 'model.glb');
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);

  return (
    <group position={[0, -1.45, 0]}>
      <primitive object={clonedScene} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[2, 2, 5]} intensity={2} />
      <pointLight position={[-2, 1, 3]} intensity={1} color="#aaddff" />
    </group>
  );
}

export function CharacterProfile() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 ease-out flex flex-col ${isExpanded ? 'w-80' : 'w-64'}`}>
      {/* Top Banner / Collapsed View */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden cursor-pointer hover:bg-slate-800/80 transition-colors group relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="flex items-center p-3 gap-4">
          {/* Avatar Live Feed */}
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0 relative">
            <Canvas camera={{ position: [0, 0, 0.4], fov: 40 }}>
              <MiniAvatar />
            </Canvas>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-lg leading-tight truncate flex items-center gap-2">
              Ava <span className="text-blue-400 text-xs px-1.5 py-0.5 bg-blue-500/20 rounded font-mono">v2.0</span>
            </h2>
            <div className="text-slate-400 text-sm flex items-center gap-2">
              <span>Age: 24</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
              <span className="text-green-400 text-xs font-mono">ONLINE</span>
            </div>
          </div>

          <div className="text-slate-400 group-hover:text-white transition-colors px-2">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* Expanded Details View */}
      <div 
        className={`transition-all duration-500 ease-out origin-top overflow-hidden mt-2 ${
          isExpanded ? 'opacity-100 max-h-[600px] scale-y-100' : 'opacity-0 max-h-0 scale-y-95'
        }`}
      >
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex flex-col gap-1">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                <Activity size={12} /> Status
              </div>
              <div className="text-white text-sm font-medium">Optimal</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex flex-col gap-1">
              <div className="text-slate-400 text-xs flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                <MapPin size={12} /> Location
              </div>
              <div className="text-white text-sm font-medium">Gridmap Lab</div>
            </div>
          </div>

          <hr className="border-slate-700/50" />

          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Cpu size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-slate-200 text-sm font-bold mb-1">Systems Operator</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Ava is the primary AI interface for the Gridmap OS. She oversees local terminal tasks, file system integrity, and physical world kinematics mapping.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Heart size={16} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-slate-200 text-sm font-bold mb-1">Personality Matrix</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Highly charming and witty. Extremely protective of her personal laptop and easily flustered if unauthorized users discover her private vacation photos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                <ShieldAlert size={16} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-slate-200 text-sm font-bold mb-1">Security Clearance</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-mono">
                  LEVEL 5 (ADMIN)
                  <br/>
                  PASS: Kira123
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + 'model.glb');
