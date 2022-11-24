import React, {useEffect, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import EarthFrag from './Earth.frag';
import EarthVert from './Earth.vert';
import {ShaderMaterial, Uniform, Vector2, Vector3, Vector4} from 'three';
import {useWindowSize} from '../src/hooks/useWindowSize';
import {useTexture} from '@react-three/drei';
import {useWebSocket} from '../src/context/WebSocket';


export const EarthShader = () => {
  const earthTexture = useTexture('earth.jpg');
  let waveValue = 0;
  const earthState = useWebSocket();
  const shaderRef = useRef<ShaderMaterial>(null!);

  useEffect(() => {
    const now = new Date();
    const limitTime = now.setMinutes(now.getMinutes() - 1);
    earthState?.tweets.forEach(({score, loc, time}) => {
      if (Date.parse(time) >= limitTime) {
        addWave(loc[1], loc[0], score);
      }
    });
  }, [earthState]);
  // const uniforms = useControls('Noise', {
  //   displaceForce: {value: 0.1, min: 0, max: 1, step: 0.01},
  //   period: {value: 9, min: 0, max: 10, step: 0.01},
  //   timeSpeed: {value: 4, min: 0, max: 10, step: 0.01},
  // });
  const {width, height} = useWindowSize();
  if (shaderRef.current) {
  shaderRef.current!.uniforms.iResolution.value = new Vector2(width, height);
  }
  useFrame(() => {
     shaderRef.current!.uniforms.iTime.value += 0.01;
  });
  const translateGeoCoords = (latitude: number, longitude: number, radius: number, score: number) => {
    // 仰角
    const phi = latitude * Math.PI / 180;
    // 方位角
    const theta = (longitude - 180) * Math.PI / 180;

    const x = -1 * radius * Math.cos(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi);
    const z = radius * Math.cos(phi) * Math.sin(theta);

    return new Vector4(score, x, y, z);
  };

  const addWave = (latitude: number, longitude: number, score: number) => {
    if (shaderRef.current && waveValue <= 20) {
      const newWave = shaderRef.current.uniforms.waves.value;
      newWave[waveValue] = translateGeoCoords(latitude, longitude, 1, score);
      shaderRef.current.uniforms.waves.value = newWave;
      console.log(newWave);
      setTimeout(() => {
        const newWave = shaderRef.current.uniforms.waves.value;
        const waveIndex = newWave.findIndex((element: any) => {
          return element.x !== -2;
        });
        newWave[waveIndex] = new Vector3(-2);
        shaderRef.current.uniforms.waves.value = newWave;
        waveValue--;
      }, 60000);
      waveValue++;
    }
  };


  return useMemo(() =>
    <shaderMaterial
      ref={shaderRef}
      fragmentShader={EarthFrag}
      vertexShader={EarthVert}
      uniforms={
        {iResolution: new Uniform(new Vector2(0, 0)),
          iTime: new Uniform(0.0),
          earthTexture: new Uniform(earthTexture),
          period: new Uniform(5),
          displaceForce: new Uniform(0.3),
          waves:
            new Uniform([
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
              new Vector4(-2, 0, 0, 0),
            ]),
        }}
    />, [],
  );
};

