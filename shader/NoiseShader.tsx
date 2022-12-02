import {useControls} from 'leva';
import React, {useEffect, useMemo, useRef, VFC} from 'react';
import {ShaderPass} from 'three-stdlib';
import {extend, useFrame} from '@react-three/fiber';
import NoiseFrag from './Noise.frag';
import {DoubleSide, ShaderMaterial, Uniform, Vector2} from 'three';
import {useWindowSize} from '../src/hooks/useWindowSize';


export const NoiseShader = () => {
  // const uniforms = useControls('Noise', {
  //   displaceForce: {value: 0.1, min: 0, max: 1, step: 0.01},
  //   period: {value: 9, min: 0, max: 10, step: 0.01},
  //   timeSpeed: {value: 4, min: 0, max: 10, step: 0.01},
  // });
  const {width, height} = useWindowSize();
  const shaderRef = useRef<ShaderMaterial>(null!);
  if (shaderRef.current) {
  shaderRef.current!.uniforms.iResolution.value = new Vector2(width, height);
  }
  useFrame(() => {
     shaderRef.current!.uniforms.iTime.value += 0.01 * 4;
  });
  // useEffect(() => {
  //   shaderRef.current!.uniforms.displaceForce.value = uniforms.displaceForce;
  //   shaderRef.current!.uniforms.period.value = uniforms.period;
  // }, [uniforms]);

  return useMemo(() =>
    <shaderMaterial
      side={DoubleSide}
      ref={shaderRef}
      fragmentShader={NoiseFrag}
      uniforms={
        {iResolution: new Uniform(new Vector2(0, 0)),
          iTime: new Uniform(0.0),
          displaceForce: new Uniform(0.1),
          period: new Uniform(9),
        }}
    />, [],
  );
};

