export type CurrentLocation = {latitude: number; longitude: number};

export function currentLocation(): Promise<CurrentLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('このブラウザでは位置情報を取得できません。位置情報に対応したブラウザで開いてください。'));
      return;
    }
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude, longitude} = position.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
        reject(new Error('現在地を確認できませんでした。もう一度お試しください。'));
        return;
      }
      resolve({latitude, longitude});
    }, error => {
      reject(new Error(error.code === 1 ? '位置情報の利用が許可されていません。ブラウザの設定で許可して、もう一度お試しください。' : error.code === 3 ? '現在地の取得がタイムアウトしました。もう一度お試しください。' : '現在地を取得できませんでした。端末の位置情報設定を確認してください。'));
    }, {enableHighAccuracy: false, timeout: 10000, maximumAge: 60000});
  });
}
