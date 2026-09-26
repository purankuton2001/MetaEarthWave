// Canvas2D renderer for wave captions (see waveCaption.ts for the planner and motion recipes).
// Look: white serif type washed with the emotion colour, a soft glow and a quiet shadow — light on water,
// in the same palette as the globe, rather than an opaque telop.
import {CaptionPlan, CAPTION_WEIGHT, cutState, ease, clamp, hash} from './waveCaption';

const SHADOW = 'rgba(20, 6, 48, 0.62)';
const TATE_SHIFT = '、。，．', TATE_ROTATE = 'ー〜～…‥―-()（）「」『』';

type Point = {x: number; y: number};
// Where each caption's text block was placed, as fractions of the viewport so a resize keeps it on screen.
const placed = new WeakMap<CaptionPlan, {side: number; fx: number; fy: number}>();
export type Globe = Point & {r: number};

const rgba = (hex: string, a: number) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${a})`;
};
const mixWhite = (hex: string, k: number) => {
  const v = parseInt(hex.slice(1), 16), ch = (s: number) => Math.round(255 * (1 - k) + ((v >> s) & 255) * k);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};

// Draws one frame of a wave caption at time t (s). `anchor` is the wave's screen position, or null when it faces away;
// `globe` is the globe's screen centre and radius (null before the 3D scene reports it).
export function drawCaption(ctx: CanvasRenderingContext2D, plan: CaptionPlan, t: number, W: number, H: number, reduced: boolean, anchor: Point | null, globe: Globe | null = null) {
  const size = Math.round(Math.min(W, H) * 0.062);
  const fadeAll = ease.inOutSine(t / 0.6) * (1 - ease.inOutSine((t - plan.total + 0.8) / 0.8));
  if (plan.cuts[0].layout === 'orbit') {
    drawOrbit(ctx, plan, t, W, H, reduced, anchor, globe || {x: W / 2, y: H / 2, r: Math.min(W, H) * 0.43}, size, fadeAll);
    return;
  }
  // Text block sits beside the wave on the side with more room; centred when the wave is behind the globe.
  // Vertical range keeps clear of the score panel (top) and Create Wave button (bottom).
  const onGlobe = Boolean(anchor);
  const ax = anchor ? anchor.x : W / 2, ay = anchor ? anchor.y : H * 0.3;
  const tate = plan.cuts[0].layout === 'tate';
  const longest = Math.max(...plan.cuts.map(cut => Array.from(cut.text).length));
  const glyph = tate ? Math.min(size, H * 0.34 / longest) : size;
  const blockH = tate ? glyph * 1.12 * longest : size * 1.4;
  // The block is placed once, where the wave is first seen, and then stays put while the globe carries the wave on;
  // the hairline follows the wave. (Following it made the text slide and eventually leave the screen.)
  if (anchor && t < 0.6 && !placed.has(plan)) {
    const side = ax < W / 2 ? 1 : -1;
    placed.set(plan, {side, fx: clamp(ax / W + side * 0.22, 0.32, 0.68), fy: ay / H - 0.12});
  }
  const spot = placed.get(plan);
  const side = spot ? spot.side : 1;
  const cx = spot ? spot.fx * W : W / 2;
  const cy = clamp(spot ? spot.fy * H : H * 0.45, H * 0.3 + blockH / 2, H * 0.78 - blockH / 2 - size * 0.6);
  const labelY = cy + blockH / 2 + size * 0.6;

  ctx.save();
  // Very soft shade behind the text block so white type reads over the bright fluid.
  scrim(ctx, cx, cy + size * 0.2, tate ? size * 2.2 : W * 0.3, blockH / 2 + size * 1.1, 0.4 * fadeAll);
  if (onGlobe && !reduced) ripple(ctx, plan, ax, ay, t, size, fadeAll);
  // Hairline from the wave to the caption, drawn on slowly.
  if (onGlobe) {
    const q = reduced ? 1 : ease.inOutSine(clamp((t - 0.2) / 0.9));
    const ex = cx - side * size * 0.3, ey = labelY - size * 0.3;
    // Once the globe carries the wave toward (or past) the pinned text, the line would cut through it; fade it out.
    const clear = clamp((side * (cx - ax) - size * 1.5) / (size * 2));
    ctx.globalAlpha = 0.45 * fadeAll * clear; ctx.strokeStyle = mixWhite(plan.accent, 0.6); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (ex - ax) * q, ay + (ey - ay) * q); ctx.stroke();
    ctx.globalAlpha = 0.8 * fadeAll; ctx.fillStyle = mixWhite(plan.accent, 0.6);
    ctx.beginPath(); ctx.arc(ax, ay, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  label(ctx, plan, cx, labelY, t, size, fadeAll, reduced);
  if (!reduced) motes(ctx, plan, t, cx, cy, tate ? size * 3 : W * 0.46, blockH + size * 1.4, fadeAll);
  ctx.restore();

  for (const cut of plan.cuts) {
    const lt = t - cut.start;
    if (lt < 0 || lt > cut.dur) continue;
    drawCut(ctx, plan, cut, cutState(cut, lt, glyph, reduced, side), cx, cy, glyph, W, fadeAll);
  }
}

function scrim(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, alpha: number) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, 'rgba(18, 6, 44, 1)'); g.addColorStop(0.55, 'rgba(18, 6, 44, 0.45)'); g.addColorStop(1, 'rgba(18, 6, 44, 0)');
  ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
  ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawCut(ctx: CanvasRenderingContext2D, plan: CaptionPlan, cut: CaptionPlan['cuts'][number], state: ReturnType<typeof cutState>, cx: number, cy: number, size: number, W: number, fadeAll: number) {
  const chars = Array.from(cut.text);
  const tate = cut.layout === 'tate';
  // Shrink long cuts so they fit ~60% of the width.
  // Glyphs are ~1em wide plus 0.08em tracking, so divide by 1.1em per character.
  const fontSize = tate ? size : Math.min(size, W * 0.6 / Math.max(1, chars.length * 1.1));
  ctx.save();
  ctx.font = `${CAPTION_WEIGHT} ${fontSize}px ${plan.font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // A little tracking gives the serif room to breathe.
  const widths = chars.map(ch => tate ? fontSize * 1.12 : ctx.measureText(ch).width + fontSize * 0.08);
  const total = widths.reduce((a, b) => a + b, 0);
  const positions = widths.map((w, i) => widths.slice(0, i).reduce((a, b) => a + b, 0) + w / 2 - total / 2);
  const fill = glyphFill(ctx, plan, fontSize, -0.5);
  chars.forEach((ch, i) => {
    const g = state.glyphs[i];
    const alpha = clamp(g.a) * fadeAll;
    if (alpha <= 0.01) return;
    const x = (tate ? cx : cx + positions[i]) + g.dx, y = (tate ? cy + positions[i] : cy) + g.dy;
    ctx.save();
    ctx.translate(x, y);
    // 縦書き: commas/periods sit top-right, long marks and brackets turn 90°.
    if (tate && TATE_SHIFT.includes(ch)) ctx.translate(fontSize * 0.32, -fontSize * 0.32);
    else if (tate && TATE_ROTATE.includes(ch)) ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = alpha;
    if (g.blur > 0.4) ctx.filter = `blur(${g.blur.toFixed(1)}px)`;
    paintGlyph(ctx, plan, ch, fontSize, fill, true);
    ctx.restore();
  });
  ctx.restore();
}

