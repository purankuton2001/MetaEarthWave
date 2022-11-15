import React, {useEffect, useRef, useState, VFC} from 'react';
import {Icon} from '@chakra-ui/react';
import {AiOutlineClose} from 'react-icons/ai';
import {IoEarth} from 'react-icons/io5';
import InfoButton from './InfoButton';
import {gsap} from 'gsap';
import {useLanguage} from '../hooks/useLanguage';
import {signIn, useSession} from 'next-auth/react';
import {useWebSocket} from '../context/WebSocket';
import {Alert} from '@reach/alert';


export const ModalPannel: VFC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const language = useLanguage();
  const parmeter = {
    scale: 0.15,
  };


  function conceptTitle(lang: string) {
    switch (lang) {
      case 'ja':
        return 'コンセプト';
      default:
        return 'Concept';
    }
  };
  function conceptDescription(lang: string) {
    switch (lang) {
      case 'ja':
        return 'インターネット,SNS,メタバース上では' +
            '価値観,国籍,ジェンダー,社会的地位,人種,思想を問わず' +
            '様々なコミュニケーションがされている。' +
            'それによって、あらゆる波が生まれ、' +
            '世界各地で出会うはずのないものが混ざり合っている。' +
            'それによって生じる共感,希望,革新, そして、混乱,分断,衝突すらも' +
            'しなやかに受け流す流体の世界を描いた';
      default:
        return 'On the Internet, SNS, and metaverse, people communicate with ' +
            'each other regardless of values, nationality, gender, social status, ' +
            'race, or ideology. This creates various waves and mixes things that ' +
            'would never have met elsewhere. It depicts a fluid world of empathy, hope, ' +
            'innovation, and a supple acceptance of confusion, division, and even conflict.';
    }
  };
  function joinTitle(lang: string) {
    switch (lang) {
      case 'ja':
        return '参加しよう!';
      default:
        return 'Join!';
    }
  };

  function joinDescription(lang: string) {
    switch (lang) {
      case 'ja':
        return 'このサイトのリンクを貼ってあなたのいる場所の地理タグを付けてツイートするとその場所から波が生じます!';
      default:
        return 'Tweet a link to this site with your current location geo-tagged and a wave will be generated from that location!';
    }
  };
  function joinMediumText(lang: string) {
    switch (lang) {
      case 'ja':
        return 'ツイートの内容をAIが感情分析';
      default:
        return 'AI analyzes the content of tweets for emotion';
    }
  };
  function joinEmotionSkyBlue(lang: string) {
    switch (lang) {
      case 'ja':
        return '＋ : スカイブルー';
      default:
        return '+ : SkyBlue';
    }
  };

  function joinEmotionMagenta(lang: string) {
    switch (lang) {
      case 'ja':
        return '－ : マゼンタ';
      default:
        return '－ : Magenta';
    }
  };
  function tweetButton(lang: string) {
    switch (lang) {
      case 'ja':
        return '波を生み出す';
      default:
        return 'Creating Waves';
    }
  };

  useEffect(() => {
    gsap.set('.scale', {x: 12, y: 12, transformOrigin: '50% 50%'});
  }, [modalVisible]);

  return (
    <>
      <div className={'modalBackground'}/>
      {modalVisible && <div className={'modalPanel'}>
        <div className={'closeButton'} onClick={() => {
          setModalVisible(false);
          gsap.set('.modalBackground', {
            opacity: 0,
            scale: 1.33,
            x: 0,
            y: 0,
            left: 'auto',
            top: 'auto',
            width: '50px',
            height: '50px',
            right: '50px',
            bottom: '42px'});
          setTimeout(() => {
            gsap.fromTo('.infoButton', {opacity: 0}, {opacity: 1, pointerEvents: 'auto', duration: 3, delay: 1});
          }, 0.1);
        }}>
          <Icon width={12} height={12} as={AiOutlineClose} color={'whiteAlpha.500'}/>
        </div>
        <h2 className={'modalTitle'}>{conceptTitle(language)}</h2>
        <div className={'modalText'}>{conceptDescription(language)}</div>
        <h2 className={'modalTitle'}>{joinTitle(language)}</h2>
        <div className={'modalText2'}>{joinDescription(language)}</div>
        <div className={'modalMediamText'}>{joinMediumText(language)}</div>
        <div className={'modalEmotion lightBlue'}>
          {joinEmotionSkyBlue(language)}
        </div>
        <div className={'modalEmotion magenta'}>
          {joinEmotionMagenta(language)}
        </div>
        <div onClick={() => signIn('twitter', {callbackUrl: '/?tweetBox=true'})}
          className={'tweetButton'}>
          {tweetButton(language)}
        </div>
      </div>}
      {!modalVisible && <div
        onClick={() => {
          setTimeout(() => {
            setModalVisible(true);
          }, 100);
          gsap.to('.scale', {scale: 0.15, rotate: 0, duration: 0.5});
          gsap.to('.text', {fill: 'url(#d)', duration: 0.5});
          gsap.to('.fill', {fill: '#FFFFFF', duration: 0.5});
          gsap.to('.circle', {fill: '#FFFFFF', strokeOpacity: 1, duration: 0.5});
          gsap.set('.infoButton', {pointerEvents: 'none'});
          gsap.to('.infoButton', {opacity: 0, duration: 0.5});
          gsap.to('.modalBackground', {opacity: 0.5, duration: 0.5});
          gsap.to('.modalBackground', {x: '-50%', y: '-50%', left: '50%', top: '50%', width: '30%', height: '60%', duration: 0.5, delay: 0.5});
          setTimeout(() => {
            gsap.to('.modalPanel', {pointerEvents: 'auto', opacity: 1, duration: 3.0});
          }, 1000);
        }}
        onMouseEnter={(event) => {
          if (!modalVisible) {
            gsap.to('.scale', {scale: 0.2, rotate: 360, duration: 0.5});
            gsap.to('.text', {fill: 'white', duration: 0.5});
            gsap.to('.fill', {fill: '#000000', duration: 0.5});
            gsap.to('.circle', {fill: '#000000', strokeOpacity: 0, duration: 0.5});
          }
        }}
        onMouseLeave={(event) => {
          setTimeout(() => {
            if (!modalVisible) {
              gsap.to('.scale', {scale: 0.15, rotate: 0, duration: 0.5});
              gsap.to('.text', {fill: 'url(#d)', duration: 0.5});
              gsap.to('.fill', {fill: '#FFFFFF', duration: 0.5});
              gsap.to('.circle', {fill: '#FFFFFF', strokeOpacity: 1, duration: 0.5});
            }
          }, 100);
        }}
        className={'infoButton'}>
        <InfoButton {...parmeter}/>
      </div>}
    </>
  );
};
