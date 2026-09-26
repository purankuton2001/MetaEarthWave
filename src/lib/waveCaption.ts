// Lyric-motion captions for new waves.
// Motion recipes (pop / drop / blur / type / slice / glitch, jitter / wave / breathe, bounce easing,
// hash-based determinism) are ported from JIZURA (https://github.com/852wa/JIZURA, MIT, (c) 2026 hakoniwa).
import {axes, Axis, Emotions, labels} from './waveEmotion';

export type Enter = 'pop' | 'drop' | 'blur' | 'type' | 'slice' | 'rise';
export type Hold = 'still' | 'jitter' | 'wave' | 'breathe' | 'glitch';
export type Exit = 'fade' | 'sink' | 'glitch' | 'scatter' | 'lift';
export type Layout = 'yoko' | 'tate';
export type CaptionCut = {text: string; start: number; dur: number; inDur: number; outDur: number; enter: Enter; hold: Hold; exit: Exit; layout: Layout; seed: number};
export type CaptionPlan = {id: string; mood: Axis; font: string; color: string; accent: string; label: string; cuts: CaptionCut[]; total: number; seed: number};
export type CaptionSource = {_id: string; text: string; score: number; emotions?: Emotions; cityName?: string};

type Mood = {font: string; color: string; accent: string; enter: Enter[]; hold: Hold[]; exit: Exit[]; tate: number};
// Each emotion gets a JIZURA-like "style": typeface, palette and the motions that suit it.
export const moods: Record<Axis, Mood> = {
  joy: {font: '"Mochiy Pop One", "M PLUS Rounded 1c", sans-serif', color: '#fff4d6', accent: '#f4cf78', enter: ['pop', 'drop'], hold: ['wave', 'breathe'], exit: ['lift', 'scatter'], tate: 0},
  sadness: {font: '"Zen Old Mincho", serif', color: '#e4ecff', accent: '#709cff', enter: ['blur', 'type'], hold: ['breathe', 'still'], exit: ['sink', 'fade'], tate: 0.6},
  anger: {font: '"Dela Gothic One", sans-serif', color: '#ffe6ec', accent: '#f57e96', enter: ['slice', 'drop'], hold: ['jitter', 'glitch'], exit: ['glitch', 'scatter'], tate: 0},
  anxiety: {font: '"DotGothic16", monospace', color: '#efe6ff', accent: '#b898ff', enter: ['type', 'slice'], hold: ['jitter', 'glitch'], exit: ['glitch', 'fade'], tate: 0.2},
  empathy: {font: '"M PLUS Rounded 1c", sans-serif', color: '#e2fbf6', accent: '#65dcc8', enter: ['rise', 'blur'], hold: ['wave', 'breathe'], exit: ['lift', 'fade'], tate: 0.3},
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
  for (const ch of chars) {
    if (!cur && ch === ' ') continue;
    cur += ch;
    if (breakAfter.test(ch) && Array.from(cur.trim()).length >= 3) {out.push(cur.trim()); cur = '';}
    else if (Array.from(cur).length >= max) {out.push(cur); cur = '';}
  }
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

const pick = <T, >(list: T[], r: number) => list[Math.min(list.length - 1, Math.floor(r * list.length))];

export function planCaption(source: CaptionSource): CaptionPlan | null {
  const pieces = splitCuts(source.text);
  if (!pieces.length) return null;
  const mood = dominant(source), style = moods[mood], seed = hashText(source._id + source.text);
  // Vertical writing (縦書き) is chosen per caption so the block doesn't jump between cuts.
  const tate = pieces.every(text => Array.from(text).length <= 8) && hash(seed, 4) < style.tate;
  let start = 0.35; // leave room for the ripple ring to bloom first
  const cuts = pieces.map((text, index): CaptionCut => {
    const n = Array.from(text).length;
    const dur = Math.max(1.3, Math.min(2.8, 0.9 + n * 0.14));
    const cut: CaptionCut = {
      text, start, dur, inDur: Math.min(0.6, dur * 0.35), outDur: Math.min(0.45, dur * 0.25),
      enter: pick(style.enter, hash(seed, index, 1)), hold: pick(style.hold, hash(seed, index, 2)),
      exit: index === pieces.length - 1 ? pick(style.exit, hash(seed, index, 3)) : 'fade',
      layout: tate ? 'tate' : 'yoko', seed: hash(seed, index, 5) * 1e6,
    };
    start += dur - 0.12; // slight overlap, like cut transitions
    return cut;
  });
  const strength = source.emotions ? Math.round(source.emotions[mood] * 100) : Math.round(Math.abs(source.score) * 100);
  const label = [source.cityName, `${labels[mood]} ${strength}`].filter(Boolean).join(' · ');
  return {id: source._id, mood, font: style.font, color: style.color, accent: style.accent, label, cuts, total: start + 0.6, seed};
}

// Easing — same curves as JIZURA's J.E.
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = {
  outCubic: (x: number) => 1 - Math.pow(1 - clamp(x), 3),
  inCubic: (x: number) => Math.pow(clamp(x), 3),
  outExpo: (x: number) => (x = clamp(x)) === 1 ? 1 : 1 - Math.pow(2, -10 * x),
  inOutExpo: (x: number) => {x = clamp(x); return x === 0 || x === 1 ? x : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;},
  outBack: (x: number, s = 1.9) => {x = clamp(x); const c = s + 1; return 1 + c * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);},
  bounce: (x: number) => {
    const n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  },
};

