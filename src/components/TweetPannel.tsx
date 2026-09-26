import React, {useEffect, useRef, useState, VFC} from 'react';
import {Button, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Textarea, Text} from '@chakra-ui/react';
import {signIn, useSession} from 'next-auth/react';
import {useWebSocket} from '../context/WebSocket';
import {EmotionPreview} from './EmotionPreview';
import {createEmotionPreview, PreviewState, requestEmotions} from '../lib/emotionPreview';
import {currentLocation} from '../lib/currentLocation';

type Props = {isOpen: boolean; onOpen: () => void; onClose: () => void};
export const TweetPannel: VFC<Props> = ({isOpen, onClose}) => {
  const [text, setText] = useState('');
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [mode, setMode] = useState<'jev' | 'unavailable' | 'loading' | 'error'>('loading');
  const pending = useRef(false);
  const [preview, setPreview] = useState<PreviewState>({text: '', status: 'idle'});
  const previewController = useRef<ReturnType<typeof createEmotionPreview>>();
  useEffect(() => {
    if (!isOpen || mode !== 'jev' || busy) return;
    const controller = createEmotionPreview(setPreview); previewController.current = controller;
    return () => {controller.dispose(); previewController.current = undefined;};
  }, [isOpen, mode, busy]);
  useEffect(() => {previewController.current?.update(text);}, [text, isOpen, mode, busy]);
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
    const submittedText = text.trim();
    const cachedEmotions = preview.status === 'ready' && preview.text === submittedText ? preview.emotions : undefined;
    pending.current = true; setBusy(true); setError('');
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      setProgress('現在地を取得中');
      const location = await currentLocation();
      setProgress('判定中');
      timeout = setTimeout(() => controller.abort(), 15000);
      const emotions = cachedEmotions || await requestEmotions(submittedText, controller.signal);
      const score = Math.max(-1, Math.min(1, (emotions.joy + emotions.empathy)/2 - (emotions.sadness + emotions.anger + emotions.anxiety)/3));
      earth.addLocalTweet({_id: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`, text: text.trim(), time: new Date().toISOString(), loc: [location.latitude, location.longitude], cityName: '現在地', score, emotions, themeId: earth.theme?.theme.id, themeTitle: earth.theme?.theme.title, source: 'jev', account: {id: 0, name: 'あなたの波', screenName: '', profileImage: '/assets/images/favicon.png'}});
      setText(''); onClose();
    } catch (e) {setError(e instanceof Error && e.name !== 'AbortError' ? e.message : '接続できませんでした。もう一度お試しください。');}
    finally {if (timeout) clearTimeout(timeout); pending.current = false; setBusy(false); setProgress('');}
  }
  async function sendTweet() {
    if (!text.trim() || pending.current) return;
    if (!earth.socket || earth.socket.readyState !== 1) {setError('Twitter投稿サーバーに接続していません。'); return;}
    const account = (data?.user as any)?.token?.account;
    if (!account) {signIn('twitter', {callbackUrl: '/?tweetBox=true'}); return;}
    pending.current = true; setBusy(true); setError(''); setProgress('現在地を取得中');
    try {
      const location = await currentLocation();
      if (earth.socket.readyState !== 1) throw new Error('Twitter投稿サーバーとの接続が切れました。もう一度お試しください。');
      earth.socket.send(JSON.stringify({tweetText: text.trim(), name: data?.user?.name, image: data?.user?.image, accessToken: account.oauth_token, accessTokenSecret: account.oauth_token_secret, loc: [location.latitude, location.longitude]}));
      setText(''); onClose();
    } catch (e) {setError(e instanceof Error ? e.message : '投稿できませんでした。');}
    finally {pending.current = false; setBusy(false); setProgress('');}
  }
  return <Modal isOpen={isOpen} onClose={busy ? () => {} : onClose} isCentered scrollBehavior="inside">
    <ModalOverlay bgColor="blackAlpha.500"/>
    <ModalContent bgColor="blackAlpha.800" color="white" backdropFilter="blur(8px)">
      <ModalHeader>いま、どんな気持ち？</ModalHeader><ModalCloseButton isDisabled={busy}/>
      <ModalBody>
        {earth.theme && <Text color="cyan.100" mb={3}>「{earth.theme.theme.title}」に重ねる</Text>}
        <Textarea aria-label="あなたの言葉" placeholder="うれしいことも、ちょっとした不安も。" id="emotion-text" value={text} onChange={event => setText(event.target.value)} maxLength={280} minHeight="144px" isDisabled={busy}/>
        <Text textAlign="right" fontSize="xs" color="whiteAlpha.600" mt={1}>{text.length} / 280</Text>
        {mode === 'jev' && <EmotionPreview state={preview}/>}
        <Text fontSize="xs" color="whiteAlpha.700" mt={3}>入力中の言葉を分析します。波は現在地から、この画面だけに。</Text>
        {busy && <Text role="status" fontSize="sm" mt={2}>{progress}…</Text>}
        {mode !== 'jev' && <Text role="status" fontSize="sm" color="cyan.100" mt={3}>{mode === 'loading' ? '準備中…' : mode === 'error' ? '接続できません。開き直してください。' : '感情分析は現在利用できません。'}</Text>}
        {error && <Text role="alert" color="red.200" mt={3}>{error}</Text>}
      </ModalBody>
      <ModalFooter flexWrap="wrap" gap={3}>
        <Button variant="ghost" size="sm" color="whiteAlpha.800" isDisabled={busy || !text.trim()} onClick={data ? sendTweet : () => signIn('twitter', {callbackUrl: '/?tweetBox=true'})}>{data ? 'Xに投稿' : 'Xでログイン'}</Button>
        <Button colorScheme="cyan" onClick={createWave} isLoading={busy} loadingText={progress} isDisabled={!text.trim() || mode !== 'jev'}>波を届ける</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>;
};
