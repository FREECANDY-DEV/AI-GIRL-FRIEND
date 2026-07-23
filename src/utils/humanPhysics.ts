import * as THREE from 'three';

export interface JointLimit {
  minDeg: [number, number, number]; // [X, Y, Z] min euler degrees
  maxDeg: [number, number, number]; // [X, Y, Z] max euler degrees
  description: string;
}

// Anatomical Range of Motion (ROM) Limits for Human Joints
export const ANATOMICAL_JOINT_LIMITS: Record<string, JointLimit> = {
  // Head & Neck
  Head: { minDeg: [-40, -75, -30], maxDeg: [40, 75, 30], description: 'Head pitch, turn, and tilt' },
  Neck: { minDeg: [-30, -45, -25], maxDeg: [30, 45, 25], description: 'Neck flexion/extension' },

  // Spine & Torso
  Spine2: { minDeg: [-25, -30, -20], maxDeg: [35, 30, 20], description: 'Upper Chest / Thoracic' },
  Spine1: { minDeg: [-20, -25, -15], maxDeg: [25, 25, 15], description: 'Mid Spine rotation' },
  Spine: { minDeg: [-25, -20, -15], maxDeg: [30, 20, 15], description: 'Lower Spine / Waist' },
  Hips: { minDeg: [-30, -45, -25], maxDeg: [30, 45, 25], description: 'Pelvis tilt and shift' },

  // Left Arm Chain (Elbow is strict hinge!)
  LeftShoulder: { minDeg: [-25, -35, -25], maxDeg: [30, 35, 25], description: 'Left Shoulder Blade' },
  LeftArm: { minDeg: [-180, -90, -110], maxDeg: [60, 90, 60], description: 'Left Upper Arm (Ball & Socket)' },
  LeftForeArm: { minDeg: [0, -10, -5], maxDeg: [145, 10, 5], description: 'Left Elbow Hinge (Bends Inward Only)' },
  LeftHand: { minDeg: [-70, -35, -40], maxDeg: [70, 35, 40], description: 'Left Wrist' },

  // Right Arm Chain (Elbow is strict hinge!)
  RightShoulder: { minDeg: [-25, -35, -25], maxDeg: [30, 35, 25], description: 'Right Shoulder Blade' },
  RightArm: { minDeg: [-180, -90, -60], maxDeg: [60, 90, 110], description: 'Right Upper Arm (Ball & Socket)' },
  RightForeArm: { minDeg: [0, -10, -5], maxDeg: [145, 10, 5], description: 'Right Elbow Hinge (Bends Inward Only)' },
  RightHand: { minDeg: [-70, -35, -40], maxDeg: [70, 35, 40], description: 'Right Wrist' },

  // Left Leg Chain (Knee is strict hinge!)
  LeftUpLeg: { minDeg: [-130, -40, -45], maxDeg: [30, 45, 45], description: 'Left Hip & Thigh' },
  LeftLeg: { minDeg: [-150, -5, -5], maxDeg: [0, 5, 5], description: 'Left Knee Hinge (Bends Backward Only)' },
  LeftFoot: { minDeg: [-40, -25, -20], maxDeg: [30, 25, 20], description: 'Left Ankle' },

  // Right Leg Chain (Knee is strict hinge!)
  RightUpLeg: { minDeg: [-130, -45, -45], maxDeg: [30, 40, 45], description: 'Right Hip & Thigh' },
  RightLeg: { minDeg: [-150, -5, -5], maxDeg: [0, 5, 5], description: 'Right Knee Hinge (Bends Backward Only)' },
  RightFoot: { minDeg: [-40, -25, -20], maxDeg: [30, 25, 20], description: 'Right Ankle' },
};

/**
 * Clamp Euler degrees within human anatomical limits
 */
