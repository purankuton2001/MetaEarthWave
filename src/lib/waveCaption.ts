// Lyric-motion captions for new waves.
// The cut structure (short lyric cuts, per-glyph staggered enter / hold / exit, blur-in, easing curves,
// hash-based determinism) is ported from JIZURA (https://github.com/852wa/JIZURA, MIT, (c) 2026 hakoniwa).
// The motions themselves are tuned to the globe's own wave language: soft, fluid and slow — no bounce,
// rotation, glitch or pop, so the caption reads as part of the water rather than a telop laid on top.
import {axes, Axis, colors, Emotions, labels} from './waveEmotion';

export type Enter = 'focus' | 'rise' | 'swell' | 'settle' | 'gust';
export type Hold = 'still' | 'float' | 'sway' | 'swirl' | 'tremor';
export type Exit = 'dissolve' | 'ascend' | 'descend' | 'disperse';
export type Layout = 'yoko' | 'tate' | 'orbit';
export type CaptionCut = {text: string; start: number; dur: number; inDur: number; outDur: number; enter: Enter; hold: Hold; exit: Exit; layout: Layout; seed: number};
export type CaptionPlan = {id: string; mood: Axis; font: string; color: string; accent: string; label: string; cuts: CaptionCut[]; total: number; seed: number; spin: number; look: Look};
// Motes drift like foam around the text; the direction follows the emotion's wave (joy lifts, sadness sinks…).
export type Motes = 'up' | 'down' | 'swirl' | 'drift';
// Text styling: white type washed with the emotion's colour, a soft glow and a quiet shadow for legibility.
export type Look = {tint: number; glow: number; motes: Motes};
export type CaptionSource = {_id: string; text: string; score: number; emotions?: Emotions; cityName?: string};

// One serif family for every emotion (pairs with the EB Garamond UI); emotions differ by motion, tempo and colour.
export const CAPTION_FONT = '"Zen Old Mincho", "EB Garamond", serif';
export const CAPTION_WEIGHT = 600;

type Mood = {enter: Enter[]; hold: Hold[]; exit: Exit[]; tate: number; spin: number; tempo: number; tint: [number, number]; motes: Motes};
// Mirrors the globe shader (WAVES.md): joy lifts, sadness sinks, anger swirls, anxiety adds small irregular
// movements, empathy mixes gently. `tempo` scales cut length (higher = slower, more lingering).
export const moods: Record<Axis, Mood> = {
  joy: {enter: ['rise', 'swell'], hold: ['float'], exit: ['ascend'], tate: 0, spin: 0.5, tempo: 1, tint: [0.16, 0.26], motes: 'up'},
  sadness: {enter: ['settle', 'focus'], hold: ['still', 'float'], exit: ['descend', 'dissolve'], tate: 0.6, spin: 0.26, tempo: 1.2, tint: [0.18, 0.28], motes: 'down'},
  anger: {enter: ['gust'], hold: ['swirl'], exit: ['disperse'], tate: 0, spin: 0.75, tempo: 0.9, tint: [0.2, 0.3], motes: 'swirl'},
  anxiety: {enter: ['focus'], hold: ['tremor'], exit: ['dissolve'], tate: 0.2, spin: 0.42, tempo: 1.05, tint: [0.18, 0.28], motes: 'drift'},
  empathy: {enter: ['swell', 'focus'], hold: ['sway'], exit: ['dissolve', 'ascend'], tate: 0.3, spin: 0.38, tempo: 1.1, tint: [0.16, 0.26], motes: 'drift'},
};

// Deterministic hash → 0..1 (JIZURA never uses Math.random at render time).
export function hash(...values: number[]) {
  let h = 2166136261;
  for (const v of values) {h ^= Math.floor(v * 1000) | 0; h = Math.imul(h, 16777619); h ^= h >>> 13;}
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}
export const hashText = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(h, 31) + text.charCodeAt(i)) | 0;
  return h >>> 0;
};

export function dominant(source: CaptionSource): Axis {
  if (source.emotions) return axes.reduce((best, axis) => source.emotions![axis] > source.emotions![best] ? axis : best, axes[0]);
  return source.score >= 0 ? (source.score > 0.5 ? 'joy' : 'empathy') : (source.score < -0.5 ? 'anger' : 'sadness');
}

