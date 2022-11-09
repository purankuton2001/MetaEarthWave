import React, {useMemo, forwardRef, useRef, useEffect} from 'react';
import {ExternalForceEffect} from './externalForceEffect';

// eslint-disable-next-line react/display-name
const ExternalForce = forwardRef(({velocity, force, fboSize, mousePos}, ref) => {
  const effect =
      useMemo(() => new ExternalForceEffect(velocity, force, fboSize, mousePos),
          [ExternalForceEffect]);
  effect.setMousePos(mousePos);
  effect.setForce(force);
  effect.setFboSize(fboSize);
  return <primitive object={effect} ref={ref} dispose={null}/>;
});

export default ExternalForce;
