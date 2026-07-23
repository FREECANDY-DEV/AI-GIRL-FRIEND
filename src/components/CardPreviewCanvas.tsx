import { Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { AnimationClip, StandingPoseConfig } from '../types/animation';

interface CardPreviewModelProps {
  clip?: AnimationClip | null;
  pose?: StandingPoseConfig | null;
  modelPath?: string;
}

function CardPreviewModel({ clip, pose, modelPath = '/model.glb' }: CardPreviewModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene: gltfScene } = useGLTF(modelPath);
  const scene = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene]);

  const bonesMap = useRef<Map<string, THREE.Bone>>(new Map());
  const initialQuaternions = useRef<Map<string, THREE.Quaternion>>(new Map());
  const initialPositions = useRef<Map<string, THREE.Vector3>>(new Map());

  // Traverse model and store initial bone quaternions & positions
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as any).isMesh) {
          const mesh = child as THREE.Mesh;
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

          const matName = ((Array.isArray(mesh.material) ? mesh.material[0] : mesh.material)?.name || '').toLowerCase();

          if (mesh.material) {
            const rawMat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
            const mat = rawMat.clone() as THREE.MeshStandardMaterial;

            const isHair = nameLower.includes('hair') || nameLower.includes('headcover') || nameLower.includes('wolf3d_hair') || matName.includes('hair');
            const isTop = nameLower.includes('top') || nameLower.includes('outfit_top') || matName.includes('top');
            const isBottom = nameLower.includes('bottom') || nameLower.includes('outfit_bottom') || nameLower.includes('pants') || matName.includes('bottom');
            const isShoes = nameLower.includes('footwear') || nameLower.includes('shoes') || matName.includes('footwear');

            if (isHair) {
              mat.color = new THREE.Color('#facc15');
              mat.map = null;
              mat.roughness = 0.4;
            } else if (isTop) {
              mat.color = new THREE.Color('#141416');
              mat.map = null;
              mat.roughness = 0.45;
            } else if (isBottom) {
              mat.color = new THREE.Color('#0a0a0c');
              mat.map = null;
              mat.roughness = 0.55;
            } else if (isShoes) {
              mat.color = new THREE.Color('#ffffff');
              mat.map = null;
              mat.roughness = 0.2;
            } else if (mat.map) {
              mat.color = new THREE.Color('#ffffff');
            }
            mesh.material = mat;
          }
        }
        if ((child as any).isBone) {
          const bone = child as THREE.Bone;
          bonesMap.current.set(bone.name, bone);
          if (!initialQuaternions.current.has(bone.name)) {
            initialQuaternions.current.set(bone.name, bone.quaternion.clone());
          }
          if (!initialPositions.current.has(bone.name)) {
            initialPositions.current.set(bone.name, bone.position.clone());
          }
        }
      });
    }
  }, [scene]);

  useFrame((state) => {
    if (!scene) return;

    // Reset baseline quaternions & positions
    bonesMap.current.forEach((bone, name) => {
      const initQ = initialQuaternions.current.get(name);
      if (initQ) bone.quaternion.copy(initQ);
      const initP = initialPositions.current.get(name);
      if (initP) bone.position.copy(initP);
    });

    if (clip && clip.keyframes.length > 0) {
      const duration = clip.duration > 0 ? clip.duration : 1.0;
      const time = (state.clock.getElapsedTime() * 1.0) % duration;
      const kfs = [...clip.keyframes].sort((a, b) => a.time - b.time);

      if (kfs.length === 1) {
        const transforms = kfs[0].transforms;
        Object.entries(transforms).forEach(([bName, rot]) => {
          const bone = bonesMap.current.get(bName);
          const initQ = initialQuaternions.current.get(bName);
          if (bone && initQ) {
            const radX = (rot[0] * Math.PI) / 180;
            const radY = (rot[1] * Math.PI) / 180;
            const radZ = (rot[2] * Math.PI) / 180;
            const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(radX, radY, radZ, 'YXZ'));
            bone.quaternion.copy(initQ).multiply(deltaQ);
          }
        });
        return;
      }

      // Find prev and next keyframe
      let prev = kfs[0];
      let next = kfs[kfs.length - 1];

      if (time <= kfs[0].time) {
        prev = kfs[0];
        next = kfs[0];
      } else if (time >= kfs[kfs.length - 1].time) {
        if (clip.loop) {
          prev = kfs[kfs.length - 1];
          next = kfs[0];
        } else {
          prev = kfs[kfs.length - 1];
          next = kfs[kfs.length - 1];
        }
      } else {
        for (let i = 0; i < kfs.length - 1; i++) {
          if (time >= kfs[i].time && time <= kfs[i + 1].time) {
            prev = kfs[i];
            next = kfs[i + 1];
            break;
          }
        }
      }

      let factor = 0;
      if (prev !== next) {
        const segDuration = next === kfs[0] ? Math.max(0.01, duration - prev.time) : Math.max(0.01, next.time - prev.time);
        factor = Math.min(1, Math.max(0, (time - prev.time) / segDuration));
      }

      const allBones = new Set([...Object.keys(prev.transforms), ...Object.keys(next.transforms)]);

      allBones.forEach((bName) => {
        const bone = bonesMap.current.get(bName);
        const initQ = initialQuaternions.current.get(bName);
        if (!bone || !initQ) return;

        const rotA = prev.transforms[bName] || [0, 0, 0];
        const rotB = next.transforms[bName] || [0, 0, 0];

        const qA = new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rotA[0] * Math.PI) / 180, (rotA[1] * Math.PI) / 180, (rotA[2] * Math.PI) / 180, 'YXZ')
        );
        const qB = new THREE.Quaternion().setFromEuler(
          new THREE.Euler((rotB[0] * Math.PI) / 180, (rotB[1] * Math.PI) / 180, (rotB[2] * Math.PI) / 180, 'YXZ')
        );

        const deltaQ = qA.slerp(qB, factor);
        bone.quaternion.copy(initQ).multiply(deltaQ);
      });

      // Handle positions (like Hips translation during walk/sprint/jump)
      if (prev.positions || next.positions) {
        const allPosBones = new Set([
          ...Object.keys(prev.positions || {}),
          ...Object.keys(next.positions || {}),
        ]);
        allPosBones.forEach((bName) => {
          const bone = bonesMap.current.get(bName);
          const initP = initialPositions.current.get(bName);
          if (!bone || !initP) return;

          const posA = prev.positions?.[bName] || [0, 0, 0];
          const posB = next.positions?.[bName] || [0, 0, 0];

          const px = posA[0] + (posB[0] - posA[0]) * factor;
          const py = posA[1] + (posB[1] - posA[1]) * factor;
          const pz = posA[2] + (posB[2] - posA[2]) * factor;

          bone.position.set(initP.x + px, initP.y + py, initP.z + pz);
        });
      }
    } else if (pose) {
      // Apply standing pose parameters + custom bone rotations
      const stanceW = pose.stanceWidth ?? 0.05;
      const armSpr = pose.armSpread ?? -0.15;
      const spineT = pose.chestSpineTilt ?? 0.02;
      const headT = pose.headTilt ?? 0;
      const kneeF = pose.kneeFlex ?? 0.03;

      const setBoneRot = (name: string, rx: number, ry: number, rz: number) => {
        const bone = bonesMap.current.get(name);
        const initQ = initialQuaternions.current.get(name);
        if (!bone || !initQ) return;
        const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
        bone.quaternion.copy(initQ).multiply(deltaQ);
      };

      setBoneRot('Spine', spineT, 0, 0);
      setBoneRot('Head', headT, 0, 0);
      setBoneRot('RightUpLeg', 0, 0, -stanceW);
      setBoneRot('LeftUpLeg', 0, 0, stanceW);
      setBoneRot('RightLeg', kneeF, 0, 0);
      setBoneRot('LeftLeg', kneeF, 0, 0);
      setBoneRot('RightArm', 0, 0, armSpr);
      setBoneRot('LeftArm', 0, 0, -armSpr);

      if (pose.customBoneRotations) {
        Object.entries(pose.customBoneRotations).forEach(([bName, [rx, ry, rz]]) => {
          setBoneRot(bName, (rx * Math.PI) / 180, (ry * Math.PI) / 180, (rz * Math.PI) / 180);
        });
      }
    }
  });

  return (
    <group ref={group} position={[0, -0.9, 0]}>
      <primitive object={scene} />
    </group>
  );
}

interface CardPreviewCanvasProps {
  clip?: AnimationClip | null;
  pose?: StandingPoseConfig | null;
  autoRotate?: boolean;
}

export function CardPreviewCanvas({ clip, pose, autoRotate = true }: CardPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950/80 rounded-xl overflow-hidden">
      {isVisible ? (
        <Canvas camera={{ position: [0, 0.4, 2.5], fov: 42 }} gl={{ powerPreference: 'low-power', antialias: false, preserveDrawingBuffer: false }}>
          <color attach="background" args={['#090d16']} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[3, 5, 2]} intensity={1.5} />
          <directionalLight position={[-3, -2, -2]} intensity={0.4} color="#38bdf8" />

          <Suspense fallback={null}>
            <CardPreviewModel clip={clip} pose={pose} />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={2.2}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2 + 0.1}
          />
        </Canvas>
      ) : (
        <div className="w-full h-full bg-slate-950/90 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
