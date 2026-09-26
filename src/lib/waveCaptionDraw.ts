// Canvas2D renderer for wave captions (see waveCaption.ts for the planner and motion recipes).
import {CaptionPlan, cutState, ease, clamp, hash} from './waveCaption';

const INK = 'rgba(24, 8, 48, 0.75)';
const TATE_SHIFT = '、。，．', TATE_ROTATE = 'ー〜～…‥―-()（）「」『』';

type Point = {x: number; y: number};
export type Globe = Point & {r: number};

// Draws one frame of a wave caption at time t (s). `anchor` is the wave's screen position, or null when it faces away;
// `globe` is the globe's screen centre and radius (null before the 3D scene reports it).
export function drawCaption(ctx: CanvasRenderingContext2D, plan: CaptionPlan, t: number, W: number, H: number, reduced: boolean, anchor: Point | null, globe: Globe | null = null) {
  const size = Math.round(Math.min(W, H) * 0.068), step = Math.floor(t * 20);
  const fadeAll = clamp(t / 0.3) * (1 - clamp((t - plan.total + 0.5) / 0.5));
  if (plan.cuts[0].layout === 'orbit') {
    drawOrbit(ctx, plan, t, W, H, reduced, anchor, globe || {x: W / 2, y: H / 2, r: Math.min(W, H) * 0.43}, size, step, fadeAll);
    return;
  }
  // Text block sits beside the wave on the side with more room; centred when the wave is behind the globe.
  // Vertical range keeps clear of the score panel (top) and Create Wave button (bottom).
  const onGlobe = Boolean(anchor);
  const ax = anchor ? anchor.x : W / 2, ay = anchor ? anchor.y : H * 0.3;
  const side = ax < W / 2 ? 1 : -1;
  const cx = onGlobe ? clamp(ax + side * W * 0.22, W * 0.2, W * 0.8) : W / 2;
  const tate = plan.cuts[0].layout === 'tate';
  const longest = Math.max(...plan.cuts.map(cut => Array.from(cut.text).length));
  const glyph = tate ? Math.min(size, H * 0.34 / longest) : size;
  const blockH = tate ? glyph * 1.05 * longest : size * 1.4;
  const cy = clamp(onGlobe ? ay - H * 0.12 : H * 0.45, H * 0.3 + blockH / 2, H * 0.78 - blockH / 2 - size * 0.55);
  const labelY = cy + blockH / 2 + size * 0.55;

  ctx.save();
  // Soft dark scrim behind the text block so it reads over the bright fluid.
  const rx = tate ? size * 2.2 : W * 0.34, ry = blockH / 2 + size * 1.1;
  const scrim = ctx.createRadialGradient(cx, cy + size * 0.3, 0, cx, cy + size * 0.3, 1);
  scrim.addColorStop(0, 'rgba(12, 4, 30, 0.42)'); scrim.addColorStop(1, 'rgba(12, 4, 30, 0)');
  ctx.save(); ctx.translate(cx, cy + size * 0.3); ctx.scale(rx, ry); ctx.translate(-cx, -cy - size * 0.3);
  ctx.globalAlpha = fadeAll; ctx.fillStyle = scrim; ctx.fillRect(cx - 1, cy + size * 0.3 - 1, 2, 2);
  ctx.restore();
  if (onGlobe && !reduced) ripple(ctx, plan, ax, ay, t, size, fadeAll);
  // Leader line drawn on from the wave to the caption, like a lyric-video callout.
  if (onGlobe) {
    const q = reduced ? 1 : ease.inOutExpo(clamp((t - 0.1) / 0.5));
    const ex = cx - side * size * 0.3, ey = labelY - size * 0.3;
    ctx.globalAlpha = 0.7 * fadeAll; ctx.strokeStyle = plan.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (ex - ax) * q, ay + (ey - ay) * q); ctx.stroke();
    ctx.fillStyle = plan.accent; ctx.beginPath(); ctx.arc(ax, ay, 3, 0, Math.PI * 2); ctx.fill();
  }
  label(ctx, plan, cx, labelY, t, size, fadeAll, reduced);
  if (!reduced) particles(ctx, plan, t, step, cx, cy, tate ? size * 2.6 : W * 0.5, blockH + size, fadeAll);
  ctx.restore();

  for (const cut of plan.cuts) {
    const lt = t - cut.start;
    if (lt < 0 || lt > cut.dur) continue;
    drawCut(ctx, plan, cut, cutState(cut, lt, glyph, step, reduced), cx, cy, glyph, W, t, step, reduced);
  }
}

