import React, {useEffect, useRef, useState, VFC} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import {PerspectiveCamera, Vector3} from 'three';
import {useWebSocket} from '../context/WebSocket';
import {translateGeoCoords} from '../utils';
import {CAPTION_WEIGHT, CaptionPlan, planCaption} from '../lib/waveCaption';
import {drawCaption} from '../lib/waveCaptionDraw';

// Where the currently captioned wave sits on screen. Written by the tracker inside the
// three.js canvas, read by the 2D overlay on top of it.
const anchor = {loc: null as number[] | null, x: 0, y: 0, visible: false, ready: false};
const globe = {x: 0, y: 0, r: 0, ready: false};

export const WaveAnchorTracker: VFC = () => {
  const {scene, camera, size} = useThree();
  const world = useRef(new Vector3()), toCamera = useRef(new Vector3());
  useFrame(() => {
    const earth = scene.getObjectByName('emotion-earth');
    if (!earth) {anchor.ready = globe.ready = false; return;}
    // Globe silhouette on screen: a unit sphere at distance d spans asin(1/d) of the vertical field of view.
    const centre = earth.getWorldPosition(world.current), distance = camera.position.distanceTo(centre);
    const fov = (camera as PerspectiveCamera).fov ?? 75;
    centre.project(camera);
    globe.x = (centre.x + 1) / 2 * size.width;
    globe.y = (1 - centre.y) / 2 * size.height;
    globe.r = Math.tan(Math.asin(Math.min(1, 1 / distance))) / Math.tan(fov * Math.PI / 360) * size.height / 2;
    globe.ready = true;
    if (!anchor.loc) {anchor.ready = false; return;}
    const point = earth.localToWorld(world.current.copy(translateGeoCoords(anchor.loc[0], anchor.loc[1], 1)));
    // Facing the camera when the surface normal points toward it (the globe is centered at the origin).
    anchor.visible = point.dot(toCamera.current.copy(camera.position).sub(point)) > 0;
    point.project(camera);
    anchor.x = (point.x + 1) / 2 * size.width;
    anchor.y = (1 - point.y) / 2 * size.height;
    anchor.ready = true;
  });
  return null;
};

const MAX_QUEUE = 3, FRESH_MS = 10000;

export const WaveCaption: VFC = () => {
  const {tweets} = useWebSocket();
  const canvas = useRef<HTMLCanvasElement>(null!);
  const seen = useRef<Set<string> | null>(null);
  const queue = useRef<{plan: CaptionPlan; loc: number[]}[]>([]);
  const [announce, setAnnounce] = useState('');

  useEffect(() => {
    const now = Date.now();
    if (!seen.current) {seen.current = new Set(tweets.map(tweet => tweet._id)); return;}
    for (const tweet of tweets) {
      if (seen.current.has(tweet._id)) continue;
      seen.current.add(tweet._id);
      // Only newly created waves get a caption, not a backlog replayed by the feed.
      if (now - Date.parse(tweet.time) > FRESH_MS || !tweet.text?.trim()) continue;
      const plan = planCaption(tweet);
      if (!plan) continue;
      // Canvas text only uses a web font once it is loaded; request it before the first cut.
      // Japanese web fonts are split into unicode-range subsets, so pass the text to fetch the right ones.
      document.fonts?.load(`${CAPTION_WEIGHT} 48px ${plan.font}`, tweet.text + plan.label).catch(() => {});
      queue.current.push({plan, loc: tweet.loc});
      if (queue.current.length > MAX_QUEUE) queue.current.splice(1, queue.current.length - MAX_QUEUE);
      setAnnounce(`新しい波: ${tweet.text}`);
    }
  }, [tweets]);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const el = canvas.current, ctx = el.getContext('2d');
    if (!ctx) return;
    let frame = 0, started = 0;
    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      const dpr = Math.min(2, window.devicePixelRatio || 1), W = el.clientWidth, H = el.clientHeight;
      if (el.width !== Math.round(W * dpr) || el.height !== Math.round(H * dpr)) {el.width = Math.round(W * dpr); el.height = Math.round(H * dpr);}
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const current = queue.current[0];
      if (!current) {anchor.loc = null; return;}
      if (anchor.loc !== current.loc) {anchor.loc = current.loc; started = time;}
      const t = (time - started) / 1000;
      if (t > current.plan.total) {queue.current.shift(); anchor.loc = null; return;}
      drawCaption(ctx, current.plan, t, W, H, reduced, anchor.ready && anchor.visible ? anchor : null, globe.ready ? globe : null);
    };
    frame = requestAnimationFrame(loop);
    return () => {cancelAnimationFrame(frame); anchor.loc = null;};
  }, []);

  return <>
    <canvas ref={canvas} aria-hidden="true" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 20}}/>
    <div aria-live="polite" style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)'}}>{announce}</div>
  </>;
};
