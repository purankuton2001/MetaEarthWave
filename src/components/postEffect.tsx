import {useControls} from 'leva';
import React, {useEffect, useRef, VFC} from 'react';
import {EffectComposer, RenderPass, ShaderPass} from 'three-stdlib';
import {extend, useFrame, useThree} from '@react-three/fiber';
import {RipplePass} from '../../postprocessing/RipplePass';
import {DistortionPass} from '../../postprocessing/DistortionPass';

extend({EffectComposer, RenderPass, ShaderPass});

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
    composerRef.current.render();
  } );

  return (
    <effectComposer ref={composerRef} args={[gl]}>
      <renderPass attachArray="passes" args={[scene, camera]} />
      <RipplePass {...rippleDatas} />
      <DistortionPass {...distDatas} />
    </effectComposer>
  );
};
