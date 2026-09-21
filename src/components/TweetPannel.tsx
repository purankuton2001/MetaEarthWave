import React, {useEffect, useRef, useState, VFC} from 'react';
import {Box, Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Textarea, Select, FormLabel, Text} from '@chakra-ui/react';
import {signIn, useSession} from 'next-auth/react';
import {useWebSocket} from '../context/WebSocket';
import {WaveCoordinates} from './WaveCoordinates';
import {cities} from '../lib/waveEmotion';

type Props = {isOpen: boolean; onOpen: () => void; onClose: () => void};
export const TweetPannel: VFC<Props> = ({isOpen, onClose}) => {
  const [text, setText] = useState(''), [city, setCity] = useState(0);
  const [location, setLocation] = useState({latitude: cities[0].lat, longitude: cities[0].lon});
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [mode, setMode] = useState<'jev' | 'unavailable' | 'loading' | 'error'>('loading');
  const pending = useRef(false);
  const {data} = useSession();
  const earth = useWebSocket();
  useEffect(() => {
    if (!isOpen) return;
    let live = true;
    fetch('/api/wave-emotion').then(response => {if (!response.ok) throw new Error(); return response.json();}).then(result => {if (live) setMode(result.mode);}).catch(() => {if (live) setMode('error');});
    return () => {live = false;};
  }, [isOpen]);
  async function createWave() {
    if (!text.trim() || pending.current) return;
    pending.current = true; setBusy(true); setError('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/wave-emotion', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({text: text.trim()}), signal: controller.signal});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '判定できませんでした。');
      const emotions = result.emotions;
      const score = Math.max(-1, Math.min(1, (emotions.joy + emotions.empathy)/2 - (emotions.sadness + emotions.anger + emotions.anxiety)/3));
      earth.addLocalTweet({_id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, text: text.trim(), time: new Date().toISOString(), loc: [location.latitude, location.longitude], cityName: location.latitude === cities[city].lat && location.longitude === cities[city].lon ? cities[city].name : `${location.latitude}°, ${location.longitude}°`, score, emotions, source: result.source, account: {id: 0, name: 'あなたの波', screenName: '', profileImage: '/assets/images/favicon.png'}});
      setText(''); onClose();
    } catch (e) {setError(e instanceof Error && e.name !== 'AbortError' ? e.message : '接続できませんでした。もう一度お試しください。');}
    finally {clearTimeout(timeout); pending.current = false; setBusy(false);}
  }
  function sendTweet() {
    if (!earth.socket || earth.socket.readyState !== 1) {setError('Twitter投稿サーバーに接続していません。'); return;}
    const account = (data?.user as any)?.token?.account;
    if (!account) {signIn('twitter', {callbackUrl: '/?tweetBox=true'}); return;}
    earth.socket.send(JSON.stringify({tweetText: text.trim(), name: data?.user?.name, image: data?.user?.image, accessToken: account.oauth_token, accessTokenSecret: account.oauth_token_secret, loc: [location.latitude, location.longitude]}));
    setText(''); onClose();
  }
  return <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} isCentered>
    <ModalOverlay bgColor="blackAlpha.500"/>
    <ModalContent bgColor="blackAlpha.800" color="white" backdropFilter="blur(8px)">
      <ModalHeader>言葉で世界に波を起こそう！</ModalHeader><ModalCloseButton isDisabled={busy}/>
      <ModalBody>
        <Box mb={4}>嬉しかったこと、悲しかったこと。混ざった気持ちを、そのまま地球に広げてみましょう。</Box>
        <FormLabel htmlFor="emotion-text">あなたの言葉</FormLabel>
        <Textarea id="emotion-text" value={text} onChange={event => setText(event.target.value)} maxLength={280} minHeight="144px" isDisabled={busy}/>
        <Text textAlign="right" fontSize="sm">{text.length} / 280</Text>
        <FormLabel htmlFor="emotion-city" mt={3}>波を届ける場所</FormLabel>
        <Select id="emotion-city" value={city} onChange={event => {const next = Number(event.target.value); setCity(next); setLocation({latitude: cities[next].lat, longitude: cities[next].lon});}} isDisabled={busy}>{cities.map((item, i) => <option key={item.en} value={i} style={{background: '#111'}}>{item.name}</option>)}</Select>
        <fieldset disabled={busy}><WaveCoordinates {...location} onChange={(latitude, longitude) => setLocation({latitude, longitude})}/></fieldset>
        <Text fontSize="sm" color="cyan.100" mt={4}>{mode === 'jev' ? 'Jevが言葉に表れた5つの感情を推定します。' : mode === 'loading' ? '判定方法を確認しています…' : mode === 'error' ? '接続を確認できません。再度開いてお試しください。' : '感情分析は現在利用できません。'}</Text>
        <Text fontSize="sm" mt={2}>波はこの画面だけに追加されます。投稿一覧で感情の内訳を確認できます。再読み込みすると消えます。</Text>
        {error && <Text role="alert" color="red.200" mt={3}>{error}</Text>}
      </ModalBody>
      <ModalFooter flexWrap="wrap" gap={3}>
        <Button variant="outline" isDisabled={busy || !text.trim()} onClick={data ? sendTweet : () => signIn('twitter', {callbackUrl: '/?tweetBox=true'})}>{data ? 'Twitterに投稿' : 'Twitterでログイン'}</Button>
        <Button colorScheme="cyan" onClick={createWave} isLoading={busy} loadingText="判定中" isDisabled={!text.trim() || mode !== 'jev'}>感情の波を生み出す</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>;
};
