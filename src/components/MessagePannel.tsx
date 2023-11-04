import React, {useContext, useLayoutEffect, useRef, useState, VFC} from 'react';
import {Icon} from '@chakra-ui/react';
import {AiOutlineClose} from 'react-icons/ai';
import {gsap} from 'gsap';
import {useWebSocket} from '../context/WebSocket';
import Image from 'next/image';
import {ModalState} from '../pages';
import {FiMessageCircle} from 'react-icons/fi';
import {hex2rgb, mix, rgb2hex} from '../utils';
import {EarthRotationContext, useEarthRotation} from '../context/useEarthRotation';

type ModalPannelProps = {
  modalState: ModalState,
  changeModalState?: any
}
export const MessagePannel: VFC<ModalPannelProps> = ({modalState}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const earthState: any = useWebSocket();
  const messageList = useRef<HTMLDivElement>(null!);
  const {dispatch} = useContext(EarthRotationContext);
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
          {!loading && earthState?.tweets.map((tweet: any, index: number) => {
            return (<div className={'messageItem'} key={index} onClick={() => {
              dispatch({type: 'TOGGLE_PLAYING'});
              // console.log(playing);
            }}>
              <div className={'messageHeader'}>
                <Image
                  className={'profileImage'}
                  src={tweet.account.profileImage}
                  width={32}
                  height={32}/>
                <h2 className={'name'}>{tweet.account.name}</h2>
                <div style={{color: rgb2hex(mix(hex2rgb('#00E0FF'),
                    hex2rgb('#FF00E5'), (tweet.score+1)/2))}}>{Math.floor(tweet.score * 100)}</div>
              </div>
              <div className={'messageText'}>{tweet.text}</div>
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
        className={'messageButton'}>
        <Icon as={FiMessageCircle} width={14} height={14} color={'gray.200'}/>
      </div>}
    </>
  );
};
