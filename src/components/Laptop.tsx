import { useGLTF, Html } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerWorldPosition } from './Player';

interface LaptopProps {
  position: [number, number, number];
  onOpenDesktop?: () => void;
}

export function Laptop({ position, onOpenDesktop }: LaptopProps) {
  const { scene } = useGLTF(import.meta.env.BASE_URL + 'laptop.glb');
  const [isNear, setIsNear] = useState(false);
  const laptopRef = useRef<THREE.Group>(null);
  
  // Clone the scene so we don't accidentally pollute other instances if we reuse the GLB
  // But for this, traversing is fine.
  
  // Apply highlight effect when near
  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0x000000);
        }
        
        if (isNear) {
          child.material.emissive = new THREE.Color(0x3b82f6); // Blue highlight glow
          child.material.emissiveIntensity = 0.5;
        } else {
          child.material.emissive = child.userData.originalEmissive;
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [isNear, scene]);

  useFrame(() => {
    if (laptopRef.current) {
      const worldPos = new THREE.Vector3();
      laptopRef.current.getWorldPosition(worldPos);
      
      const distance = worldPos.distanceTo(playerWorldPosition);
      const near = distance < 3.0; // 3 meters proximity
      
      if (near !== isNear) {
        setIsNear(near);
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (isNear && onOpenDesktop) {
      onOpenDesktop();
    }
  };

  return (
    <RigidBody type="dynamic" colliders="cuboid" position={position} mass={1} restitution={0.2} friction={0.8}>
      <group ref={laptopRef} onClick={handleClick} onPointerOver={() => { document.body.style.cursor = isNear ? 'pointer' : 'default' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
        <primitive object={scene} scale={0.1} rotation={[0, -Math.PI / 4, 0]} />
        
        {/* Screen Glow projecting outwards */}
        <spotLight 
          position={[0, 0.15, 0.05]} 
          angle={Math.PI / 3} 
          penumbra={0.8} 
          color="#3b82f6" 
          intensity={15} 
          distance={4} 
          castShadow 
        />
        <pointLight position={[0, 0.15, 0.05]} color="#ffffff" intensity={0.5} distance={0.5} />

        {/* Ubuntu Login Screen Overlay */}
        <Html 
          transform 
          position={[0, 0.17, -0.065]} 
          rotation={[-0.15, -Math.PI / 4, 0]} 
          scale={0.025}
          occlude
        >
          <div 
            className="w-[400px] h-[250px] flex flex-col items-center justify-center rounded overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.6)] cursor-pointer bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1623345805780-8f01f714e65f?q=80&w=2000&auto=format&fit=crop')" }}
            onClick={handleClick}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full mb-4 flex items-center justify-center border-2 border-white/20 shadow-lg overflow-hidden">
                <span className="text-4xl">👤</span>
              </div>
              <div className="text-white text-xl font-medium tracking-wide mb-6 drop-shadow-md">user</div>
              
              <div className="w-64 h-10 bg-slate-800/80 rounded-md border border-white/10 flex items-center px-4 shadow-inner backdrop-blur-md">
                <span className="text-slate-400 text-sm">Password</span>
                <div className="ml-auto w-1 h-4 bg-white/50 animate-pulse"></div>
              </div>
            </div>
          </div>
        </Html>

        {isNear && (
          <Html position={[0, 0.4, 0]} center>
            <div className="bg-slate-900/90 text-white text-xs font-bold px-2 py-1 rounded-md border border-slate-700 pointer-events-none whitespace-nowrap shadow-xl">
              Click to Use Laptop
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + 'laptop.glb');
