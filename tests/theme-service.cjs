const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, filename);
test('theme service coalesces requests, caches analysis, allows listed IDs only and sends isolated Jev questions', async () => {
 process.env.TREG_TOKEN='test';process.env.TYPESAFE_API_KEY='test';
 const transport=require('../src/lib/server/jsonRequest.ts');
 let trends=0,searches=0,analyses=0;
 transport.jsonRequest=async (url,headers,body)=>{
   if (url.pathname.includes('fetch-trending')) {trends++;return {code:200,data:{trends:[{name:'hello',context:'Music'}]}};}
   if (url.pathname.includes('search.posts')) {searches++;assert.equal(body.limit,20);assert(headers['Idempotency-Key']);return {output:{data:{items:[{id:'1',authorId:'one',text:'hello',createdUtc:Date.now()/1000},{id:'2',authorId:'two',text:'hello again',createdUtc:Date.now()/1000}]}}};}
   analyses++;assert.equal(body.state.posts.length,2);assert.equal(Object.keys(body.questions).length,10);assert(body.questions.p0_joy.instructions.includes('state.posts[0]'));
   return {answers:Object.fromEntries(Object.keys(body.questions).map(key=>[key,{score:3}]))};
 };
 const {listThemes,analyzeTheme}=require('../src/lib/server/themeService.ts');
 const lists=await Promise.all([listThemes(),listThemes()]);assert.equal(trends,1);assert.equal(lists[0].themes.length,1);
 const results=await Promise.all([analyzeTheme('hello'),analyzeTheme('hello')]);assert.equal(searches,1);assert.equal(analyses,1);assert.equal(results[0].count,2);assert.equal(results[0].groups[0].emotions.joy,.6);
 await analyzeTheme('hello');assert.equal(analyses,1);
 await assert.rejects(()=>analyzeTheme('arbitrary-search-query'),/Unknown theme/);assert.equal(searches,1);
 assert.equal(JSON.stringify(results[0]).includes('hello again'),false);
});
