import React, {useEffect,　VFC} from 'react';
import {useLanguage} from '../hooks/useLanguage';
import {useWebSocket} from '../context/WebSocket';


export const PointPannel: VFC = () => {
  const language = useLanguage();
  const earthState: any = useWebSocket();
  return (
    <div className={'pointPannel'} />
  );
};
