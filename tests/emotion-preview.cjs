const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const {test}=require('node:test');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const {createEmotionPreview}=require('../src/lib/emotionPreview.ts');
const wait=()=>new Promise(r=>setTimeout(r,20));
const scores={joy:1,sadness:0,anger:0,anxiety:0,empathy:0};
test('continuous edits do not postpone analysis; completed snapshots animate while latest input queues',async()=>{
 const states=[],calls=[];let finish;
 const c=createEmotionPreview(s=>states.push(s),(text)=>{calls.push(text);return new Promise(r=>{finish=r;});},5);
 try {
 c.update('a');await wait();assert.deepEqual(calls,['a']);
 c.update('ab');c.update('abc');await wait();assert.equal(calls.length,1);
 finish(scores);await wait();assert.deepEqual(calls,['a','abc']);
 assert(states.some(s=>s.text==='a'&&s.emotions===scores&&s.status==='waiting'));
 finish(scores);await wait();assert.equal(states.at(-1).status,'ready');
 c.update(' a ');assert.equal(states.at(-1).status,'ready');await wait();assert.equal(calls.length,2);
 c.update('');assert.equal(states.at(-1).status,'idle');assert.equal(states.at(-1).emotions,undefined);
 }finally{c.dispose();}
});
test('edits faster than the interval still produce periodic results',async()=>{
 const states=[],calls=[];const c=createEmotionPreview(s=>states.push(s),async text=>{calls.push(text);return scores;},30);
 try {for(let i=0;i<12;i++){c.update('文'.repeat(i+1));await new Promise(r=>setTimeout(r,8));}
 assert(calls.length>=3);assert(states.filter(s=>s.emotions).length>=3);
 }finally{c.dispose();}
});
test('clearing prevents an old in-flight result from resurrecting the previous wave',async()=>{
 const states=[];let finish;const c=createEmotionPreview(s=>states.push(s),()=>new Promise(r=>{finish=r;}),5);
 c.update('old');await wait();c.update('');finish(scores);await wait();assert.equal(states.at(-1).status,'idle');c.dispose();
});
test('closing cancels work and suppresses late responses; failure does not auto-retry',async()=>{
 const states=[];let finish,signal;
 const c=createEmotionPreview(s=>states.push(s),(text,s)=>{signal=s;return new Promise(r=>{finish=r;});},1);
 c.update('hello');await wait();c.dispose();const count=states.length;assert(signal.aborted);finish(scores);await wait();assert.equal(states.length,count);
 let calls=0;const errors=[];const d=createEmotionPreview(s=>errors.push(s),async()=>{calls++;throw Error();},1);
 d.update('failure');await wait();await wait();assert.equal(calls,1);assert.equal(errors.at(-1).status,'error');d.dispose();
});
