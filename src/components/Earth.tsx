import {EarthProps} from '../../types/util';
import {useFrame} from '@react-three/fiber';
import {useRef} from 'react';
import {EarthShader} from '../../shader/EarthShader';
import {Mesh} from 'three';

export default function Earth({position}: EarthProps) {
  const ref = useRef<Mesh>();
  useFrame(() => {
    if (ref.current) {
      const time = new Date(Date.now());
      const second = time.getSeconds() + time.getMilliseconds()/1000;
      const earthRotation = 2 * Math.PI * second/60;
      ref.current.rotation.y = earthRotation;
    }
  });
  return (
    <mesh position={position} ref={ref}>
      <sphereGeometry />
      <EarthShader />
    </mesh>

  );
}