export function clampJointRotation(
  boneName: string,
  eulerDeg: [number, number, number],
  enableSoftSpring = true
): [number, number, number] {
  const limit = ANATOMICAL_JOINT_LIMITS[boneName];
  if (!limit) return eulerDeg;

  let [x, y, z] = eulerDeg;
  const [minX, minY, minZ] = limit.minDeg;
  const [maxX, maxY, maxZ] = limit.maxDeg;

  const clampAxis = (val: number, min: number, max: number) => {
    if (val < min) {
      if (!enableSoftSpring) return min;
      const overflow = min - val;
      return min - (1 - Math.exp(-overflow * 0.12)) * 6;
    }
    if (val > max) {
      if (!enableSoftSpring) return max;
      const overflow = val - max;
      return max + (1 - Math.exp(-overflow * 0.12)) * 6;
    }
    return val;
  };

  return [
    clampAxis(x, minX, maxX),
    clampAxis(y, minY, maxY),
    clampAxis(z, minZ, maxZ),
  ];
}

export interface CollisionVolume {
  boneName: string;
  category: string;
  radius: number;
  offset: THREE.Vector3;
}

export const BODY_COLLISION_VOLUMES: CollisionVolume[] = [
  { boneName: 'Head', category: 'head', radius: 0.13, offset: new THREE.Vector3(0, 0.06, 0) },
  { boneName: 'Spine2', category: 'torso', radius: 0.16, offset: new THREE.Vector3(0, 0, 0) },
  { boneName: 'Spine', category: 'torso', radius: 0.15, offset: new THREE.Vector3(0, -0.05, 0) },
  { boneName: 'Hips', category: 'torso', radius: 0.17, offset: new THREE.Vector3(0, 0, 0) },

  { boneName: 'LeftArm', category: 'l_arm', radius: 0.062, offset: new THREE.Vector3(0, -0.1, 0) },
  { boneName: 'LeftForeArm', category: 'l_arm', radius: 0.055, offset: new THREE.Vector3(0, -0.1, 0) },
  { boneName: 'LeftHand', category: 'l_arm', radius: 0.05, offset: new THREE.Vector3(0, -0.05, 0) },

  { boneName: 'RightArm', category: 'r_arm', radius: 0.062, offset: new THREE.Vector3(0, -0.1, 0) },
  { boneName: 'RightForeArm', category: 'r_arm', radius: 0.055, offset: new THREE.Vector3(0, -0.1, 0) },
  { boneName: 'RightHand', category: 'r_arm', radius: 0.05, offset: new THREE.Vector3(0, -0.05, 0) },

  { boneName: 'LeftUpLeg', category: 'l_leg', radius: 0.085, offset: new THREE.Vector3(0, -0.15, 0) },
  { boneName: 'LeftLeg', category: 'l_leg', radius: 0.075, offset: new THREE.Vector3(0, -0.15, 0) },

  { boneName: 'RightUpLeg', category: 'r_leg', radius: 0.085, offset: new THREE.Vector3(0, -0.15, 0) },
  { boneName: 'RightLeg', category: 'r_leg', radius: 0.075, offset: new THREE.Vector3(0, -0.15, 0) },
];

export interface DetectedCollision {
  boneA: string;
  boneB: string;
  posA: THREE.Vector3;
  posB: THREE.Vector3;
  penetration: number;
}

/**
 * Check self-collision between non-adjacent body parts
 */
export function detectBodyCollisions(
  bonesMap: Map<string, THREE.Bone>
): DetectedCollision[] {
  const activeCollisions: DetectedCollision[] = [];
  const volumeData: Array<{ volume: CollisionVolume; worldPos: THREE.Vector3; bone: THREE.Bone }> = [];

  // Compute world positions for collision volumes
  BODY_COLLISION_VOLUMES.forEach((vol) => {
    const bone = bonesMap.get(vol.boneName);
    if (!bone) return;
    const worldPos = bone.getWorldPosition(new THREE.Vector3());
    if (vol.offset) {
      const q = bone.getWorldQuaternion(new THREE.Quaternion());
      worldPos.add(vol.offset.clone().applyQuaternion(q));
    }
    volumeData.push({ volume: vol, worldPos, bone });
  });

  // Test pairs of volumes
  for (let i = 0; i < volumeData.length; i++) {
    for (let j = i + 1; j < volumeData.length; j++) {
      const itemA = volumeData[i];
      const itemB = volumeData[j];

      // Skip adjacent or same category segments
      if (itemA.volume.category === itemB.volume.category) continue;
      if (
        (itemA.volume.category === 'torso' && (itemA.volume.boneName === 'Spine2' || itemA.volume.boneName === 'Hips')) &&
        (itemB.volume.boneName === 'LeftArm' || itemB.volume.boneName === 'RightArm' || itemB.volume.boneName === 'LeftUpLeg' || itemB.volume.boneName === 'RightUpLeg')
      ) {
        // Skip direct shoulder/hip attachment points
        continue;
      }

      const minDist = itemA.volume.radius + itemB.volume.radius;
      const actualDist = itemA.worldPos.distanceTo(itemB.worldPos);

      if (actualDist < minDist) {
        activeCollisions.push({
          boneA: itemA.volume.boneName,
          boneB: itemB.volume.boneName,
          posA: itemA.worldPos.clone(),
          posB: itemB.worldPos.clone(),
          penetration: minDist - actualDist,
        });
      }
    }
  }

  return activeCollisions;
}