export type Glyph = {dx: number; dy: number; rot: number; s: number; sx: number; sy: number; a: number; blur: number; hide: boolean};
export type CutState = {visible: boolean; glyphs: Glyph[]; bands: number[] | null; cursor: number; pIn: number; pOut: number};

// Per-glyph transforms for a cut at local time lt. `size` is the font size in px, `step` a ≤24 Hz integer clock.
export function cutState(cut: CaptionCut, lt: number, size: number, step: number, reduced = false): CutState {
  const n = Array.from(cut.text).length;
  const visible = lt >= 0 && lt <= cut.dur;
  const pIn = clamp(lt / cut.inDur), pOut = clamp((lt - (cut.dur - cut.outDur)) / cut.outDur);
  const glyphs: Glyph[] = Array.from({length: n}, () => ({dx: 0, dy: 0, rot: 0, s: 1, sx: 1, sy: 1, a: 1, blur: 0, hide: false}));
  let bands: number[] | null = null, cursor = -1;
  if (!visible) return {visible, glyphs, bands, cursor, pIn, pOut};
  if (reduced) {
    glyphs.forEach(g => {g.a = Math.min(pIn, 1 - pOut);});
    return {visible, glyphs, bands, cursor, pIn, pOut};
  }
  const seed = cut.seed, p = pIn;
  glyphs.forEach((g, i) => {
    const d = n > 1 ? i / (n - 1) : 0;
    switch (cut.enter) {
      case 'pop': {const q = clamp((p - d * 0.45) / 0.55); if (q <= 0) g.hide = true; g.s = ease.outBack(q, 2.6); g.rot = (1 - ease.outCubic(q)) * (hash(seed, i, 9) * 2 - 1) * 28; break;}
      case 'drop': {const q = clamp((p - hash(seed, i, 4) * 0.5) / 0.5); if (q <= 0) g.hide = true; g.dy = -(1 - ease.bounce(q)) * size * 2.4; g.sy = 1 + (1 - q) * 0.5; g.sx = 1 - (1 - q) * 0.2; break;}
      case 'blur': {const e = ease.outCubic(p); g.blur = (1 - e) * 18; g.a = Math.pow(e, 0.7); g.dx = (i - (n - 1) / 2) * size * 0.5 * (1 - e); break;}
      case 'type': if (i >= Math.floor(p * (n + 0.999))) g.hide = true; cursor = p < 1 ? Math.floor(p * (n + 0.999)) : -1; break;
      case 'rise': {const q = clamp((p - d * 0.35) / 0.65), e = ease.outCubic(q); g.dy = (1 - e) * size * 0.9; g.a = e; break;}
      case 'slice': break;
    }
    switch (cut.hold) {
      case 'jitter': {const a = size * 0.03; g.dx += (hash(seed, step, i, 1) * 2 - 1) * a; g.dy += (hash(seed, step, i, 2) * 2 - 1) * a; g.rot += (hash(seed, step, i, 3) * 2 - 1) * 4; break;}
      case 'wave': g.dy += Math.sin(lt * 5 + i * 0.75) * size * 0.07; g.rot += Math.cos(lt * 5 + i * 0.75) * 5; break;
      case 'breathe': g.s *= 1 + 0.035 * Math.sin(lt * Math.PI * 1.8); break;
      default: break;
    }
    if (pOut > 0) {
      const e = ease.inCubic(pOut);
      switch (cut.exit) {
        case 'fade': g.a *= 1 - pOut; break;
        case 'sink': g.dy += e * size * 1.2; g.blur += e * 10; g.a *= 1 - pOut; break;
        case 'lift': {const q = clamp((pOut - d * 0.3) / 0.7); g.dy -= ease.inCubic(q) * size * 1.8; g.a *= 1 - q; break;}
        case 'scatter': {const ang = hash(seed, i, 12) * Math.PI * 2, dist = size * (2 + hash(seed, i, 13) * 3); g.dx += Math.cos(ang) * dist * e; g.dy += Math.sin(ang) * dist * e; g.rot += (hash(seed, i, 14) * 2 - 1) * 260 * e; g.a *= 1 - e * e; break;}
        case 'glitch': if (pOut > 0.55) g.a *= (hash(seed, step, 63) < 0.5 ? 0.15 : 1) * (1 - clamp((pOut - 0.8) / 0.2)); break;
      }
    }
  });
  // Horizontal band offsets (7 slices): slice entrance, glitch hold / exit.
  if (cut.enter === 'slice' && p < 1) bands = Array.from({length: 7}, (_, i) => (1 - ease.outExpo(p * 1.2 - 0.05 * i)) * (i % 2 ? 1 : -1) * size * 12);
  else if (cut.exit === 'glitch' && pOut > 0) bands = Array.from({length: 7}, (_, i) => hash(seed, step, i, 61) < 0.75 ? (hash(seed, step, i, 62) * 2 - 1) * size * (0.3 + pOut * 2.2) : 0);
  else if (cut.hold === 'glitch' && hash(seed, step, 77) < 0.22) bands = Array.from({length: 7}, (_, i) => hash(seed, step, i, 5) < 0.6 ? (hash(seed, step, i, 6) * 2 - 1) * size * 0.35 : 0);
  return {visible, glyphs, bands, cursor, pIn, pOut};
}
