import React, {useMemo, useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import EarthFrag from './Earth.frag';
import Fluid from './Fluid.glsl';
import EarthVert from './Earth.vert';
import {Color, ShaderMaterial, Uniform, Vector2, Vector3, Vector4} from 'three';
import {useTexture} from '@react-three/drei';
import {useWebSocket} from '../src/context/WebSocket';
import {translateGeoCoords} from '../src/utils';
import {themeFlowSpeed} from '../src/lib/themes';
import {axes, colors, Emotions} from '../src/lib/waveEmotion';

export const EarthShader = () => {
  const earthTexture = useTexture('earth_light.jpg');
  const earthState = useWebSocket();
  const flowSpeed = useRef(1);
  const shaderRef = useRef<ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    iResolution: new Uniform(new Vector2(1, 1)), iTime: new Uniform(0), waveTime: new Uniform(0), earthTexture: new Uniform(earthTexture),
    waves: new Uniform(Array.from({length: 20}, () => new Vector4(0, 0, 0, -2))),
    emotionColors: new Uniform(Array.from({length: 20}, () => new Vector4(0, 0, 0, 0))),
    waveKinds: new Uniform(Array(20).fill(-1)),
    waveAges: new Uniform(Array(20).fill(0)),
    waveTravelAges: new Uniform(Array(20).fill(0)),
    waveWeights: new Uniform(Array(20).fill(1)),
  }), [earthTexture]);
  useFrame(({size}, delta) => {
    if (!shaderRef.current) return;
    flowSpeed.current += (themeFlowSpeed(earthState.theme) - flowSpeed.current) * (1 - Math.exp(-delta / 4));
    uniforms.iTime.value += delta * .6 * flowSpeed.current;
    uniforms.waveTime.value += delta * .6;
    uniforms.iResolution.value.set(size.width, size.height);
    const report = earthState.theme && Date.now() - Date.parse(earthState.theme.updatedAt) < 30 * 60 * 1000 ? earthState.theme : null;
    const groups = report?.groups.slice(0, 3) || [];
    // Keep room for the theme and at least one complete personal emotion blend.
    let capacity = 20 - groups.reduce((sum, group) => sum + axes.filter(axis => group.emotions[axis] > 0).length, 0);
    let index = 0;
    const put = (center: Vector3, strength: number, age: number, kind = -1, weight = 1) => {
      if (index >= capacity) return;
      uniforms.waves.value[index].set(center.x, center.y, center.z, strength);
      if (kind >= 0) {const c = new Color(colors[axes[kind]]); uniforms.emotionColors.value[index].set(c.r, c.g, c.b, 1);}
      else uniforms.emotionColors.value[index].set(0, 0, 0, 0);
      uniforms.waveKinds.value[index] = kind;
      uniforms.waveAges.value[index] = age;
      uniforms.waveTravelAges.value[index] = age;
      uniforms.waveWeights.value[index] = weight;
      index++;
    };
    const putBlend = (center: Vector3, emotions: Emotions, age: number) => {
      const strength = Math.max(...axes.map(axis => emotions[axis]));
      const total = axes.reduce((sum, axis) => sum + emotions[axis], 0);
      const active = axes.filter(axis => emotions[axis] > 0);
      // Never drop just one part of a blend when the buffer is full.
      if (!strength || index + active.length > capacity) return;
      active.forEach(axis => put(center, strength, age, axes.indexOf(axis), emotions[axis] / Math.max(1, total)));
    };
    const now = Date.now();
    earthState.tweets
      .filter(tweet => Date.parse(tweet.time) >= now - 60000 && Date.parse(tweet.time) <= now &&
        tweet.loc?.length >= 2 && Number.isFinite(tweet.loc[0]) && Math.abs(tweet.loc[0]) <= 90 &&
        Number.isFinite(tweet.loc[1]) && Math.abs(tweet.loc[1]) <= 180 && Number.isFinite(tweet.score))
      .sort((a, b) => Date.parse(b.time) - Date.parse(a.time))
      .slice(0, 20).forEach(tweet => {
        const center = translateGeoCoords(tweet.loc[0], tweet.loc[1], 1);
        const age = Math.max(0, (now - Date.parse(tweet.time)) / 1000);
        if (tweet.emotions) putBlend(center, tweet.emotions, age);
        else put(center, Math.max(-1, Math.min(1, tweet.score)), age);
      });
    // Aggregate groups are an ongoing visualization of a dated sample, not new posts.
    capacity = 20;
    if (report) {
      groups.forEach(group => {
        putBlend(translateGeoCoords(group.latitude, group.longitude, 1), group.emotions, 12);
      });
    }
    for (; index < 20; index++) uniforms.waves.value[index].set(0, 0, 0, -2);
  });
  return <shaderMaterial ref={shaderRef} fragmentShader={Fluid+'\n'+EarthFrag} vertexShader={EarthVert} uniforms={uniforms}/>;
};
