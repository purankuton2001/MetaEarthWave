import {useEffect, useState} from 'react';

type Props = {latitude: number; longitude: number; onChange: (latitude: number, longitude: number) => void};
export function WaveCoordinates({latitude, longitude, onChange}: Props) {
  const [lat, setLat] = useState(String(latitude));
  const [lon, setLon] = useState(String(longitude));
  useEffect(() => setLat(String(latitude)), [latitude]);
  useEffect(() => setLon(String(longitude)), [longitude]);
  const field = (axis: 'lat' | 'lon') => {
    const isLat = axis === 'lat', value = isLat ? lat : lon, limit = isLat ? 90 : 180;
    const valid = value.trim() !== '' && Number.isFinite(Number(value)) && Math.abs(Number(value)) <= limit;
    return <label style={{display: 'block', fontSize: 13, marginTop: 10}}>
      {isLat ? '緯度（北＋ / 南−）' : '経度（東＋ / 西−）'}
      <input aria-label={isLat ? '波の緯度' : '波の経度'} aria-invalid={!valid} type="number" min={-limit} max={limit} step="0.01" value={value}
        onChange={event => {
          const next = event.target.value;
          (isLat ? setLat : setLon)(next);
          if (next.trim() !== '' && Number.isFinite(Number(next)) && Math.abs(Number(next)) <= limit) {
            onChange(isLat ? Number(next) : latitude, isLat ? longitude : Number(next));
          }
        }}
        onBlur={() => {if (!valid) (isLat ? setLat : setLon)(String(isLat ? latitude : longitude));}}
        style={{display: 'block', width: '100%', padding: '5px 9px', marginTop: 3, border: '1px solid #ffffff55', borderRadius: 6, background: '#101426', color: 'white'}}/>
      {!valid && <span style={{fontSize: 11, color: '#ffc6cf'}}>−{limit}〜{limit}度で入力してください。</span>}
    </label>;
  };
  return <div>{field('lat')}{field('lon')}</div>;
}
