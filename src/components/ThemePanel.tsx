import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/router';
import {useWebSocket} from '../context/WebSocket';
import {Theme, ThemeList, ThemeReport, THEME_INTERVAL} from '../lib/themes';
import {axes, colors, labels} from '../lib/waveEmotion';

const panel = {position: 'absolute' as const, left: 18, top: 145, width: 245, maxHeight: 'calc(100vh - 235px)', overflowY: 'auto' as const, zIndex: 36, padding: 16, borderRadius: 18, color: '#fff', background: 'rgba(28,24,65,.76)', border: '1px solid #ffffff45', backdropFilter: 'blur(16px)'};
export function ThemePanel() {
  const {theme: report, setTheme, setFocusGroup} = useWebSocket();
  const [list, setList] = useState<ThemeList | null>(null);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const chosen = useRef(''), request = useRef<AbortController | null>(null);
  const live = useRef(true), refresh = useRef<() => void>(() => {});
  const router = useRouter();
  async function loadTheme(theme: Theme, clear = true) {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    chosen.current = theme.id; setSelected(theme.id); setBusy(true); setError('');
    if (clear) {setTheme(null); setFocusGroup('');}
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`/api/themes/${encodeURIComponent(theme.id)}`, {signal: controller.signal});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (live.current && request.current === controller) setTheme(data as ThemeReport);
    } catch (e) {
      if (live.current && request.current === controller) setError(controller.signal.aborted ? '読み込みに時間がかかっています。もう一度お試しください。' : e instanceof Error ? e.message : '分析できませんでした。');
    } finally {clearTimeout(timeout); if (live.current && request.current === controller) setBusy(false);}
  }
  useEffect(() => {
    live.current = true;
    let listing: AbortController | null = null;
    const update = async () => {
      listing?.abort(); const controller = new AbortController(); listing = controller;
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const response = await fetch('/api/themes', {signal: controller.signal});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!live.current || listing !== controller) return;
        setList(data); setError('');
        const next = data.themes.find((item: Theme) => item.id === chosen.current) || data.themes[0];
        if (next) loadTheme(next, next.id !== chosen.current);
      } catch (e) {if (live.current && listing === controller) setError('話題を取得できませんでした。少し待ってお試しください。');}
      finally {clearTimeout(timeout);}
    };
    refresh.current = update;
    update();
    const timer = setInterval(update, THEME_INTERVAL);
    const clockTimer = setInterval(() => setClock(Date.now()), 30000);
    return () => {live.current = false; listing?.abort(); request.current?.abort(); clearInterval(timer); clearInterval(clockTimer);};
  }, []);
  const expired = report && clock - Date.parse(report.updatedAt) >= 30 * 60 * 1000;
  return <aside style={panel} aria-label="今、波が起きていること">
    <button onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed} style={{display: 'flex', justifyContent: 'space-between', width: '100%', textAlign: 'left', fontWeight: 600, fontSize: 14}}>今、波が起きていること <span>{collapsed ? '＋' : '−'}</span></button>
    {!collapsed && <>
      <p style={{fontSize: 11, opacity: .75, margin: '6px 0 12px'}}>日本のXトレンド · 表示中は15分ごとに更新</p>
      {!list && !error && <p role="status">今の話題を探しています…</p>}
      <div style={{display: 'grid', gap: 7}}>{list?.themes.map(item => <button key={item.id} aria-pressed={selected === item.id} onClick={() => loadTheme(item)} style={{padding: '7px 10px', textAlign: 'left', borderRadius: 10, background: selected === item.id ? '#e6e4ff30' : '#ffffff0a', border: `1px solid ${selected === item.id ? '#c4efff' : '#ffffff22'}`}}><span style={{fontSize: 9, opacity: .7, marginRight: 7}}>{item.category}</span><span style={{fontSize: 12, overflowWrap: 'anywhere'}}>{item.title}</span></button>)}</div>
      {busy && <p role="status" style={{fontSize: 12, marginTop: 12}}>投稿の気持ちを読み取っています…</p>}
      {error && <div role="alert" style={{fontSize: 12, marginTop: 12}}>{error}<button style={{display: 'block', textDecoration: 'underline', marginTop: 8}} onClick={() => {const item = list?.themes.find(t => t.id === selected); if (item) loadTheme(item); else refresh.current();}}>もう一度読み込む</button></div>}
      {report && <section style={{fontSize: 11, marginTop: 14, borderTop: '1px solid #ffffff33', paddingTop: 12}} aria-label="話題の感情">
        <p>{report.count}件を分析 · {new Date(report.updatedAt).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})} 更新</p>
        {(report.stale || list?.stale || expired) && <p style={{color: '#ffe5ac'}}>過去の取得結果です{expired ? '。波の表示を停止しています。' : '。'}</p>}
        <p style={{opacity: .7, marginTop: 5}}>直近24時間の投稿から抽出。世論全体ではありません。</p>
        {report.groups.map(group => <div key={group.id} style={{marginTop: 12}}><button onClick={() => setFocusGroup(group.id)} style={{textAlign: 'left', textDecoration: 'underline'}} aria-label={`${group.label}の波を見る`}><strong>{group.label} · {group.count}件 ↗</strong></button><div style={{display: 'flex', height: 5, gap: 2, margin: '7px 0'}}>{axes.map(axis => <span key={axis} style={{flex: Math.max(.01, group.emotions[axis]), background: colors[axis], borderRadius: 4}}/>)}</div><div style={{display: 'flex', flexWrap: 'wrap', gap: '3px 8px'}}>{axes.map(axis => <span key={axis} style={{color: colors[axis]}}>{labels[axis]} {Math.round(group.emotions[axis]*100)}</span>)}</div><p style={{opacity: .65, marginTop: 5}}>{group.locationNote}</p></div>)}
        <button onClick={() => router.push('/?tweetBox=true', undefined, {shallow: true})} style={{width: '100%', border: '1px solid #b5f4fa', borderRadius: 20, padding: 9, marginTop: 14}}>自分の言葉を重ねる</button>
        <details style={{marginTop: 12, opacity: .8}}><summary>分析元の投稿</summary><p>取得期間 {new Date(report.sourceStart).toLocaleString('ja-JP')} 〜 {new Date(report.sourceEnd).toLocaleString('ja-JP')}</p>{report.sources.map((source, i) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" style={{display: 'inline-block', margin: '5px 8px 0 0', textDecoration: 'underline'}}>投稿 {i+1}</a>)}</details>
      </section>}
      {list && <p style={{fontSize: 10, opacity: .6, marginTop: 12}}>候補取得 {new Date(list.updatedAt).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})} · treg / 感情分析 Jev</p>}
    </>}
  </aside>;
}
