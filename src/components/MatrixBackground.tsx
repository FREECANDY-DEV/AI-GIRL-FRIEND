import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const MATRIX_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';
const NUM_PARTICLES = 150;

export function MatrixBackground() {
  const groupRef = useRef<THREE.Group>(null);
  
  // To avoid expensive React re-renders on every frame just to update text,
  // we will manage the text strings in a state that updates at a much lower frequency (e.g. 5fps),
  // while the position updates continuously in useFrame via raw Three.js refs for silky smooth 60fps!
  
  const [glitchTrigger, setGlitchTrigger] = useState(0);

  // Pre-generate random properties for each text particle
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < NUM_PARTICLES; i++) {
      arr.push({
        id: i,
        char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
        // Position them in a wide cylinder or wall behind and around the character
        x: (Math.random() - 0.5) * 25,
        y: (Math.random() - 0.5) * 25,
        z: (Math.random() - 0.5) * 15 - 5, // Keep them behind the main character
        speed: Math.random() * 0.5 + 0.5, // Random fall speed
        opacity: Math.random() * 0.5 + 0.1, // Random opacity
        scale: Math.random() * 0.5 + 0.5,
        color: Math.random() > 0.8 ? '#ffffff' : '#00ff41', // Matrix green, occasional white
        glitchOffset: Math.random() // Unique offset so they don't all glitch on the exact same frame
      });
    }
    return arr;
  }, []);

  const textRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Glitch interval to swap characters occasionally without destroying framerate
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchTrigger(prev => prev + 1);
    }, 150); // 150ms is fast enough to look cool, but saves massive React diffing overhead
    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Move particles downwards using highly efficient raw refs (No React state involved here!)
    particles.forEach((p, i) => {
      p.y -= p.speed * delta * 4.0;
      
      // Loop back to top
      if (p.y < -12) {
        p.y = 12;
        p.x = (Math.random() - 0.5) * 25;
        p.z = (Math.random() - 0.5) * 15 - 5;
      }

      const mesh = textRefs.current[i];
      if (mesh) {
        mesh.position.set(p.x, p.y, p.z);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => {
        // Only update the character occasionally based on its unique glitch offset
        const shouldGlitch = (glitchTrigger + Math.floor(p.glitchOffset * 10)) % 4 === 0;
        if (shouldGlitch) {
          p.char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        }

        return (
          <Text
            key={p.id}
            ref={(el) => (textRefs.current[i] = el)}
            position={[p.x, p.y, p.z]}
            fontSize={p.scale}
            color={p.color}
            fillOpacity={p.opacity}
            anchorX="center"
            anchorY="middle"
            characters={MATRIX_CHARS} // Pre-generate glyphs for memory performance
            depthOffset={10} // Ensure they render behind transparent objects
          >
            {p.char}
          </Text>
        );
      })}
    </group>
  );
}
