import reportWebVitals from '../reportWebVitals';
import React, {useLayoutEffect, useRef, useState} from 'react';
import {TCanvas} from '../components/TCanvas';
import {NextPage} from 'next';
import {ModalPannel} from '../components/ModalPannel';
import {MessagePannel} from '../components/MessagePannel';
import {PointPannel} from '../components/PointPannel';
import {useRouter} from 'next/router';
import {TweetPannel} from '../components/TweetPannel';
// @ts-ignore
import {Howl} from 'howler';

export type ModalState = null | string;

const App: NextPage = () => {
  const [direction, setDirection] = useState<number>();
  useLayoutEffect(() => {
    addEventListener('orientationchange', () => {
      if (screen?.orientation?.angle) setDirection(Math.abs(screen.orientation.angle));
    });
  }, []);
  const router = useRouter();
  const audio = useRef(new Howl({
    src: '/assets/frozen.wav',
    html5: true,
    loop: true,
  }));
  useLayoutEffect(() => {
    audio.current.on('load', () => {
      console.log(audio.current.playing());
    });
    audio.current.load();
  }, []);
  const {tweetBox} = router.query;
  const [modalState] = useState<ModalState>(null);

  return (
    <>
      <div>
        {Math.abs(direction)}
      </div>
      {(!direction || direction === 90) && <div
        style={{
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'}}>
        <PointPannel />
        <MessagePannel modalState={modalState}/>
        <ModalPannel />
        <TCanvas />
        <TweetPannel
          isOpen={Boolean(tweetBox)}
          onOpen={() => {}}
          onClose={() => {
            router.push('/');
          }} />
      </div>}
      {(direction === 0) && <div>
        縦向き
      </div>}
    </>
  );
};


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
export default App;
