import { AnimationClip, StandingPoseConfig, PosePreset } from '../types/animation';

export const DEFAULT_STANDING_POSE: StandingPoseConfig = {
  "stanceWidth": 0.1,
  "armSpread": 0.05,
  "chestSpineTilt": 0.05,
  "headTilt": 0.08,
  "kneeFlex": 0.02,
  "customBoneRotations": {
    "RightForeArm": [
      103,
      0,
      17
    ],
    "LeftArm": [
      0,
      28,
      -34
    ],
    "LeftForeArm": [
      68,
      0,
      0
    ],
    "Head": [
      8.5,
      17,
      0
    ]
  }
};

export const POSE_PRESETS: PosePreset[] = [
  {
    "id": "natural_idle",
    "name": "Natural Relaxed",
    "description": "Casual upright posture with relaxed shoulders and subtle weight shift.",
    "pose": {
      "stanceWidth": 0.015,
      "armSpread": -0.36,
      "chestSpineTilt": 0.02,
      "headTilt": 0,
      "kneeFlex": 0.02,
      "customBoneRotations": {
        "Hips": [
          0,
          0,
          0
        ],
        "Spine": [
          0,
          0,
          0
        ],
        "Spine1": [
          2,
          0,
          0
        ],
        "Spine2": [
          2,
          0,
          0
        ],
        "Head": [
          0,
          0,
          0
        ],
        "LeftArm": [
          -5,
          0,
          3
        ],
        "RightArm": [
          -5,
          0,
          -3
        ],
        "LeftForeArm": [
          8,
          0,
          0
        ],
        "RightForeArm": [
          8,
          0,
          0
        ],
        "LeftUpLeg": [
          0,
          0,
          0.5
        ],
        "RightUpLeg": [
          0,
          0,
          -0.5
        ],
        "LeftLeg": [
          2,
          0,
          0
        ],
        "RightLeg": [
          2,
          0,
          0
        ]
      }
    }
  },
  {
    "id": "thinking_pose",
    "name": "AI Thinking",
    "description": "The classic hand-on-chin thinking pose played when generating a response.",
    "pose": {
      "stanceWidth": 0.1,
      "armSpread": 0.05,
      "chestSpineTilt": 0.05,
      "headTilt": 0.08,
      "kneeFlex": 0.02,
      "customBoneRotations": {
        "RightArm": [
          23,
          11,
          74
        ],
        "RightForeArm": [
          103,
          0,
          17
        ],
        "LeftArm": [
          0,
          28,
          -34
        ],
        "LeftForeArm": [
          68,
          0,
          0
        ],
        "Head": [
          8.5,
          17,
          0
        ]
      }
    }
  },
  {
    "id": "hero_stance",
    "name": "Hero Champion",
    "description": "Wide grounded stance, broad chest, confident hands ready.",
    "pose": {
      "stanceWidth": 0.16,
      "armSpread": 0.12,
      "chestSpineTilt": 0.08,
      "headTilt": -0.04,
      "kneeFlex": 0.06,
      "customBoneRotations": {
        "LeftArm": [
          -18,
          12,
          28
        ],
        "RightArm": [
          -18,
          -12,
          -28
        ],
        "LeftForeArm": [
          35,
          0,
          0
        ],
        "RightForeArm": [
          35,
          0,
          0
        ],
        "Spine1": [
          6,
          0,
          0
        ],
        "Head": [
          -6,
          0,
          0
        ],
        "LeftUpLeg": [
          2,
          0,
          8
        ],
        "RightUpLeg": [
          -2,
          0,
          -8
        ]
      }
    }
  },
  {
    "id": "combat_ready",
    "name": "Tactical Guard",
    "description": "Low athletic center of gravity with raised protective forearms.",
    "pose": {
      "stanceWidth": 0.2,
      "armSpread": 0.05,
      "chestSpineTilt": 0.12,
      "headTilt": -0.08,
      "kneeFlex": 0.18,
      "customBoneRotations": {
        "LeftArm": [
          -55,
          25,
          22
        ],
        "RightArm": [
          -72,
          -22,
          -22
        ],
        "LeftForeArm": [
          85,
          0,
          0
        ],
        "RightForeArm": [
          95,
          0,
          0
        ],
        "Spine": [
          6,
          18,
          0
        ],
        "Head": [
          -6,
          -12,
          0
        ],
        "LeftUpLeg": [
          12,
          0,
          12
        ],
        "RightUpLeg": [
          -12,
          0,
          -12
        ],
        "LeftLeg": [
          25,
          0,
          0
        ],
        "RightLeg": [
          28,
          0,
          0
        ]
      }
    }
  },
  {
    "id": "crossed_arms",
    "name": "Crossed Arms",
    "description": "Folded arms across chest with poised erect spine.",
    "pose": {
      "stanceWidth": 0.08,
      "armSpread": -0.1,
      "chestSpineTilt": 0.04,
      "headTilt": -0.02,
      "kneeFlex": 0.02,
      "customBoneRotations": {
        "LeftArm": [
          -45,
          45,
          50
        ],
        "RightArm": [
          -45,
          -45,
          -50
        ],
        "LeftForeArm": [
          110,
          -20,
          0
        ],
        "RightForeArm": [
          110,
          20,
          0
        ],
        "Spine1": [
          4,
          0,
          0
        ],
        "Head": [
          -2,
          0,
          0
        ]
      }
    }
  },
  {
    "id": "hands_raised",
    "name": "Victory Cheer",
    "description": "Triumphant dual arm raise in joyous celebration.",
    "pose": {
      "stanceWidth": 0.12,
      "armSpread": 0.35,
      "chestSpineTilt": 0.14,
      "headTilt": -0.18,
      "kneeFlex": 0.05,
      "customBoneRotations": {
        "LeftArm": [
          -155,
          0,
          32
        ],
        "RightArm": [
          -155,
          0,
          -32
        ],
        "LeftForeArm": [
          25,
          0,
          0
        ],
        "RightForeArm": [
          25,
          0,
          0
        ],
        "Head": [
          -18,
          0,
          0
        ],
        "Spine2": [
          12,
          0,
          0
        ]
      }
    }
  },
  {
    "id": "ninja_stealth",
    "name": "Ninja Crouch",
    "description": "Agile low stance with forward torso angle and poised limbs.",
    "pose": {
      "stanceWidth": 0.24,
      "armSpread": -0.08,
      "chestSpineTilt": 0.24,
      "headTilt": -0.14,
      "kneeFlex": 0.28,
      "customBoneRotations": {
        "Hips": [
          0,
          0,
          0
        ],
        "LeftArm": [
          28,
          35,
          22
        ],
        "RightArm": [
          -38,
          -22,
          -22
        ],
        "LeftForeArm": [
          50,
          0,
          0
        ],
        "RightForeArm": [
          70,
          0,
          0
        ],
        "Spine1": [
          18,
          0,
          0
        ],
        "LeftUpLeg": [
          22,
          0,
          12
        ],
        "RightUpLeg": [
          -12,
          0,
          -12
        ],
        "LeftLeg": [
          40,
          0,
          0
        ],
        "RightLeg": [
          42,
          0,
          0
        ]
      }
    }
  },
  {
    "id": "sprint_start",
    "name": "Sprint Block",
    "description": "Explosive starting block posture with staggered leg drive.",
    "pose": {
      "stanceWidth": 0.18,
      "armSpread": 0,
      "chestSpineTilt": 0.3,
      "headTilt": -0.2,
      "kneeFlex": 0.25,
      "customBoneRotations": {
        "LeftArm": [
          -60,
          0,
          15
        ],
        "RightArm": [
          40,
          0,
          -15
        ],
        "LeftForeArm": [
          60,
          0,
          0
        ],
        "RightForeArm": [
          40,
          0,
          0
        ],
        "LeftUpLeg": [
          -30,
          0,
          5
        ],
        "RightUpLeg": [
          45,
          0,
          -5
        ],
        "LeftLeg": [
          45,
          0,
          0
        ],
        "RightLeg": [
          65,
          0,
          0
        ],
        "Spine": [
          15,
          0,
          0
        ]
      }
    }
  }
];