const breakAfter = /[、。！？!?,.，．…\s]/;
// Split a post into short lyric "cuts": break at punctuation, then at a max length.
export function splitCuts(text: string, max = 12, limit = 4) {
  const chars = Array.from(text.replace(/\s+/g, ' ').trim());
  const out: string[] = [];
  let cur = '';
  chars.forEach((ch, i) => {
    if (!cur && ch === ' ') return;
    cur += ch;
    // Keep runs of punctuation (！？, 。」) together so no cut starts with a stray mark.
    const next = chars[i + 1];
    if (breakAfter.test(ch) && !(next && next !== ' ' && breakAfter.test(next)) && Array.from(cur.trim()).length >= 3) {out.push(cur.trim()); cur = '';}
    else if (Array.from(cur).length >= max) {out.push(cur); cur = '';}
  });
  if (cur.trim()) out.push(cur.trim());
  // Merge tiny tails into the previous cut when it still fits.
  const merged = out.reduce<string[]>((acc, cut) => {
    const last = acc[acc.length - 1];
    if (last && Array.from(cut).length <= 2 && Array.from(last + cut).length <= max + 2) acc[acc.length - 1] = last + cut;
    else acc.push(cut);
    return acc;
  }, []);
  if (merged.length > limit) {
    const kept = merged.slice(0, limit);
    kept[limit - 1] = Array.from(kept[limit - 1]).slice(0, max - 1).join('').replace(/[、。,.\s]+$/, '') + '…';
    return kept;
  }
  return merged;
}

// Share of short captions (≤ ORBIT_MAX characters) that orbit the globe as a revolving ring instead of sitting beside the wave.
export const ORBIT_CHANCE = 0.5;
export const ORBIT_MAX = 28;

const pick = <T, >(list: T[], r: number) => list[Math.min(list.length - 1, Math.floor(r * list.length))];

export function planCaption(source: CaptionSource): CaptionPlan | null {
  const pieces = splitCuts(source.text);
  if (!pieces.length) return null;
  const mood = dominant(source), style = moods[mood], seed = hashText(source._id + source.text);
  const strength = source.emotions ? Math.round(source.emotions[mood] * 100) : Math.round(Math.abs(source.score) * 100);
  const label = [source.cityName, `${labels[mood]} ${strength}`].filter(Boolean).join(' · ');
  const look: Look = {tint: style.tint[0] + (style.tint[1] - style.tint[0]) * hash(seed, 7), glow: 0.32 + 0.14 * hash(seed, 8), motes: style.motes};
  const base = {id: source._id, mood, font: CAPTION_FONT, color: '#ffffff', accent: colors[mood], label, seed, spin: style.spin, look};
  const ring = Array.from(pieces.join('　'));
  // Orbit only when the whole post fits on the ring — a truncated ring reads as broken.
  if (ring.length <= ORBIT_MAX && hash(seed, 6) < ORBIT_CHANCE) {
    // Orbit: the whole post becomes one ring of text revolving slowly around the globe.
    const text = ring.join('');
    const dur = Math.max(4.5, Math.min(7, 3.8 + Array.from(text).length * 0.1)) * style.tempo;
    const cut: CaptionCut = {
      text, start: 0.35, dur, inDur: 1.4, outDur: 1.1, enter: pick(style.enter, hash(seed, 0, 1)),
      hold: pick(style.hold, hash(seed, 0, 2)), exit: pick(style.exit, hash(seed, 0, 3)), layout: 'orbit', seed: hash(seed, 0, 5) * 1e6,
    };
    return {...base, cuts: [cut], total: cut.start + dur + 0.8};
  }
  // Vertical writing (縦書き) is chosen per caption so the block doesn't jump between cuts.
  const tate = pieces.every(text => Array.from(text).length <= 8) && hash(seed, 4) < style.tate;
  let start = 0.35; // leave room for the ripple ring to bloom first
  const cuts = pieces.map((text, index): CaptionCut => {
    const n = Array.from(text).length;
    const dur = Math.max(1.7, Math.min(3.4, 1.2 + n * 0.16)) * style.tempo;
    const cut: CaptionCut = {
      text, start, dur, inDur: Math.min(0.95, dur * 0.4), outDur: Math.min(0.75, dur * 0.3),
      enter: pick(style.enter, hash(seed, index, 1)), hold: pick(style.hold, hash(seed, index, 2)),
      exit: index === pieces.length - 1 ? pick(style.exit, hash(seed, index, 3)) : 'dissolve',
      layout: tate ? 'tate' : 'yoko', seed: hash(seed, index, 5) * 1e6,
    };
    start += dur - 0.3; // cuts cross-dissolve into each other
    return cut;
  });
  return {...base, cuts, total: start + 0.3 + 0.8};
}

// Easing — curves after JIZURA's J.E., minus the bouncy ones.
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = {
  outCubic: (x: number) => 1 - Math.pow(1 - clamp(x), 3),
  inCubic: (x: number) => Math.pow(clamp(x), 3),
  outQuint: (x: number) => 1 - Math.pow(1 - clamp(x), 5),
  outExpo: (x: number) => (x = clamp(x)) === 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inOutSine: (x: number) => -(Math.cos(Math.PI * clamp(x)) - 1) / 2,
  inOutExpo: (x: number) => {x = clamp(x); return x === 0 || x === 1 ? x : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;},
};

