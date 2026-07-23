export interface SceneConfig {
  showSkeleton: boolean;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  shadowSoftness: number;
  saturation: number;
  filmGrain: number;
  bloomIntensity: number;
  brightness: number;
  contrast: number;
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  showSkeleton: false,
  ambientLightIntensity: 0.8,
  directionalLightIntensity: 1.5,
  shadowSoftness: 2,
  saturation: 1.0,
  filmGrain: 0.15,
  bloomIntensity: 0.1,
  brightness: 0.0,
  contrast: 1.0,
};
