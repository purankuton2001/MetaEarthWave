import {useEffect, useState} from 'react';

export const useGeoPosition = () => {
  const [geoPosition, setGeoPosition] = useState<number[]>(null!);
  const successGetPosition: PositionCallback = (argPos) => {
    setGeoPosition([argPos.coords.longitude, argPos.coords.latitude]);
  };
  const errorGetPosition: PositionErrorCallback = (argErr) => {
    let wErrMsg = '';
    switch (argErr.code) {
      case 1: wErrMsg = '位置情報の利用が許可されていません'; break;
      case 2: wErrMsg = 'デバイスの位置が判定できません'; break;
      case 3: wErrMsg = 'タイムアウトしました'; break;
    }
    alert(wErrMsg);
  };

  useEffect(() => {
    if (typeof navigator?.geolocation !== 'undefined') {
      navigator
          .geolocation
          .getCurrentPosition(successGetPosition, errorGetPosition);
    } else {
      return;
    }
  }, []);
  return geoPosition;
};
