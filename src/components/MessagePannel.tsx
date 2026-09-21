import React, {useContext, useLayoutEffect, useRef, useState, VFC} from 'react';
import {Icon} from '@chakra-ui/react';
import {AiOutlineClose} from 'react-icons/ai';
import {gsap} from 'gsap';
import {useWebSocket} from '../context/WebSocket';
import Image from 'next/image';
import {ModalState} from '../pages';
import {axes, labels, colors} from '../lib/waveEmotion';
import {FiMessageCircle} from 'react-icons/fi';
import {hex2rgb, mix, rgb2hex} from '../utils';
import {EarthRotationContext} from '../context/useEarthRotation';

type ModalPannelProps = {
  modalState: ModalState,
  changeModalState?: any
}
export const MessagePannel: VFC<ModalPannelProps> = ({modalState}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const earthState = useWebSocket();
  const messageList = useRef<HTMLDivElement>(null!);
  const {dispatch} = useContext<any>(EarthRotationContext);
  useLayoutEffect(() => {
    gsap.set('.messagePannel', {x: '100%'});
  }, []);
  return (
    <>
      <div className={'messagePannel'}>
        <div className={'messageCloseButton'} onClick={() => {
          gsap.to('.messagePannel', {x: '100%', duration: 0.5});
        }}>
          <Icon
            width={10}
            height={10}
            as={AiOutlineClose}
            color={'whiteAlpha.500'}/>
        </div>
        <div className={'messageList'}>
          {!loading && earthState?.tweets.map((tweet, index) => {
            return (<div className={'messageItem'} key={tweet._id} onClick={() => {
              dispatch({type: 'TOGGLE_PLAYING'});
              // console.log(playing);
            }}>
              <div className={'messageHeader'}>
                <Image
                  className={'profileImage'}
                  src={tweet.account.profileImage}
                  width={32}
                  height={32} alt=""/>
                <h2 className={'name'}>{tweet.account.name}</h2>
                <div style={{color: rgb2hex(mix(hex2rgb('#00E0FF'),
                    hex2rgb('#FF00E5'), (tweet.score+1)/2))}}>{Math.floor(tweet.score * 100)}</div>
              </div>
              <div className={'messageText'}>{tweet.text}</div>
              {tweet.emotions && <div style={{fontSize: 12, marginTop: 8, color: 'white'}}>
                <div>{tweet.themeTitle && `「${tweet.themeTitle}」 · `}{tweet.cityName} · Jev 推定 · この画面のみ</div>
                {axes.map(axis => <label key={axis} style={{color: colors[axis], display: 'block', marginTop: 10}} onClick={event => event.stopPropagation()}>
                  {labels[axis]} {Math.round(tweet.emotions![axis] * 100)}
                </label>)}
                <p style={{marginTop: 12, lineHeight: 1.6}}>喜びは浮かぶ流れ、悲しみは沈む流れ、怒りは強い渦、不安は細かな揺らぎ、共感は緩やかに混ざる流れ。感情の強さに合わせて混ざります。</p>
              </div>}
            </div>);
          })
          }
          <div className={'messageListBottom'} ref={messageList} />
        </div>
      </div>
      {modalState === null && <div
        onClick={() => {
          setLoading(true);
          gsap.to('.messagePannel', {x: 0, duration: 0.5});
          setTimeout(() => {
            setLoading(false);
            messageList.current.scrollIntoView();
          }, 500);
        }}
        onMouseEnter={(event) => {
          gsap.to('.messageButton', {scale: 1.3, duration: 0.5});
        }}
        onMouseLeave={(event) => {
          gsap.to('.messageButton', {scale: 1, duration: 0.5});
        }}
        role="button" tabIndex={0} aria-label="投稿一覧を開く" onKeyDown={event => {if (event.key === 'Enter' || event.key === ' ') {event.preventDefault(); event.currentTarget.click();}}}
        className={'messageButton'}>
        <Icon as={FiMessageCircle} width={14} height={14} color={'gray.200'}/>
      </div>}
    </>
  );
};
