import { useEffect, useRef, useMemo, useState } from 'react';
import { useGLTF, TransformControls, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { SkeletonVisualizer } from '../SkeletonVisualizer';
import { AnimationClip, StandingPoseConfig } from '../../types/animation';
import {
  clampJointRotation,
  detectBodyCollisions,
  resolveLimbWrappingCollisions,
  DetectedCollision,
} from '../../utils/humanPhysics';

// Human-readable labels for floating 3D badges
export const BONE_LABELS: Record<string, string> = {
  Head: 'Head & Face',
  Neck: 'Neck & Throat',
  Spine2: 'Upper Torso (Chest)',
  Spine1: 'Mid Spine & Ribcage',
  Spine: 'Lower Spine & Waist',
  Hips: 'Hips & Pelvis',
  LeftShoulder: 'Left Shoulder',
  LeftArm: 'Left Upper Arm',
  LeftForeArm: 'Left Forearm',
  LeftHand: 'Left Hand & Wrist',
  RightShoulder: 'Right Shoulder',
  RightArm: 'Right Upper Arm',
  RightForeArm: 'Right Forearm',
  RightHand: 'Right Hand & Wrist',
  LeftUpLeg: 'Left Thigh',
  LeftLeg: 'Left Shin & Knee',
  LeftFoot: 'Left Foot & Ankle',
  RightUpLeg: 'Right Thigh',
  RightLeg: 'Right Shin & Knee',
  RightFoot: 'Right Foot & Ankle',
};

// Connected regional bone groups for multi-part highlighting
const REGIONAL_BONES: Record<string, string[]> = {
  Head: ['Neck', 'Head'],
  Neck: ['Neck', 'Head'],
  Spine2: ['Spine', 'Spine1', 'Spine2', 'Hips'],
  Spine1: ['Spine', 'Spine1', 'Spine2'],
  Spine: ['Spine', 'Spine1', 'Hips'],
  Hips: ['Hips', 'Spine', 'LeftUpLeg', 'RightUpLeg'],
  LeftShoulder: ['LeftShoulder', 'LeftArm'],
  LeftArm: ['LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand'],
  LeftForeArm: ['LeftArm', 'LeftForeArm', 'LeftHand'],
  LeftHand: ['LeftForeArm', 'LeftHand'],
  RightShoulder: ['RightShoulder', 'RightArm'],
  RightArm: ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand'],
  RightForeArm: ['RightArm', 'RightForeArm', 'RightHand'],
  RightHand: ['RightForeArm', 'RightHand'],
  LeftUpLeg: ['Hips', 'LeftUpLeg', 'LeftLeg', 'LeftFoot'],
  LeftLeg: ['LeftUpLeg', 'LeftLeg', 'LeftFoot'],
  LeftFoot: ['LeftLeg', 'LeftFoot'],
  RightUpLeg: ['Hips', 'RightUpLeg', 'RightLeg', 'RightFoot'],
  RightLeg: ['RightUpLeg', 'RightLeg', 'RightFoot'],
  RightFoot: ['RightLeg', 'RightFoot'],
};

interface LabModelProps {
  showSkeleton: boolean;
  showMesh: boolean;
  wireframe: boolean;
  selectedBoneName: string | null;
  onSelectBone: (name: string) => void;
  activeClip: AnimationClip | null;
  currentTime: number;
  standingPose: StandingPoseConfig;
  activeMode: 'timeline' | 'pose';
  tempBoneOverrides: Record<string, [number, number, number]>;
  tempBonePosOverrides?: Record<string, [number, number, number]>;
  onBoneRotate?: (boneName: string, degrees: [number, number, number]) => void;
  onBoneTranslate?: (boneName: string, deltaPos: [number, number, number]) => void;
  gizmoMode?: 'rotate' | 'translate';
  lockedBones?: Set<string>;
  controlsRef?: React.RefObject<any>;
  modelPath?: string;
  enablePhysics?: boolean;
  preventStretch?: boolean;
  clampLimits?: boolean;
  enableSelfCollision?: boolean;
  onDetectedCollisions?: (collisions: DetectedCollision[]) => void;
  isPlaying?: boolean;
}

export function LabModel({
  showSkeleton,
  showMesh,
  wireframe,
  selectedBoneName,
  onSelectBone,
  activeClip,
  currentTime,
  standingPose,
  activeMode,
  tempBoneOverrides,
  tempBonePosOverrides = {},
  onBoneRotate,
  onBoneTranslate,
  gizmoMode = 'rotate',
  lockedBones = new Set(),
  controlsRef,
  modelPath = '/model.glb',
  enablePhysics = true,
  preventStretch = true,
  clampLimits = true,
  enableSelfCollision = true,
  onDetectedCollisions,
  isPlaying = false,
}: LabModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene: gltfScene } = useGLTF(modelPath);
  const scene = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene]);

  const bonesMap = useRef<Map<string, THREE.Bone>>(new Map());
  const initialQuaternions = useRef<Map<string, THREE.Quaternion>>(new Map());
  const initialPositions = useRef<Map<string, THREE.Vector3>>(new Map());
  const initialHipsPos = useRef<THREE.Vector3 | null>(null);

  const [boneJoints, setBoneJoints] = useState<Array<{ name: string; bone: THREE.Bone }>>([]);
  const [selectedBoneObj, setSelectedBoneObj] = useState<THREE.Bone | null>(null);
  const [activeCollisions, setActiveCollisions] = useState<DetectedCollision[]>([]);

  useEffect(() => {
    if (scene) {
      bonesMap.current.clear();
      initialQuaternions.current.clear();
      initialPositions.current.clear();
      const joints: Array<{ name: string; bone: THREE.Bone }> = [];

      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const nameLower = mesh.name.toLowerCase();

          // 1. REMOVE MASK / GLASSES / FACIAL ACCESSORIES
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
            mat.wireframe = wireframe;

            const isHair = nameLower.includes('hair') || nameLower.includes('headcover') || nameLower.includes('wolf3d_hair') || matName.includes('hair');
            const isTop = nameLower.includes('top') || nameLower.includes('outfit_top') || matName.includes('top');
            const isBottom = nameLower.includes('bottom') || nameLower.includes('outfit_bottom') || nameLower.includes('pants') || matName.includes('bottom');
            const isShoes = nameLower.includes('footwear') || nameLower.includes('shoes') || matName.includes('footwear');

            if (isHair) {
              mat.color = new THREE.Color('#facc15'); // Golden Blonde Hair
              mat.map = null;
              mat.roughness = 0.4;
              mat.metalness = 0.05;
            } else if (isTop) {
              mat.color = new THREE.Color('#141416'); // Sleek Black Athletic Shirt
              mat.map = null;
              mat.roughness = 0.45;
              mat.metalness = 0.05;
            } else if (isBottom) {
              mat.color = new THREE.Color('#0a0a0c'); // Black Pants
              mat.map = null;
              mat.roughness = 0.55;
              mat.metalness = 0.0;
            } else if (isShoes) {
              mat.color = new THREE.Color('#ffffff'); // Pure White Sneakers
              mat.map = null;
              mat.roughness = 0.2;
              mat.metalness = 0.1;
            } else if (mat.map) {
              mat.color = new THREE.Color('#ffffff');
            }
            mesh.material = mat;
          }
        }
        if ((child as any).isBone) {
          const bone = child as THREE.Bone;
          bonesMap.current.set(bone.name, bone);
          joints.push({ name: bone.name, bone });
          if (!initialQuaternions.current.has(bone.name)) {
            initialQuaternions.current.set(bone.name, bone.quaternion.clone());
          }
          if (!initialPositions.current.has(bone.name)) {
            initialPositions.current.set(bone.name, bone.position.clone());
          }
          if (bone.name === 'Hips' && !initialHipsPos.current) {
            initialHipsPos.current = bone.position.clone();
          }
        }
      });
      setBoneJoints(joints);
    }
  }, [scene, wireframe, modelPath]);

  useEffect(() => {
    if (selectedBoneName) {
      const bone = bonesMap.current.get(selectedBoneName) || null;
      setSelectedBoneObj(bone);
    } else {
      setSelectedBoneObj(null);
    }
  }, [selectedBoneName]);

  useFrame((state) => {
    if (!scene) return;

    // Reset bones to baseline GLTF rest quaternions and positions first
    bonesMap.current.forEach((bone, name) => {
      if (lockedBones.has(name)) return;
      const initQ = initialQuaternions.current.get(name);
      if (initQ) bone.quaternion.copy(initQ);

      // ENFORCE BONE STRETCH PREVENTION: Non-root bones stay locked to socket offset
      const initP = initialPositions.current.get(name);
      if (initP) {
        if (preventStretch && name !== 'Hips') {
          bone.position.copy(initP);
        } else {
          bone.position.copy(initP);
        }
      }
    });

    if (activeMode === 'pose') {
      applyStandingPose(bonesMap.current, initialQuaternions.current, standingPose);

      // Apply rotation overrides with anatomical limits clamping
      Object.entries(tempBoneOverrides).forEach(([bName, rot]) => {
        if (lockedBones.has(bName)) return;
        const bone = bonesMap.current.get(bName);
        const initQ = initialQuaternions.current.get(bName);
        if (bone && initQ) {
          let [rx, ry, rz] = rot;

          if (clampLimits) {
            [rx, ry, rz] = clampJointRotation(bName, [rx, ry, rz], enablePhysics);
          }

          const radX = (rx * Math.PI) / 180;
          const radY = (ry * Math.PI) / 180;
          const radZ = (rz * Math.PI) / 180;
          const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(radX, radY, radZ, 'YXZ'));
          bone.quaternion.copy(initQ).multiply(deltaQ);
        }
      });

      // Apply position overrides (only allowed for Hips if stretch prevention is enabled)
      Object.entries(tempBonePosOverrides).forEach(([bName, [px, py, pz]]) => {
        if (lockedBones.has(bName)) return;
        if (preventStretch && bName !== 'Hips') return; // Strict lock non-pelvis sockets

        const bone = bonesMap.current.get(bName);
        const initP = initialPositions.current.get(bName);
        if (bone && initP) {
          bone.position.set(initP.x + px, initP.y + py, initP.z + pz);
        }
      });
    } else if (activeMode === 'timeline' && activeClip && activeClip.keyframes.length > 0) {
      interpolateKeyframes(activeClip, currentTime, bonesMap.current, initialQuaternions.current, initialPositions.current, lockedBones);

      if (!isPlaying) {
        Object.entries(tempBoneOverrides).forEach(([bName, rot]) => {
          if (lockedBones.has(bName)) return;
          const bone = bonesMap.current.get(bName);
          const initQ = initialQuaternions.current.get(bName);
          if (bone && initQ) {
            let [rx, ry, rz] = rot;
            if (clampLimits) {
              [rx, ry, rz] = clampJointRotation(bName, [rx, ry, rz], enablePhysics);
            }

            const radX = (rx * Math.PI) / 180;
            const radY = (ry * Math.PI) / 180;
            const radZ = (rz * Math.PI) / 180;
            const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(radX, radY, radZ, 'YXZ'));
            bone.quaternion.copy(initQ).multiply(deltaQ);
          }
        });

        Object.entries(tempBonePosOverrides).forEach(([bName, [px, py, pz]]) => {
          if (lockedBones.has(bName)) return;
          if (preventStretch && bName !== 'Hips') return;

          const bone = bonesMap.current.get(bName);
          const initP = initialPositions.current.get(bName);
          if (bone && initP) {
            bone.position.set(initP.x + px, initP.y + py, initP.z + pz);
          }
        });
      }
    }

    // Soft Muscle Dynamics & Breathing
    if (enablePhysics) {
      const breathTime = state.clock.getElapsedTime() * 2.2;
      const chestBone = bonesMap.current.get('Spine2');
      if (chestBone) {
        const breathScale = 1 + Math.sin(breathTime) * 0.012;
        chestBone.scale.set(breathScale, 1 + Math.sin(breathTime + 0.5) * 0.008, breathScale);
      }
    }

    // Self-Collision Physics Engine: calculate soft anatomical contacts & wrap active limbs
    if (enableSelfCollision) {
      const collisions = resolveLimbWrappingCollisions(bonesMap.current, selectedBoneName);
      if (collisions.length !== activeCollisions.length) {
        setActiveCollisions(collisions);
        onDetectedCollisions?.(collisions);
      }
    }
  });

  const transformRef = useRef<any>(null);

  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const handleDragging = (event: any) => {
      if (controlsRef?.current) {
        controlsRef.current.enabled = !event.value;
      }
    };

    controls.addEventListener('dragging-changed', handleDragging);
    return () => {
      controls.removeEventListener('dragging-changed', handleDragging);
    };
  }, [controlsRef, selectedBoneObj]);

  const handleGizmoChange = () => {
    if (!selectedBoneObj || !selectedBoneName || lockedBones.has(selectedBoneName)) return;

    if (gizmoMode === 'translate') {
      const initP = initialPositions.current.get(selectedBoneName);
      if (initP && onBoneTranslate) {
        // Enforce Stretch Prevention: Restrict translation to Hips or convert to rotation
        if (preventStretch && selectedBoneName !== 'Hips') {
          // Keep socket locked at rest position, preventing bone detachment
          selectedBoneObj.position.copy(initP);
        } else {
          const dx = Number((selectedBoneObj.position.x - initP.x).toFixed(3));
          const dy = Number((selectedBoneObj.position.y - initP.y).toFixed(3));
          const dz = Number((selectedBoneObj.position.z - initP.z).toFixed(3));
          onBoneTranslate(selectedBoneName, [dx, dy, dz]);
        }
      }
    } else {
      const initQ = initialQuaternions.current.get(selectedBoneName);
      if (!initQ || !onBoneRotate) return;

      const deltaQ = selectedBoneObj.quaternion.clone().multiply(initQ.clone().invert());
      const euler = new THREE.Euler().setFromQuaternion(deltaQ, 'YXZ');

      let degX = Math.round((euler.x * 180) / Math.PI);
      let degY = Math.round((euler.y * 180) / Math.PI);
      let degZ = Math.round((euler.z * 180) / Math.PI);

      if (clampLimits) {
        [degX, degY, degZ] = clampJointRotation(selectedBoneName, [degX, degY, degZ], enablePhysics);
      }

      onBoneRotate(selectedBoneName, [degX, degY, degZ]);
    }
  };

  // Direct 3D Raycast click on model mesh to pick closest bone
  const handleModelClick = (e: any) => {
    e.stopPropagation();
    if (!e.point) return;

    let closestBone = '';
    let minDist = Infinity;

    bonesMap.current.forEach((bone, name) => {
      const boneWorldPos = bone.getWorldPosition(new THREE.Vector3());
      const dist = boneWorldPos.distanceTo(e.point);
      if (dist < minDist) {
        minDist = dist;
        closestBone = name;
      }
    });

    if (closestBone) {
      onSelectBone(closestBone);
    }
  };

  const isSelectedLocked = selectedBoneName ? lockedBones.has(selectedBoneName) : false;

  return (
    <group ref={group} position={[0, 0, 0]} dispose={null}>
      {showMesh && (
        <primitive object={scene} onClick={handleModelClick} />
      )}

      <SkeletonVisualizer root={scene} visible={showSkeleton} />

      {/* 3D Highlighting for Selected Body Part */}
      <BodyPartHighlighter selectedBoneName={selectedBoneName} bonesMap={bonesMap.current} />

      {/* Minimalist 3D Joint Dot Markers */}
      {showSkeleton &&
        boneJoints.map(({ name, bone }) => {
          const isSelected = selectedBoneName === name;
          const isRegional = selectedBoneName ? REGIONAL_BONES[selectedBoneName]?.includes(name) : false;
          const isLocked = lockedBones.has(name);

          return (
            <mesh
              key={name}
              position={bone.getWorldPosition(new THREE.Vector3())}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBone(name);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
            >
              <sphereGeometry args={[isSelected ? 0.03 : isRegional ? 0.022 : 0.016, 12, 12]} />
              <meshBasicMaterial
                color={isSelected ? '#f59e0b' : isRegional ? '#fbbf24' : isLocked ? '#ef4444' : '#38bdf8'}
                wireframe={false}
                depthTest={true}
                transparent
                opacity={isSelected ? 0.95 : isRegional ? 0.75 : 0.45}
              />
            </mesh>
          );
        })}

      {/* Interactive 3D Rotation / Free Translate Gizmo - Compact size */}
      {selectedBoneObj && !isSelectedLocked && (
        <TransformControls
          ref={transformRef}
          object={selectedBoneObj}
          mode={gizmoMode}
          size={0.28}
          onObjectChange={handleGizmoChange}
        />
      )}

      {/* Sleek Corner Viewport Orientation Axis */}
      <GizmoHelper alignment="bottom-right" margin={[50, 50]}>
        <GizmoViewport labelColor="#ffffff" axisColors={['#ef4444', '#22c55e', '#3b82f6']} scale={0.55} />
      </GizmoHelper>
    </group>
  );
}

