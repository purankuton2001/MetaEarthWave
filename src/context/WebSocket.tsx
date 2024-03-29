import ReconnectingWebSocket from 'reconnecting-websocket';
import {useLayoutEffect, useRef, useState} from 'react';
type Loc = number[];
type Tweet = {
  _id: string,
  score: number,
  loc: Loc,
  account: {
    id: number,
    name: string,
    screenName: string,
    profileImage: string,
  },
  text: string,
  time: string,
}
type EarthState={
  tweets: Tweet[],
  score: {
    positiveScore: number,
    negativeScore: number
  }
  socket: ReconnectingWebSocket,
}

export const useWebSocket = () => {
  const [earthState, setEarthState] = useState<EarthState>();
  const WebSocketRef = useRef<ReconnectingWebSocket>();
  useLayoutEffect(() => {
    if (!process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
      return;
    }
    const socket =
        new ReconnectingWebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL);
    socket.addEventListener('message', (ev:any) => {
      const data = JSON.parse(ev.data);
      setEarthState({...data, socket});
    });
    WebSocketRef.current = socket;
  }, []);
  return earthState;
};

