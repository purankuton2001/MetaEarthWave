import React, {useEffect, useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import EarthFrag from './Earth.frag';
import EarthVert from './Earth.vert';
import {ShaderMaterial, Uniform, Vector2, Vector3, Vector4} from 'three';
import {useWindowSize} from '../src/hooks/useWindowSize';
import {useTexture} from '@react-three/drei';
import {useWebSocket} from '../src/context/WebSocket';
import {translateGeoCoords} from '../src/utils';


export const EarthShader = () => {
  const earthTexture = useTexture('earth_light.jpg');
  let waveValue = 0;
  const earthState = useWebSocket();
  const shaderRef = useRef<ShaderMaterial>(null!);
  const {width, height} = useWindowSize();


  useEffect(() => {
    const now = new Date();
    const limitTime = now.setMonth(now.getMonth() - 1);

    earthState?.tweets.forEach(({score, loc, time}) => {
      if (Date.parse(time) >= limitTime && loc) {
        addWave(loc[0], loc[1], score);
      }
    });
  }, [earthState]); // 一分前までのツイートを抽出して波を発生させる関数を呼ぶ
  if (shaderRef.current) {
  shaderRef.current!.uniforms.iResolution.value = new Vector2(width, height);
  }
  useFrame(() => {
     shaderRef.current!.uniforms.iTime.value += 0.01;
  });


  const addWave = (latitude: number, longitude: number, score: number) => {
    if (shaderRef.current && waveValue <= 20) {
      const newWave = shaderRef.current.uniforms.waves.value;
      const wavePostion = translateGeoCoords(latitude, longitude, 1);
      newWave[waveValue] = new Vector4(wavePostion.x, wavePostion.y, wavePostion.z, score);
      shaderRef.current.uniforms.waves.value = newWave;

      waveValue++;
      setTimeout(() => {
        const newWave = shaderRef.current.uniforms.waves.value;
        const waveIndex = newWave.findIndex((element: any) => {
          return element.x !== -2;
        });
        newWave[waveIndex] = new Vector3(-2);
        shaderRef.current.uniforms.waves.value = newWave;
        waveValue--;
      }, 60000);// 規定時間後に波を消す
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
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
              new Vector4(0, 0, 0, -2),
            ]),
        }}
    />, [],
  );
};

