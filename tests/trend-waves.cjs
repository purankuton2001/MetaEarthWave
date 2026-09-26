const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');const {test}=require('node:test');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {trendSearchUrl,decodeOrigin,activeTrendWaves}=require('../src/lib/trendWaves.ts');
test('X links preserve hashtags and special characters without changing destination',()=>{
 const title='#話題 & test?f=evil';const url=new URL(trendSearchUrl({title}));
 assert.equal(url.origin,'https://x.com');assert.equal(url.pathname,'/search');assert.equal(url.searchParams.get('q'),title);assert.equal(url.searchParams.get('f'),'live');
});
test('origins distinguish inferred topic locations from labelled observation anchors',()=>{
 assert.equal(decodeOrigin({choice:'GB',probabilities:{GB:.95}}).inferred,true);
 for(const answer of [null,{choice:'GB',probabilities:{GB:.5}},{choice:'fake',probabilities:{fake:1}}]){
 const origin=decodeOrigin(answer);assert.equal(origin.inferred,false);assert.match(origin.label,/観測点/);
 }
});
test('inactive or invalid trend waves disappear',()=>{
 const now=Date.now();const wave=age=>({updatedAt:new Date(now-age).toISOString()});
 assert.equal(activeTrendWaves([wave(6*60*60*1000),wave(12*60*60*1000),wave(-90000),{updatedAt:'bad'}],now).length,1);
});
test('observed country controls geographic wave placement and unknown countries get no invented location',()=>{
 const {observedTrendOrigin}=require('../src/lib/trendWaves.ts');
 const india=observedTrendOrigin({id:'elitecongrowth',sourceCountries:['India']});
 assert(Math.abs(india.latitude-22.6)<1);assert(Math.abs(india.longitude-79)<1);assert.match(india.label,/インド/);
 assert.equal(observedTrendOrigin({id:'unknown',sourceCountries:['unknown']}),null);
 assert.match(observedTrendOrigin({id:'multi',sourceCountries:['Japan','India']}).label,/日本/);
});
