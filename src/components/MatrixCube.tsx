import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

export function MatrixCube({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  // Matrix characters setup
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプ';
  const matrix = letters.split('');
  const fontSize = 18;
  const dropsRef = useRef<number[]>([]);

  useMemo(() => {
    const canvas = canvasRef.current;
    canvas.width = 512;
    canvas.height = 512;
    const columns = canvas.width / fontSize;
    dropsRef.current = new Array(Math.floor(columns)).fill(1);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvasRef.current);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    textureRef.current = tex;
    return tex;
  }, []);

  // Frame throttle for classic chunky matrix feel
  const lastDrawTime = useRef(0);

  useFrame((state) => {
    // Only draw every 50ms to create that distinct classic Matrix staggered fall speed
    if (state.clock.elapsedTime - lastDrawTime.current > 0.05) {
      lastDrawTime.current = state.clock.elapsedTime;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#d946ef'; // Bright Fuchsia / Purple text
        ctx.font = `bold ${fontSize}px monospace`;

        const drops = dropsRef.current;
        for (let i = 0; i < drops.length; i++) {
          const text = matrix[Math.floor(Math.random() * matrix.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
            drops[i] = 0;
          }
          drops[i]++;
        }

        if (textureRef.current) {
          textureRef.current.needsUpdate = true;
        }
      }
    }
  });

  return (
    <group position={position}>
      {/* Outer Shell made entirely of falling characters */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial 
          map={texture} 
          transparent={true}
          opacity={1.0}
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
          side={THREE.DoubleSide}
          color="#ffffff"
        />
      </mesh>
      
      {/* Inner Hologram Planes (Front-to-Back & Side-to-Side) to construct volumetric depth */}
      {[-0.33, 0, 0.33].map((offset, idx) => (
        <mesh key={`z-${idx}`} position={[0, 0, offset]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent={true} opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {[-0.33, 0, 0.33].map((offset, idx) => (
        <mesh key={`x-${idx}`} position={[offset, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent={true} opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Very faint glass bounding box just to give it physical boundaries */}
      <mesh>
        <boxGeometry args={[1.02, 1.02, 1.02]} />
        <meshPhysicalMaterial 
          transparent={true} 
          opacity={0.05}
          roughness={0.1}
          metalness={0.9}
          color="#d946ef"
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