/**
 * Smoothly resolves self-collisions by wrapping the active/moving limb
 * around static body parts along surface contours without affecting static parts.
 */
export function resolveLimbWrappingCollisions(
  bonesMap: Map<string, THREE.Bone>,
  selectedBoneName: string | null
): DetectedCollision[] {
  const collisions = detectBodyCollisions(bonesMap);
  if (collisions.length === 0) return [];

  const isLimb = (bName: string) =>
    bName.includes('Arm') || bName.includes('Hand') || bName.includes('Leg') || bName.includes('Foot');

  const belongsToSelectedChain = (bName: string) => {
    if (!selectedBoneName) return false;
    if (bName === selectedBoneName) return true;
    const prefix = selectedBoneName.startsWith('Left') ? 'Left' : selectedBoneName.startsWith('Right') ? 'Right' : '';
    if (!prefix) return false;
    return bName.startsWith(prefix);
  };

  collisions.forEach((col) => {
    let movingBoneName = col.boneA;
    let staticBoneName = col.boneB;

    if (belongsToSelectedChain(col.boneB) && !belongsToSelectedChain(col.boneA)) {
      movingBoneName = col.boneB;
      staticBoneName = col.boneA;
    } else if (!belongsToSelectedChain(col.boneA) && isLimb(col.boneA) && !isLimb(col.boneB)) {
      movingBoneName = col.boneA;
      staticBoneName = col.boneB;
    } else if (!belongsToSelectedChain(col.boneB) && isLimb(col.boneB) && !isLimb(col.boneA)) {
      movingBoneName = col.boneB;
      staticBoneName = col.boneA;
    }

    const movingBone = bonesMap.get(movingBoneName);
    const staticBone = bonesMap.get(staticBoneName);

    if (!movingBone || !staticBone) return;

    const staticPos = staticBone.getWorldPosition(new THREE.Vector3());
    const movingPos = movingBone.getWorldPosition(new THREE.Vector3());
    const pushDir = movingPos.clone().sub(staticPos);
    const dist = pushDir.length();

    if (dist < 0.0001) return;
    pushDir.divideScalar(dist);

    const penetration = col.penetration;
    if (penetration <= 0) return;

    // Pure Rotational Contour Wrapping: Rigid joint rotation around surface normal
    // Maintains 100% rigid bone lengths with ZERO mesh distortion or stretching
    const surfaceNormal = pushDir.clone().normalize();
    const parent = (movingBone.parent as THREE.Bone | null) || movingBone;
    const parentPos = parent.getWorldPosition(new THREE.Vector3());
    const limbVec = movingPos.clone().sub(parentPos);
    const limbLen = Math.max(0.08, limbVec.length());

    let rotAxis = limbVec.clone().cross(surfaceNormal).normalize();
    if (rotAxis.lengthSq() < 0.001) {
      rotAxis = new THREE.Vector3(0, 0, 1);
    }

    const wrapAngle = Math.min(0.2, (penetration / limbLen) * 0.5);
    const wrapQ = new THREE.Quaternion().setFromAxisAngle(rotAxis, wrapAngle);
    const targetQ = parent.quaternion.clone().multiply(wrapQ);
    parent.quaternion.slerp(targetQ, 0.2);
  });

  return collisions;
}

