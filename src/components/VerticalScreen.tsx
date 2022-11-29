import React, {VFC} from 'react';
import Image from 'next/image';
import {
  conceptDescription,
  conceptTitle,
  joinDescription,
  joinEmotionMagenta, joinEmotionSkyBlue,
  joinMediumText,
  joinTitle,
} from '../utils/translateText';
import {useLanguage} from '../hooks/useLanguage';
import {useWindowSize} from '../hooks/useWindowSize';

export const VerticalScreen: VFC = () => {
  const language = useLanguage();
  const {width} = useWindowSize();
  return (
    <div style={{padding: '12px',
      background: 'black', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <Image className={'verticalImage'} src={'/assets/images/MetaEarthWave.png'} width={width} height={'400'} objectFit={'contain'}/>
      <div className={'verticalTitle bigFont'}>
        MetaEarthWave
      </div>
      <div className={'verticalDescription'}>
        {conceptDescription(language)}
      </div>
      <div className={'verticalTitle'}>
        {joinTitle(language)}
      </div>
      <div className={'verticalDescription'}>
        {joinDescription(language)}
      </div>
      <div className={'verticalMediumText'}>
        {joinMediumText(language)}
      </div>
      <div className={'verticalMediumText lightBlue'}>
        {joinEmotionSkyBlue(language)}
      </div>
      <div className={'verticalMediumText magenta'}>
        {joinEmotionMagenta(language)}
      </div>
    </div>
  );
};