export const DEFAULT_CLIPS: AnimationClip[] = [
  {
    "id": "walk_cycle",
    "name": "Realistic Walk Cycle",
    "duration": 1.2,
    "fps": 30,
    "loop": true,
    "keyframes": [
      {
        "id": "kf_1784795382140",
        "time": 0.02,
        "transforms": {
          "RightUpLeg": [
            7,
            -1,
            3
          ],
          "LeftUpLeg": [
            25,
            1,
            -3
          ],
          "RightArm": [
            24,
            6,
            -18
          ],
          "LeftArm": [
            24,
            -6,
            18
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            -2,
            1,
            0
          ],
          "RightLeg": [
            5,
            0,
            0
          ],
          "LeftLeg": [
            -22,
            0,
            0
          ],
          "Hips": [
            2,
            5,
            -2
          ],
          "Spine": [
            3,
            -4,
            2
          ],
          "Spine2": [
            2,
            -3,
            0
          ],
          "RightForeArm": [
            18,
            0,
            0
          ],
          "RightFoot": [
            -14,
            0,
            0
          ],
          "LeftFoot": [
            -8,
            6,
            11
          ],
          "LeftForeArm": [
            15,
            76,
            -32
          ]
        },
        "positions": {
          "Hips": [
            0,
            -0.015,
            0
          ],
          "LeftForeArm": [
            0,
            0,
            0
          ],
          "RightUpLeg": [
            0,
            0,
            0
          ],
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "kf_1784798955167",
        "time": 0.3,
        "transforms": {
          "RightUpLeg": [
            7,
            -1,
            3
          ],
          "LeftUpLeg": [
            53,
            1,
            -3
          ],
          "RightArm": [
            34,
            6,
            -18
          ],
          "LeftArm": [
            25,
            -6,
            -9
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            -2,
            1,
            0
          ],
          "RightLeg": [
            -25,
            0,
            0
          ],
          "LeftLeg": [
            -22,
            0,
            0
          ],
          "Hips": [
            2,
            5,
            -2
          ],
          "Spine": [
            3,
            -4,
            2
          ],
          "Spine2": [
            2,
            -3,
            0
          ],
          "LeftForeArm": [
            1,
            5,
            -44
          ],
          "RightForeArm": [
            51,
            38,
            26
          ],
          "RightFoot": [
            -14,
            0,
            0
          ],
          "LeftFoot": [
            -8,
            6,
            11
          ]
        },
        "positions": {
          "Hips": [
            0,
            -0.015,
            0
          ],
          "LeftForeArm": [
            0,
            0,
            0
          ],
          "RightUpLeg": [
            0,
            0,
            0
          ],
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "kf_1784798264124",
        "time": 0.57,
        "transforms": {
          "RightUpLeg": [
            7,
            -1,
            3
          ],
          "LeftUpLeg": [
            25,
            1,
            -3
          ],
          "RightArm": [
            17,
            -8,
            -18
          ],
          "LeftArm": [
            17,
            8,
            18
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            -2,
            1,
            0
          ],
          "RightLeg": [
            5,
            0,
            0
          ],
          "LeftLeg": [
            -22,
            0,
            0
          ],
          "Hips": [
            2,
            5,
            -2
          ],
          "Spine": [
            3,
            -4,
            2
          ],
          "Spine2": [
            2,
            -3,
            0
          ],
          "LeftForeArm": [
            6,
            5,
            -44
          ],
          "RightForeArm": [
            18,
            0,
            0
          ],
          "RightFoot": [
            -14,
            0,
            0
          ],
          "LeftFoot": [
            -8,
            6,
            11
          ]
        },
        "positions": {
          "Hips": [
            0,
            -0.015,
            0
          ],
          "LeftForeArm": [
            0,
            0,
            0
          ],
          "RightUpLeg": [
            0,
            0,
            0
          ],
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "kf_1784798921443",
        "time": 0.88,
        "transforms": {
          "RightUpLeg": [
            25,
            0,
            10
          ],
          "LeftUpLeg": [
            2,
            0,
            3
          ],
          "RightArm": [
            14,
            12,
            8
          ],
          "LeftArm": [
            20,
            -11,
            10
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            -2,
            1,
            0
          ],
          "RightLeg": [
            -13,
            0,
            0
          ],
          "LeftLeg": [
            -21,
            0,
            0
          ],
          "Hips": [
            2,
            5,
            -2
          ],
          "Spine": [
            3,
            -4,
            2
          ],
          "Spine2": [
            2,
            -3,
            0
          ],
          "LeftForeArm": [
            20,
            0,
            0
          ],
          "RightForeArm": [
            18,
            0,
            0
          ],
          "RightFoot": [
            -16,
            0,
            -3
          ],
          "LeftFoot": [
            22,
            0,
            0
          ]
        },
        "positions": {
          "Hips": [
            0,
            -0.015,
            0
          ]
        }
      },
      {
        "id": "w_4",
        "time": 1.2,
        "transforms": {
          "RightUpLeg": [
            7,
            -1,
            3
          ],
          "LeftUpLeg": [
            25,
            1,
            -3
          ],
          "RightArm": [
            22,
            0,
            -10
          ],
          "LeftArm": [
            34,
            -6,
            18
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            -2,
            1,
            0
          ],
          "RightLeg": [
            5,
            0,
            0
          ],
          "LeftLeg": [
            -22,
            0,
            0
          ],
          "Hips": [
            2,
            5,
            -2
          ],
          "Spine": [
            3,
            -4,
            2
          ],
          "Spine2": [
            2,
            -3,
            0
          ],
          "RightForeArm": [
            18,
            0,
            0
          ],
          "RightFoot": [
            -14,
            0,
            0
          ],
          "LeftFoot": [
            -8,
            6,
            11
          ],
          "LeftForeArm": [
            6,
            5,
            -44
          ]
        },
        "positions": {
          "Hips": [
            0,
            -0.015,
            0
          ],
          "LeftForeArm": [
            0,
            0,
            0
          ],
          "RightUpLeg": [
            0,
            0,
            0
          ],
          "RightArm": [
            0,
            0,
            0
          ]
        }
      }
    ]
  },
  {
    "id": "athletic_sprint",
    "name": "Athletic Sprint Run",
    "duration": 0.8,
    "fps": 30,
    "loop": true,
    "keyframes": [
      {
        "id": "s_0",
        "time": 0,
        "transforms": {
          "RightUpLeg": [
            55,
            0,
            -5
          ],
          "LeftUpLeg": [
            -45,
            0,
            5
          ],
          "RightLeg": [
            20,
            0,
            0
          ],
          "LeftLeg": [
            70,
            0,
            0
          ],
          "RightArm": [
            -60,
            0,
            -15
          ],
          "LeftArm": [
            50,
            0,
            15
          ],
          "RightForeArm": [
            65,
            0,
            0
          ],
          "LeftForeArm": [
            45,
            0,
            0
          ],
          "Hips": [
            8,
            12,
            4
          ],
          "Spine": [
            12,
            -8,
            0
          ],
          "Head": [
            -8,
            0,
            0
          ]
        }
      },
      {
        "id": "s_1",
        "time": 0.2,
        "transforms": {
          "RightUpLeg": [
            15,
            0,
            -5
          ],
          "LeftUpLeg": [
            -15,
            0,
            5
          ],
          "RightLeg": [
            75,
            0,
            0
          ],
          "LeftLeg": [
            25,
            0,
            0
          ],
          "RightArm": [
            -10,
            0,
            -15
          ],
          "LeftArm": [
            10,
            0,
            15
          ],
          "RightForeArm": [
            80,
            0,
            0
          ],
          "LeftForeArm": [
            25,
            0,
            0
          ],
          "Hips": [
            14,
            0,
            0
          ],
          "Spine": [
            10,
            0,
            0
          ],
          "Head": [
            -6,
            0,
            0
          ]
        }
      },
      {
        "id": "s_2",
        "time": 0.4,
        "transforms": {
          "RightUpLeg": [
            -45,
            0,
            -5
          ],
          "LeftUpLeg": [
            55,
            0,
            5
          ],
          "RightLeg": [
            70,
            0,
            0
          ],
          "LeftLeg": [
            20,
            0,
            0
          ],
          "RightArm": [
            50,
            0,
            -15
          ],
          "LeftArm": [
            -60,
            0,
            15
          ],
          "RightForeArm": [
            45,
            0,
            0
          ],
          "LeftForeArm": [
            65,
            0,
            0
          ],
          "Hips": [
            8,
            -12,
            -4
          ],
          "Spine": [
            12,
            8,
            0
          ],
          "Head": [
            -8,
            0,
            0
          ]
        }
      },
      {
        "id": "s_3",
        "time": 0.6,
        "transforms": {
          "RightUpLeg": [
            -15,
            0,
            -5
          ],
          "LeftUpLeg": [
            15,
            0,
            5
          ],
          "RightLeg": [
            25,
            0,
            0
          ],
          "LeftLeg": [
            75,
            0,
            0
          ],
          "RightArm": [
            10,
            0,
            -15
          ],
          "LeftArm": [
            -10,
            0,
            15
          ],
          "RightForeArm": [
            25,
            0,
            0
          ],
          "LeftForeArm": [
            80,
            0,
            0
          ],
          "Hips": [
            14,
            0,
            0
          ],
          "Spine": [
            10,
            0,
            0
          ],
          "Head": [
            -6,
            0,
            0
          ]
        }
      },
      {
        "id": "s_4",
        "time": 0.8,
        "transforms": {
          "RightUpLeg": [
            55,
            0,
            -5
          ],
          "LeftUpLeg": [
            -45,
            0,
            5
          ],
          "RightLeg": [
            20,
            0,
            0
          ],
          "LeftLeg": [
            70,
            0,
            0
          ],
          "RightArm": [
            -60,
            0,
            -15
          ],
          "LeftArm": [
            50,
            0,
            15
          ],
          "RightForeArm": [
            65,
            0,
            0
          ],
          "LeftForeArm": [
            45,
            0,
            0
          ],
          "Hips": [
            8,
            12,
            4
          ],
          "Spine": [
            12,
            -8,
            0
          ],
          "Head": [
            -8,
            0,
            0
          ]
        }
      }
    ]
  },
  {
    "id": "wave_hello",
    "name": "Expressive Hand Wave",
    "duration": 5,
    "fps": 30,
    "loop": true,
    "keyframes": [
      {
        "id": "kf_1784835018371",
        "time": 0,
        "transforms": {
          "RightArm": [
            -18,
            51,
            7
          ],
          "RightForeArm": [
            32,
            42,
            -82
          ],
          "RightHand": [
            0,
            0,
            0
          ],
          "Head": [
            6,
            -1,
            0
          ],
          "Spine1": [
            2,
            4,
            0
          ],
          "LeftArm": [
            22,
            -2,
            -3
          ],
          "RightHandThumb1": [
            0,
            0,
            0
          ]
        },
        "positions": {
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "w_1",
        "time": 1.22,
        "transforms": {
          "RightArm": [
            -18,
            51,
            7
          ],
          "RightForeArm": [
            12,
            31,
            -125
          ],
          "RightHand": [
            0,
            0,
            0
          ],
          "Head": [
            6,
            -1,
            0
          ],
          "Spine1": [
            2,
            4,
            0
          ],
          "LeftArm": [
            22,
            -2,
            -3
          ],
          "RightHandThumb1": [
            0,
            0,
            0
          ]
        },
        "positions": {
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "w_2",
        "time": 2.51,
        "transforms": {
          "RightArm": [
            -18,
            51,
            7
          ],
          "RightForeArm": [
            12,
            31,
            -113
          ],
          "RightHand": [
            0,
            0,
            0
          ],
          "Head": [
            -4,
            12,
            0
          ],
          "Spine1": [
            2,
            4,
            0
          ],
          "LeftArm": [
            22,
            -2,
            -3
          ],
          "RightHandThumb1": [
            0,
            0,
            0
          ]
        },
        "positions": {
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "kf_1784834843488",
        "time": 3.8,
        "transforms": {
          "RightArm": [
            -18,
            51,
            7
          ],
          "RightForeArm": [
            12,
            31,
            -125
          ],
          "RightHand": [
            0,
            0,
            0
          ],
          "Head": [
            6,
            -1,
            0
          ],
          "Spine1": [
            2,
            4,
            0
          ],
          "LeftArm": [
            22,
            -2,
            -3
          ],
          "RightHandThumb1": [
            0,
            0,
            0
          ]
        },
        "positions": {
          "RightArm": [
            0,
            0,
            0
          ]
        }
      },
      {
        "id": "w_4",
        "time": 5,
        "transforms": {
          "RightArm": [
            -18,
            51,
            7
          ],
          "RightForeArm": [
            12,
            31,
            -113
          ],
          "RightHand": [
            0,
            0,
            0
          ],
          "Head": [
            -4,
            12,
            0
          ],
          "Spine1": [
            2,
            4,
            0
          ],
          "LeftArm": [
            22,
            -2,
            -3
          ],
          "RightHandThumb1": [
            0,
            0,
            0
          ]
        },
        "positions": {
          "RightArm": [
            0,
            0,
            0
          ]
        }
      }
    ]
  },
  {
    "id": "boxing_combo",
    "name": "Boxing Jab-Cross Combo",
    "duration": 1.4,
    "fps": 30,
    "loop": true,
    "keyframes": [
      {
        "id": "b_0",
        "time": 0,
        "transforms": {
          "LeftArm": [
            -60,
            20,
            20
          ],
          "RightArm": [
            -75,
            -20,
            -20
          ],
          "LeftForeArm": [
            85,
            0,
            0
          ],
          "RightForeArm": [
            95,
            0,
            0
          ],
          "Spine": [
            5,
            15,
            0
          ],
          "Head": [
            -5,
            -10,
            0
          ]
        }
      },
      {
        "id": "b_1",
        "time": 0.25,
        "transforms": {
          "LeftArm": [
            -90,
            10,
            5
          ],
          "LeftForeArm": [
            10,
            0,
            0
          ],
          "RightArm": [
            -80,
            -25,
            -20
          ],
          "RightForeArm": [
            105,
            0,
            0
          ],
          "Spine": [
            8,
            25,
            0
          ],
          "Head": [
            -5,
            -15,
            0
          ]
        }
      },
      {
        "id": "b_2",
        "time": 0.5,
        "transforms": {
          "LeftArm": [
            -60,
            20,
            20
          ],
          "RightArm": [
            -75,
            -20,
            -20
          ],
          "LeftForeArm": [
            85,
            0,
            0
          ],
          "RightForeArm": [
            95,
            0,
            0
          ],
          "Spine": [
            5,
            15,
            0
          ],
          "Head": [
            -5,
            -10,
            0
          ]
        }
      },
      {
        "id": "b_3",
        "time": 0.85,
        "transforms": {
          "RightArm": [
            -95,
            -10,
            -5
          ],
          "RightForeArm": [
            10,
            0,
            0
          ],
          "LeftArm": [
            -75,
            25,
            20
          ],
          "LeftForeArm": [
            105,
            0,
            0
          ],
          "Spine": [
            10,
            -30,
            0
          ],
          "Head": [
            -5,
            15,
            0
          ]
        }
      },
      {
        "id": "b_4",
        "time": 1.4,
        "transforms": {
          "LeftArm": [
            -60,
            20,
            20
          ],
          "RightArm": [
            -75,
            -20,
            -20
          ],
          "LeftForeArm": [
            85,
            0,
            0
          ],
          "RightForeArm": [
            95,
            0,
            0
          ],
          "Spine": [
            5,
            15,
            0
          ],
          "Head": [
            -5,
            -10,
            0
          ]
        }
      }
    ]
  },
  {
    "id": "breathing_idle",
    "name": "Breathing Idle & Look",
    "duration": 9.9,
    "fps": 30,
    "loop": true,
    "keyframes": [
      {
        "id": "kf_1784796063328",
        "time": 0,
        "transforms": {
          "RightUpLeg": [
            0,
            0,
            3
          ],
          "LeftUpLeg": [
            0,
            0,
            -3
          ],
          "RightArm": [
            24,
            0,
            -12
          ],
          "LeftArm": [
            24,
            0,
            12
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            0,
            0,
            0
          ],
          "RightLeg": [
            2,
            0,
            0
          ],
          "LeftLeg": [
            2,
            0,
            0
          ],
          "Hips": [
            0,
            0,
            0
          ],
          "Spine": [
            0,
            0,
            0
          ],
          "Spine2": [
            2,
            0,
            0
          ],
          "RightForeArm": [
            12,
            0,
            0
          ],
          "LeftForeArm": [
            12,
            0,
            0
          ]
        },
        "positions": {}
      },
      {
        "id": "kf_1784834439278",
        "time": 2.74,
        "transforms": {
          "RightUpLeg": [
            0,
            0,
            3
          ],
          "LeftUpLeg": [
            0,
            0,
            -3
          ],
          "RightArm": [
            20,
            -2,
            -12
          ],
          "LeftArm": [
            20,
            2,
            12
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            0,
            0,
            0
          ],
          "RightLeg": [
            2,
            0,
            0
          ],
          "LeftLeg": [
            2,
            0,
            0
          ],
          "RightForeArm": [
            12,
            0,
            0
          ],
          "LeftForeArm": [
            12,
            0,
            0
          ],
          "Hips": [
            0,
            0,
            0
          ],
          "Spine": [
            0,
            0,
            0
          ],
          "Spine2": [
            2,
            0,
            0
          ],
          "Neck": [
            3,
            -6,
            0
          ]
        },
        "positions": {}
      },
      {
        "id": "kf_1784834488388",
        "time": 4,
        "transforms": {
          "RightUpLeg": [
            0,
            0,
            3
          ],
          "LeftUpLeg": [
            0,
            0,
            -3
          ],
          "RightArm": [
            24,
            0,
            -12
          ],
          "LeftArm": [
            24,
            0,
            12
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            0,
            0,
            0
          ],
          "RightLeg": [
            2,
            0,
            0
          ],
          "LeftLeg": [
            2,
            0,
            0
          ],
          "RightForeArm": [
            12,
            0,
            0
          ],
          "LeftForeArm": [
            12,
            0,
            0
          ],
          "Hips": [
            0,
            0,
            0
          ],
          "Spine": [
            0,
            0,
            0
          ],
          "Spine2": [
            2,
            0,
            0
          ]
        },
        "positions": {}
      },
      {
        "id": "kf_1784796818560",
        "time": 5.22,
        "transforms": {
          "RightUpLeg": [
            0,
            0,
            3
          ],
          "LeftUpLeg": [
            0,
            0,
            -3
          ],
          "RightArm": [
            24,
            0,
            -12
          ],
          "LeftArm": [
            24,
            0,
            12
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            0,
            0,
            0
          ],
          "RightLeg": [
            2,
            0,
            0
          ],
          "LeftLeg": [
            2,
            0,
            0
          ],
          "Hips": [
            0,
            0,
            0
          ],
          "Spine": [
            0,
            0,
            0
          ],
          "Spine2": [
            2,
            0,
            0
          ],
          "RightForeArm": [
            12,
            0,
            0
          ],
          "LeftForeArm": [
            12,
            0,
            0
          ]
        },
        "positions": {}
      },
      {
        "id": "i_3",
        "time": 7.97,
        "transforms": {
          "RightUpLeg": [
            0,
            0,
            3
          ],
          "LeftUpLeg": [
            0,
            0,
            -3
          ],
          "RightArm": [
            20,
            -2,
            -12
          ],
          "LeftArm": [
            20,
            2,
            12
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            9,
            0,
            0
          ],
          "RightLeg": [
            2,
            0,
            0
          ],
          "LeftLeg": [
            2,
            0,
            0
          ],
          "Hips": [
            0,
            0,
            0
          ],
          "Spine": [
            0,
            0,
            0
          ],
          "Spine2": [
            2,
            0,
            0
          ],
          "RightForeArm": [
            12,
            0,
            0
          ],
          "LeftForeArm": [
            12,
            0,
            0
          ],
          "Neck": [
            -4,
            8,
            0
          ]
        },
        "positions": {}
      },
      {
        "id": "kf_1784796866223",
        "time": 9.9,
        "transforms": {
          "RightUpLeg": [
            0,
            0,
            3
          ],
          "LeftUpLeg": [
            0,
            0,
            -3
          ],
          "RightArm": [
            24,
            0,
            -12
          ],
          "LeftArm": [
            24,
            0,
            12
          ],
          "Spine1": [
            2,
            0,
            0
          ],
          "Head": [
            0,
            0,
            0
          ],
          "RightLeg": [
            2,
            0,
            0
          ],
          "LeftLeg": [
            2,
            0,
            0
          ],
          "Hips": [
            0,
            0,
            0
          ],
          "Spine": [
            0,
            0,
            0
          ],
          "Spine2": [
            2,
            0,
            0
          ],
          "RightForeArm": [
            12,
            0,
            0
          ],
          "LeftForeArm": [
            12,
            0,
            0
          ]
        },
        "positions": {}
      }
    ]
  },
  {
    "id": "chicken_dance",
    "name": "Chicken Dance",
    "duration": 12,
    "fps": 30,
    "loop": true,
    "keyframes": [
      {
        "id": "cd_0",
        "time": 0,
        "transforms": {}
      },
      {
        "id": "cd_1",
        "time": 12,
        "transforms": {}
      }
    ]
  }
];
