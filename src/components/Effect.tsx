import {useControls} from 'leva';
import React, {useEffect, useRef, VFC} from 'react';
import {EffectComposer, RenderPass, ShaderPass, GlitchPass, BloomPass} from 'three-stdlib';
import {extend, useFrame, useThree} from '@react-three/fiber';
import {DistortionPass} from './postprocessing/DistortionPass';
import {RipplePass} from './postprocessing/RipplePass';
import * as ReactPostProcessing from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import {Bloom, Glitch} from '@react-three/postprocessing';
import {NoisePass} from './postprocessing/NoisePass';

extend({EffectComposer, ShaderPass, GlitchPass, RenderPass, BloomPass});

export const Effect: VFC = () => {
  const dist_datas = useControls('Distortion', {
    enabled: true,
    progress: {value: 0, min: 0, max: 1, step: 0.01},
    scale: {value: 1, min: 0, max: 5, step: 0.01},
  });

  const ripple_datas = useControls('Ripple', {
    enabled: true,
  });

  const composerRef = useRef<EffectComposer>(null);
  const {gl, scene, camera, size} = useThree();

  useEffect(() => {
      composerRef.current!.setSize(size.width, size.height);
  }, [size]);

  useFrame(() => {
      composerRef.current!.render();
  }, 1);

  return (
    <effectComposer ref={composerRef} args={[gl]}>
      <renderPass attachArray="passes" args={[scene, camera]} />
      <DistortionPass {...dist_datas} />
      <RipplePass {...ripple_datas} />
    </effectComposer>
  );
};
