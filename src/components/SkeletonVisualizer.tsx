import { useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SkeletonVisualizerProps {
  root: THREE.Object3D;
  visible?: boolean;
}

export function SkeletonVisualizer({ root, visible = true }: SkeletonVisualizerProps) {
  const helper = useMemo(() => {
    if (!root || !visible) return null;
    const h = new THREE.SkeletonHelper(root);
    if (h.material instanceof THREE.LineBasicMaterial) {
      h.material.linewidth = 2;
      h.material.depthTest = false; // Render on top of the avatar mesh
      h.material.transparent = true;
      h.material.opacity = 1.0;
      h.material.color = new THREE.Color('#38bdf8'); // Minimalist sleek sky-blue
    }
    return h;
  }, [root, visible]);

  useEffect(() => {
    return () => {
      if (helper) {
        helper.dispose();
      }
    };
  }, [helper]);

  useFrame(() => {
    if (helper && visible) {
      (helper as any).update?.();
      helper.updateMatrixWorld(true);
    }
  });

  if (!visible || !helper) return null;

  return <primitive object={helper} />;
}

