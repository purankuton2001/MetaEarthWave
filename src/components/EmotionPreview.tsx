import React, {useEffect, useRef} from 'react';
import {Box, Text} from '@chakra-ui/react';
import {axes, colors, Emotions, labels} from '../lib/waveEmotion';
import {PreviewState} from '../lib/emotionPreview';
export function EmotionPreview({state}: {state: PreviewState}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef<Emotions | undefined>(state.emotions);
  useEffect(() => {target.current = state.emotions;}, [state.emotions]);
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const ctx = el.getContext('2d'); if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const values = axes.map(() => 0);
    let frame = 0, previous = 0, time = 0;
    const draw = (now: number) => {
      const dt = previous ? Math.min((now - previous)/1000, .05) : .016; previous = now;
      if (!reduced) time += dt;
      const w = el.clientWidth, h = 120, ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (el.width !== Math.round(w*ratio) || el.height !== h*ratio) {el.width = Math.round(w*ratio); el.height = h*ratio;}
      ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,w,h);
      axes.forEach((axis,i) => {values[i] += ((target.current?.[axis] || 0)-values[i])*(1-Math.exp(-dt*4));});
      const strength = Math.max(...values);
      ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = colors[axes[i]]; ctx.globalAlpha = .06 + values[i]*.7; ctx.lineWidth = 1.5+values[i]*2;
        for (let band = 0; band < 3; band++) {
          ctx.beginPath();
          for (let x = 0; x <= w; x += 3) {
            const envelope = Math.sin(x/w*Math.PI);
            const y = 60+Math.sin(x/w*9-time*(1+i*.12)+i*.8+band*.45)*envelope*(8+strength*24+band*4);
            if (!x) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame);
  }, []);
  const message = state.status === 'error' ? '波を読み取れませんでした。送信時にもう一度試します。' : '';
  return <Box mt={3} aria-label="感情の波のプレビュー">
    <canvas ref={canvas} aria-hidden="true" style={{display:'block',width:'100%',height:120,background:'radial-gradient(ellipse, rgba(130,104,225,.16), transparent 72%)'}}/>
    {message && <Text role="status" fontSize="sm" color="cyan.100">{message}</Text>}
    {state.emotions && <details style={{fontSize:12,color:"rgba(255,255,255,.65)"}}><summary style={{cursor:"pointer"}}>気持ちの内訳</summary><Box display="flex" flexWrap="wrap" gridGap={3} mt={2} fontSize="xs">{axes.map(axis => <span key={axis} style={{color:colors[axis]}}>{labels[axis]} {Math.round(state.emotions![axis]*100)}</span>)}</Box></details>}
  </Box>;
}
