import React, {useEffect, useRef, useState} from 'react';
type Loc = number[];
type Tweet = {
  _id: string,
  score: number,
  loc: Loc[],
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
    participants: number,
    positiveScore: number,
    negativeScore: number
  }
}

export const useWebSocket = () => {
  const [earthState, setEarthState] = useState<EarthState>();
  const WebSoecketRef = useRef<WebSocket>();
  useEffect(() => {
    const socket = new WebSocket('ws://meta-earth-wave-backend.herokuapp.com');
    socket.addEventListener('message', (ev) => {
      const data = JSON.parse(ev.data);
      setEarthState(data);
      console.log(data);
    });
    WebSoecketRef.current = socket;
  }, []);
  console.log(earthState);
  return earthState;
};

