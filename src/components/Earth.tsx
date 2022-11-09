import {OrbitControls, useTexture} from '@react-three/drei';
import {EarthProps} from '../../types/util';
import {useFrame} from '@react-three/fiber';
import {useRef} from 'react';
import {EarthShader} from '../../shader/EarthShader';

export default function Earth({position}: EarthProps) {
  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.y += 0.002;
  });
  return (
    <mesh position={position} ref={ref}>
      <sphereGeometry />
      <EarthShader />
    </mesh>

  );
}