/**
 * Returns the symmetrical mirrored bone name and mirrored Euler rotation angles [x, -y, -z]
 */
export function getMirroredBone(
  bName: string,
  deg: [number, number, number]
): { mirrorName: string; mirrorDeg: [number, number, number] } | null {
  let mirrorName = '';
  if (bName.startsWith('Left')) {
    mirrorName = bName.replace('Left', 'Right');
  } else if (bName.startsWith('Right')) {
    mirrorName = bName.replace('Right', 'Left');
  } else {
    return null;
  }
  const [x, y, z] = deg;
  return {
    mirrorName,
    mirrorDeg: [x, -y, -z],
  };
}

/**
 * Solve 2-Bone Inverse Kinematics for rigid, non-stretching limb posing
 */
export function solveTwoBoneIK(
  rootBone: THREE.Bone,
  middleBone: THREE.Bone,
  endBone: THREE.Bone,
  targetWorldPos: THREE.Vector3,
  bendNormal: THREE.Vector3 = new THREE.Vector3(0, 0, 1)
) {
  const rootPos = rootBone.getWorldPosition(new THREE.Vector3());
  const middlePos = middleBone.getWorldPosition(new THREE.Vector3());
  const endPos = endBone.getWorldPosition(new THREE.Vector3());

  // Rigid limb segment lengths (never change!)
  const len1 = rootPos.distanceTo(middlePos);
  const len2 = middlePos.distanceTo(endPos);
  const totalLength = len1 + len2;

  // Vector to target
  const targetVec = targetWorldPos.clone().sub(rootPos);
  let distToTarget = targetVec.length();

  // Prevent stretching: clamp max target distance to 99.5% of total limb length
  distToTarget = Math.min(distToTarget, totalLength * 0.995);
  distToTarget = Math.max(distToTarget, Math.abs(len1 - len2) + 0.01);

  // Cosine rule angles
  const cosAngle1 = (len1 * len1 + distToTarget * distToTarget - len2 * len2) / (2 * len1 * distToTarget);
  const cosAngle2 = (len1 * len1 + len2 * len2 - distToTarget * distToTarget) / (2 * len1 * len2);

  const angle1 = Math.acos(THREE.MathUtils.clamp(cosAngle1, -1, 1));
  const angle2 = Math.acos(THREE.MathUtils.clamp(cosAngle2, -1, 1));

  // Rotate Root Bone towards target with angle1 offset
  const dir = targetVec.clone().normalize();
  const currentDir = endPos.clone().sub(rootPos).normalize();

  const rotQ = new THREE.Quaternion().setFromUnitVectors(currentDir, dir);
  rootBone.quaternion.multiply(rotQ);

  // Rotate Middle Bone (Elbow/Knee hinge)
  const elbowAngle = Math.PI - angle2;
  const hingeQ = new THREE.Quaternion().setFromAxisAngle(bendNormal, elbowAngle);
  middleBone.quaternion.multiply(hingeQ);
}

/**
 * Calculate interpolated rotation [x, y, z] degrees for a specific bone in an AnimationClip
 */
export function getInterpolatedBoneRotation(
  clip: { keyframes: Array<{ time: number; transforms: Record<string, [number, number, number]> }> },
  time: number,
  boneName: string
): [number, number, number] {
  if (!clip || !clip.keyframes || clip.keyframes.length === 0) return [0, 0, 0];
  const kfs = [...clip.keyframes].sort((a, b) => a.time - b.time);

  if (kfs.length === 1 || time <= kfs[0].time) {
    return kfs[0].transforms[boneName] || [0, 0, 0];
  }

  if (time >= kfs[kfs.length - 1].time) {
    return kfs[kfs.length - 1].transforms[boneName] || [0, 0, 0];
  }

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

  const rotA = prev.transforms[boneName] || [0, 0, 0];
  const rotB = next.transforms[boneName] || [0, 0, 0];

  const rx = rotA[0] + (rotB[0] - rotA[0]) * factor;
  const ry = rotA[1] + (rotB[1] - rotA[1]) * factor;
  const rz = rotA[2] + (rotB[2] - rotA[2]) * factor;

  return [Math.round(rx), Math.round(ry), Math.round(rz)];
}
