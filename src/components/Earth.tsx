import {EarthProps} from '../../types/util';
import {useFrame} from '@react-three/fiber';
import {useContext, useRef} from 'react';
import {EarthShader} from '../../shader/EarthShader';
import {Mesh} from 'three';

export default function Earth({position, rotation, playing, dispatch}: EarthProps) {
  const ref = useRef<Mesh>();
  useFrame(() => {
    if (ref.current && playing) {
      const time = new Date(Date.now());
      const second = time.getSeconds() + time.getMilliseconds()/1000;
      dispatch({type: 'SET_ROTATION', payload: 2 * Math.PI * second/60});
      // setEarthRotation(2 * Math.PI * second/60);
      // console.log(earthRotation);
      ref.current.rotation.y = rotation;
    }
  });
  return (
    <mesh position={position} ref={ref}>
      <sphereGeometry />
      <EarthShader />
    </mesh>

  );
}
