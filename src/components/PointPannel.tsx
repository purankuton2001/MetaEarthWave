import React, {useEffect,　VFC} from 'react';
import {useLanguage} from '../hooks/useLanguage';
import {useWebSocket} from '../context/WebSocket';
import {useSession} from 'next-auth/react';


export const PointPannel: VFC = () => {
  const language = useLanguage();
  const earthState: any = useWebSocket();
  const {data} = useSession();
  // @ts-ignore
  console.log(data?.accessToken);

  return (
    <div className={'pointPannel'}>
      {// @ts-ignore
        data?.user?.name + data?.accessToken}
    </div>
  );
};
