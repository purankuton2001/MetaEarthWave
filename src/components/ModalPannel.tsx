import React, {useEffect, useState, VFC} from 'react';
import {Icon} from '@chakra-ui/react';
import {AiOutlineClose} from 'react-icons/ai';
import InfoButton from './InfoButton';
import {gsap} from 'gsap';
import {useLanguage} from '../hooks/useLanguage';

import {
  conceptDescription,
  conceptTitle,
  joinDescription,
  joinEmotionMagenta, joinEmotionSkyBlue,
  joinMediumText,
  joinTitle,
} from '../utils/translateText';
import {TwitterLoginButton} from './TwitterLoginButton';


export const ModalPannel: VFC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const language = useLanguage();
  const parmeter = {
    scale: 0.15,
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
            gsap
                .fromTo(
                    '.infoButton',
                    {opacity: 0},
                    {opacity: 1, pointerEvents: 'auto', duration: 3, delay: 1});
          }, 0.1);
        }}>
          <Icon width={12} height={12}
            as={AiOutlineClose} color={'whiteAlpha.500'}/>
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
        <TwitterLoginButton style={{bottom: '3%', position: 'absolute'}} />
      </div>}
      {!modalVisible && <div
        onClick={() => {
          setTimeout(() => {
            setModalVisible(true);
          }, 100);
          gsap.to('.scale', {scale: 0.15, rotate: 0, duration: 0.5});
          gsap.to('.text', {fill: 'url(#d)', duration: 0.5});
          gsap.to('.fill', {fill: '#FFFFFF', duration: 0.5});
          gsap
              .to('.circle',
                  {fill: '#FFFFFF', strokeOpacity: 1, duration: 0.5});
          gsap.set('.infoButton', {pointerEvents: 'none'});
          gsap.to('.infoButton', {opacity: 0, duration: 0.5});
          gsap.to('.modalBackground', {opacity: 0.5, duration: 0.5});
          gsap
              .to('.modalBackground',
                  {x: '-50%',
                    y: '-50%',
                    left: '50%',
                    top: '50%',
                    width: '37.5%',
                    height: '60%',
                    duration: 0.5,
                    delay: 0.5});
          setTimeout(() => {
            gsap.to('.modalPanel',
                {pointerEvents: 'auto', opacity: 1, duration: 3.0});
          }, 1000);
        }}
        onMouseEnter={(event) => {
          if (!modalVisible) {
            gsap.to('.scale', {scale: 0.2, rotate: 360, duration: 0.5});
            gsap.to('.text', {fill: 'white', duration: 0.5});
            gsap.to('.fill', {fill: '#000000', duration: 0.5});
            gsap.to('.circle',
                {fill: '#000000', strokeOpacity: 0, duration: 0.5});
          }
        }}
        onMouseLeave={(event) => {
          setTimeout(() => {
            if (!modalVisible) {
              gsap.to('.scale', {scale: 0.15, rotate: 0, duration: 0.5});
              gsap.to('.text', {fill: 'url(#d)', duration: 0.5});
              gsap.to('.fill', {fill: '#FFFFFF', duration: 0.5});
              gsap.to('.circle',
                  {fill: '#FFFFFF', strokeOpacity: 1, duration: 0.5});
            }
          }, 100);
        }}
        className={'infoButton'}>
        <InfoButton {...parmeter}/>
      </div>}
    </>
  );
};
