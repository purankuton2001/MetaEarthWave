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

test('glyph states: hidden before entrance, settled mid-cut, gone after', () => {
  const cut = {text: 'こんにちは', start: 0, dur: 2, inDur: 0.5, outDur: 0.4, enter: 'pop', hold: 'still', exit: 'fade', layout: 'yoko', seed: 42};
  assert.ok(cutState(cut, 0, 60, 0).glyphs.some(g => g.hide));
  const mid = cutState(cut, 1, 60, 20);
  assert.ok(mid.glyphs.every(g => !g.hide && Math.abs(g.s - 1) < 1e-9 && g.a === 1));
  assert.equal(cutState(cut, 2.5, 60, 50).visible, false);
  assert.ok(cutState(cut, 1.99, 60, 40).glyphs.every(g => g.a < 0.1));
  const reduced = cutState({...cut, enter: 'drop'}, 0.1, 60, 2, true);
  assert.ok(reduced.glyphs.every(g => g.dy === 0 && g.rot === 0));
});
