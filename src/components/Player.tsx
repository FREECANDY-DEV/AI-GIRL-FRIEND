import { useGLTF, Html } from '@react-three/drei';
import { useFrame, useThree, useLoader } from '@react-three/fiber';
import { useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { SkeletonUtils, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { SkeletonVisualizer } from './SkeletonVisualizer';
import { StandingPoseConfig, AnimationClip } from '../types/animation';
import { solveTwoBoneIK, resolveLimbWrappingCollisions } from '../utils/humanPhysics';
import { History } from 'lucide-react';

// Global reference for other components to track the player's 3D world position
export const playerWorldPosition = new THREE.Vector3();

interface PlayerProps {
  joystickMove: { x: number; y: number };
  showSkeleton?: boolean;
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
  camHeight?: number;
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
  camHeight = 1.65,
}: PlayerProps) {
  const { camera, scene: globalScene } = useThree();
  const group = useRef<THREE.Group>(null);
  const rigidBody = useRef<RapierRigidBody>(null);
  const { scene: gltfScene } = useGLTF(`${import.meta.env.BASE_URL}model.glb`);
  const scene = useMemo(() => SkeletonUtils.clone(gltfScene), [gltfScene]);
  const leftFootprintTex = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}left_footprint.jpg`);
  const rightFootprintTex = useLoader(THREE.TextureLoader, `${import.meta.env.BASE_URL}right_footprint.jpg`);

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
  const rightHand = useRef<THREE.Bone | null>(null);
  const leftHand = useRef<THREE.Bone | null>(null);
  const neck = useRef<THREE.Bone | null>(null);
  const rightShoulder = useRef<THREE.Bone | null>(null);
  const leftShoulder = useRef<THREE.Bone | null>(null);
  const rightEye = useRef<THREE.Bone | null>(null);
  const leftEye = useRef<THREE.Bone | null>(null);

  const timeRef = useRef(0);
  const idleTimeRef = useRef(0);
  const clipTimeRef = useRef(0);
  const prevClipIdRef = useRef<string | null>(null);
  const initialQuaternions = useRef<Map<string, THREE.Quaternion>>(new Map());
  const initialPositions = useRef<Map<string, THREE.Vector3>>(new Map());
  const bonesMapRef = useRef<Map<string, THREE.Bone>>(new Map());
  const initialHipsPos = useRef<THREE.Vector3 | null>(null);
  const lastPlayerPos = useRef<THREE.Vector3 | null>(null);
  const isBodyCorrectingRef = useRef(false);
  const headFacingRef = useRef<number | null>(null);
  const isHeadCorrectingRef = useRef(false);
  const hasInitFreeCamRef = useRef(false);
  const hasInitOtsCamRef = useRef(false);
  const isZoomedCloseRef = useRef(false);
  const turnAnticipationRef = useRef({ isTurning: false, targetAngle: 0 });

  const ttsWordRef = useRef('');
  const ttsBoundaryTimeRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const isBlinkingRef = useRef(false);
  const blinkProgressRef = useRef(0);

  useEffect(() => {
    const onBoundary = (e: any) => {
      ttsWordRef.current = e.detail?.word || '';
      ttsBoundaryTimeRef.current = performance.now();
    };
    const onEnd = () => {
      ttsWordRef.current = '';
    };

    window.addEventListener('tts-word-boundary', onBoundary);
    window.addEventListener('tts-end', onEnd);
    return () => {
      window.removeEventListener('tts-word-boundary', onBoundary);
      window.removeEventListener('tts-end', onEnd);
    };
  }, []);



  const { rapier, world } = useRapier();
  const braceWeightsRef = useRef({ left: 0, right: 0 });

  // Footprints system
  const footprintsGroupRef = useRef<THREE.Group>(new THREE.Group());
  const lastStepDistRef = useRef(0);
  const stepSideRef = useRef(false);
  const footprintGeo = useMemo(() => {
    // The user's custom textures are oriented sideways (landscape),
    // so we use a landscape PlaneGeometry (Length, Width)
    const geo = new THREE.PlaneGeometry(0.32, 0.14);
    return geo;
  }, []);

  useEffect(() => {
    const group = footprintsGroupRef.current;
    if (globalScene) {
      globalScene.add(group);
    }
    return () => {
      if (globalScene) {
        globalScene.remove(group);
      }
    };
  }, [globalScene]);


  const applyBraceIK = (bName: string, deltaQ: THREE.Quaternion) => {
    const lw = braceWeightsRef.current.left;
    const rw = braceWeightsRef.current.right;

    if (lw > 0.01) {
      if (bName === 'LeftArm') {
        const braceQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-60 * Math.PI/180, 20 * Math.PI/180, 20 * Math.PI/180, 'YXZ'));
        deltaQ.slerp(braceQ, lw);
      } else if (bName === 'LeftForeArm') {
        const braceQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(70 * Math.PI/180, 0, 0, 'YXZ'));
        deltaQ.slerp(braceQ, lw);
      } else if (bName === 'LeftHand') {
        const braceQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * Math.PI/180, 0, 0, 'YXZ'));
        deltaQ.slerp(braceQ, lw);
      }
    }

    if (rw > 0.01) {
      if (bName === 'RightArm') {
        const braceQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-60 * Math.PI/180, -20 * Math.PI/180, -20 * Math.PI/180, 'YXZ'));
        deltaQ.slerp(braceQ, rw);
      } else if (bName === 'RightForeArm') {
        const braceQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(70 * Math.PI/180, 0, 0, 'YXZ'));
        deltaQ.slerp(braceQ, rw);
      } else if (bName === 'RightHand') {
        const braceQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(-40 * Math.PI/180, 0, 0, 'YXZ'));
        deltaQ.slerp(braceQ, rw);
      }
    }
  };

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
          if (bone.name === 'RightHand') rightHand.current = bone;
          if (bone.name === 'LeftHand') leftHand.current = bone;
          if (bone.name === 'Neck') neck.current = bone;
          if (bone.name === 'RightShoulder') rightShoulder.current = bone;
          if (bone.name === 'LeftShoulder') leftShoulder.current = bone;
          if (bone.name === 'RightEye') rightEye.current = bone;
          if (bone.name === 'LeftEye') leftEye.current = bone;
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
      rigidBody.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
      isBodyCorrectingRef.current = false;
      turnAnticipationRef.current.targetAngle = 0;
      if (group.current) {
        group.current.quaternion.identity();
      }
      hasInitFreeCamRef.current = false;
      hasInitOtsCamRef.current = false;
    }
  }, [resetTrigger]);

  useFrame((state, delta) => {
    if (!group.current || !rigidBody.current) return;

    // Update the global player position tracker for proximity sensors
    playerWorldPosition.copy(rigidBody.current.translation());

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

    // ----------------------------------------------------
    // Bracing Anticipation (Raycast for obstacles)
    // ----------------------------------------------------
    const originPos = rigidBody.current.translation();
    const braceOrigin = new THREE.Vector3(originPos.x, originPos.y + 1.2, originPos.z);
    // Use the current physical body angle to determine forward
    const braceYaw = group.current.rotation.y;
    
    const maxRayDist = 0.7; // Check 70cm ahead
    const capsuleRadius = 0.55; // Start just outside the capsule to avoid self-collision

    // Left ray (angled slightly left)
    const dirLeft = new THREE.Vector3(Math.sin(braceYaw + 0.35), 0, Math.cos(braceYaw + 0.35)).normalize();
    const startLeft = braceOrigin.clone().add(dirLeft.clone().multiplyScalar(capsuleRadius));
    const rayLeft = new rapier.Ray(startLeft, dirLeft);
    const hitLeft = world.castRay(rayLeft, maxRayDist, true);
    
    // Right ray (angled slightly right)
    const dirRight = new THREE.Vector3(Math.sin(braceYaw - 0.35), 0, Math.cos(braceYaw - 0.35)).normalize();
    const startRight = braceOrigin.clone().add(dirRight.clone().multiplyScalar(capsuleRadius));
    const rayRight = new rapier.Ray(startRight, dirRight);
    const hitRight = world.castRay(rayRight, maxRayDist, true);

    // Target weights
    const targetLWeight = hitLeft && (hitLeft as any).toi < maxRayDist ? 1.0 - ((hitLeft as any).toi / maxRayDist) : 0;
    const targetRWeight = hitRight && (hitRight as any).toi < maxRayDist ? 1.0 - ((hitRight as any).toi / maxRayDist) : 0;

    braceWeightsRef.current.left = THREE.MathUtils.lerp(braceWeightsRef.current.left, targetLWeight, 12 * delta);
    braceWeightsRef.current.right = THREE.MathUtils.lerp(braceWeightsRef.current.right, targetRWeight, 12 * delta);

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
      const speed = 2.2;
      const targetBodyAngle = Math.atan2(moveVector.x, moveVector.z);

      let angleDiff = targetBodyAngle - bodyAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Only enter turning state if completely reversing direction (e.g., > 140 degrees / 2.5 rads)
      // This prevents the walking animation from stuttering/pausing during normal steering
      if (Math.abs(angleDiff) > 2.5 && !turnAnticipationRef.current.isTurning) {
        turnAnticipationRef.current.isTurning = true;
      }
      
      turnAnticipationRef.current.targetAngle = targetBodyAngle;

      if (turnAnticipationRef.current.isTurning) {
        // Halt physical velocity while doing the anticipation turn
        rigidBody.current.setLinvel({ x: 0, y: rigidBody.current.linvel().y, z: 0 }, true);

        // Slowly pivot the hips/root to follow the turn
        const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), turnAnticipationRef.current.targetAngle);
        group.current.quaternion.slerp(targetRotation, 5 * delta); // Slower pivot

        // If body is close enough to target angle, end the turn anticipation and start walking
        let hipsDiff = turnAnticipationRef.current.targetAngle - bodyAngle;
        while (hipsDiff > Math.PI) hipsDiff -= Math.PI * 2;
        while (hipsDiff < -Math.PI) hipsDiff += Math.PI * 2;

        if (Math.abs(hipsDiff) < 0.25) {
          turnAnticipationRef.current.isTurning = false;
        }
      } else {
        // Normal walking
        rigidBody.current.setLinvel(
          {
            x: moveVector.x * speed,
            y: rigidBody.current.linvel().y,
            z: moveVector.z * speed,
          },
          true
        );

        // Spawn footprints
        lastStepDistRef.current += speed * delta;
        if (lastStepDistRef.current > 0.8) {
          lastStepDistRef.current = 0;
          stepSideRef.current = !stepSideRef.current;

          if (footprintsGroupRef.current) {
            // Force a wide stance offset to visibly split left and right footprints
            const sideOffset = stepSideRef.current ? 0.18 : -0.18;
            const offsetX = Math.cos(bodyAngle) * sideOffset;
            const offsetZ = -Math.sin(bodyAngle) * sideOffset;
            
            const originPos = rigidBody.current.translation();
            const pos = new THREE.Vector3(originPos.x, 0.02, originPos.z);
            
            // Apply side offset
            pos.x += offsetX;
            pos.z += offsetZ;
            
            // Shift backwards slightly to align with heels instead of center mass
            const backOffset = 0.1;
            pos.x -= Math.sin(bodyAngle) * backOffset;
            pos.z -= Math.cos(bodyAngle) * backOffset;

            const currentFootTex = stepSideRef.current ? rightFootprintTex : leftFootprintTex;

            const mesh = new THREE.Mesh(
              footprintGeo,
              new THREE.MeshBasicMaterial({ 
                color: new THREE.Color('#06b6d4'),
                transparent: true, 
                opacity: 0.8, 
                alphaMap: currentFootTex,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
              })
            );
            mesh.rotation.x = -Math.PI / 2;
            // The texture is oriented sideways, so subtract 90 degrees (Math.PI / 2) 
            // so the toe points in the direction the character is facing
            mesh.rotation.z = -bodyAngle - Math.PI / 2;
            // Removed scale.x mirroring since we now have dedicated left/right textures
            mesh.position.copy(pos);
            footprintsGroupRef.current.add(mesh);
          }
        }

        // Keyboard movement directly controls hips & legs rotation
        const targetRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetBodyAngle);
        group.current.quaternion.slerp(targetRotation, 14 * delta);
      }

      // Evaluate Keyframe-based Walk Clip or Procedural Walk Cycle
      if (activeWalkClip && activeWalkClip.keyframes.length > 0) {
        // Pause the walk cycle animation while doing a sharp staggered turn
        if (!turnAnticipationRef.current.isTurning) {
          timeRef.current += delta * 0.8;
        }
        const clipTime = timeRef.current % activeWalkClip.duration;
        const kfs = [...activeWalkClip.keyframes].sort((a, b) => a.time - b.time);

        let prev = kfs[0];
        let next = kfs[0];
        let factor = 0;
        
        const lastKfTime = kfs[kfs.length - 1].time;

        if (clipTime >= lastKfTime) {
          // Seamlessly interpolate from the last keyframe back to the first one
          prev = kfs[kfs.length - 1];
          next = kfs[0];
          const timePastLast = clipTime - lastKfTime;
          const gapDuration = activeWalkClip.duration - lastKfTime;
          factor = gapDuration > 0 ? timePastLast / gapDuration : 0;
        } else {
          for (let i = 0; i < kfs.length - 1; i++) {
            if (clipTime >= kfs[i].time && clipTime < kfs[i + 1].time) {
              prev = kfs[i];
              next = kfs[i + 1];
              const duration = next.time - prev.time;
              factor = duration > 0 ? (clipTime - prev.time) / duration : 0;
              break;
            }
          }
        }
        const allBones = new Set([...Object.keys(prev.transforms), ...Object.keys(next.transforms)]);

        allBones.forEach((bName) => {
          if (isDragMode && draggedBoneNameRef.current) {
            const draggedName = draggedBoneNameRef.current;
            const isRightArmDragged = draggedName.includes('RightArm') || draggedName.includes('RightForeArm') || draggedName.includes('RightHand');
            const isLeftArmDragged = draggedName.includes('LeftArm') || draggedName.includes('LeftForeArm') || draggedName.includes('LeftHand');
            
            if (isRightArmDragged && (bName.includes('RightArm') || bName.includes('RightForeArm') || bName.includes('RightHand'))) return;
            if (isLeftArmDragged && (bName.includes('LeftArm') || bName.includes('LeftForeArm') || bName.includes('LeftHand'))) return;
            if (bName === draggedName) return;
          }

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
          applyBraceIK(bName, deltaQ);
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

      if (turnAnticipationRef.current.isTurning && head.current && spine2.current && spine1.current) {
        let turnDiff = turnAnticipationRef.current.targetAngle - bodyAngle;
        while (turnDiff > Math.PI) turnDiff -= Math.PI * 2;
        while (turnDiff < -Math.PI) turnDiff += Math.PI * 2;
        
        const clampedTurnDiff = THREE.MathUtils.clamp(turnDiff, -Math.PI * 0.8, Math.PI * 0.8);
        
        // Head snaps quickly to look at the new direction
        const headYaw = clampedTurnDiff * 0.8;
        const headTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(head.current.rotation.x, headYaw, head.current.rotation.z, 'YXZ'));
        head.current.quaternion.slerp(headTarget, 16 * delta);
        
        // Spine/Shoulders follow the head slightly slower
        const shoulderYaw = clampedTurnDiff * 0.5;
        const spine2Target = new THREE.Quaternion().setFromEuler(new THREE.Euler(spine2.current.rotation.x, shoulderYaw, spine2.current.rotation.z, 'YXZ'));
        spine2.current.quaternion.slerp(spine2Target, 10 * delta);
        
        const spine1Yaw = clampedTurnDiff * 0.3;
        const spine1Target = new THREE.Quaternion().setFromEuler(new THREE.Euler(spine1.current.rotation.x, spine1Yaw, spine1.current.rotation.z, 'YXZ'));
        spine1.current.quaternion.slerp(spine1Target, 6 * delta);
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

    // Process Footprints Fading
    if (footprintsGroupRef.current) {
      for (let i = footprintsGroupRef.current.children.length - 1; i >= 0; i--) {
        const mesh = footprintsGroupRef.current.children[i] as THREE.Mesh;
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity -= delta * 0.1; // Fade out over ~10 seconds
        if (mat.opacity <= 0) {
          footprintsGroupRef.current.remove(mesh);
          mat.dispose();
        }
      }
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

    if (isMoving) {
      isBodyCorrectingRef.current = false;
    }

    // Trigger lower body & leg realignment when camera reaches 180° threshold (~170°-180°)
    if (!isFreeCamera && Math.abs(camDiff) >= Math.PI * 0.92 && !isMoving) {
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
      const prevClipId = prevClipIdRef.current;
      if (activeIdleClip && activeIdleClip.id !== prevClipId) {
        clipTimeRef.current = 0; // Reset clip time when switching animations
        prevClipIdRef.current = activeIdleClip.id;
      }

      if (activeIdleClip && activeIdleClip.keyframes.length > 0) {
        // Use a dedicated clip time ref so we don't interfere with the breathing sine wave
        clipTimeRef.current += delta * 1.0;
        const clipTime = clipTimeRef.current % activeIdleClip.duration;
        const kfs = [...activeIdleClip.keyframes].sort((a, b) => a.time - b.time);

        let prev = kfs[0];
        let next = kfs[0];
        let factor = 0;
        
        const lastKfTime = kfs[kfs.length - 1].time;

        if (clipTime >= lastKfTime) {
          // Seamlessly interpolate from the last keyframe back to the first one
          prev = kfs[kfs.length - 1];
          next = kfs[0];
          const timePastLast = clipTime - lastKfTime;
          const gapDuration = activeIdleClip.duration - lastKfTime;
          factor = gapDuration > 0 ? timePastLast / gapDuration : 0;
        } else {
          for (let i = 0; i < kfs.length - 1; i++) {
            if (clipTime >= kfs[i].time && clipTime < kfs[i + 1].time) {
              prev = kfs[i];
              next = kfs[i + 1];
              const duration = next.time - prev.time;
              factor = duration > 0 ? (clipTime - prev.time) / duration : 0;
              break;
            }
          }
        }
        const allBones = new Set([...Object.keys(prev.transforms), ...Object.keys(next.transforms)]);

        allBones.forEach((bName) => {
          if (isDragMode && draggedBoneNameRef.current) {
            const draggedName = draggedBoneNameRef.current;
            const isRightArmDragged = draggedName.includes('RightArm') || draggedName.includes('RightForeArm') || draggedName.includes('RightHand');
            const isLeftArmDragged = draggedName.includes('LeftArm') || draggedName.includes('LeftForeArm') || draggedName.includes('LeftHand');
            
            if (isRightArmDragged && (bName.includes('RightArm') || bName.includes('RightForeArm') || bName.includes('RightHand'))) return;
            if (isLeftArmDragged && (bName.includes('LeftArm') || bName.includes('LeftForeArm') || bName.includes('LeftHand'))) return;
            if (bName === draggedName) return;
          }

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
          applyBraceIK(bName, deltaQ);
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
          setBoneRot(rightHand.current, 0, 0, 0, lerpSpeed);
        }
        if (!isLeftArmDragged) {
          setBoneRot(leftArm.current, 0, shoulderYaw * 0.25, -armSpr, lerpSpeed);
          setBoneRot(leftForeArm.current, 0.1, 0, 0, lerpSpeed);
          setBoneRot(leftHand.current, 0, 0, 0, lerpSpeed);
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

      // ALWAYS recover head/neck/shoulders/eyes when not explicitly driven by an animation clip
      const clipBones = (activeIdleClip && activeIdleClip.keyframes.length > 0) 
        ? new Set(activeIdleClip.keyframes.flatMap(k => Object.keys(k.transforms))) 
        : new Set();

      if (!clipBones.has('Neck')) setBoneRot(neck.current, 0, 0, 0, lerpSpeed);
      if (!clipBones.has('RightShoulder')) setBoneRot(rightShoulder.current, 0, 0, 0, lerpSpeed);
      if (!clipBones.has('LeftShoulder')) setBoneRot(leftShoulder.current, 0, 0, 0, lerpSpeed);
      if (!clipBones.has('RightEye')) setBoneRot(rightEye.current, 0, 0, 0, lerpSpeed);
      if (!clipBones.has('LeftEye')) setBoneRot(leftEye.current, 0, 0, 0, lerpSpeed);
    }

      // Apply procedural camera look-at tracking ON TOP of any idle/walking animation
      // Only do this if not in free camera and if we aren't actively correcting the body
      if (!isFreeCamera && !isBodyCorrectingRef.current && !isMoving && head.current && spine2.current && spine1.current) {
        // Use slerp to blend the animation's rotation with the target look rotation
        const headTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(head.current.rotation.x, headYaw, head.current.rotation.z, 'YXZ'));
        head.current.quaternion.slerp(headTarget, 8 * delta);

        const spine2Target = new THREE.Quaternion().setFromEuler(new THREE.Euler(spine2.current.rotation.x, shoulderYaw, spine2.current.rotation.z, 'YXZ'));
        spine2.current.quaternion.slerp(spine2Target, 6 * delta);

        const spine1Target = new THREE.Quaternion().setFromEuler(new THREE.Euler(spine1.current.rotation.x, spine1Yaw, spine1.current.rotation.z, 'YXZ'));
        spine1.current.quaternion.slerp(spine1Target, 4 * delta);
      } else if (isFreeCamera && head.current && neck.current && spine2.current && !isMoving) {
        // In free camera, make the head and eyes follow the exact 3D mouse cursor location!
        // Calculate a target point on the camera's plane to perfectly track the mouse
        // without projecting behind the character.
        const headPos = head.current.getWorldPosition(new THREE.Vector3());
        
        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
        
        // Scale the mouse offset by distance so the tracking remains accurate when zooming
        const dist = camera.position.distanceTo(headPos);
        const mouseWorld = camera.position.clone()
          .add(camRight.multiplyScalar(state.pointer.x * dist * 0.8))
          .add(camUp.multiplyScalar(state.pointer.y * dist * 0.8));
        
        // Calculate the vector from the character's head to that 3D mouse point
        const headToMouse = mouseWorld.sub(headPos).normalize();
        
        // Calculate the world yaw and pitch required to look at the mouse
        const targetWorldYaw = Math.atan2(headToMouse.x, headToMouse.z);
        const targetWorldPitch = Math.asin(headToMouse.y);
        
        // Convert world yaw to character-local yaw
        const charBodyYaw = group.current?.rotation.y || 0;
        let localYaw = targetWorldYaw - charBodyYaw;
        
        // Normalize angle to -PI to PI
        while (localYaw > Math.PI) localYaw -= Math.PI * 2;
        while (localYaw < -Math.PI) localYaw += Math.PI * 2;
        
        // --- DEADZONE IK SYSTEM ---
        // Human anatomy: eyes move first for small angles, head turns for large angles.
        const maxEyeYaw = 0.25; // ~14 degrees deadzone before head turns
        const maxEyePitch = 0.15; // ~8 degrees deadzone before head tilts
        
        let headYawDemand = 0;
        if (localYaw > maxEyeYaw) headYawDemand = localYaw - maxEyeYaw;
        else if (localYaw < -maxEyeYaw) headYawDemand = localYaw + maxEyeYaw;
        
        let headPitchDemand = 0;
        if (targetWorldPitch > maxEyePitch) headPitchDemand = targetWorldPitch - maxEyePitch;
        else if (targetWorldPitch < -maxEyePitch) headPitchDemand = targetWorldPitch + maxEyePitch;
        
        // Clamp head limits
        const finalHeadYaw = THREE.MathUtils.clamp(headYawDemand, -Math.PI / 2.5, Math.PI / 2.5);
        const finalHeadPitch = THREE.MathUtils.clamp(headPitchDemand, -0.6, 0.6);

        // Split head rotation across neck and head bones for a natural curve
        const headTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(-finalHeadPitch * 0.6, finalHeadYaw * 0.6, head.current.rotation.z, 'YXZ'));
        head.current.quaternion.slerp(headTarget, 12 * delta);

        const neckTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(-finalHeadPitch * 0.4, finalHeadYaw * 0.4, neck.current.rotation.z, 'YXZ'));
        neck.current.quaternion.slerp(neckTarget, 10 * delta);
        
        // Make the eyes track the exact remainder of the angle
        if (rightEye.current && leftEye.current) {
          // Eyes take exactly the rotation the head didn't cover
          const requiredEyeYaw = localYaw - finalHeadYaw;
          const requiredEyePitch = targetWorldPitch - finalHeadPitch;
          
          const finalEyeYaw = THREE.MathUtils.clamp(requiredEyeYaw, -0.8, 0.8);
          const finalEyePitch = THREE.MathUtils.clamp(-requiredEyePitch, -0.6, 0.6); // Pitch inverted for Mixamo eye bones
          
          const eyeTarget = new THREE.Quaternion().setFromEuler(new THREE.Euler(finalEyePitch, finalEyeYaw, 0, 'YXZ'));
          rightEye.current.quaternion.slerp(eyeTarget, 20 * delta);
          leftEye.current.quaternion.slerp(eyeTarget, 20 * delta);
        }
      }

      // 2. Real Human Flesh & Bone Self-Collision Solver (Active during bone dragging)
    if (isDragMode && draggedBoneNameRef.current && bonesMapRef.current.size > 0) {
      resolveLimbWrappingCollisions(bonesMapRef.current, draggedBoneNameRef.current);
    }

    // 2.5 Dynamic Lip Sync for TTS Speech
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const isSpeaking = window.speechSynthesis.speaking && speechMessage;
      const headMesh = scene.getObjectByName('Wolf3D_Head') as THREE.Mesh;
      const teethMesh = scene.getObjectByName('Wolf3D_Teeth') as THREE.Mesh;
      
      if (headMesh && headMesh.morphTargetDictionary && headMesh.morphTargetInfluences) {
        const jawOpenIdx = headMesh.morphTargetDictionary['jawOpen'];
        const mouthOpenIdx = headMesh.morphTargetDictionary['mouthOpen'];
        
        let targetIntensity = 0;
        if (isSpeaking) {
          const now = performance.now();
          const timeSinceBoundary = (now - ttsBoundaryTimeRef.current) / 1000;
          const currentWord = ttsWordRef.current;
          
          if (timeSinceBoundary < 0.3 && currentWord.length > 0) {
             const wordLen = currentWord.length;
             const hasVowel = /[aeiouAEIOU]/.test(currentWord);
             const baseOpen = hasVowel ? 0.6 : 0.3;
             
             // Flap using sine wave scaled by word length to simulate syllable pulses
             const flap = (Math.sin(timeSinceBoundary * Math.PI * (wordLen > 4 ? 14 : 22)) + 1) * 0.5;
             targetIntensity = baseOpen * flap * (0.8 + Math.random() * 0.2);
          } else {
             // Closed or slight pause between words
             targetIntensity = 0.02;
          }
        }

        if (jawOpenIdx !== undefined) {
          headMesh.morphTargetInfluences[jawOpenIdx] = THREE.MathUtils.lerp(headMesh.morphTargetInfluences[jawOpenIdx], targetIntensity, 0.3);
        }
        if (mouthOpenIdx !== undefined) {
          headMesh.morphTargetInfluences[mouthOpenIdx] = THREE.MathUtils.lerp(headMesh.morphTargetInfluences[mouthOpenIdx], targetIntensity * 0.6, 0.3);
        }
        
        if (teethMesh && teethMesh.morphTargetDictionary && teethMesh.morphTargetInfluences) {
           const tJawOpen = teethMesh.morphTargetDictionary['jawOpen'];
           if (tJawOpen !== undefined) {
             teethMesh.morphTargetInfluences[tJawOpen] = THREE.MathUtils.lerp(teethMesh.morphTargetInfluences[tJawOpen], targetIntensity, 0.3);
           }
        }
      }

      // 2.6 Random Eye Blinking
      const headMeshBlink = scene.getObjectByName('Wolf3D_Head') as THREE.Mesh;
      if (headMeshBlink && headMeshBlink.morphTargetDictionary && headMeshBlink.morphTargetInfluences) {
        const blinkLeftIdx = headMeshBlink.morphTargetDictionary['eyeBlinkLeft'];
        const blinkRightIdx = headMeshBlink.morphTargetDictionary['eyeBlinkRight'];

        if (blinkLeftIdx !== undefined && blinkRightIdx !== undefined) {
          blinkTimerRef.current -= delta;

          if (blinkTimerRef.current <= 0 && !isBlinkingRef.current) {
            // Start a blink
            isBlinkingRef.current = true;
            blinkProgressRef.current = 0;
            // Set next blink timer between 2 and 6 seconds
            blinkTimerRef.current = 2.0 + Math.random() * 4.0;
          }

          if (isBlinkingRef.current) {
            // Blink animation (down and up) takes about 0.15 seconds
            blinkProgressRef.current += delta * 12.0; // Speed of blink

            let blinkValue = 0;
            if (blinkProgressRef.current < 0.5) {
               // Closing eyes
               blinkValue = blinkProgressRef.current * 2.0;
            } else if (blinkProgressRef.current < 1.0) {
               // Opening eyes
               blinkValue = 1.0 - ((blinkProgressRef.current - 0.5) * 2.0);
            } else {
               // Done blinking
               blinkValue = 0;
               isBlinkingRef.current = false;
               
               // 15% chance to do a double blink
               if (Math.random() < 0.15) {
                 blinkTimerRef.current = 0.1;
               }
            }

            headMeshBlink.morphTargetInfluences[blinkLeftIdx] = blinkValue;
            headMeshBlink.morphTargetInfluences[blinkRightIdx] = blinkValue;
          }
        }
      }
    }

    // 3. Over-The-Right-Shoulder (OTS) Camera View & Camera Shake Controller (OrbitControls Compatible)
    const currentPos = rigidBody.current.translation();
    // Use the visually interpolated position of the model group, NOT the raw physics body,
    // to prevent high-frequency physics tick micro-stuttering on high refresh rate screens!
    const playerWorldPos = new THREE.Vector3();
    if (group.current) {
      group.current.getWorldPosition(playerWorldPos);
    } else {
      playerWorldPos.set(currentPos.x, currentPos.y, currentPos.z);
    }

    // Calculate Organic Camera Shake (Breathing vs Walking Footsteps)
    let shakeY = 0;
    let shakeX = 0;
    const elapsedTime = state.clock.getElapsedTime();

    if (isMoving && !isFreeCamera) {
      // Walking Shake removed per user request
      shakeY = 0;
      shakeX = 0;
    } else {
      // Idle Breathing Shake: Micro-sinusoidal chest sway
      const breathPhase = elapsedTime * 1.8;
      shakeY = Math.sin(breathPhase) * 0.005;
      shakeX = Math.cos(breathPhase * 0.7) * 0.003;
    }

    if (orbitControlsRef.current) {
      orbitControlsRef.current.enableDamping = isFreeCamera;

      if (isFreeCamera && !hasInitFreeCamRef.current) {
        hasInitOtsCamRef.current = false;
        // Smoothly position camera directly in front of model face at eye level
        const targetPos = new THREE.Vector3(0, camHeight, 1.6);
        const targetLookAt = new THREE.Vector3(0, camHeight, 0);
        
        camera.position.lerp(targetPos, Math.min(1, 1.5 * delta));
        orbitControlsRef.current.target.lerp(targetLookAt, Math.min(1, 1.5 * delta));
        
        if (camera.position.distanceToSquared(targetPos) < 0.05) {
          hasInitFreeCamRef.current = true;
        }
        orbitControlsRef.current.update();
      } else if (!isFreeCamera) {
        hasInitFreeCamRef.current = false;

        if (!hasInitOtsCamRef.current) {
          // Smoothly move camera behind the character when toggling to OTS
          const charYaw = group.current?.rotation.y || 0;
          const radius = 2.5;
          const camX = playerWorldPos.x + Math.sin(charYaw + Math.PI) * radius;
          const camZ = playerWorldPos.z + Math.cos(charYaw + Math.PI) * radius;
          const targetCamPos = new THREE.Vector3(camX, playerWorldPos.y + camHeight, camZ);
          
          camera.position.lerp(targetCamPos, Math.min(1, 1.5 * delta));
          
          // Complete the transition if we are close enough, OR if the player starts moving!
          // This prevents an eternal lag bug where the transition never finishes because the target is running away.
          if (camera.position.distanceToSquared(targetCamPos) < 0.05 || isMoving) {
            hasInitOtsCamRef.current = true;
          }
        }

        const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        camRight.y = 0;
        if (camRight.lengthSq() > 0.001) camRight.normalize();

        // Target lookAt point is offset to the right of the character (from camera's perspective)
        // This puts the character on the left side of the screen (Over The Right Shoulder)
        const lookAtTarget = playerWorldPos
          .clone()
          .add(new THREE.Vector3(0, camHeight + shakeY, 0))
          .add(camRight.multiplyScalar(0.4 + shakeX));

        if (!hasInitOtsCamRef.current) {
          orbitControlsRef.current.target.lerp(lookAtTarget, Math.min(1, 1.5 * delta));
        } else {
          // If the target moves without the camera moving, OrbitControls will think the user zoomed out.
          // To perfectly lock the camera distance, we must move the camera by the exact same delta as the target!
          const prevTarget = orbitControlsRef.current.target.clone();
          orbitControlsRef.current.target.copy(lookAtTarget);
          const targetDelta = lookAtTarget.clone().sub(prevTarget);
          camera.position.add(targetDelta);
        }
        
        // Auto-follow camera: rotate camera to align with movement direction always
        if (isMoving) {
          // Use orbitControls target instead of lookAtTarget to prevent fighting OrbitControls internal state
          const target = orbitControlsRef.current.target;
          const offset = camera.position.clone().sub(target);
          const currentAzimuth = Math.atan2(offset.x, offset.z);
          
          const moveAzimuth = Math.atan2(moveVector.x, moveVector.z);
          let targetAzimuth = moveAzimuth + Math.PI; // Camera should be behind the movement direction
          
          let deltaAzimuth = targetAzimuth - currentAzimuth;
          while (deltaAzimuth > Math.PI) deltaAzimuth -= Math.PI * 2;
          while (deltaAzimuth < -Math.PI) deltaAzimuth += Math.PI * 2;
          
          // Smooth rotation speed, scales with movement magnitude
          const rotationSpeed = 3.5 * delta * Math.min(1, Math.abs(joystickMove.x) + Math.abs(joystickMove.y));
          
          if (Math.abs(deltaAzimuth) > 0.01) {
            const currentPolar = orbitControlsRef.current.getPolarAngle();
            const currentDist = orbitControlsRef.current.getDistance();
            
            const newAzimuth = currentAzimuth + deltaAzimuth * rotationSpeed;
            
            // Set spherical relative to the CURRENT target
            const sph = new THREE.Spherical(currentDist, currentPolar, newAzimuth);
            camera.position.copy(target).add(new THREE.Vector3().setFromSpherical(sph));
            orbitControlsRef.current.update();
          }
        }

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
        handleBoneDragIK(draggedBoneNameRef.current, targetPos);
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

  const handleBoneDragIK = (bName: string, targetPos: THREE.Vector3) => {
    const boneObj = scene.getObjectByName(bName) as THREE.Bone | null;
    if (!boneObj) return;

    // Identify if the dragged bone is part of an IK limb chain
    let rootName: string | null = null;
    let middleName: string | null = null;

    if (bName.includes('Hand') || bName.includes('Foot') || bName.includes('ForeArm') || bName.includes('Leg')) {
      if (bName.includes('LeftArm') || bName.includes('LeftForeArm') || bName.includes('LeftHand')) {
        rootName = 'LeftArm'; middleName = 'LeftForeArm';
      } else if (bName.includes('RightArm') || bName.includes('RightForeArm') || bName.includes('RightHand')) {
        rootName = 'RightArm'; middleName = 'RightForeArm';
      } else if (bName.includes('LeftUpLeg') || bName.includes('LeftLeg') || bName.includes('LeftFoot')) {
        rootName = 'LeftUpLeg'; middleName = 'LeftLeg';
      } else if (bName.includes('RightUpLeg') || bName.includes('RightLeg') || bName.includes('RightFoot')) {
        rootName = 'RightUpLeg'; middleName = 'RightLeg';
      }
    }

    // If we grabbed an arm/leg bone, pull the ROOT (Shoulder/Hip) towards the target
    // This creates a highly natural look where the entire limb aims at the mouse, rather than just the wrist twisting.
    if (rootName && middleName && (bName.includes('Hand') || bName.includes('Foot') || bName.includes('ForeArm') || bName.includes('Leg'))) {
      const rootBone = scene.getObjectByName(rootName) as THREE.Bone;
      if (rootBone) {
        const rootWorldPos = rootBone.getWorldPosition(new THREE.Vector3());
        const pullDir = targetPos.clone().sub(rootWorldPos).normalize();
        
        const parentWorldQ = new THREE.Quaternion();
        if (rootBone.parent) rootBone.parent.getWorldQuaternion(parentWorldQ);
        
        const localDir = pullDir.clone().applyQuaternion(parentWorldQ.clone().invert());
        const defaultLocalDir = new THREE.Vector3(0, 1, 0); // Mixamo limbs point down +Y locally
        
        // Slerp the ROOT bone towards the target
        const targetLocalQ = new THREE.Quaternion().setFromUnitVectors(defaultLocalDir, localDir);
        rootBone.quaternion.slerp(targetLocalQ, 0.5);
        
        // Optionally add a slight natural bend to the elbow/knee
        const middleBone = scene.getObjectByName(middleName) as THREE.Bone;
        if (middleBone) {
          // Mixamo elbows usually bend on +Z or +X. Let's apply a slight natural flex.
          const flexAxis = bName.includes('Leg') ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
          const flexQ = new THREE.Quaternion().setFromAxisAngle(flexAxis, 0.4);
          // Slerp towards a slightly flexed resting state so the limb doesn't look completely rigid
          middleBone.quaternion.slerp(flexQ, 0.2);
        }
        return;
      }
    }

    // Fallback for Torso, Head: Standard directional pull
    // Prevent dragging shoulders as it breaks the mesh topology
    if (bName.includes('Shoulder')) return;

    const boneWorldPos = boneObj.getWorldPosition(new THREE.Vector3());
    const pullDir = targetPos.clone().sub(boneWorldPos).normalize();

    const parentWorldQ = new THREE.Quaternion();
    if (boneObj.parent) {
      boneObj.parent.getWorldQuaternion(parentWorldQ);
    }

    const localDir = pullDir.clone().applyQuaternion(parentWorldQ.clone().invert());
    const defaultLocalDir = new THREE.Vector3(0, 1, 0);

    const targetLocalQ = new THREE.Quaternion().setFromUnitVectors(defaultLocalDir, localDir);
    boneObj.quaternion.slerp(targetLocalQ, 0.6);
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
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (isFreeCamera) {
            const ouchSound = new Audio(`${import.meta.env.BASE_URL}ouch.wav`);
            ouchSound.volume = 0.6;
            ouchSound.play().catch(err => console.error("Could not play sound", err));
          }
        }}
        onPointerDown={(e) => {
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

          // Apply physical poke/flinch reaction
          const clickedBone = scene.getObjectByName(closestBoneName) as THREE.Bone | null;
          if (clickedBone) {
            // Instantly bump the bone backwards relative to camera view
            // Use smaller force for core/shoulder bones so it doesn't twist the mesh inside out
            let forceMagnitude = 0.5;
            if (closestBoneName.includes('Shoulder') || closestBoneName.includes('Spine') || closestBoneName.includes('Neck') || closestBoneName.includes('Head')) {
              forceMagnitude = 0.1;
            }
            
            const pushAxis = new THREE.Vector3(1, 0, 0); // Local axis that bends limbs backwards
            const pushForce = new THREE.Quaternion().setFromAxisAngle(pushAxis, forceMagnitude);
            clickedBone.quaternion.multiply(pushForce);

            // Also bump the middle joint if it's an IK chain (makes limbs flinch naturally)
            if (closestBoneName.includes('Hand') || closestBoneName.includes('Foot')) {
              const midName = closestBoneName.replace('Hand', 'ForeArm').replace('Foot', 'Leg');
              const midBone = scene.getObjectByName(midName) as THREE.Bone | null;
              if (midBone) midBone.quaternion.multiply(pushForce);
            }
          }

          // If not in drag mode, we just poke and return so it smoothly recovers!
          if (!isDragMode) return;

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

useGLTF.preload(`${import.meta.env.BASE_URL}model.glb`);


