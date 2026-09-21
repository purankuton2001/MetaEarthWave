import React, {useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import NoiseFrag from './Noise.frag';
import Fluid from './Fluid.glsl';
import {DoubleSide, Uniform, Vector2} from 'three';
export const NoiseShader = () => {
  const uniforms = useMemo(() => ({iResolution: new Uniform(new Vector2(1,1)), iTime: new Uniform(0)}), []);
  useFrame(({size}, delta) => {uniforms.iResolution.value.set(size.width,size.height); uniforms.iTime.value += delta*.6;});
  return <shaderMaterial side={DoubleSide} fragmentShader={Fluid+'\n'+NoiseFrag} uniforms={uniforms}/>;
};
