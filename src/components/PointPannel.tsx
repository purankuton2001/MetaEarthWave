import React, {VFC} from 'react';
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
  const positiveScore = earthState.score.positiveScore;
  const negativeScore = Math.abs(earthState.score.negativeScore);
  const total = positiveScore + negativeScore;
  const positiveRatio = total ? positiveScore / total : 0.5;
  const negativeRatio = total ? negativeScore / total : 0.5;
  if (!earthState) {
    return <div />;
  }
  return (
    <div className={'pointPannel'}>
      <PointPannelBackground style={{marginTop: '-32px'}} />
      <div className={'negativeScoreGage'}
        style={{width: `${negativeRatio*343}px`}} />
      <div className={'positiveScoreGage'}
        style={{width: `${positiveRatio*343}px`}} />
      <div className={'negativeScoreGageText'}>
        {Math.round(negativeScore * 10)}
      </div>
      <div className={'positiveScoreGageText'}>
        {Math.round(positiveScore * 10)}
      </div>
      <PositiveIcon className={'positiveIcon'} />
      <NegativeIcon className={'negativeIcon'} />
      <TotalScore gradientColor={rgb2hex(mix(hex2rgb('#00E0FF'),
          hex2rgb('#FF00E5'),
          positiveRatio,
      ))} />
      <div className={'totalScoreNumber'}>
        {Math.round(
            (positiveScore -
                negativeScore) * 10)}
      </div>
    </div>
  );
};

