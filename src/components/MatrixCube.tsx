import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';

export function MatrixCube({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvasRef.current);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Solid black initial background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプ'.split('');
    const fontSize = 22; // Large enough to see clearly
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    let animationFrameId: number;
    let lastDrawTime = 0;

    const draw = (time: number) => {
      animationFrameId = requestAnimationFrame(draw);

      // Throttle to 50ms (approx 20 fps) for the classic Matrix stuttery fall
      if (time - lastDrawTime < 50) return;
      lastDrawTime = time;

      // Fade out previous characters
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // 0.15 opacity leaves a nice trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ff00ff'; // Ultra bright Magenta text
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        // Draw the character
        ctx.fillText(text, i * fontSize + fontSize / 2, drops[i] * fontSize);

        // Randomly reset drops to top when they hit the bottom
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      texture.needsUpdate = true;
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [texture]);

  return (
    <group position={position}>
      {/* Outer Shell */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <meshBasicMaterial
            key={index}
            attach={`material-${index}`}
            map={index === 2 || index === 3 ? undefined : texture}
            transparent={true}
            opacity={index === 2 || index === 3 ? 0 : 1.0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
            color="#ffffff"
          />
        ))}
      </mesh>
      
      {/* Volumetric Internal Planes */}
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

      {/* Faint boundaries */}
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
