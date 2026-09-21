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
test('sports mention groups never infer nationality and preserve mixed/other samples', () => {
 const theme={id:'test',title:'決勝',category:'スポーツ'};
 const posts=['日本代表が楽しみ','ブラジル代表が心配','日本代表とブラジル代表の試合'].map((text,i)=>({id:String(i),text,url:'https://x.com',createdAt:new Date().toISOString()}));
 const scores=posts.map(()=>({joy:.6,sadness:.1,anger:.2,anxiety:.4,empathy:.3}));
 const report=aggregateTheme(theme,posts,scores);
 assert.equal(report.count,3);assert.equal(report.groups.length,3);assert.equal(report.groups.find(g=>g.id==='topic').symbolic,true);assert.equal(report.groups.find(g=>g.id==='jp').emotions.joy,.6);
 const ordinary=aggregateTheme({...theme,category:'社会'},posts,scores);assert.equal(ordinary.groups.length,1);assert.equal(ordinary.groups[0].symbolic,true);
});
test('named cities use topic locations; single posts and old reports do not change global flow', () => {
 const {themeFlowSpeed}=require('../src/lib/themes.ts');
 const now=Date.now(); const posts=[{id:'1',text:'東京の話題',url:'https://x.com',createdAt:new Date(now).toISOString()}];
 const score={joy:1,sadness:0,anger:0,anxiety:0,empathy:0};
 const report=aggregateTheme({id:'tokyo',title:'東京のイベント',category:'文化'},posts,[score],now);
 assert.equal(report.groups[0].symbolic,false);assert.match(report.groups[0].locationNote,/東京/);
 assert.equal(themeFlowSpeed(report,now),1);
 const more={...report,count:3,groups:report.groups.map(g=>({...g,count:3}))};
 assert(themeFlowSpeed(more,now)>1);assert.equal(themeFlowSpeed(more,now+1800001),1);
});
