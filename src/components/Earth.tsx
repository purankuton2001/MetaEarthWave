import {EarthProps} from '../../types/util';
import {useFrame, useThree} from '@react-three/fiber';
import {useEffect, useRef} from 'react';
import {EarthShader} from '../../shader/EarthShader';
import {Mesh, Vector3} from 'three';

import {useWebSocket} from '../context/WebSocket';
import {translateGeoCoords} from '../utils';

export default function Earth({position, rotation, playing, dispatch}: EarthProps) {
  const ref = useRef<Mesh>();
  const {theme, focusGroup, focusRevision} = useWebSocket();
  const {camera} = useThree();
  const group = theme?.groups.find(item => item.id === focusGroup) || theme?.groups[0];
  useEffect(() => {
    if (!ref.current) return;
    if (!group) {ref.current.rotation.set(0, rotation, 0); return;}
    const origin = translateGeoCoords(group.latitude, group.longitude, 1).normalize();
    const facing = camera.getWorldPosition(new Vector3()).sub(position).normalize();
    ref.current.quaternion.setFromUnitVectors(origin, facing);
  }, [focusRevision, theme?.theme.id, group?.id, group?.latitude, group?.longitude]);
  useFrame(() => {
    if (ref.current && playing && !theme) {
      const time = new Date(Date.now());
      const second = time.getSeconds() + time.getMilliseconds()/1000;
      dispatch({type: 'SET_ROTATION', payload: 2 * Math.PI * second/60});
      // setEarthRotation(2 * Math.PI * second/60);
      // console.log(earthRotation);
      ref.current.rotation.y = rotation;
    }
  });
  return (
    <mesh name="emotion-earth" position={position} ref={ref}>
      <sphereGeometry />
      <EarthShader />
    </mesh>

  );
}
