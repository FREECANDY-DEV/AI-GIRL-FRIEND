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
        
        {/* Screen Glow */}
        <pointLight position={[0, 0.15, 0.1]} color="#3b82f6" intensity={2} distance={3} />
        <pointLight position={[0, 0.15, 0.1]} color="#ffffff" intensity={0.5} distance={1} />

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
