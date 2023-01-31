import React, {Suspense, useRef, VFC} from 'react';
import {OrbitControls, Stats} from '@react-three/drei';
import {Canvas} from '@react-three/fiber';
import {Effect} from './Effect';
import Earth from './Earth';
import {Euler, Vector3} from 'three';
import {NoiseShader} from '../../shader/NoiseShader';
import {ParticleSystem} from './ParticleSystem';


export const TCanvas: VFC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null!);


  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, 0, -1.8],
        near: 0.1,
        far: 2000,
      }}>
      <OrbitControls attach="orbitControls" enableZoom={false} enablePan={false}/>
      <Stats />
      <Suspense fallback={null}>
        <ambientLight intensity={1} />
        <Earth position={new Vector3(0, 0, 0)}/>
        <mesh
          position={new Vector3(0, 0, 0)}
          scale={3}
          rotation={new Euler(0, Math.PI, 0)}>
          <sphereBufferGeometry />
          <NoiseShader />
        </mesh>
      </Suspense>
      <Effect />
    </Canvas>
  );
};