// 3D Visual Highlighter Component for Selected Body Parts
function BodyPartHighlighter({
  selectedBoneName,
  bonesMap,
}: {
  selectedBoneName: string | null;
  bonesMap: Map<string, THREE.Bone>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);

  const [highlightData, setHighlightData] = useState<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    midPos: THREE.Vector3;
    orientation: THREE.Quaternion;
    length: number;
    radius: number;
    label: string;
    rotDeg: [number, number, number];
  } | null>(null);

  useFrame(() => {
    if (!selectedBoneName) {
      setHighlightData(null);
      return;
    }

    const bone = bonesMap.get(selectedBoneName);
    if (!bone) {
      setHighlightData(null);
      return;
    }

    const startPos = bone.getWorldPosition(new THREE.Vector3());
    let endPos = new THREE.Vector3();
    let radius = 0.06;

    // Find first child bone for vector
    const childBone = bone.children.find((c) => (c as THREE.Bone).isBone) as THREE.Bone | undefined;

    if (childBone) {
      childBone.getWorldPosition(endPos);
    } else {
      // Leaf bone or custom offset direction
      const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
      const worldDir = new THREE.Vector3(0, 1, 0).applyQuaternion(worldQ);

      if (selectedBoneName.includes('Hand')) {
        endPos.copy(startPos).add(worldDir.clone().multiplyScalar(0.12));
        radius = 0.045;
      } else if (selectedBoneName.includes('Foot')) {
        endPos.copy(startPos).add(new THREE.Vector3(0, -0.05, 0.12));
        radius = 0.055;
      } else if (selectedBoneName === 'Head') {
        endPos.copy(startPos).add(new THREE.Vector3(0, 0.18, 0));
        radius = 0.11;
      } else {
        endPos.copy(startPos).add(worldDir.clone().multiplyScalar(0.15));
      }
    }

    // Radius tuned to female model body part proportions
    if (selectedBoneName.includes('Arm') || selectedBoneName.includes('ForeArm')) radius = 0.052;
    if (selectedBoneName.includes('Leg') || selectedBoneName.includes('UpLeg')) radius = 0.072;
    if (selectedBoneName.includes('Spine') || selectedBoneName === 'Hips') radius = 0.13;
    if (selectedBoneName === 'Head') radius = 0.11;
    if (selectedBoneName === 'Neck') radius = 0.055;

    const len = Math.max(0.08, startPos.distanceTo(endPos));
    const midPos = startPos.clone().add(endPos).multiplyScalar(0.5);

    // Direction alignment vector
    const dir = endPos.clone().sub(startPos).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const orientation = new THREE.Quaternion().setFromUnitVectors(up, dir);

    // Current Euler angles
    const euler = new THREE.Euler().setFromQuaternion(bone.quaternion, 'YXZ');
    const rotDeg: [number, number, number] = [
      Math.round((euler.x * 180) / Math.PI),
      Math.round((euler.y * 180) / Math.PI),
      Math.round((euler.z * 180) / Math.PI),
    ];

    setHighlightData({
      startPos,
      endPos,
      midPos,
      orientation,
      length: len,
      radius,
      label: BONE_LABELS[selectedBoneName] || selectedBoneName,
      rotDeg,
    });
  });

  if (!highlightData) return null;

  return (
    <group>
      {/* 3D Glowing Vector Stroke Outline around Selected Body Part */}
      <GlowingStrokeOutline
        midPos={highlightData.midPos}
        orientation={highlightData.orientation}
        length={highlightData.length}
        radius={highlightData.radius}
        startPos={highlightData.startPos}
        endPos={highlightData.endPos}
      />
    </group>
  );
}

