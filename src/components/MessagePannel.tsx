import React, {useEffect, VFC} from 'react';
import {Icon} from '@chakra-ui/react';
import {AiOutlineClose} from 'react-icons/ai';
import {gsap} from 'gsap';
import {useWebSocket} from '../context/WebSocket';
import Image from 'next/image';
import {ModalState} from '../pages';
import {FiMessageCircle} from 'react-icons/fi';

type ModalPannelProps = {
  modalState: ModalState,
  changeModalState?: any
}
export const MessagePannel: VFC<ModalPannelProps> = ({modalState}) => {
  const earthState: any = useWebSocket();
  useEffect(() => {
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
          {earthState?.tweets.map((tweet: any, index: number) => {
            return (<div className={'messageItem'} key={index}>
              <div className={'messageHeader'}>
                <Image
                  className={'profileImage'}
                  src={tweet.account.profileImage}
                  width={32}
                  height={32}/>
                <h2 className={'name'}>{tweet.account.name}</h2>
                <div className={'screenName'}>@{tweet.account.screenName}</div>
              </div>
              <div className={'messageText'}>{tweet.text}</div>
            </div>);
          })
          }
        </div>
      </div>
      {modalState === null && <div
        onClick={() => {
          gsap.to('.messagePannel', {x: 0, duration: 0.5});
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
