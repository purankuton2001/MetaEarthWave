import React, {useEffect, useRef, useState, VFC} from 'react';
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
  const changePositiveScore = (apiScore: number, displayScore: number) => {
    if (apiScore > displayScore) {
      setPositiveScore(displayScore + 0.1);
      setTimeout(changePositiveScore, 0.1, apiScore, displayScore + 0.1);
    }
  };
  const changeNegativeScore = (apiScore: number, displayScore: number) => {
    if (apiScore > displayScore) {
      setNegativeScore(displayScore + 0.1);
      setTimeout(changeNegativeScore, 0.1, apiScore, displayScore + 0.1);
    }
  };
  useEffect(() => {
    if (earthState) {
      changePositiveScore(earthState.score.positiveScore, positiveScore);
    }
  }, [earthState?.score.positiveScore]);
  useEffect(() => {
    if (earthState) {
      changeNegativeScore(Math.abs(earthState.score.negativeScore), negativeScore);
    }
  }, [earthState?.score.positiveScore]);
  const [positiveScore, setPositiveScore] = useState<number>(0);
  const [negativeScore, setNegativeScore] = useState<number>(0);
  if (!earthState) {
    return <div />;
  }
  return (
    <div className={'pointPannel'}>
      <PointPannelBackground style={{marginTop: '-32px'}} />
      <div className={'negativeScoreGage'}
        style={{width: `${(Math.abs(negativeScore)/
                (positiveScore + negativeScore))*343}px`}} />
      <div className={'positiveScoreGage'}
        style={{width: `${(positiveScore/
                (positiveScore + negativeScore))*343}px`}} />
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
          positiveScore/((positiveScore +
          negativeScore)),
      ))} />
      <div className={'totalScoreNumber'}>
        {Math.round(
            (positiveScore -
                negativeScore) * 10)}
      </div>
    </div>
  );
};

