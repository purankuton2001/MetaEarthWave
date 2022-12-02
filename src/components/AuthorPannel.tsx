import React, {useEffect, useState, VFC} from 'react';
import {Icon} from '@chakra-ui/react';
import {AiOutlineClose} from 'react-icons/ai';
import {MdOutlineSupervisedUserCircle, MdSupervisedUserCircle, MdSupervisorAccount} from 'react-icons/md';
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
import {AuthorCard} from './AuthorCard';


export const AuthorPannel: VFC = () => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <div className={'authorBackground'}/>
      {modalVisible && <div className={'authorPanel'}>
        <div className={'closeButton'} onClick={() => {
          setModalVisible(false);
          gsap.set('.authorBackground', {
            opacity: 0,
            width: '50px',
            height: '50px'});
          setTimeout(() => {
            gsap
                .fromTo(
                    '.superviseButton',
                    {opacity: 0},
                    {opacity: 1, pointerEvents: 'auto', duration: 3, delay: 1});
          }, 0.1);
        }}>
          <Icon width={12} height={12} as={AiOutlineClose} color={'whiteAlpha.500'}/>
        </div>
        <h2 className={'authorTitle'}>Creators</h2>
        <div className={'authorList'}>
          <AuthorCard
            twitter={'https://twitter.com/plankton_2022'}
            instagram={'https://www.instagram.com/metankton__2022'}
            image={'/assets/images/plankton_profile.jpg'}
            name={'Plankton'}
            profession={'DigitalCreator'} />
          <AuthorCard
            instagram={'https://www.instagram.com/domori__/'}
            image={'/assets/images/domori_profile.jpg'}
            name={'Domori'} profession={'SoundCreator'} />
        </div>
      </div>
      }
      {!modalVisible && <div
        onClick={() => {
          setTimeout(() => {
            setModalVisible(true);
          }, 100);
          gsap.set('.superviseButton', {pointerEvents: 'none'});
          gsap.to('.supervisedButton', {opacity: 0, duration: 0.5});
          gsap.to('.authorBackground', {opacity: 0.5, duration: 0.5});
          gsap.to('.authorBackground', {width: '40%', height: '60%', duration: 0.5, delay: 0.5});
          setTimeout(() => {
            gsap.to('.authorPanel', {pointerEvents: 'auto', opacity: 1, duration: 3.0});
          }, 1000);
        }}
        onMouseEnter={(event) => {
          gsap.to('.supervisedButton', {scale: 1.3, duration: 0.5});
        }}
        onMouseLeave={(event) => {
          gsap.to('.supervisedButton', {scale: 1, duration: 0.5});
        }}
        className={'supervisedButton'}>
        <Icon as={MdOutlineSupervisedUserCircle}
          width={16}
          height={16}
          color={'gray.200'}/>
      </div>}
    </>
  );
};
