const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, filename);
test('theme service coalesces requests, caches analysis, allows listed IDs only and sends isolated Jev questions', async () => {
 process.env.TREG_TOKEN='test';process.env.TYPESAFE_API_KEY='test';
 const transport=require('../src/lib/server/jsonRequest.ts');
 let trends=0,searches=0,analyses=0,regions=0,active=0,maxActive=0;
 const seen = new Set();
 const {questions} = require('../src/lib/waveEmotion.ts');
 transport.jsonRequest=async (url,headers,body)=>{
   if (url.pathname.includes('fetch-trending')) {trends++;return {code:200,data:{trends:[{name:'hello',context:'Music'}]}};}
   if (url.pathname.includes('search.posts')) {searches++;assert.equal(body.limit,50);assert(headers['Idempotency-Key']);const page=Number(body.cursor || 0);return {output:{data:{items:Array.from({length:20},(_,i)=>({id:String(page*20+i+1),authorId:String(page*20+i+1),text:'sample '+(page*20+i+1),createdUtc:Date.now()/1000})),nextCursor:String(page+1)}}};}

   if(body.questions?.subject) return {answers:{}};
  if(Array.isArray(body.state)||body.state.themes) return {answers:{}};
   if (body.state.utterance !== undefined) {
     analyses++;
     assert.deepEqual(Object.keys(body.state), ['utterance']);
     assert.deepEqual(body.questions, questions());
     assert(!seen.has(body.state.utterance));seen.add(body.state.utterance);
     active++;maxActive=Math.max(maxActive,active);
     await new Promise(resolve=>setTimeout(resolve,1));active--;
     return {answers:Object.fromEntries(Object.keys(body.questions).map(key=>[key,{score:3}]))};
   }
   regions++;assert.equal(body.state.posts.length,10);assert.equal(Object.keys(body.questions).length,20);
   assert(Object.keys(body.questions).every(key=>key.endsWith('_region')||key.endsWith('_basis')));

  return {answers:Object.fromEntries(Object.keys(body.questions).map(key=>[key,key.endsWith('_region')?{choice:'JP',probabilities:{JP:.9}}:key.endsWith('_basis')?{choice:'language'}:{score:3}]))};
 };
 const {listThemes,analyzeTheme}=require('../src/lib/server/themeService.ts');
 const lists=await Promise.all([listThemes(),listThemes()]);assert.equal(trends,16);assert.equal(lists[0].themes.length,1);
 const results=await Promise.all([analyzeTheme('hello'),analyzeTheme('hello')]);assert.equal(searches,6);assert.equal(analyses,120);assert.equal(results[0].count,120);assert(Math.abs(results[0].groups[0].emotions.joy-.6)<1e-10);assert.equal(results[0].limited,false);assert.equal(results[0].groups[0].languageCount,120);
 assert.equal(regions,12);assert.equal(seen.size,120);assert(maxActive<=3);
 await analyzeTheme('hello');assert.equal(analyses,120);
 await assert.rejects(()=>analyzeTheme('arbitrary-search-query'),/Unknown theme/);assert.equal(searches,6);
 assert.equal(JSON.stringify(results[0]).includes('hello again'),false);
});
test('repeated cursors stop collection and missing locations never get a map fallback', async () => {
 delete require.cache[require.resolve('../src/lib/server/themeService.ts')];
 const transport=require('../src/lib/server/jsonRequest.ts');let searches=0;
 transport.jsonRequest=async (url,headers,body)=>{
  if(url.pathname.includes('fetch-trending')) return {code:200,data:{trends:[{name:'small'}]}};
  if(url.pathname.includes('search.posts')) {searches++;return {output:{data:{items:[{id:'1',text:'one post',authorId:'a',createdUtc:Date.now()/1000}],nextCursor:'same'}}};}
  if(body.questions?.subject) return {answers:{}};
  if(Array.isArray(body.state)||body.state.themes) return {answers:{}};
  return {answers:Object.fromEntries(Object.keys(body.questions).map(key=>[key,key.endsWith('_region')?{choice:'unknown',probabilities:{unknown:.99}}:key.endsWith('_basis')?{choice:'unknown'}:{score:3}]))};
 };
 const {analyzeTheme}=require('../src/lib/server/themeService.ts');
 const result=await analyzeTheme('small');assert.equal(searches,2);assert.equal(result.count,1);assert.equal(result.limited,true);assert.equal(result.unknownCount,1);assert.deepEqual(result.groups,[]);
});
test('billing rejection disables analysis before any paid post searches',async()=>{
 delete require.cache[require.resolve('../src/lib/server/themeService.ts')];
 const transport=require('../src/lib/server/jsonRequest.ts');let searches=0;
 transport.jsonRequest=async(url)=>{
  if(url.pathname.includes('fetch-trending'))return {code:200,data:{trends:[{name:'blocked'}]}};
  if(url.pathname.includes('search.posts'))searches++;
  throw new Error('Upstream HTTP 402');
 };
 const {listThemes,analyzeTheme}=require('../src/lib/server/themeService.ts');
 const list=await listThemes();assert.equal(list.analysisAvailable,false);assert.equal(list.themes.length,1);
 await assert.rejects(()=>analyzeTheme('blocked'),/Analysis unavailable/);assert.equal(searches,0);
});
test('one invalid emotion response rejects the theme instead of caching a partial average',async()=>{
 delete require.cache[require.resolve('../src/lib/server/themeService.ts')];
 const transport=require('../src/lib/server/jsonRequest.ts');let emotions=0;
 transport.jsonRequest=async(url,headers,body)=>{
  if(url.pathname.includes('fetch-trending'))return {code:200,data:{trends:[{name:'invalid-emotion'}]}};
  if(url.pathname.includes('search.posts'))return {output:{data:{items:[{id:'1',text:'one',authorId:'a',createdUtc:Date.now()/1000}]}}};
  if(body.questions?.subject) return {answers:{}};
  if(Array.isArray(body.state))return {answers:{}};
  if(body.state.utterance){emotions++;return {answers:{joy:{score:3}}};}
  return {answers:{p0_region:{choice:'unknown',probabilities:{unknown:1}},p0_basis:{choice:'unknown'}}};
 };
 const {analyzeTheme}=require('../src/lib/server/themeService.ts');
 await assert.rejects(()=>analyzeTheme('invalid-emotion'),/Invalid emotion score/);
 await assert.rejects(()=>analyzeTheme('invalid-emotion'),/Invalid emotion score/);
 assert.equal(emotions,1);
});

test('trend credit exhaustion stays specific through retry cooldown',async()=>{
 delete require.cache[require.resolve('../src/lib/server/themeService.ts')];
 const transport=require('../src/lib/server/jsonRequest.ts');let calls=0;
 transport.jsonRequest=async()=>{calls++;throw new Error('Upstream HTTP 402');};
 const {listThemes}=require('../src/lib/server/themeService.ts');
 await assert.rejects(()=>listThemes(),/Trend credits exhausted/);
 const count=calls;await assert.rejects(()=>listThemes(),/Trend credits exhausted/);assert.equal(calls,count);
});
