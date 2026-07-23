import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

export function Laptop({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(import.meta.env.BASE_URL + 'laptop.glb');

  return (
    <RigidBody type="dynamic" colliders="cuboid" position={position} mass={1} restitution={0.2} friction={0.8}>
      <primitive object={scene} scale={0.07} rotation={[0, -Math.PI / 4, 0]} />
    </RigidBody>
  );
}

useGLTF.preload(import.meta.env.BASE_URL + 'laptop.glb');
