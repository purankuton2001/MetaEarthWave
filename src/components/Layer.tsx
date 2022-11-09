import React, {useRef} from 'react';
import {Scene} from 'three';
import {useFrame} from '@react-three/fiber';
import {LayerProps} from '../../types/util';

export default function Layer({layer, children}: LayerProps) {
  const sceneRef = useRef<Scene>(null!);

  useFrame(({gl, camera}) => {
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(sceneRef.current, camera);
  }, layer);

  return <scene ref={sceneRef}>{children}</scene>;
};
