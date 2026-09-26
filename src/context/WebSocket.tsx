import {TrendWave} from '../lib/trendWaves';
import ReconnectingWebSocket from 'reconnecting-websocket';
import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {ThemeReport} from '../lib/themes';
import {Emotions} from '../lib/waveEmotion';
export type Tweet = {
  _id: string; score: number; loc: number[];
  account: {id: number; name: string; screenName: string; profileImage: string};
  text: string; time: string; emotions?: Emotions; source?: 'jev'; cityName?: string; themeId?: string; themeTitle?: string;
};
type EarthState = {
  selectedTrend:TrendWave|null; setSelectedTrend:(wave:TrendWave|null)=>void;
  trendWaves: TrendWave[]; setTrendWaves: (waves:TrendWave[])=>void;
  focusRevision: number; focusGroup: string; setFocusGroup: (id: string) => void;
  theme: ThemeReport | null; setTheme: (theme: ThemeReport | null) => void;
  tweets: Tweet[]; score: {positiveScore: number; negativeScore: number};
  socket?: ReconnectingWebSocket; addLocalTweet: (tweet: Tweet) => void;
};
const Context = createContext<EarthState>({selectedTrend:null,setSelectedTrend:()=>{},trendWaves: [], setTrendWaves:()=>{},focusRevision: 0, focusGroup: '', setFocusGroup: () => {}, theme: null, setTheme: () => {}, tweets: [], score: {positiveScore: 0, negativeScore: 0}, addLocalTweet: () => {}});
export function EarthStateProvider({children}: {children: React.ReactNode}) {
  const [selectedTrend,setSelectedTrend]=useState<TrendWave|null>(null);
  const [trendWaves, setTrendWaves] = useState<TrendWave[]>([]);
  const [focusRevision, setFocusRevision] = useState(0);
  const [focusGroup, setFocusGroup] = useState('');
  const [theme, setTheme] = useState<ThemeReport | null>(null);
  const [remote, setRemote] = useState<{tweets: Tweet[]; score: EarthState['score']}>({tweets: [], score: {positiveScore: 0, negativeScore: 0}});
  const [local, setLocal] = useState<Tweet[]>([]);
  const [socket, setSocket] = useState<ReconnectingWebSocket>();
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
    if (!url) return;
    const connection = new ReconnectingWebSocket(url);
    setSocket(connection);
    connection.addEventListener('message', event => {
      try {
        const data = JSON.parse(event.data);
        if (!Array.isArray(data.tweets) || !Number.isFinite(data.score?.positiveScore) || !Number.isFinite(data.score?.negativeScore)) return;
        setRemote({tweets: data.tweets, score: data.score});
      } catch { /* Ignore malformed upstream events without losing local posts. */ }
    });
    return () => connection.close();
  }, []);
  const value = useMemo<EarthState>(() => ({
    selectedTrend,setSelectedTrend,trendWaves, setTrendWaves, focusRevision, focusGroup, setFocusGroup: id => {setFocusGroup(id); setFocusRevision(value => value + 1);}, theme, setTheme, tweets: [...remote.tweets, ...local.filter(tweet => !tweet.themeId || tweet.themeId === theme?.theme.id)], socket,
    score: {
      positiveScore: remote.score.positiveScore + local.reduce((sum, tweet) => sum + Math.max(0, tweet.score), 0),
      negativeScore: remote.score.negativeScore + local.reduce((sum, tweet) => sum + Math.min(0, tweet.score), 0),
    },
    addLocalTweet: tweet => setLocal(items => [...items, tweet].slice(-20)),
  }), [remote, local, socket, theme, focusGroup, focusRevision, trendWaves, selectedTrend]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useWebSocket = () => useContext(Context);

export const EarthStateBridge = Context.Provider;