// Ripple rings spread slowly from the wave origin (echoing the shader's wave).
function ripple(ctx: CanvasRenderingContext2D, plan: CaptionPlan, ax: number, ay: number, t: number, size: number, fadeAll: number) {
  ctx.save();
  ctx.strokeStyle = mixWhite(plan.accent, 0.55);
  for (let k = 0; k < 3; k++) {
    const q = clamp((t - k * 0.55) / 2.6);
    if (q <= 0 || q >= 1) continue;
    ctx.globalAlpha = Math.sin(q * Math.PI) * (1 - q) * 0.75 * fadeAll;
    ctx.lineWidth = 1.2 * (1 - q) + 0.4;
    ctx.beginPath(); ctx.arc(ax, ay, 4 + ease.outCubic(q) * size * 1.9, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// Small spaced serif label: city · dominant emotion, with a hairline that draws itself under it.
function label(ctx: CanvasRenderingContext2D, plan: CaptionPlan, x: number, y: number, t: number, size: number, fadeAll: number, reduced: boolean) {
  const q = reduced ? 1 : ease.inOutSine(clamp((t - 0.4) / 1));
  ctx.save();
  ctx.globalAlpha = fadeAll * q; ctx.fillStyle = mixWhite(plan.accent, 0.35);
  ctx.font = `600 ${Math.round(size * 0.32)}px ${plan.font}`;
  (ctx as CanvasRenderingContext2D & {letterSpacing?: string}).letterSpacing = `${(size * 0.05).toFixed(1)}px`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = SHADOW; ctx.shadowBlur = size * 0.3;
  ctx.fillText(plan.label, x, y);
  const labelW = ctx.measureText(plan.label).width;
  ctx.shadowBlur = 0; ctx.globalAlpha = fadeAll * 0.4;
  ctx.fillRect(x - labelW / 2 * q, y + size * 0.24, labelW * q, 0.8);
  ctx.restore();
}

// Orbit layout: the post revolves slowly around the globe on a tilted ring, like a planetary ring of text.
// The front half reads left to right; the back half is mirrored, smaller and dimmed (more so behind the globe).
const RING = 1.22, FLAT = 0.26, ROLL = -0.2;
function drawOrbit(ctx: CanvasRenderingContext2D, plan: CaptionPlan, t: number, W: number, H: number, reduced: boolean, anchor: Point | null, globe: Globe, size: number, fadeAll: number) {
  const cut = plan.cuts[0], lt = t - cut.start, chars = Array.from(cut.text), n = chars.length;
  const glyph = size * 0.8, R = globe.r * RING;
  const cosR = Math.cos(ROLL), sinR = Math.sin(ROLL);
  const at = (theta: number) => {
    const ex = Math.cos(theta) * R, ey = Math.sin(theta) * R * FLAT;
    return {x: globe.x + ex * cosR - ey * sinR, y: globe.y + ex * sinR + ey * cosR, depth: Math.sin(theta)};
  };
  const front = at(Math.PI / 2), labelY = front.y + glyph * 1.5;

  ctx.save();
  if (anchor && !reduced) ripple(ctx, plan, anchor.x, anchor.y, t, size, fadeAll);
  scrim(ctx, front.x, front.y + glyph * 0.4, R * 0.9, glyph * 1.9, 0.36 * fadeAll);
  label(ctx, plan, front.x, labelY, t, size, fadeAll, reduced);
  if (!reduced) motes(ctx, plan, t, globe.x, globe.y, R * 2.1, R * FLAT * 2 + glyph * 3, fadeAll);
  ctx.restore();
  if (lt < 0 || lt > cut.dur) return;

  const state = cutState(cut, lt, glyph, reduced);
  const draw = ease.inOutSine(lt / cut.inDur) * (1 - state.pOut);
  // The ring line draws itself on during the entrance: back half faint first, front half later.
  const orbitLine = (a0: number, a1: number, alpha: number) => {
    ctx.save(); ctx.globalAlpha = alpha * draw * fadeAll; ctx.strokeStyle = mixWhite(plan.accent, 0.55); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(globe.x, globe.y, R, R * FLAT, ROLL, a0, a1); ctx.stroke(); ctx.restore();
  };
  const sweep = reduced ? 1 : ease.inOutSine(lt / (cut.inDur * 1.4));
  orbitLine(Math.PI, Math.PI + Math.PI * sweep, 0.16);

  // Centre of the text sits at the front halfway through, so the whole post passes by while it turns.
  const spacing = glyph * 1.14 / R;
  const centre = Math.PI / 2 + (reduced ? 0 : plan.spin * (lt - cut.dur / 2));
  const glyphs = chars.map((ch, i) => ({ch, i, ...at(centre - (i - (n - 1) / 2) * spacing)}))
    .sort((a, b) => a.depth - b.depth);
  let frontLine = false;
  ctx.save();
  ctx.font = `${CAPTION_WEIGHT} ${glyph}px ${plan.font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const fill = glyphFill(ctx, plan, glyph, -0.85);
  for (const p of glyphs) {
    if (!frontLine && p.depth >= 0) {orbitLine(0, Math.PI * sweep, 0.45); frontLine = true;}
    const g = state.glyphs[p.i];
    const behindGlobe = p.depth < 0 && Math.hypot(p.x - globe.x, p.y - globe.y) < globe.r;
    const alpha = clamp(g.a) * fadeAll * (p.depth >= 0 ? 1 : 1 - 0.7 * clamp(-p.depth * 3)) * (behindGlobe ? 0.4 : 1);
    if (alpha <= 0.01) continue;
    const face = Math.sign(p.depth || 1) * Math.max(0.14, Math.abs(p.depth)), persp = 0.82 + 0.18 * p.depth;
    ctx.save();
    ctx.translate(p.x + g.dx, p.y + g.dy - glyph * 0.12);
    ctx.rotate(ROLL * 0.6);
    ctx.scale(face * persp, persp);
    ctx.globalAlpha = alpha;
    // Glyphs on the far side soften a little, like depth of field.
    const blur = g.blur + (p.depth < 0 ? -p.depth * glyph * 0.05 : 0);
    if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`;
    paintGlyph(ctx, plan, p.ch, glyph, fill, p.depth > 0);
    ctx.restore();
  }
  if (!frontLine) orbitLine(0, Math.PI * sweep, 0.45);
  ctx.restore();
}

// Vertical white-to-tint fill in glyph-local coordinates; shared by every glyph of a cut.
// `top` is where the glyph's top sits relative to the anchor, in ems (-0.5 for middle baseline, -0.85 for alphabetic).
function glyphFill(ctx: CanvasRenderingContext2D, plan: CaptionPlan, size: number, top: number) {
  const fill = ctx.createLinearGradient(0, top * size, 0, (top + 1) * size);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(1, mixWhite(plan.accent, plan.look.tint));
  return fill;
}

// One glyph in local coordinates (origin on the glyph's anchor, current alpha/filter already set).
// Two passes: a quiet dark shadow for legibility, then white-to-tint type with a coloured glow.
function paintGlyph(ctx: CanvasRenderingContext2D, plan: CaptionPlan, ch: string, size: number, fill: CanvasGradient, glow: boolean) {
  const alpha = ctx.globalAlpha;
  ctx.shadowColor = SHADOW; ctx.shadowBlur = size * 0.32; ctx.shadowOffsetY = size * 0.03;
  ctx.globalAlpha = alpha * 0.85; ctx.fillStyle = SHADOW; ctx.fillText(ch, 0, 0);
  ctx.shadowOffsetY = 0;
  if (glow) {ctx.shadowColor = rgba(plan.accent, 0.75); ctx.shadowBlur = size * plan.look.glow;} else ctx.shadowBlur = 0;
  ctx.globalAlpha = alpha; ctx.fillStyle = fill; ctx.fillText(ch, 0, 0);
  ctx.shadowBlur = 0;
}

// Foam-like motes around the text box (centre x, y; size w × h), deterministic from the plan seed.
// They drift the way the emotion's wave moves: up (joy), down (sadness), around (anger), aimlessly (anxiety, empathy).
function motes(ctx: CanvasRenderingContext2D, plan: CaptionPlan, t: number, x: number, y: number, w: number, h: number, fadeAll: number) {
  const seed = plan.seed, kind = plan.look.motes;
  // Two unit-radius soft dots (white, accent) reused for every mote via translate/scale.
  const dot = (colour: string) => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, colour); g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return g;
  };
  const white = dot('rgba(255, 255, 255, 1)'), tinted = dot(rgba(plan.accent, 1));
  ctx.save();
  const base = ctx.getTransform();
  for (let k = 0; k < 14; k++) {
    const speed = 0.06 + hash(seed, k, 1) * 0.06, phase = hash(seed, k, 2);
    const q = (t * speed + phase) % 1;
    let px = x + (hash(seed, k, 3) - 0.5) * w, py = y + (hash(seed, k, 4) - 0.5) * h;
    if (kind === 'up') py += (0.5 - q) * h * 0.8;
    else if (kind === 'down') py -= (0.5 - q) * h * 0.8;
    else if (kind === 'swirl') {const a = t * 0.5 + phase * 6.28; px += Math.cos(a) * w * 0.08; py += Math.sin(a) * h * 0.12;}
    else {px += Math.sin(t * 0.4 + phase * 6.28) * w * 0.05; py += Math.cos(t * 0.33 + phase * 9) * h * 0.08;}
    const a = Math.sin(q * Math.PI) * (0.25 + 0.35 * hash(seed, k, 5)) * fadeAll;
    if (a <= 0.02) continue;
    const r = 1.6 + hash(seed, k, 6) * 3.4;
    ctx.setTransform(base.translate(px, py).scale(r * 2.2));
    ctx.globalAlpha = a; ctx.fillStyle = k % 3 ? white : tinted;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