export type Glyph = {dx: number; dy: number; a: number; blur: number};
export type CutState = {visible: boolean; glyphs: Glyph[]; pIn: number; pOut: number};

// Per-glyph offsets for a cut at local time lt. `size` is the font size in px. Glyphs never rotate or scale:
// they drift, blur and fade like light on water. `side` (-1/1) is the direction a gust comes from.
export function cutState(cut: CaptionCut, lt: number, size: number, reduced = false, side = 1): CutState {
  const n = Array.from(cut.text).length;
  const visible = lt >= 0 && lt <= cut.dur;
  const pIn = clamp(lt / cut.inDur), pOut = clamp((lt - (cut.dur - cut.outDur)) / cut.outDur);
  const glyphs: Glyph[] = Array.from({length: n}, () => ({dx: 0, dy: 0, a: 1, blur: 0}));
  if (!visible) return {visible, glyphs, pIn, pOut};
  if (reduced) {
    glyphs.forEach(g => {g.a = Math.min(pIn, 1 - pOut);});
    return {visible, glyphs, pIn, pOut};
  }
  const seed = cut.seed, p = pIn;
  glyphs.forEach((g, i) => {
    const d = n > 1 ? i / (n - 1) : 0;
    // Entrance: each glyph has its own window inside pIn so the text arrives as a travelling wave.
    const win = (spread: number) => clamp((p - d * spread) / (1 - spread));
    switch (cut.enter) {
      case 'focus': {const q = clamp((p - hash(seed, i, 4) * 0.35) / 0.65), e = ease.outCubic(q); g.blur = (1 - e) * size * 0.28; g.a = e; break;}
      case 'rise': {const e = ease.outCubic(win(0.4)); g.dy = (1 - e) * size * 0.55; g.blur = (1 - e) * size * 0.12; g.a = e; break;}
      case 'swell': {const q = win(0.5), e = ease.inOutSine(q); g.dy = Math.sin((1 - q) * Math.PI) * size * 0.22 + (1 - e) * size * 0.25; g.blur = (1 - e) * size * 0.14; g.a = e; break;}
      case 'settle': {const e = ease.outCubic(win(0.3)); g.dy = -(1 - e) * size * 0.35; g.blur = (1 - e) * size * 0.22; g.a = e; break;}
      case 'gust': {const e = ease.outCubic(win(0.35)); g.dx = -side * (1 - e) * size * 1.1; g.dy = Math.sin(e * Math.PI) * size * 0.08; g.blur = (1 - e) * size * 0.2; g.a = ease.outCubic(win(0.35)); break;}
    }
    // Hold: slow, continuous motion (sub-pixel noise, never stepped).
    switch (cut.hold) {
      case 'float': g.dy += Math.sin(lt * 1.7 + i * 0.55) * size * 0.045; break;
      case 'sway': g.dx += Math.sin(lt * 1.1 + i * 0.35) * size * 0.03; g.dy += Math.cos(lt * 1.1 + i * 0.35) * size * 0.03; break;
      case 'swirl': {const ang = lt * 2.2 + i * 0.9; g.dx += Math.cos(ang) * size * 0.035; g.dy += Math.sin(ang) * size * 0.035; break;}
      case 'tremor': {const k = hash(seed, i, 6) * 6.28; g.dx += (Math.sin(lt * 3.1 + k) + Math.sin(lt * 5.3 + k * 1.7) * 0.5) * size * 0.016; g.dy += (Math.sin(lt * 2.7 + k * 2.3) + Math.sin(lt * 6.1 + k) * 0.4) * size * 0.016; break;}
      default: break;
    }
    if (pOut > 0) {
      const e = ease.inOutSine(pOut);
      switch (cut.exit) {
        case 'dissolve': g.blur += e * size * 0.25; g.a *= 1 - e; break;
        case 'ascend': {const q = ease.inOutSine(clamp((pOut - d * 0.3) / 0.7)); g.dy -= q * size * 0.6; g.blur += q * size * 0.15; g.a *= 1 - q; break;}
        case 'descend': g.dy += e * size * 0.5; g.blur += e * size * 0.22; g.a *= 1 - e; break;
        case 'disperse': {const ang = hash(seed, i, 12) * Math.PI * 2, dist = size * (0.5 + hash(seed, i, 13) * 0.6); g.dx += Math.cos(ang) * dist * e; g.dy += Math.sin(ang) * dist * e; g.blur += e * size * 0.2; g.a *= 1 - e; break;}
      }
    }
  });
  return {visible, glyphs, pIn, pOut};
}
