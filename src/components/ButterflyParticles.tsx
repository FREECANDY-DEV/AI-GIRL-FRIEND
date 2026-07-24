import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { playerWorldPosition } from './Player';

const BUTTERFLY_COUNT = 30; // Increased for more life
const LAPTOP_POS = new THREE.Vector3(3, 1.15, 3);

export function ButterflyParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const butterflyTexture = useTexture(import.meta.env.BASE_URL + 'butterfly.jpg');
  const { camera } = useThree();

  const butterflies = useMemo(() => {
    const data = [];
    for (let i = 0; i < BUTTERFLY_COUNT; i++) {
      // 80% trail to laptop, 20% orbit the player
      const behavior = Math.random() > 0.2 ? 'trail' : 'orbit_player';
      
      data.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          Math.random() * 0.5 + 1.0, // stomach height start
          (Math.random() - 0.5) * 0.5
        ),
        velocity: new THREE.Vector3(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.015,
        travelPhase: Math.random() * Math.PI * 2,
        travelSpeed: 0.15 + Math.random() * 0.3,
        orbitRadius: behavior === 'orbit_player' ? 0.3 + Math.random() * 0.4 : 0.05 + Math.random() * 0.15,
        orbitSpeed: 0.5 + Math.random() * 1.0,
        behavior
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Use a softer glow multiplier since the texture already has a bright neon glow
  const glowColor = useMemo(() => new THREE.Color(1, 1, 1), []);

  const butterflyGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    // V-shaped geometry with 2 wings
    const vertices = new Float32Array([
      // Left wing (front-facing)
      0, -0.025, 0,      // 0: bottom right (center)
      -0.025, -0.025, 0.02, // 1: bottom left (outer tip)
      0, 0.025, 0,       // 2: top right (center)
      -0.025, 0.025, 0.02,  // 3: top left (outer tip)

      // Right wing (front-facing)
      0.025, -0.025, 0.02,  // 4: bottom right (outer tip)
      0, -0.025, 0,      // 5: bottom left (center)
      0.025, 0.025, 0.02,   // 6: top right (outer tip)
      0, 0.025, 0,       // 7: top left (center)
    ]);

    const indices = [
      // Left wing
      0, 1, 2,
      2, 1, 3,
      // Right wing
      4, 5, 6,
      6, 5, 7
    ];

    const uvs = new Float32Array([
      // Left wing
      0.5, 0,
      0, 0,
      0.5, 1,
      0, 1,
      // Right wing
      1, 0,
      0.5, 0,
      1, 1,
      0.5, 1
    ]);

    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = state.clock.elapsedTime;

    // Calculate camera distance to player to determine fade
    const distToPlayer = camera.position.distanceTo(playerWorldPosition);
    const distToLaptop = camera.position.distanceTo(LAPTOP_POS);
    const minDist = Math.min(distToPlayer, distToLaptop);
    
    // Fade out when camera is closer than 3 units, completely transparent at 1.5 units
    const targetOpacity = THREE.MathUtils.clamp((minDist - 1.5) / 1.5, 0, 1);
    materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1);

    // If completely faded out, no need to update matrices
    if (materialRef.current.opacity < 0.01) return;

    butterflies.forEach((b, i) => {
      // Offset player position to the avatar's stomach area (~1.0m up)
      const stomachPos = playerWorldPosition.clone();
      stomachPos.y += 1.0; 

      let basePos;
      if (b.behavior === 'orbit_player') {
        basePos = stomachPos;
      } else {
        // Calculate a base position that interpolates (trails) between player stomach and laptop
        const lerpFactor = (Math.sin(time * b.travelSpeed + b.travelPhase) + 1) / 2;
        basePos = stomachPos.clone().lerp(LAPTOP_POS, lerpFactor);
      }
      
      // Calculate a dynamic orbiting point around the target
      // Give orbiting butterflies a much larger vertical radius to reach head height
      const yRadius = b.behavior === 'orbit_player' ? b.orbitRadius * 1.8 : b.orbitRadius * 0.5;
      const orbitX = basePos.x + Math.sin(time * b.orbitSpeed + b.phase) * b.orbitRadius;
      const orbitY = basePos.y + Math.sin(time * (b.orbitSpeed * 0.7) + b.phase) * yRadius;
      const orbitZ = basePos.z + Math.cos(time * b.orbitSpeed + b.phase) * b.orbitRadius;
      
      const targetPos = new THREE.Vector3(orbitX, orbitY, orbitZ);

      // Vector towards the orbiting point
      const dir = new THREE.Vector3().subVectors(targetPos, b.position);
      
      dir.normalize();
      
      // Gentle flutter noise (reduced so they don't scatter)
      dir.x += Math.sin(time * 5.0 + b.phase) * 0.05;
      dir.y += Math.cos(time * 4.0 + b.phase) * 0.05;
      dir.z += Math.sin(time * 6.0 + b.phase) * 0.05;
      dir.normalize();

      b.velocity.lerp(dir.multiplyScalar(b.speed), 0.05); 
      b.position.add(b.velocity);

      dummy.position.copy(b.position);
      
      // Look in direction of travel
      dummy.lookAt(b.position.clone().add(b.velocity));
      
      // Flapping effect (scaling X and Z to simulate wings folding)
      const flap = Math.max(0.1, Math.abs(Math.sin(time * 15 + b.phase)));
      
      dummy.scale.set(flap, 1, flap);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[butterflyGeo, undefined, BUTTERFLY_COUNT]} frustumCulled={false}>
      <meshBasicMaterial 
        ref={materialRef}
        color={glowColor}
        transparent 
        map={butterflyTexture}
        opacity={1.0} 
        side={THREE.DoubleSide} 
        blending={THREE.AdditiveBlending} 
        depthWrite={false}
      />
    </instancedMesh>
  );
}
