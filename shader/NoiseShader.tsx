import React, {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import NoiseFrag from './Noise.frag';
import Fluid from './Fluid.glsl';
import {DoubleSide, Uniform, Vector2} from 'three';
import {useWebSocket} from '../src/context/WebSocket';
import {themeFlowSpeed} from '../src/lib/themes';
export const NoiseShader = () => {
  const {theme} = useWebSocket();
  const speed = useRef(1);
  const uniforms = useMemo(() => ({iResolution: new Uniform(new Vector2(1,1)), iTime: new Uniform(0)}), []);
  useFrame(({size}, delta) => {uniforms.iResolution.value.set(size.width,size.height); speed.current += (themeFlowSpeed(theme) - speed.current)*(1-Math.exp(-delta/4)); uniforms.iTime.value += delta*.6*speed.current;});
  return <shaderMaterial side={DoubleSide} fragmentShader={Fluid+'\n'+NoiseFrag} uniforms={uniforms}/>;
};
