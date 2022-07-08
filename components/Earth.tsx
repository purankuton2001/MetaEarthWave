import {useTexture} from '@react-three/drei';

export default function Earth({position}) {
  const colorMap = useTexture('earth.jpg');
  return (
    <mesh position={position}>
      <sphereGeometry />
      <meshStandardMaterial map={colorMap}/>
    </mesh>
  );
}
