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
  castShadows: boolean;
  contactShadowOpacity: number;
  contactShadowBlur: number;
}

export const DEFAULT_SCENE_CONFIG: SceneConfig = {
  "showSkeleton": false,
  "ambientLightIntensity": 0.55,
  "ambientLightColor": "#e0e7ff",
  "directionalLightIntensity": 0,
  "directionalLightColor": "#ffffff",
  "directionalLightPositionX": -10,
  "directionalLightPositionY": 18,
  "directionalLightPositionZ": -10,
  "backgroundColor": "#070a14",
  "cameraFov": 48,
  "enableAutoRotate": false,
  "autoRotateSpeed": 1,
  "starCount": 10000,
  "starSpeed": 1.5,
  "saturation": 1.45,
  "brightness": 0.7,
  "contrast": 1.05,
  "filmGrain": 1,
  "castShadows": true,
  "contactShadowOpacity": 1,
  "contactShadowBlur": 10,
  "cameraPositionX": 0,
  "cameraPositionY": 1.4,
  "cameraPositionZ": 1.4531856209042269
};
