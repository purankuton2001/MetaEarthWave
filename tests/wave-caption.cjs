const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, filename);
const {splitCuts, planCaption, cutState, dominant} = require('../src/lib/waveCaption.ts');

const emotions = (joy, sadness, anger, anxiety, empathy) => ({joy, sadness, anger, anxiety, empathy});

test('splits posts into short lyric cuts at punctuation', () => {
  assert.deepEqual(splitCuts('今日は晴れ。すごく嬉しい！'), ['今日は晴れ。', 'すごく嬉しい！']);
  assert.ok(splitCuts('あ'.repeat(40)).every(cut => Array.from(cut).length <= 12));
  const long = splitCuts('一二三四五六七八九十。'.repeat(8));
  assert.equal(long.length, 4);
  assert.ok(long[3].endsWith('…'));
  assert.deepEqual(splitCuts('   '), []);
  assert.deepEqual(splitCuts('また仕様変更！？締切は変わらないのに、ほんとありえない！'), ['また仕様変更！？', '締切は変わらないのに、', 'ほんとありえない！']);
});

test('mood follows the dominant emotion, or the score for plain tweets', () => {
  assert.equal(dominant({_id: 'a', text: 'x', score: 0, emotions: emotions(0.1, 0.8, 0.2, 0, 0.3)}), 'sadness');
  assert.equal(dominant({_id: 'a', text: 'x', score: -0.9}), 'anger');
  assert.equal(dominant({_id: 'a', text: 'x', score: 0.9}), 'joy');
});

test('plans are deterministic and cuts are sequential', () => {
  const source = {_id: 'local-1', text: '嬉しいけれど、少し不安。明日も会えるかな', score: 0.2, cityName: '東京', emotions: emotions(0.7, 0.1, 0, 0.5, 0.2)};
  const a = planCaption(source), b = planCaption(source);
  assert.deepEqual(a, b);
  assert.equal(a.mood, 'joy');
  assert.equal(a.label, '東京 · 喜び 70');
  a.cuts.forEach((cut, i) => {
    if (i) assert.ok(cut.start > a.cuts[i - 1].start);
    assert.ok(cut.start + cut.dur <= a.total);
  });
  assert.equal(planCaption({_id: 'x', text: '  ', score: 0}), null);
});

test('glyph states: faded in before entrance, settled mid-cut, gone after', () => {
  const cut = {text: 'こんにちは', start: 0, dur: 2, inDur: 0.5, outDur: 0.4, enter: 'rise', hold: 'still', exit: 'dissolve', layout: 'yoko', seed: 42};
  assert.ok(cutState(cut, 0, 60).glyphs.every(g => g.a < 0.05));
  const mid = cutState(cut, 1, 60);
  assert.ok(mid.glyphs.every(g => Math.abs(g.dy) < 1e-9 && g.a === 1 && g.blur < 1e-9));
  assert.equal(cutState(cut, 2.5, 60).visible, false);
  assert.ok(cutState(cut, 1.99, 60).glyphs.every(g => g.a < 0.1));
  const reduced = cutState({...cut, enter: 'gust', hold: 'swirl'}, 0.1, 60, true);
  assert.ok(reduced.glyphs.every(g => g.dx === 0 && g.dy === 0 && g.blur === 0));
});

test('motion stays gentle: small continuous drift, no jumps between frames', () => {
  const {moods} = require('../src/lib/waveCaption.ts');
  const size = 60;
  for (const mood of Object.values(moods)) for (const enter of mood.enter) for (const hold of mood.hold) for (const exit of mood.exit) {
    const cut = {text: '波が届きました', start: 0, dur: 3, inDur: 0.9, outDur: 0.7, enter, hold, exit, layout: 'yoko', seed: 7};
    let prev = cutState(cut, 0, size, false, 1);
    for (let lt = 1 / 60; lt <= 3; lt += 1 / 60) {
      const next = cutState(cut, lt, size, false, 1);
      next.glyphs.forEach((g, i) => {
        // At 60 fps no glyph moves more than a fifth of an em per frame (the old pop/bounce/glitch moved several).
        assert.ok(Math.hypot(g.dx - prev.glyphs[i].dx, g.dy - prev.glyphs[i].dy) < size * 0.2, `${enter}/${hold}/${exit} at ${lt}`);
      });
      if (lt > 0.95 && lt < 2.25) next.glyphs.forEach(g => assert.ok(Math.hypot(g.dx, g.dy) < size * 0.1, `${hold} drift too wide`));
      prev = next;
    }
  }
});

test('orbit captions carry the whole post as one ring, only when it fits', () => {
  const {ORBIT_CHANCE, ORBIT_MAX} = require('../src/lib/waveCaption.ts');
  const plans = Array.from({length: 200}, (_, i) => planCaption({_id: `p${i}`, text: '一二三四五、六七八九十', score: -0.9}));
  const orbit = plans.filter(plan => plan.cuts[0].layout === 'orbit');
  assert.ok(Math.abs(orbit.length / plans.length - ORBIT_CHANCE) < 0.15);
  for (const plan of orbit) {
    assert.equal(plan.cuts.length, 1);
    assert.ok(!plan.cuts[0].text.endsWith('…'));
    assert.ok(plan.spin > 0 && plan.cuts[0].start + plan.cuts[0].dur <= plan.total);
  }
  assert.ok(plans.some(plan => plan.cuts[0].layout !== 'orbit'));
  const long = Array.from({length: 50}, (_, i) => planCaption({_id: `q${i}`, text: 'あ'.repeat(ORBIT_MAX + 5), score: 0.9}));
  assert.ok(long.every(plan => plan.cuts[0].layout !== 'orbit'));
});

test('every mood shares one serif and the emotion colour; motes follow the wave direction', () => {
  const {moods, CAPTION_FONT} = require('../src/lib/waveCaption.ts');
  const {colors} = require('../src/lib/waveEmotion.ts');
  const direction = {joy: 'up', sadness: 'down', anger: 'swirl'};
  for (const [mood, text, score] of [['joy', 'うれしい', 0.9], ['sadness', 'かなしい', -0.3], ['anger', 'ふざけるな', -0.9]]) {
    const plans = Array.from({length: 30}, (_, i) => planCaption({_id: `${mood}${i}`, text, score}));
    for (const plan of plans) {
      assert.equal(plan.mood, mood);
      assert.equal(plan.font, CAPTION_FONT);
      assert.equal(plan.accent, colors[mood]);
      assert.equal(plan.look.motes, direction[mood]);
      assert.ok(plan.look.tint >= moods[mood].tint[0] && plan.look.tint <= moods[mood].tint[1]);
    }
  }
});
