import React, {Suspense, useEffect, useRef, VFC} from 'react';
import {OrbitControls, Stats} from '@react-three/drei';
import {Canvas} from '@react-three/fiber';
import {Effect} from './Effect';
import {useWindowSize} from '../hooks/useWindowSize';
import Earth from './Earth';
import {Color, Euler, Uniform, Vector3, WebGLRenderer} from 'three';
import {NoiseShader} from '../../shader/NoiseShader';


export const TCanvas: VFC = () => {
  const {width, height, devicePixelRatio} = useWindowSize();
  const time = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null!);


  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, 0, -1.8],
        near: 0.1,
        far: 2000,
      }}
      dpr={devicePixelRatio}>
      <OrbitControls attach="orbitControls" enableZoom={false} enablePan={false}/>
      <Stats />
      <Suspense fallback={null}>
        <ambientLight />
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