function drawCut(ctx: CanvasRenderingContext2D, plan: CaptionPlan, cut: CaptionPlan['cuts'][number], state: ReturnType<typeof cutState>, cx: number, cy: number, size: number, W: number, t: number, step: number, reduced: boolean) {
  const chars = Array.from(cut.text);
  const tate = cut.layout === 'tate';
  // Shrink long cuts so they fit ~60% of the width.
  const fontSize = tate ? size : Math.min(size, W * 0.6 / Math.max(1, chars.length * 0.95));
  ctx.save();
  ctx.font = `${fontSize}px ${plan.font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const widths = chars.map(ch => tate ? fontSize * 1.05 : ctx.measureText(ch).width + fontSize * 0.02);
  const total = widths.reduce((a, b) => a + b, 0);
  const positions = widths.map((w, i) => widths.slice(0, i).reduce((a, b) => a + b, 0) + w / 2 - total / 2);
  const bandH = (tate ? total : fontSize * 1.4) / (state.bands?.length || 1);
  const top = cy - (tate ? total : fontSize * 1.4) / 2;

  const paint = (offsetX: number) => chars.forEach((ch, i) => {
    const g = state.glyphs[i];
    if (g.hide || g.a <= 0.01) return;
    const x = (tate ? cx : cx + positions[i]) + g.dx + offsetX, y = (tate ? cy + positions[i] : cy) + g.dy;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(g.rot * Math.PI / 180); ctx.scale(g.s * g.sx, g.s * g.sy);
    // 縦書き: commas/periods sit top-right, long marks and brackets turn 90°.
    if (tate && TATE_SHIFT.includes(ch)) ctx.translate(fontSize * 0.32, -fontSize * 0.32);
    else if (tate && TATE_ROTATE.includes(ch)) ctx.rotate(Math.PI / 2);
    ctx.globalAlpha = clamp(g.a);
    if (g.blur > 0.5) ctx.filter = `blur(${g.blur.toFixed(1)}px)`;
    paintGlyph(ctx, plan, ch, fontSize, i, t, step, -0.5, true, reduced);
    ctx.restore();
  });

  if (state.bands) {
    // Band slicing: redraw the text in horizontal strips, each shifted sideways.
    state.bands.forEach((dx, i) => {
      ctx.save(); ctx.beginPath(); ctx.rect(0, top + i * bandH, W, bandH + 0.5); ctx.clip();
      paint(dx); ctx.restore();
    });
  } else paint(0);

  if (state.cursor >= 0) {
    const at = state.cursor < chars.length ? positions[state.cursor] - widths[state.cursor] / 2 : total / 2;
    ctx.fillStyle = plan.accent;
    if (tate) ctx.fillRect(cx - fontSize * 0.45, cy + at, fontSize * 0.9, 2);
    else ctx.fillRect(cx + at, cy - fontSize * 0.45, 2, fontSize * 0.9);
  }
  ctx.restore();
}

// Ripple rings bloom from the wave origin (echoing the shader's wave).
function ripple(ctx: CanvasRenderingContext2D, plan: CaptionPlan, ax: number, ay: number, t: number, size: number, fadeAll: number) {
  for (let k = 0; k < 3; k++) {
    const q = clamp((t - k * 0.35) / 1.6);
    if (q <= 0 || q >= 1) continue;
    ctx.globalAlpha = (1 - q) * 0.8 * fadeAll;
    ctx.strokeStyle = plan.accent; ctx.lineWidth = 2 * (1 - q) + 0.5;
    ctx.beginPath(); ctx.arc(ax, ay, 6 + ease.outCubic(q) * size * 1.6, 0, Math.PI * 2); ctx.stroke();
  }
}

// Small mono label: city · dominant emotion.
function label(ctx: CanvasRenderingContext2D, plan: CaptionPlan, x: number, y: number, t: number, size: number, fadeAll: number, reduced: boolean) {
  ctx.globalAlpha = fadeAll * 0.9; ctx.fillStyle = plan.accent;
  ctx.font = `${Math.round(size * 0.32)}px "IBM Plex Mono", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const labelW = ctx.measureText(plan.label).width;
  ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = INK;
  ctx.strokeText(plan.label, x, y);
  ctx.fillText(plan.label, x, y);
  ctx.globalAlpha = fadeAll * 0.6; ctx.fillRect(x - labelW / 2, y + size * 0.2, labelW * (reduced ? 1 : ease.outExpo(t / 0.8)), 1);
}

