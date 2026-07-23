export interface BoneTransform {
  boneName: string;
  rotation: [number, number, number]; // euler angles in degrees [x, y, z]
  position?: [number, number, number];
}

export interface Keyframe {
  id: string;
  time: number; // in seconds (e.g., 0.0, 0.5, 1.0)
  transforms: Record<string, [number, number, number]>; // boneName -> [rotX, rotY, rotZ] in degrees
  positions?: Record<string, [number, number, number]>; // boneName -> [posX, posY, posZ] position offsets
}

export interface AnimationClip {
  id: string;
  name: string;
  duration: number; // total duration in seconds
  fps: number;
  loop: boolean;
  keyframes: Keyframe[];
}

export interface StandingPoseConfig {
  stanceWidth: number;      // Leg separation (-0.2 to 0.2)
  armSpread: number;        // Arm hang angle (-0.5 to 0.5)
  chestSpineTilt: number;   // Spine posture (-0.3 to 0.3)
  headTilt: number;         // Head tilt angle (-0.3 to 0.3)
  kneeFlex: number;         // Slight knee bend (0 to 0.3)
  customBoneRotations: Record<string, [number, number, number]>; // boneName -> [degX, degY, degZ]
  customBonePositions?: Record<string, [number, number, number]>; // boneName -> [posX, posY, posZ]
}

export interface BoneNode {
  id: string;
  label: string;
  category: 'torso' | 'arm' | 'leg' | 'head';
  parent?: string;
  children?: string[];
}

export interface PosePreset {
  id: string;
  name: string;
  icon?: string;
  description: string;
  pose: StandingPoseConfig;
}

export const BONE_HIERARCHY: BoneNode[] = [
  { id: 'Hips', label: 'Hips / Pelvis', category: 'torso', children: ['Spine', 'LeftUpLeg', 'RightUpLeg'] },
  { id: 'Spine', label: 'Lower Spine', category: 'torso', parent: 'Hips', children: ['Spine1'] },
  { id: 'Spine1', label: 'Middle Spine', category: 'torso', parent: 'Spine', children: ['Spine2'] },
  { id: 'Spine2', label: 'Upper Spine / Chest', category: 'torso', parent: 'Spine1', children: ['Neck', 'LeftShoulder', 'RightShoulder'] },
  { id: 'Neck', label: 'Neck', category: 'head', parent: 'Spine2', children: ['Head'] },
  { id: 'Head', label: 'Head', category: 'head', parent: 'Neck' },
  { id: 'LeftShoulder', label: 'L Shoulder', category: 'arm', parent: 'Spine2', children: ['LeftArm'] },
  { id: 'LeftArm', label: 'L Upper Arm', category: 'arm', parent: 'LeftShoulder', children: ['LeftForeArm'] },
  { id: 'LeftForeArm', label: 'L Forearm', category: 'arm', parent: 'LeftArm' },
  { id: 'RightShoulder', label: 'R Shoulder', category: 'arm', parent: 'Spine2', children: ['RightArm'] },
  { id: 'RightArm', label: 'R Upper Arm', category: 'arm', parent: 'RightShoulder', children: ['RightForeArm'] },
  { id: 'RightForeArm', label: 'R Forearm', category: 'arm', parent: 'RightArm' },
  { id: 'LeftUpLeg', label: 'L Thigh', category: 'leg', parent: 'Hips', children: ['LeftLeg'] },
  { id: 'LeftLeg', label: 'L Shin / Knee', category: 'leg', parent: 'LeftUpLeg', children: ['LeftFoot'] },
  { id: 'LeftFoot', label: 'L Foot', category: 'leg', parent: 'LeftLeg' },
  { id: 'RightUpLeg', label: 'R Thigh', category: 'leg', parent: 'Hips', children: ['RightLeg'] },
  { id: 'RightLeg', label: 'R Shin / Knee', category: 'leg', parent: 'RightUpLeg', children: ['RightFoot'] },
  { id: 'RightFoot', label: 'R Foot', category: 'leg', parent: 'RightLeg' },
];
