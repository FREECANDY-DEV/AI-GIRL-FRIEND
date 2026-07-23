export interface SceneConfig {
  showSkeleton: boolean;
  ambientLightIntensity: number;
  ambientLightColor: string;
  directionalLightIntensity: number;
  directionalLightColor: string;
  directionalLightPositionX: number;
  directionalLightPositionY: number;
  directionalLightPositionZ: number;
  backgroundColor: string;
  cameraFov: number;
  enableAutoRotate: boolean;
  autoRotateSpeed: number;
  starCount: number;
  starSpeed: number;
  saturation: number;
  brightness: number;
  contrast: number;
  filmGrain: number;
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  showSkeleton: false,
  ambientLightIntensity: 0.8,
  ambientLightColor: "#e0e7ff",
  directionalLightIntensity: 1.5,
  directionalLightColor: "#38bdf8",
  directionalLightPositionX: -10,
  directionalLightPositionY: 18,
  directionalLightPositionZ: -10,
  backgroundColor: "#070a14",
  cameraFov: 48,
  enableAutoRotate: false,
  autoRotateSpeed: 1.0,
  starCount: 6000,
  starSpeed: 1.5,
  saturation: 1.0,
  brightness: 1.0,
  contrast: 1.0,
  filmGrain: 0.3,
};
