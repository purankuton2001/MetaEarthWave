import {ParticleProps} from '../../types/util';
import {useMemo} from 'react';
import {PlaneGeometry, SphereGeometry} from 'three';

export default function Particle({position}: ParticleProps) {
  const planePositions = useMemo(() => {
    const planeGeometry = new PlaneGeometry(6, 6, 128, 128);
    const positions = planeGeometry.attributes.position.array;
    return positions;
  }, []);

  return (
    <points position={position} rotation={[-Math.PI / 2, 0, 0]}>
      {/* <bufferGeometry attach={'geometry'}>*/}
      {/*  <bufferAttribute*/}
      {/*    attach="attributes-position"*/}
      {/*    array={planePositions}*/}
      {/*    itemSize={3}*/}
      {/*    count={planePositions.length / 3}*/}
      {/*  />*/}
      {/* </bufferGeometry>*/}
      <sphereGeometry />
      <pointsMaterial size={0.1} color={'black'}/>
    </points>

  );
}
