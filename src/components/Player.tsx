import { useGLTF, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import { SkeletonUtils, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SkeletonVisualizer } from './SkeletonVisualizer';
import { StandingPoseConfig, AnimationClip } from '../types/animation';
import { solveTwoBoneIK, resolveLimbWrappingCollisions } from '../utils/humanPhysics';
import { History } from 'lucide-react';

interface PlayerProps {
  joystickMove: { x: number; y: number };
  showSkeleton: boolean;
  orbitControlsRef: React.RefObject<OrbitControlsImpl | null>;
  standingPose?: StandingPoseConfig;
  activeWalkClip?: AnimationClip | null;
  activeIdleClip?: AnimationClip | null;
  isDragMode?: boolean;
  speechMessage?: string | null;
  isFreeCamera?: boolean;
  onToggleHistory?: () => void;
  onZoomChange?: (isZoomedClose: boolean) => void;
  hideHeadSpeech?: boolean;
  resetTrigger?: number;
}

export function Player({
  joystickMove,
  showSkeleton,
  orbitControlsRef,
  standingPose,
  activeWalkClip,
  activeIdleClip,
  isDragMode,
  speechMessage,
  isFreeCamera,
  onToggleHistory,
  onZoomChange,
  hideHeadSpeech,
  resetTrigger,
}: PlayerProps) {
  const { camera } = useThree();
  const group = useRef<THREE.Group>(null);
  const rigidBody = useRef<RapierRigidBody>(null);
  const { scene: gltfScene } = useGLTF('/model.glb');
  const scene = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene]);

  // Refs for bones
  const hips = useRef<THREE.Bone | null>(null);
  const spine = useRef<THREE.Bone | null>(null);
  const spine1 = useRef<THREE.Bone | null>(null);
  const spine2 = useRef<THREE.Bone | null>(null);
  const head = useRef<THREE.Bone | null>(null);

  const rightLeg = useRef<THREE.Bone | null>(null);
  const leftLeg = useRef<THREE.Bone | null>(null);
  const rightLegLower = useRef<THREE.Bone | null>(null);
  const leftLegLower = useRef<THREE.Bone | null>(null);
  const rightFoot = useRef<THREE.Bone | null>(null);
  const leftFoot = useRef<THREE.Bone | null>(null);

  const rightArm = useRef<THREE.Bone | null>(null);
  const leftArm = useRef<THREE.Bone | null>(null);
  const rightForeArm = useRef<THREE.Bone | null>(null);
  const leftForeArm = useRef<THREE.Bone | null>(null);

  const timeRef = useRef(0);
  const idleTimeRef = useRef(0);
  const initialQuaternions = useRef<Map<string, THREE.Quaternion>>(new Map());
  const initialPositions = useRef<Map<string, THREE.Vector3>>(new Map());
  const bonesMapRef = useRef<Map<string, THREE.Bone>>(new Map());
  const initialHipsPos = useRef<THREE.Vector3 | null>(null);
  const lastPlayerPos = useRef<THREE.Vector3 | null>(null);
  const isBodyCorrectingRef = useRef(false);
  const headFacingRef = useRef<number | null>(null);
  const isHeadCorrectingRef = useRef(false);
  const hasInitFreeCamRef = useRef(false);
  const isZoomedCloseRef = useRef(false);

  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as any).isMesh) {
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
          if (!initialQuaternions.current.has(bone.name)) {
            initialQuaternions.current.set(bone.name, bone.quaternion.clone());
          }
          if (!initialPositions.current.has(bone.name)) {
            initialPositions.current.set(bone.name, bone.position.clone());
          }
          bonesMapRef.current.set(bone.name, bone);

          if (bone.name === 'Hips') {
            hips.current = bone;
            if (!initialHipsPos.current) {
              initialHipsPos.current = bone.position.clone();
            }
          }
          if (bone.name === 'Spine') spine.current = bone;
          if (bone.name === 'Spine1') spine1.current = bone;
          if (bone.name === 'Spine2') spine2.current = bone;
          if (bone.name === 'Head') head.current = bone;

          if (bone.name === 'RightUpLeg') rightLeg.current = bone;
          if (bone.name === 'LeftUpLeg') leftLeg.current = bone;
          if (bone.name === 'RightLeg') rightLegLower.current = bone;
          if (bone.name === 'LeftLeg') leftLegLower.current = bone;
          if (bone.name === 'RightFoot') rightFoot.current = bone;
          if (bone.name === 'LeftFoot') leftFoot.current = bone;

          if (bone.name === 'RightArm') rightArm.current = bone;
          if (bone.name === 'LeftArm') leftArm.current = bone;
          if (bone.name === 'RightForeArm') rightForeArm.current = bone;
          if (bone.name === 'LeftForeArm') leftForeArm.current = bone;
        }
      });
    }
  }, [scene]);

  // Reset physics rigidBody translation and velocities on resetTrigger
  useEffect(() => {
    if (resetTrigger && rigidBody.current) {
      rigidBody.current.setTranslation({ x: 0, y: 0.05, z: 0 }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBody.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      hasInitFreeCamRef.current = false;
    }
  }, [resetTrigger]);

  useFrame((state, delta) => {
    if (!group.current || !rigidBody.current) return;

    // Emergency out-of-bounds fall protection: only reset position if character falls deep off map (y < -1.5)
    const currentTranslation = rigidBody.current.translation();
    if (currentTranslation.y < -1.5) {
      rigidBody.current.setTranslation({ x: currentTranslation.x, y: 0.1, z: currentTranslation.z }, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    const camera = state.camera;

    // 1. Calculate camera orientation vectors
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    if (cameraDirection.lengthSq() > 0.001) cameraDirection.normalize();

    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraRight.y = 0;
    if (cameraRight.lengthSq() > 0.001) cameraRight.normalize();

    // Movement vector relative to camera perspective
    const moveVector = new THREE.Vector3()
      .addScaledVector(cameraDirection, joystickMove.y)
      .addScaledVector(cameraRight, joystickMove.x);

    const isMoving = !isFreeCamera && moveVector.lengthSq() > 0.01;

    // Free Camera Movement (Move camera in 3D space instead of character)
    if (isFreeCamera && moveVector.lengthSq() > 0.01) {
      moveVector.normalize();
      const freeCamSpeed = 5.5 * delta;
      const camDelta = moveVector.clone().multiplyScalar(freeCamSpeed);

      camera.position.add(camDelta);
      if (orbitControlsRef?.current) {
        orbitControlsRef.current.target.add(camDelta);
        orbitControlsRef.current.update();
      }
    }

    // Helper to blend local bone rotation smoothly
    const setBoneRot = (
      bone: THREE.Bone | null,
      rotX: number,
      rotY: number,
      rotZ: number,
      speed = 12
    ) => {
      if (!bone) return;
      const initQ = initialQuaternions.current.get(bone.name);
      if (!initQ) return;

      const deltaQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, rotZ, 'YXZ'));
      const targetQ = initQ.clone().multiply(deltaQ);
      bone.quaternion.slerp(targetQ, Math.min(1, speed * delta));
    };

    // Calculate current body angle (hips & legs)
    const bodyEuler = new THREE.Euler().setFromQuaternion(group.current.quaternion, 'YXZ');
    const bodyAngle = bodyEuler.y;

    if (headFacingRef.current === null) {
      headFacingRef.current = bodyAngle;
    }

    let targetCamAngle = bodyAngle;
    if (cameraDirection.lengthSq() > 0.001) {
      targetCamAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
    }

    if (isMoving) {
      moveVector.normalize();
      const speed = 4.2;

      // Apply physical velocity
      rigidBody.current.setLinvel(
        {
          x: moveVector.x * speed,
          y: rigidBody.current.linvel().y,
          z: moveVector.z * speed,
        },
        true
      );

      // Keyboard movement directly controls hips & legs rotation
      const targetBodyAngle = Math.atan2(moveVector.x, moveVector.z);
      const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetBodyAngle);
      group.current.quaternion.slerp(targetRotation, 14 * delta);

      // Evaluate Keyframe-based Walk Clip or Procedural Walk Cycle
      if (activeWalkClip && activeWalkClip.keyframes.length > 0) {
        timeRef.current += delta * 1.1;
        const clipTime = timeRef.current % activeWalkClip.duration;
        const kfs = [...activeWalkClip.keyframes].sort((a, b) => a.time - b.time);

        let prev = kfs[0];
        let next = kfs[kfs.length - 1];

        for (let i = 0; i < kfs.length - 1; i++) {
          if (clipTime >= kfs[i].time && clipTime <= kfs[i + 1].time) {
            prev = kfs[i];
            next = kfs[i + 1];
            break;
          }
        }

        const duration = next.time - prev.time;
        const factor = duration > 0 ? (clipTime - prev.time) / duration : 0;
        const allBones = new Set([...Object.keys(prev.transforms), ...Object.keys(next.transforms)]);

        allBones.forEach((bName) => {
          const bone = scene.getObjectByName(bName) as THREE.Bone | null;
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
          const targetQ = initQ.clone().multiply(deltaQ);
          bone.quaternion.slerp(targetQ, Math.min(1, 16 * delta));
        });

        if (prev.positions || next.positions) {
          const allPosBones = new Set([
            ...Object.keys(prev.positions || {}),
            ...Object.keys(next.positions || {}),
          ]);
          allPosBones.forEach((bName) => {
            const bone = scene.getObjectByName(bName) as THREE.Bone | null;
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
      } else {
        // Realistic Procedural Walk Cycle
        timeRef.current += delta * 11;
        const t = timeRef.current;
        const swing = Math.sin(t);
        const lerpSpeed = 14;

        // Thighs (UpLeg) - Swing forward & backward
        setBoneRot(rightLeg.current, -swing * 0.45, 0, -0.04, lerpSpeed);
        setBoneRot(leftLeg.current, swing * 0.45, 0, 0.04, lerpSpeed);

        // Knees (Leg) - Flex during swing phase to clear ground
        const rightKneeFlex = Math.max(0, swing) * 0.6 + 0.08;
        const leftKneeFlex = Math.max(0, -swing) * 0.6 + 0.08;
        setBoneRot(rightLegLower.current, rightKneeFlex, 0, 0, lerpSpeed);
        setBoneRot(leftLegLower.current, leftKneeFlex, 0, 0, lerpSpeed);

        // Ankles / Feet - Pitch angle for heel-strike and toe-off
        setBoneRot(rightFoot.current, -swing * 0.22, 0, 0, lerpSpeed);
        setBoneRot(leftFoot.current, swing * 0.22, 0, 0, lerpSpeed);

        // Hips - Vertical bounce & pelvic yaw/tilt
        if (hips.current && initialHipsPos.current) {
          const bounce = Math.abs(Math.sin(t * 2)) * 0.035;
          hips.current.position.y = THREE.MathUtils.lerp(hips.current.position.y, initialHipsPos.current.y + bounce, 12 * delta);
        }
        setBoneRot(hips.current, 0.02, swing * 0.08, swing * 0.03, lerpSpeed);

        // Spine & Torso - Counter-rotation against hips for balance
        setBoneRot(spine.current, 0.04, -swing * 0.05, 0, lerpSpeed);
        setBoneRot(spine1.current, 0.02, -swing * 0.03, 0, lerpSpeed);
        setBoneRot(head.current, 0, 0, 0, lerpSpeed);

        // Arms - Swing opposite to legs with natural posture
        setBoneRot(rightArm.current, swing * 0.35 - 0.1, 0, -0.22, lerpSpeed);
        setBoneRot(leftArm.current, -swing * 0.35 - 0.1, 0, 0.22, lerpSpeed);

        // Forearms / Elbows - Flex during forward swing
        const rightElbow = 0.2 + Math.max(0, swing) * 0.25;
        const leftElbow = 0.2 + Math.max(0, -swing) * 0.25;
        setBoneRot(rightForeArm.current, rightElbow, 0, 0, lerpSpeed);
        setBoneRot(leftForeArm.current, leftElbow, 0, 0, lerpSpeed);
      }

    } else {
      // Stop horizontal movement when idle
      rigidBody.current.setLinvel(
        {
          x: 0,
          y: rigidBody.current.linvel().y,
          z: 0,
        },
        true
      );
    }

    // Calculate camera target angle and relative difference to character body
    let camAngle = bodyAngle;
    let camDiff = 0;

    if (!isFreeCamera && cameraDirection.lengthSq() > 0.001) {
      camAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
      camDiff = camAngle - bodyAngle;
      while (camDiff > Math.PI) camDiff -= Math.PI * 2;
      while (camDiff < -Math.PI) camDiff += Math.PI * 2;
    } else {
      isBodyCorrectingRef.current = false;
    }

    // Trigger lower body & leg realignment when camera reaches 180° threshold (~170°-180°)
    if (!isFreeCamera && Math.abs(camDiff) >= Math.PI * 0.92) {
      isBodyCorrectingRef.current = true;
    }
    if (Math.abs(camDiff) < 0.06) {
      isBodyCorrectingRef.current = false;
    }

    // Smoothly rotate hips & legs towards camera direction when 180° limit is reached
    if (!isFreeCamera && isBodyCorrectingRef.current && !isMoving) {
      const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), camAngle);
      group.current.quaternion.slerp(targetRotation, 7 * delta);
    }

    // Smoothly track head facing angle
    const targetHeadAngle = isMoving ? Math.atan2(moveVector.x, moveVector.z) : camAngle;
    headFacingRef.current = THREE.MathUtils.lerp(
      headFacingRef.current ?? bodyAngle,
      targetHeadAngle,
      8 * delta
    );

    // Compute relative face & shoulder yaw based on camera perspective
    const clampedCamDiff = THREE.MathUtils.clamp(camDiff, -Math.PI * 0.94, Math.PI * 0.94);
    const headYaw = clampedCamDiff * 0.55;       // Face / Head (55%)
    const shoulderYaw = clampedCamDiff * 0.35;   // Upper Chest & Shoulders Spine2 (35%)
    const spine1Yaw = clampedCamDiff * 0.15;     // Mid Spine1 (15%)

    // Natural Upright Standing Pose + Gentle Breathing
    idleTimeRef.current += delta * 2.2;
    const breath = Math.sin(idleTimeRef.current) * 0.012;
    const lerpSpeed = 10;

    const stanceW = standingPose?.stanceWidth ?? 0.015;
    const armSpr = standingPose?.armSpread ?? -0.36;
    const spineT = standingPose?.chestSpineTilt ?? 0.02;
    const headT = standingPose?.headTilt ?? 0;
    const kneeF = standingPose?.kneeFlex ?? 0.02;

    // Apply upper body, shoulders, and head rotation
    if (hips.current && initialHipsPos.current && !isMoving) {
      hips.current.position.y = THREE.MathUtils.lerp(hips.current.position.y, initialHipsPos.current.y + breath * 0.2, 8 * delta);
    }

    if (!isMoving) {
      if (activeIdleClip && activeIdleClip.keyframes.length > 0) {
        idleTimeRef.current += delta * 1.0;
        const clipTime = idleTimeRef.current % activeIdleClip.duration;
        const kfs = [...activeIdleClip.keyframes].sort((a, b) => a.time - b.time);

        let prev = kfs[0];
        let next = kfs[kfs.length - 1];

        for (let i = 0; i < kfs.length - 1; i++) {
          if (clipTime >= kfs[i].time && clipTime <= kfs[i + 1].time) {
            prev = kfs[i];
            next = kfs[i + 1];
            break;
          }
        }

        const duration = next.time - prev.time;
        const factor = duration > 0 ? (clipTime - prev.time) / duration : 0;
        const allBones = new Set([...Object.keys(prev.transforms), ...Object.keys(next.transforms)]);

        allBones.forEach((bName) => {
          const bone = scene.getObjectByName(bName) as THREE.Bone | null;
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
          const targetQ = initQ.clone().multiply(deltaQ);
          bone.quaternion.slerp(targetQ, Math.min(1, 12 * delta));
        });

        if (prev.positions || next.positions) {
          const allPosBones = new Set([
            ...Object.keys(prev.positions || {}),
            ...Object.keys(next.positions || {}),
          ]);
          allPosBones.forEach((bName) => {
            const bone = scene.getObjectByName(bName) as THREE.Bone | null;
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
      } else {
        setBoneRot(hips.current, 0, 0, 0, lerpSpeed);
        setBoneRot(spine.current, spineT + breath * 0.2, 0, 0, lerpSpeed);
        setBoneRot(spine1.current, 0.01 + breath * 0.15, spine1Yaw, 0, lerpSpeed);
        setBoneRot(spine2.current, 0.01 + breath * 0.1, shoulderYaw, 0, lerpSpeed);
        setBoneRot(head.current, headT, headYaw, 0, lerpSpeed);

        // Legs - Natural stance width & knee flex
        setBoneRot(rightLeg.current, 0, 0, -stanceW, lerpSpeed);
        setBoneRot(leftLeg.current, 0, 0, stanceW, lerpSpeed);
        setBoneRot(rightLegLower.current, kneeF, 0, 0, lerpSpeed);
        setBoneRot(leftLegLower.current, kneeF, 0, 0, lerpSpeed);
        setBoneRot(rightFoot.current, -kneeF * 0.5, 0, 0, lerpSpeed);
        setBoneRot(leftFoot.current, -kneeF * 0.5, 0, 0, lerpSpeed);

        // Arms & Shoulders - Follow camera direction with natural posture (isolated during single limb dragging)
        const draggedName = draggedBoneNameRef.current;
        const isRightArmDragged = isDragMode && draggedName && (draggedName.includes('RightArm') || draggedName.includes('RightForeArm') || draggedName.includes('RightHand'));
        const isLeftArmDragged = isDragMode && draggedName && (draggedName.includes('LeftArm') || draggedName.includes('LeftForeArm') || draggedName.includes('LeftHand'));

        if (!isRightArmDragged) {
          setBoneRot(rightArm.current, 0, shoulderYaw * 0.25, armSpr, lerpSpeed);
          setBoneRot(rightForeArm.current, 0.1, 0, 0, lerpSpeed);
        }
        if (!isLeftArmDragged) {
          setBoneRot(leftArm.current, 0, shoulderYaw * 0.25, -armSpr, lerpSpeed);
          setBoneRot(leftForeArm.current, 0.1, 0, 0, lerpSpeed);
        }

        // Apply any active custom standing pose bone rotations
        if (standingPose?.customBoneRotations) {
          Object.entries(standingPose.customBoneRotations).forEach(([bName, [rx, ry, rz]]) => {
            const b = scene.getObjectByName(bName) as THREE.Bone | null;
            if (b) {
              setBoneRot(b, (rx * Math.PI) / 180, (ry * Math.PI) / 180, (rz * Math.PI) / 180, lerpSpeed);
            }
          });
        }
      }
    }

    // 2. Real Human Flesh & Bone Self-Collision Solver (Active during bone dragging)
    if (isDragMode && draggedBoneNameRef.current && bonesMapRef.current.size > 0) {
      resolveLimbWrappingCollisions(bonesMapRef.current, draggedBoneNameRef.current);
    }

    // 3. Over-The-Right-Shoulder (OTS) Camera View & Camera Shake Controller (OrbitControls Compatible)
    const currentPos = rigidBody.current.translation();
    const playerWorldPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);

    // Calculate Organic Camera Shake (Breathing vs Walking Footsteps)
    let shakeY = 0;
    let shakeX = 0;
    const elapsedTime = state.clock.getElapsedTime();

    if (isMoving) {
      // Walking Footstep Shake: Vertical step bobbing & lateral step sway
      const stepPhase = elapsedTime * 10;
      shakeY = Math.sin(stepPhase) * 0.022;
      shakeX = Math.cos(stepPhase * 0.5) * 0.012;
    } else {
      // Idle Breathing Shake: Micro-sinusoidal chest sway
      const breathPhase = elapsedTime * 1.8;
      shakeY = Math.sin(breathPhase) * 0.005;
      shakeX = Math.cos(breathPhase * 0.7) * 0.003;
    }

    if (orbitControlsRef.current) {
      if (isFreeCamera && !hasInitFreeCamRef.current) {
        hasInitFreeCamRef.current = true;
        // Position camera directly in front of model face at eye level looking squarely at her face (World Y = 1.45m)
        camera.position.set(0, 1.45, 1.6);
        orbitControlsRef.current.target.set(0, 1.45, 0);
        orbitControlsRef.current.update();
      } else if (!isFreeCamera) {
        hasInitFreeCamRef.current = false;
        // Character Face Direction Vector & Right Vector
        const faceDir = new THREE.Vector3(0, 0, 1).applyQuaternion(group.current.quaternion);
        faceDir.y = 0;
        if (faceDir.lengthSq() > 0.001) faceDir.normalize();

        const faceRight = new THREE.Vector3(1, 0, 0).applyQuaternion(group.current.quaternion);
        faceRight.y = 0;
        if (faceRight.lengthSq() > 0.001) faceRight.normalize();

        // Target lookAt point directly in front of her right shoulder
        const lookAtTarget = playerWorldPos
          .clone()
          .add(new THREE.Vector3(0, 1.45 + shakeY, 0))
          .add(faceRight.clone().multiplyScalar(0.35 + shakeX))
          .add(faceDir.clone().multiplyScalar(1.2));

        // Fixed camera position locked right behind her right shoulder facing her look direction
        const idealCamPos = playerWorldPos
          .clone()
          .sub(faceDir.clone().multiplyScalar(2.2))
          .add(faceRight.clone().multiplyScalar(0.45))
          .add(new THREE.Vector3(0, 1.55 + shakeY, 0));

        camera.position.lerp(idealCamPos, Math.min(1, 8.0 * delta));
        orbitControlsRef.current.target.lerp(lookAtTarget, Math.min(1, 12 * delta));
        orbitControlsRef.current.update();
      }
    }
    lastPlayerPos.current = playerWorldPos.clone();

    // Check camera distance to player to detect close zoom
    const camDist = camera.position.distanceTo(playerWorldPos);
    const isClose = camDist < 1.85;
    if (onZoomChange && isZoomedCloseRef.current !== isClose) {
      isZoomedCloseRef.current = isClose;
      onZoomChange(isClose);
    }
  });

  const isDraggingBodyPartRef = useRef(false);
  const draggedBoneNameRef = useRef<string | null>(null);
  const dragPlaneRef = useRef(new THREE.Plane());

  // Listen to global pointer move and up events for smooth click-and-hold dragging
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingBodyPartRef.current || !draggedBoneNameRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const mouse = new THREE.Vector2(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const targetPos = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(dragPlaneRef.current, targetPos)) {
        rotateSingleHeldBoneToTarget(draggedBoneNameRef.current, targetPos);
      }
    };

    const handlePointerUp = () => {
      if (isDraggingBodyPartRef.current) {
        isDraggingBodyPartRef.current = false;
        draggedBoneNameRef.current = null;
        if (orbitControlsRef?.current) {
          orbitControlsRef.current.enabled = true;
        }
      }
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [camera, orbitControlsRef]);

  const rotateSingleHeldBoneToTarget = (bName: string, targetPos: THREE.Vector3) => {
    const boneObj = scene.getObjectByName(bName) as THREE.Bone | null;
    if (!boneObj) return;

    // Get current world position of the held bone
    const boneWorldPos = boneObj.getWorldPosition(new THREE.Vector3());
    const pullDir = targetPos.clone().sub(boneWorldPos).normalize();

    // Convert target world direction vector to bone's local coordinate space
    const parentWorldQ = new THREE.Quaternion();
    if (boneObj.parent) {
      boneObj.parent.getWorldQuaternion(parentWorldQ);
    }

    const localDir = pullDir.clone().applyQuaternion(parentWorldQ.clone().invert());
    const defaultLocalDir = new THREE.Vector3(0, 1, 0); // Default bone axis direction

    const targetLocalQ = new THREE.Quaternion().setFromUnitVectors(defaultLocalDir, localDir);
    boneObj.quaternion.slerp(targetLocalQ, 0.4);
  };

  return (
    <RigidBody
      ref={rigidBody}
      colliders={false}
      mass={1}
      position={[0, 1, 0]}
      lockRotations
      canSleep={false}
      friction={0.2}
    >
      <CapsuleCollider args={[0.5, 0.3]} position={[0, 0.8, 0]} />
      <group
        ref={group}
        dispose={null}
        position={[0, 0, 0]}
        onPointerDown={(e) => {
          if (!isDragMode) return;
          e.stopPropagation();

          const point = e.point;
          let closestBoneName = 'RightHand';
          let minDistance = Infinity;

          if (bonesMapRef.current.size > 0) {
            bonesMapRef.current.forEach((bone, bName) => {
              const bWorldPos = bone.getWorldPosition(new THREE.Vector3());
              const dist = bWorldPos.distanceTo(point);
              if (dist < minDistance) {
                minDistance = dist;
                closestBoneName = bName;
              }
            });
          } else {
            const clickedObject = e.object as any;
            const skeleton = clickedObject?.skeleton || (scene as any).getObjectByProperty('isSkinnedMesh', true)?.skeleton;
            if (skeleton?.bones) {
              skeleton.bones.forEach((bone: THREE.Bone) => {
                const bWorldPos = bone.getWorldPosition(new THREE.Vector3());
                const dist = bWorldPos.distanceTo(point);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestBoneName = bone.name;
                }
              });
            }
          }

          isDraggingBodyPartRef.current = true;
          draggedBoneNameRef.current = closestBoneName;

          // Set up camera-facing drag plane at clicked 3D point
          const planeNormal = camera.getWorldDirection(new THREE.Vector3()).negate();
          dragPlaneRef.current.setFromNormalAndCoplanarPoint(planeNormal, point);

          if (orbitControlsRef?.current) {
            orbitControlsRef.current.enabled = false;
          }
        }}
      >
        <primitive object={scene} />
        <SkeletonVisualizer root={scene} visible={showSkeleton} />

        {/* Minimalist Multi-Word Text Overlay Above Head with Chat History Icon */}
        {speechMessage && !hideHeadSpeech && (
          <Html position={[0, 2.35, 0]} center zIndexRange={[100, 0]}>
            <div className="text-slate-100 text-xs sm:text-sm font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] w-64 sm:w-80 text-center pointer-events-auto select-none px-3.5 py-2 bg-slate-950/90 rounded-xl border border-slate-800/90 backdrop-blur-md shadow-2xl flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-between w-full text-[9.5px] font-mono text-slate-400 border-b border-slate-800 pb-1">
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ava</span>
                </span>
                <button
                  onClick={onToggleHistory}
                  className="hover:text-blue-400 text-slate-400 bg-slate-800/80 hover:bg-slate-800 px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer font-bold"
                  title="Open Chat History"
                >
                  <History size={11} />
                  <span>History</span>
                </button>
              </div>
              <p dir="auto" className="leading-snug text-slate-100 whitespace-normal break-words w-full text-center">
                {speechMessage}
              </p>
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}

useGLTF.preload('/model.glb');


