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
import {useWindowSize} from '../hooks/useWindowSize';
import {useLanguage} from '../hooks/useLanguage';
import {screenOrientation} from '../utils/translateText';
import {TwitterLoginButton} from '../components/TwitterLoginButton';
import {AuthorPannel} from '../components/AuthorPannel';

export type ModalState = null | string;

const App: NextPage = () => {
  const [playing, setPlaying] = useState<boolean>(false);
  const language = useLanguage();
  const router = useRouter();
  const scrollBottom = useRef<HTMLDivElement>(null!);
  const audio = useRef(new Howl({
    src: '/assets/frozen.wav',
    html5: true,
    loop: true,
  }));
  const {width, height} = useWindowSize();
  useLayoutEffect(() => {
    audio.current.load();
    if (window) {
      setTimeout(function() {
        window.scrollTo(0, 1);
      }, 1);
    }
  }, []);
  useLayoutEffect(() => {
    if (playing) scrollBottom.current?.scrollIntoView();
  }, [playing]);
  const {tweetBox} = router.query;
  const [modalState] = useState<ModalState>(null);
  if (!playing && tweetBox === undefined) {
    return <div style={{width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      justifyContent: 'center'}}>
      <div
        onClick={() => {
          setPlaying(true);
          audio.current.play();
        }}
        style={{
          cursor: 'pointer',
          background: 'black',
          width: '64px',
          height: '64px',
          borderRadius: '32px',
          color: 'white',
          paddingTop: '16px',
          fontSize: '16px',
          textAlign: 'center'}}>
        START
      </div>
    </div>;
  }

  return (
    <>
      {(height < width) && <div
        style={{
          width: '100vw',
          height: '100vh',
          minWidth: '700px',
          minHeight: '420px',
          position: 'relative',
          overflow: 'hidden'}}>
        <PointPannel />
        <MessagePannel modalState={modalState}/>
        <ModalPannel />
        <AuthorPannel />
        <TCanvas />
        <TwitterLoginButton
          style={{position: 'absolute',
            bottom: '10%',
            margin: 'auto',
            left: 0,
            right: 0,
            width: '20%'}} />
        <TweetPannel
          isOpen={Boolean(tweetBox)}
          onOpen={() => {}}
          onClose={() => {
            if (!playing) {
              setPlaying(true);
              audio.current.play();
            }
            router.push('/');
          }} />
        <div
          style={{position: 'absolute', bottom: 0, height: 0, width: '100%'}}
          ref={scrollBottom}
        />
      </div>}
      {(height > width) &&
          <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <div style={{
              textAlign: 'center',
            }}>
              {screenOrientation(language)}
            </div>
          </div>}
    </>
  );
};


// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
export default App;
