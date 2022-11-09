import {useControls} from 'leva';
import React, {useEffect, useRef, VFC} from 'react';
import {EffectComposer, RenderPass, ShaderPass, GlitchPass, BloomPass} from 'three-stdlib';
import {extend, useFrame, useThree} from '@react-three/fiber';
import {DistortionPass} from './postprocessing/DistortionPass';
import {RipplePass} from './postprocessing/RipplePass';


extend({EffectComposer, ShaderPass, GlitchPass, RenderPass, BloomPass});

export const Effect: VFC = () => {
  const distDatas = useControls('Distortion', {
    enabled: true,
    progress: {value: 0, min: 0, max: 1, step: 0.01},
    scale: {value: 1, min: 0, max: 5, step: 0.01},
  });

  const rippleDatas = useControls('Ripple', {
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
      <DistortionPass {...distDatas} />
      <RipplePass {...rippleDatas} />
    </effectComposer>
  );
};
