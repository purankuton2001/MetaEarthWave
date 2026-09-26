const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, filename);
const {currentLocation} = require('../src/lib/currentLocation.ts');
test('browser coordinates are preserved and failures never fall back to a city', async () => {
 const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
 const set = value => Object.defineProperty(globalThis, 'navigator', {configurable: true, value});
 try {
  set({geolocation: {getCurrentPosition(success, failure, options) {
   assert.equal(options.timeout, 10000); assert.equal(options.maximumAge, 60000);
   success({coords: {latitude: -33.86, longitude: 151.20}});
  }}});
  assert.deepEqual(await currentLocation(), {latitude: -33.86, longitude: 151.20});
  for (const [code, message] of [[1,/許可/],[2,/取得できません/],[3,/タイムアウト/]]) {
   set({geolocation: {getCurrentPosition(success, failure) {failure({code});}}});
   await assert.rejects(currentLocation(), message);
  }
  set({}); await assert.rejects(currentLocation(), /対応したブラウザ/);
  set({geolocation: {getCurrentPosition(success) {success({coords: {latitude: NaN, longitude: 999}});}}});
  await assert.rejects(currentLocation(), /確認できません/);
 } finally {if (original) Object.defineProperty(globalThis, 'navigator', original); else delete globalThis.navigator;}
});