// Orbit layout: the post revolves around the globe on a tilted ring, like a planetary ring of text.
// The front half reads left to right; the back half is mirrored, smaller and dimmed (more so behind the globe).
const RING = 1.22, FLAT = 0.26, ROLL = -0.2;
function drawOrbit(ctx: CanvasRenderingContext2D, plan: CaptionPlan, t: number, W: number, H: number, reduced: boolean, anchor: Point | null, globe: Globe, size: number, step: number, fadeAll: number) {
  const cut = plan.cuts[0], lt = t - cut.start, chars = Array.from(cut.text), n = chars.length;
  const glyph = size * 0.85, R = globe.r * RING;
  const cosR = Math.cos(ROLL), sinR = Math.sin(ROLL);
  const at = (theta: number) => {
    const ex = Math.cos(theta) * R, ey = Math.sin(theta) * R * FLAT;
    return {x: globe.x + ex * cosR - ey * sinR, y: globe.y + ex * sinR + ey * cosR, depth: Math.sin(theta)};
  };
  const front = at(Math.PI / 2), labelY = front.y + glyph * 1.4;

  ctx.save();
  if (anchor && !reduced) ripple(ctx, plan, anchor.x, anchor.y, t, size, fadeAll);
  // Soft scrim under the front of the ring.
  const scrim = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  scrim.addColorStop(0, 'rgba(12, 4, 30, 0.4)'); scrim.addColorStop(1, 'rgba(12, 4, 30, 0)');
  ctx.save(); ctx.translate(front.x, front.y + glyph * 0.5); ctx.scale(R * 0.95, glyph * 1.9);
  ctx.globalAlpha = fadeAll; ctx.fillStyle = scrim; ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
  label(ctx, plan, front.x, labelY, t, size, fadeAll, reduced);
  if (!reduced) particles(ctx, plan, t, step, globe.x, globe.y, R * 2.1, R * FLAT * 2 + glyph * 3, fadeAll);
  ctx.restore();
  if (lt < 0 || lt > cut.dur) return;

  const state = cutState(cut, lt, glyph, step, reduced);
  const draw = clamp(lt / cut.inDur) * (1 - state.pOut);
  // The ring line draws itself on during the entrance: back half faint first, front half later.
  const orbitLine = (a0: number, a1: number, alpha: number) => {
    ctx.save(); ctx.globalAlpha = alpha * draw * fadeAll; ctx.strokeStyle = plan.accent; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(globe.x, globe.y, R, R * FLAT, ROLL, a0, a1); ctx.stroke(); ctx.restore();
  };
  const sweep = reduced ? 1 : ease.outCubic(clamp(lt / cut.inDur));
  orbitLine(Math.PI, Math.PI + Math.PI * sweep, 0.2);

  // Centre of the text sits at the front halfway through, so the whole post passes by while it spins.
  const spacing = glyph * 1.08 / R;
  const centre = Math.PI / 2 + (reduced ? 0 : plan.spin * (lt - cut.dur / 2));
  const glyphs = chars.map((ch, i) => ({ch, i, ...at(centre - (i - (n - 1) / 2) * spacing)}))
    .sort((a, b) => a.depth - b.depth);
  let frontLine = false;
  ctx.save();
  ctx.font = `${glyph}px ${plan.font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const p of glyphs) {
    if (!frontLine && p.depth >= 0) {orbitLine(0, Math.PI * sweep, 0.55); frontLine = true;}
    const g = state.glyphs[p.i];
    if (g.hide || g.a <= 0.01) continue;
    const behindGlobe = p.depth < 0 && Math.hypot(p.x - globe.x, p.y - globe.y) < globe.r;
    const alpha = clamp(g.a) * fadeAll * (p.depth >= 0 ? 1 : 1 - 0.7 * clamp(-p.depth * 3)) * (behindGlobe ? 0.45 : 1);
    if (alpha <= 0.01) continue;
    const face = Math.sign(p.depth || 1) * Math.max(0.14, Math.abs(p.depth)), persp = 0.82 + 0.18 * p.depth;
    ctx.save();
    ctx.translate(p.x + g.dx, p.y + g.dy - glyph * 0.12);
    ctx.rotate((g.rot * Math.PI / 180) + ROLL * 0.6);
    ctx.scale(g.s * g.sx * face * persp, g.s * g.sy * persp);
    ctx.globalAlpha = alpha;
    if (g.blur > 0.5) ctx.filter = `blur(${g.blur.toFixed(1)}px)`;
    paintGlyph(ctx, plan, p.ch, glyph, p.i, t, step, -0.85, p.depth > 0, reduced);
    ctx.restore();
  }
  if (!frontLine) orbitLine(0, Math.PI * sweep, 0.55);
  ctx.restore();
}

const mixHex = (a: string, b: string, k: number) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - k) + ((pb >> shift) & 255) * k);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
};

// One glyph in local coordinates (origin on the glyph's anchor, current alpha/filter already set).
// Layers, back to front: chromatic ghosts → extrusion → dark outline → gradient fill (or outline-only) with glow.
// `top` is where the glyph's top sits relative to the anchor, in ems (-0.5 for middle baseline, -0.85 for alphabetic).
function paintGlyph(ctx: CanvasRenderingContext2D, plan: CaptionPlan, ch: string, size: number, i: number, t: number, step: number, top: number, glow: boolean, reduced: boolean) {
  const look = plan.look, alpha = ctx.globalAlpha;
  if (look.chroma > 0) {
    // RGB split; jumps with the step clock so it reads as a glitchy aberration.
    const d = size * 0.07 * look.chroma * (reduced ? 1 : 0.6 + 0.8 * hash(plan.seed, step, i, 71));
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillStyle = '#ff2a6d'; ctx.fillText(ch, -d, 0);
    ctx.fillStyle = '#19e0ff'; ctx.fillText(ch, d, d * 0.3);
  }
  for (let k = look.extrude; k > 0; k--) {
    ctx.globalAlpha = alpha * (1 - 0.5 * k / look.extrude);
    ctx.fillStyle = look.extrudeColor; ctx.fillText(ch, k * size * 0.022, k * size * 0.022);
  }
  ctx.globalAlpha = alpha;
  ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.12; ctx.strokeStyle = INK;
  ctx.strokeText(ch, 0, 0);
  // Shimmer slides the two palette colours along the text over time.
  const shift = look.shimmer && !reduced ? (Math.sin(t * 2.4 - i * 0.6) + 1) / 2 : 0;
  const fill = ctx.createLinearGradient(0, top * size, 0, (top + 1) * size);
  fill.addColorStop(0, mixHex(look.fill[0], look.fill[1], shift * 0.6));
  fill.addColorStop(1, mixHex(look.fill[1], look.fill[0], shift * 0.6));
  if (glow) {ctx.shadowColor = look.fill[1]; ctx.shadowBlur = size * 0.45;}
  if (look.outline) {
    ctx.lineWidth = size * 0.055; ctx.strokeStyle = fill; ctx.strokeText(ch, 0, 0);
    ctx.shadowBlur = 0; ctx.globalAlpha = alpha * 0.22;
  }
  ctx.fillStyle = fill; ctx.fillText(ch, 0, 0);
  ctx.globalAlpha = alpha; ctx.shadowBlur = 0;
}

// Ambient particles around the text box (centre x, y; size w × h), deterministic from the plan seed.
function particles(ctx: CanvasRenderingContext2D, plan: CaptionPlan, t: number, step: number, x: number, y: number, w: number, h: number, fadeAll: number) {
  const seed = plan.seed, kind = plan.look.particles;
  ctx.save();
  if (kind === 'sparkle') {
    for (let k = 0; k < 20; k++) {
      const a = Math.max(0, Math.sin(t * 3.2 + hash(seed, k, 1) * 6.28)) * fadeAll;
      if (a <= 0.02) continue;
      const px = x + (hash(seed, k, 2) - 0.5) * w * 1.1, py = y + (hash(seed, k, 3) - 0.5) * h * 1.3 - t * 6;
      const r = (4 + hash(seed, k, 4) * 8) * (0.6 + 0.4 * a);
      ctx.globalAlpha = a; ctx.fillStyle = k % 3 ? '#ffffff' : plan.look.fill[1];
      ctx.beginPath();
      ctx.moveTo(px, py - r); ctx.quadraticCurveTo(px, py, px + r, py); ctx.quadraticCurveTo(px, py, px, py + r);
      ctx.quadraticCurveTo(px, py, px - r, py); ctx.quadraticCurveTo(px, py, px, py - r); ctx.fill();
    }
  } else if (kind === 'rain') {
    ctx.strokeStyle = '#e4ecff'; ctx.lineWidth = 1.6;
    for (let k = 0; k < 22; k++) {
      const q = (t * (0.55 + hash(seed, k, 5) * 0.3) + hash(seed, k, 6)) % 1;
      const px = x + (hash(seed, k, 7) - 0.5) * w * 1.2 - q * 18, py = y - h * 0.8 + q * h * 1.6, len = 10 + hash(seed, k, 8) * 14;
      ctx.globalAlpha = 0.7 * Math.sin(q * Math.PI) * fadeAll;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - len * 0.25, py + len); ctx.stroke();
    }
  } else if (kind === 'ember') {
    for (let k = 0; k < 26; k++) {
      const q = (t * (0.35 + hash(seed, k, 9) * 0.3) + hash(seed, k, 10)) % 1;
      const px = x + (hash(seed, k, 11) - 0.5) * w + Math.sin(t * 3 + k) * 8, py = y + h * 0.7 - q * h * 1.6;
      ctx.globalAlpha = (1 - q) * fadeAll; ctx.fillStyle = k % 2 ? '#ffb36b' : plan.look.fill[1]; ctx.shadowColor = '#ff7a2e'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(px, py, 2 + hash(seed, k, 12) * 3.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (kind === 'noise') {
    // Glitch blocks: a few thin bars flash in and out on the step clock.
    for (let k = 0; k < 5; k++) {
      if (hash(seed, step, k, 13) > 0.35) continue;
      ctx.globalAlpha = 0.55 * fadeAll; ctx.fillStyle = k % 2 ? plan.accent : '#19e0ff';
      ctx.fillRect(x + (hash(seed, step, k, 14) - 0.5) * w, y + (hash(seed, step, k, 15) - 0.5) * h, 20 + hash(seed, step, k, 16) * w * 0.25, 2 + hash(seed, step, k, 17) * 4);
    }
  }
  ctx.restore();
}
