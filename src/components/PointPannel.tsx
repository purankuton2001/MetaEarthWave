import React, {useRef, VFC} from 'react';
import PointPannelBackground
  from '../../public/assets/images/PointPannelBackground.svg';
import NegativeIcon
  from '../../public/assets/images/NegativeIcon.svg';
import PositiveIcon
  from '../../public/assets/images/PositiveIcon.svg';
import {useWebSocket} from '../context/WebSocket';
import TotalScore from './TotalScore';
import {hex2rgb, mix, rgb2hex} from '../utils';


export const PointPannel: VFC = () => {
  const earthState = useWebSocket();
  if (!earthState) {
    return <div />;
  }
  return (
    <div className={'pointPannel'}>
      <PointPannelBackground/>
      <div className={'negativeScoreGage'}
        style={{width: `${(Math.abs(earthState.score.negativeScore)/
                (earthState.score.positiveScore +
                   Math.abs(earthState.score.negativeScore)))*343}px`}} />
      <div className={'positiveScoreGage'}
        style={{width: `${(earthState.score.positiveScore/
                (earthState.score.positiveScore +
                   Math.abs(earthState.score.negativeScore)))*343}px`}} />
      <div className={'negativeScoreGageText'}>
        {Math.round(Math.abs(earthState.score.negativeScore) * 10)}
      </div>
      <div className={'positiveScoreGageText'}>
        {Math.round(earthState.score.positiveScore * 10)}
      </div>
      <PositiveIcon className={'positiveIcon'} />
      <NegativeIcon className={'negativeIcon'} />
      <TotalScore gradientColor={rgb2hex(mix(hex2rgb('#00E0FF'),
          hex2rgb('#FF00E5'),
          earthState.score.positiveScore/((earthState.score.positiveScore +
          Math.abs(earthState.score.negativeScore))),
      ))} />
      <div className={'totalScoreNumber'}>
        {Math.round(
            (earthState.score.positiveScore -
                Math.abs(earthState.score.negativeScore)) * 10)}
      </div>
    </div>
  );
};