// 3D Glowing Vector Stroke Outline Component (Clean lines, zero solid mesh obstruction)
function GlowingStrokeOutline({
  midPos,
  orientation,
  length,
  radius,
  startPos,
  endPos,
}: {
  midPos: THREE.Vector3;
  orientation: THREE.Quaternion;
  length: number;
  radius: number;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
}) {
  const rings = useMemo(() => {
    const ringCount = 5;
    const segments = 32;
    const ringGeometries: THREE.BufferGeometry[] = [];

    const halfLen = length / 2;
    for (let r = 0; r < ringCount; r++) {
      const y = -halfLen + (length * r) / (ringCount - 1);
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
      }
      ringGeometries.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return ringGeometries;
  }, [length, radius]);

  const sideLines = useMemo(() => {
    const lineCount = 8;
    const points: THREE.Vector3[] = [];
    const halfLen = length / 2;
    for (let i = 0; i < lineCount; i++) {
      const theta = (i / lineCount) * Math.PI * 2;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      points.push(new THREE.Vector3(x, -halfLen, z));
      points.push(new THREE.Vector3(x, halfLen, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [length, radius]);

  return (
    <group>
      {/* Primary Glowing Stroke Outline (Electric Cyan & Amber Glow) */}
      <group position={midPos} quaternion={orientation}>
        {rings.map((geom, idx) => (
          <lineLoop key={idx} geometry={geom}>
            <lineBasicMaterial color="#38bdf8" linewidth={2} transparent opacity={0.95} depthTest={false} depthWrite={false} />
          </lineLoop>
        ))}
        <lineSegments geometry={sideLines}>
          <lineBasicMaterial color="#38bdf8" linewidth={2} transparent opacity={0.95} depthTest={false} depthWrite={false} />
        </lineSegments>

        {/* Outer Soft Glowing Aura Rings */}
        {rings.map((geom, idx) => (
          <lineLoop key={`aura_${idx}`} geometry={geom} scale={[1.08, 1, 1.08]}>
            <lineBasicMaterial color="#f59e0b" linewidth={1} transparent opacity={0.45} depthTest={false} depthWrite={false} />
          </lineLoop>
        ))}
      </group>

      {/* Joint Indicator Glowing Stroke Circles */}
      <mesh position={startPos}>
        <sphereGeometry args={[radius * 0.35, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.85} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh position={endPos}>
        <sphereGeometry args={[radius * 0.28, 14, 14]} />
        <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.85} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// Helper: Apply standing pose configuration to bones
function applyStandingPose(
  bones: Map<string, THREE.Bone>,
  initialQs: Map<string, THREE.Quaternion>,
  pose: StandingPoseConfig
) {
  const setRot = (boneName: string, degX: number, degY: number, degZ: number) => {
    const bone = bones.get(boneName);
    const initQ = initialQs.get(boneName);
    if (!bone || !initQ) return;
    const radX = (degX * Math.PI) / 180;
    const radY = (degY * Math.PI) / 180;
    const radZ = (degZ * Math.PI) / 180;
    const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(radX, radY, radZ, 'YXZ'));
    bone.quaternion.copy(initQ).multiply(deltaQ);
  };

  // Custom bone overrides from pose
  Object.entries(pose.customBoneRotations).forEach(([bName, [x, y, z]]) => {
    setRot(bName, x, y, z);
  });

  // Stance & Posture Sliders
  const rightLeg = bones.get('RightUpLeg');
  const leftLeg = bones.get('LeftUpLeg');
  if (rightLeg && leftLeg) {
    setRot('RightUpLeg', pose.customBoneRotations.RightUpLeg?.[0] || 0, 0, -pose.stanceWidth * 50);
    setRot('LeftUpLeg', pose.customBoneRotations.LeftUpLeg?.[0] || 0, 0, pose.stanceWidth * 50);
  }

  const rightArm = bones.get('RightArm');
  const leftArm = bones.get('LeftArm');
  if (rightArm && leftArm) {
    setRot('RightArm', pose.customBoneRotations.RightArm?.[0] || 0, 0, pose.armSpread * 50);
    setRot('LeftArm', pose.customBoneRotations.LeftArm?.[0] || 0, 0, -pose.armSpread * 50);
  }

  setRot('Spine1', pose.chestSpineTilt * 30, 0, 0);
  setRot('Head', pose.headTilt * 30, 0, 0);
  setRot('RightLeg', pose.kneeFlex * 40, 0, 0);
  setRot('LeftLeg', pose.kneeFlex * 40, 0, 0);
}

// Helper: Linear/SLERP keyframe animation interpolation
function interpolateKeyframes(
  clip: AnimationClip,
  time: number,
  bones: Map<string, THREE.Bone>,
  initialQs: Map<string, THREE.Quaternion>,
  initialPs: Map<string, THREE.Vector3>,
  lockedBones: Set<string> = new Set()
) {
  const kfs = [...clip.keyframes].sort((a, b) => a.time - b.time);
  if (kfs.length === 0) return;

  if (kfs.length === 1 || time <= kfs[0].time) {
    applyKeyframe(kfs[0], bones, initialQs, initialPs, lockedBones);
    return;
  }

  if (time >= kfs[kfs.length - 1].time) {
    applyKeyframe(kfs[kfs.length - 1], bones, initialQs, initialPs, lockedBones);
    return;
  }

  // Find bounding keyframes
  let prev = kfs[0];
  let next = kfs[kfs.length - 1];

  for (let i = 0; i < kfs.length - 1; i++) {
    if (time >= kfs[i].time && time <= kfs[i + 1].time) {
      prev = kfs[i];
      next = kfs[i + 1];
      break;
    }
  }

  const duration = next.time - prev.time;
  const factor = duration > 0 ? (time - prev.time) / duration : 0;

  // Union of bones in both keyframes
  const allBones = new Set([...Object.keys(prev.transforms), ...Object.keys(next.transforms)]);

  allBones.forEach((bName) => {
    if (lockedBones.has(bName)) return;
    const bone = bones.get(bName);
    const initQ = initialQs.get(bName);
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

  // Interpolate positions (e.g. Hips bounce/translation)
  if (prev.positions || next.positions) {
    const allPosBones = new Set([
      ...Object.keys(prev.positions || {}),
      ...Object.keys(next.positions || {}),
    ]);
    allPosBones.forEach((bName) => {
      if (lockedBones.has(bName)) return;
      const bone = bones.get(bName);
      const initP = initialPs.get(bName);
      if (!bone || !initP) return;

      const posA = prev.positions?.[bName] || [0, 0, 0];
      const posB = next.positions?.[bName] || [0, 0, 0];

      const px = posA[0] + (posB[0] - posA[0]) * factor;
      const py = posA[1] + (posB[1] - posA[1]) * factor;
      const pz = posA[2] + (posB[2] - posA[2]) * factor;

      bone.position.set(initP.x + px, initP.y + py, initP.z + pz);
    });
  }
}

function applyKeyframe(
  kf: { transforms: Record<string, [number, number, number]>; positions?: Record<string, [number, number, number]> },
  bones: Map<string, THREE.Bone>,
  initialQs: Map<string, THREE.Quaternion>,
  initialPs: Map<string, THREE.Vector3>,
  lockedBones: Set<string> = new Set()
) {
  Object.entries(kf.transforms).forEach(([bName, [degX, degY, degZ]]) => {
    if (lockedBones.has(bName)) return;
    const bone = bones.get(bName);
    const initQ = initialQs.get(bName);
    if (!bone || !initQ) return;

    const radX = (degX * Math.PI) / 180;
    const radY = (degY * Math.PI) / 180;
    const radZ = (degZ * Math.PI) / 180;

    const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(radX, radY, radZ, 'YXZ'));
    bone.quaternion.copy(initQ).multiply(deltaQ);
  });

  if (kf.positions) {
    Object.entries(kf.positions).forEach(([bName, [px, py, pz]]) => {
      if (lockedBones.has(bName)) return;
      const bone = bones.get(bName);
      const initP = initialPs.get(bName);
      if (!bone || !initP) return;
      bone.position.set(initP.x + px, initP.y + py, initP.z + pz);
    });
  }
}
