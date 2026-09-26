const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const {EventEmitter} = require('node:events');
const https = require('node:https');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, filename);
const {axes, decodeEmotions, questions} = require('../src/lib/waveEmotion.ts');
const handler = require('../src/pages/api/wave-emotion.ts').default;
async function call(method, body) {
  const res = {code: 200, headers: {}, setHeader(k, v) {this.headers[k] = v;}, status(n) {this.code = n; return this;}, json(data) {this.data = data; return this;}};
  await handler({method, body}, res);
  return res;
}
test('Jev API validation, mixed scores and upstream failures', async () => {
  const oldKey = process.env.TYPESAFE_API_KEY, oldBase = process.env.TYPESAFE_BASE_URL;
  const originalRequest = https.request;
  let calls = 0, status = 200, payload;
  https.request = (url, options, callback) => {
    calls++;
    assert.equal(url.protocol, 'https:');
    assert.equal(url.pathname, '/v1/systemone');
    assert.equal(options.headers.Authorization, 'Bearer test-only');
    const request = new EventEmitter();
    request.end = body => {
      const sent = JSON.parse(body);
      assert.equal(sent.state.utterance, '嬉しいけれど不安');
      assert.deepEqual(Object.keys(sent.questions), axes);
      assert.deepEqual(sent.state, {utterance: '嬉しいけれど不安'});
      assert.deepEqual(sent.questions, questions());
      assert(sent.questions.empathy.instructions.includes('読み手がこの投稿に共感しそうかは評価しない'));
      const response = new EventEmitter();
      response.statusCode = status;
      response.setEncoding = () => {};
      callback(response);
      response.emit('data', JSON.stringify(payload));
      response.emit('end');
      request.emit('close');
    };
    request.destroy = error => {request.emit('error', error); request.emit('close');};
    return request;
  };
  try {
    delete process.env.TYPESAFE_API_KEY;
    process.env.TYPESAFE_BASE_URL = 'https://example.invalid';
    assert.equal((await call('GET')).data.mode, 'unavailable');
    assert.equal((await call('POST', {text: '嬉しい'})).code, 503);
    for (const text of ['', '  ', 'a'.repeat(281), 123, null]) assert.equal((await call('POST', {text})).code, 400);
    const method = await call('DELETE');
    assert.equal(method.code, 405);
    assert.equal(method.headers.Allow, 'GET, POST');
    assert.equal(calls, 0);
    process.env.TYPESAFE_API_KEY = 'test-only';
    assert.equal((await call('GET')).data.mode, 'jev');
    payload = {answers: Object.fromEntries(axes.map((axis, i) => [axis, {score: [5, 0, 1, 4, 2][i]}]))};
    const result = await call('POST', {text: '  嬉しいけれど不安  '});
    assert.equal(result.code, 200);
    assert.equal(result.headers['Cache-Control'], 'no-store');
    assert.deepEqual(result.data, {source: 'jev', emotions: {joy: 1, sadness: 0, anger: .2, anxiety: .8, empathy: .4}});
    for (const invalid of [NaN, Infinity, '2', -1, 6]) assert.throws(() => decodeEmotions({answers: Object.fromEntries(axes.map(a => [a, {score: invalid}]))}));
    payload = {answers: {}};
    assert.equal((await call('POST', {text: '嬉しいけれど不安'})).code, 502);
    status = 429;
    const failure = await call('POST', {text: '嬉しいけれど不安'});
    assert.equal(failure.code, 502);
    assert.equal(failure.data.emotions, undefined);
    assert.equal(failure.data.source, undefined);
  } finally {
    https.request = originalRequest;
    if (oldKey === undefined) delete process.env.TYPESAFE_API_KEY; else process.env.TYPESAFE_API_KEY = oldKey;
    if (oldBase === undefined) delete process.env.TYPESAFE_BASE_URL; else process.env.TYPESAFE_BASE_URL = oldBase;
  }
});
