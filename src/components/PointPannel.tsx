import React, {VFC} from 'react';
import PointPannelBackground
  from '../../public/assets/images/PointPannelBackground.svg';
import NegativeIcon
  from '../../public/assets/images/NegativeIcon.svg';
import PositiveIcon
  from '../../public/assets/images/PositiveIcon.svg';
import TotalScore
  from '../../public/assets/images/TotalScore.svg';
import {useWebSocket} from '../context/WebSocket';


export const PointPannel: VFC = () => {
  const earthState = useWebSocket();
  if (!earthState) {
    return <div />;
  }
  return (
    <div className={'pointPannel'}>
      <PointPannelBackground />
      <div className={'negativeScoreGage'} style={{width: '96px'}}>
        {earthState.score.negativeScore}
      </div>
      <div className={'positiveScoreGage'} style={{width: '144px'}}>
        {earthState.score.positiveScore}
      </div>
      <PositiveIcon className={'positiveIcon'} />
      <NegativeIcon className={'negativeIcon'} />
      <TotalScore className={'totalScore'} />
      <div className={'totalScoreNumber'}>300</div>
    </div>
  );
};

