import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

export function Laptop({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF('/laptop.glb');

  return (
    <RigidBody type="fixed" colliders="cuboid">
      <primitive object={scene} position={position} scale={1.5} rotation={[0, -Math.PI / 4, 0]} />
    </RigidBody>
  );
}

useGLTF.preload('/laptop.glb');
