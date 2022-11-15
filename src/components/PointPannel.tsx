import React, {useEffect,　VFC} from 'react';
import {useLanguage} from '../hooks/useLanguage';
import {useWebSocket} from '../context/WebSocket';


export const PointPannel: VFC = () => {
  const language = useLanguage();
  const earthState: any = useWebSocket();
  // @ts-ignore

  return (
    <div className={'pointPannel'}>
    </div>
  );
};

