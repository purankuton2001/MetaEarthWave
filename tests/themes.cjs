const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const {test} = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true}}).outputText, filename);
const {selectThemes, parsePosts, aggregateTheme} = require('../src/lib/themes.ts');
test('themes diversify categories and merge hashtag/case/width variants', () => {
 const themes = selectThemes([{name:'#ABC',context:'Music'}, {name:'ＡＢＣ',context:'Music'}, ...Array.from({length:8},(_,i)=>({name:`sport${i}`,context:'Sport'})), {name:'news',context:'News'}, {name:'daily'}]);
 assert.equal(themes.length,5); assert.equal(new Set(themes.map(t=>t.category)).size,4); assert.deepEqual(themes.find(t=>t.title==='#ABC').aliases,['#ABC','ＡＢＣ']);
});
test('social samples deduplicate posts, text and authors and exclude old/future/invalid items', () => {
 const now=Date.now(); const post={id:'123',text:'hello',createdUtc:now/1000,authorId:'a'};
 const posts=parsePosts([post,post,{...post,id:'124'},{...post,id:'125',text:'other'}, {...post,id:'126',text:'old',authorId:'b',createdUtc:now/1000-90000}, {...post,id:'127',text:'future',authorId:'b',createdUtc:now/1000+1000}, {...post,id:'128',text:'new',authorId:'c'}],now);
 assert.deepEqual(posts.map(p=>p.id),['123','128']);
 assert.equal(posts[0].url,'https://x.com/i/web/status/123');
});
const {decodeRegion} = require('../src/lib/regions.ts');
const mood = (joy, anger) => ({joy,sadness:0,anger,anxiety:0,empathy:0});
test('regional means differ, unknown posts are not placed in Tokyo, and sources exclude text', () => {
 const posts = ['大阪にいる','London today','日本代表頑張れ','大阪も晴れ'].map((text,i)=>({id:String(i),text,url:'https://x.com/'+i,createdAt:new Date().toISOString()}));
 const places = ['jp-kansai','GB',null,'jp-kansai'].map(regionId=>({regionId,confidence:.9,basis:regionId?'place':'unknown'}));
 const report=aggregateTheme({id:'test'},posts,[mood(1,0),mood(0,1),mood(1,0),mood(.6,.2)],places);
 assert.equal(report.count,4);assert.equal(report.unknownCount,1);assert.equal(report.groups.length,2);
 assert.equal(report.groups[0].id,'jp-kansai');assert.equal(report.groups[0].emotions.joy,.8);
 assert.equal(report.groups[1].emotions.anger,1);assert.notEqual(report.groups[0].longitude,report.groups[1].longitude);
 assert.equal(report.targetCount,120);assert.equal(report.limited,true);
 assert(!JSON.stringify(report).includes('大阪にいる'));
 const unknown=aggregateTheme({id:'test'},[posts[2]],[mood(1,0)],[places[2]]);
 assert.deepEqual(unknown.groups,[]);
});
test('regional inference rejects weak, ambiguous language-only, and invalid answers', () => {
 const decode=(id,prob,basis)=>decodeRegion({choice:id,probabilities:{[id]:prob}},{choice:basis});
 assert.equal(decode('JP',.9,'language').regionId,'JP');
 for(const id of ['jp-kanto','US','GB','BR','ES']) assert.equal(decode(id,.99,'language').regionId,null);
 assert.equal(decode('GB',.69,'place').regionId,null);
 assert.equal(decode('GB',.9,'place').regionId,'GB');
 assert.equal(decode('JP',.9,'unknown').regionId,null);
 assert.throws(()=>decode('fake',.9,'place'));
 assert.throws(()=>decode('JP',NaN,'place'));
});
test('fewer than three located samples and stale reports cannot change global flow', () => {
 const {themeFlowSpeed}=require('../src/lib/themes.ts'); const now=Date.now();
 const report={count:120,updatedAt:new Date(now).toISOString(),groups:[{count:1,emotions:mood(1,0)}]};
 assert.equal(themeFlowSpeed(report,now),1);
 report.groups[0].count=3;assert(themeFlowSpeed(report,now)>1);
 assert.equal(themeFlowSpeed(report,now+12*60*60*1000+1),1);
});
