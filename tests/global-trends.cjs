const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');const {test}=require('node:test');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {combineTrends,candidatesFromFeeds}=require('../src/lib/globalTrends.ts');
const {keywordSize,keywordOrigin}=require('../src/lib/trendWaves.ts');
test('global score sums countries once, merges aliases, and puts widespread topics above local ones',()=>{
 const items=[{name:'#Event',country:'US',rank:1},{name:'Ｅｖｅｎｔ',country:'US',rank:2},{name:'イベント',country:'JP',rank:1},{name:'local',country:'FR',rank:1}];
 const themes=combineTrends(items,{alias2:{choice:'0',probabilities:{0:.95}}});
 assert.equal(themes.length,2);assert.equal(themes[0].globalScore,2);assert.equal(themes[0].sourceCountries.length,2);assert.equal(themes[0].aliases.length,3);assert.match(themes[0].query,/イベント/);
 assert.equal(combineTrends(items,{alias2:{choice:'0',probabilities:{0:.6}}}).length,3);
});
test('global display has individual placements and size responds to reach and emotion intensity',()=>{
 assert.notDeepEqual(keywordOrigin(0,12),keywordOrigin(1,12));
 const small={globalScore:1},big={globalScore:5};
 assert(keywordSize(big)>keywordSize(small));assert(keywordSize(big,{joy:1,sadness:0,anger:0,anxiety:0,empathy:0})>keywordSize(big));
 assert.equal(candidatesFromFeeds([{country:'JP',trends:[{name:''},{name:'valid'}]}]).length,1);
});
test('keyword positions cover both hemispheres and all longitude quadrants',()=>{
 const positions=Array.from({length:12},(_,i)=>keywordOrigin(i,12));
 assert(positions.some(p=>p.latitude>55));assert(positions.some(p=>p.latitude< -55));
 assert.equal(new Set(positions.map(p=>Math.floor((p.longitude+180)/90))).size,4);
 const vectors=positions.map(p=>{const a=p.latitude*Math.PI/180,b=p.longitude*Math.PI/180;return [Math.cos(a)*Math.cos(b),Math.sin(a),Math.cos(a)*Math.sin(b)];});
 for(let i=0;i<vectors.length;i++)for(let j=0;j<i;j++)assert(Math.hypot(...vectors[i].map((v,k)=>v-vectors[j][k]))>.6);
});
