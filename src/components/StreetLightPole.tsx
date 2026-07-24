import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { RigidBody, CylinderCollider } from '@react-three/rapier';

export function StreetLightPole({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  const spotLightRef = useRef<THREE.SpotLight>(null);

  // Metallic Material Shaders
  const darkMetalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        metalness: 0.98,
        roughness: 0.08,
        envMapIntensity: 1.5,
      }),
    []
  );

  const chromeMetalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#334155',
        metalness: 0.98,
        roughness: 0.05,
        envMapIntensity: 2.0,
      }),
    []
  );

  const bronzeAccentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        metalness: 0.95,
        roughness: 0.12,
      }),
    []
  );

  // Custom Volumetric Light Ray Shader
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#fffbeb') },
        uOpacity: { value: 0.35 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
          float heightGradient = pow(vUv.y, 1.5);
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float rim = abs(dot(viewDir, normal));
          float edgeAlpha = pow(rim, 1.6);
          float alpha = heightGradient * edgeAlpha * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Soft Radial Blur Ground Light Shader
  const blurredGroundLightShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color('#fffbeb') },
        uOpacity: { value: 0.38 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;

        void main() {
          float dist = length(vUv - vec2(0.5));
          float falloff = smoothstep(0.5, 0.0, dist);
          float gaussianBlur = pow(falloff, 2.5);
          gl_FragColor = vec4(uColor, gaussianBlur * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <group position={position}>
      {/* Physical Pole Collider */}
      <RigidBody type="fixed" colliders={false} position={[0.8, 2.1, 0]}>
        <CylinderCollider args={[2.1, 0.04]} />
      </RigidBody>

      {/* Visual Metallic Pole Structure */}
      <group>
        {/* Base Foundation Flange Plate */}
        <mesh position={[0.8, 0.08, 0]} material={chromeMetalMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.12, 0.16, 0.16, 24]} />
        </mesh>

        {/* 4 Hex Mounting Bolts around base */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh
            key={idx}
            position={[
              0.8 + Math.cos(angle) * 0.10,
              0.18,
              Math.sin(angle) * 0.10,
            ]}
            material={chromeMetalMat}
            castShadow
          >
            <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
          </mesh>
        ))}

        {/* Base Bevel Taper Collar */}
        <mesh position={[0.8, 0.28, 0]} material={darkMetalMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.06, 0.12, 0.24, 24]} />
        </mesh>

        {/* Main Tapered Metallic Shaft */}
        <mesh position={[0.8, 2.25, 0]} material={darkMetalMat} castShadow receiveShadow>
          <cylinderGeometry args={[0.02, 0.06, 3.7, 24]} />
        </mesh>

        {/* Decorative Joint Ring Collar 1 */}
        <mesh position={[0.8, 1.8, 0]} material={chromeMetalMat} castShadow>
          <torusGeometry args={[0.04, 0.01, 16, 32]} />
        </mesh>

        {/* Decorative Joint Ring Collar 2 */}
        <mesh position={[0.8, 3.8, 0]} material={chromeMetalMat} castShadow>
          <torusGeometry args={[0.03, 0.01, 16, 32]} />
        </mesh>

        {/* Structural Arm Support Bracket */}
        <mesh position={[0.62, 4.05, 0]} rotation={[0, 0, Math.PI / 4]} material={bronzeAccentMat} castShadow>
          <boxGeometry args={[0.25, 0.02, 0.03]} />
        </mesh>

        {/* Curved Arm Extension */}
        <mesh position={[0.4, 4.25, 0]} rotation={[0, 0, Math.PI / 5]} material={darkMetalMat} castShadow>
          <cylinderGeometry args={[0.015, 0.02, 0.95, 24]} />
        </mesh>

        {/* Luminaire Fixture Top Housing Cap */}
        <mesh position={[0, 4.42, 0]} material={darkMetalMat} castShadow>
          <boxGeometry args={[0.28, 0.10, 0.20]} />
        </mesh>

        {/* Chrome Luminaire Trim Bezel */}
        <mesh position={[0, 4.34, 0]} material={chromeMetalMat} castShadow>
          <boxGeometry args={[0.30, 0.03, 0.22]} />
        </mesh>

        {/* Glowing Emissive Bulb Lens */}
        <mesh position={[0, 4.31, 0]}>
          <boxGeometry args={[0.24, 0.02, 0.18]} />
          <meshStandardMaterial color="#fef08a" emissive="#fbbf24" emissiveIntensity={6} toneMapped={false} />
        </mesh>

        {/* --- Volumetric Light Ray Beams --- */}
        <mesh position={[0, 2.15, 0]} material={shaderMaterial}>
          <coneGeometry args={[1.8, 4.3, 32, 1, true]} />
        </mesh>

        <mesh position={[0, 2.15, 0]} material={shaderMaterial}>
          <coneGeometry args={[2.7, 4.3, 32, 1, true]} />
        </mesh>

        {/* Ground Light Pool Bloom - Soft Feather-Blurred Radial Falloff */}
        <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={blurredGroundLightShader}>
          <planeGeometry args={[6.5, 6.5]} />
        </mesh>

        {/* Dynamic Point Light */}
        <pointLight position={[0, 3.8, 0]} intensity={22} distance={7} color="#fffbeb" decay={1.5} />

        {/* Dynamic Spotlight */}
        <spotLight
          ref={spotLightRef}
          position={[0, 4.3, 0]}
          target-position={[0, 0, 0]}
          color="#fffbeb"
          intensity={120}
          angle={0.7}
          penumbra={0.75}
          distance={14}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
      </group>
    </group>
  );
}
