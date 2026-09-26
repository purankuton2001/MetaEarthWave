import {EarthStateBridge, useWebSocket} from '../context/WebSocket';
import React, {Suspense, useContext, useRef, VFC} from 'react';
import {OrbitControls} from '@react-three/drei';
import {Canvas} from '@react-three/fiber';
import {Effect} from './Effect';
import Earth from './Earth';
import {Euler, Vector3} from 'three';
import {NoiseShader} from '../../shader/NoiseShader';
import {EarthRotationContext} from '../context/useEarthRotation';
import {WaveAnchorTracker} from './WaveCaption';


export const TCanvas: VFC = () => {
  const earthState = useWebSocket();
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const {state, dispatch} = useContext<any>(EarthRotationContext);

  return (
    <Canvas
      ref={canvasRef}
      camera={{
        position: [0, 0, -1.8],
        near: 0.1,
        far: 2000,
      }}>
      <EarthStateBridge value={earthState}>
      <OrbitControls
        attach="orbitControls"
        autoRotate={earthState.trendWaves.length > 0 && !earthState.theme && !earthState.selectedTrend}
        autoRotateSpeed={.65}
        enableZoom={false}
        enablePan={false}/>
      <Suspense fallback={null}>
        <ambientLight intensity={1} />
        <Earth rotation={state.earthRotation} playing={state.playing} dispatch={dispatch} position={new Vector3(0, 0, 0)}/>
        <mesh
          position={new Vector3(0, 0, 0)}
          scale={3}
          rotation={new Euler(0, Math.PI, 0)}>
          <sphereBufferGeometry />
          <NoiseShader />
        </mesh>
      </Suspense>
      <WaveAnchorTracker />
      <Effect />
      </EarthStateBridge>
    </Canvas>
  );
};
