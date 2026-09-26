const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');const {test}=require('node:test');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const transport=require('../src/lib/server/jsonRequest.ts');
const {summarizeTheme}=require('../src/lib/server/summarizeTheme.ts');
test('overview consists only of selected source text and validated source links',async()=>{
 const posts=[{text:'新しい音楽フェスの開催日が発表されました。',url:'https://x.com/i/web/status/1'},{text:'出演者の発表を楽しみにしています。',url:'https://x.com/i/web/status/2'}];
 transport.jsonRequest=async(url,headers,body)=>{assert.equal(body.state.topic,'フェス');assert.equal(body.questions.subject.type,'choice');return {answers:{subject:{choice:'0',probabilities:{0:.9}},reaction:{choice:'1',probabilities:{1:.8}},context:{choice:'0',probabilities:{0:.9}}}};};
 const result=await summarizeTheme({title:'フェス'},posts);assert.equal(result.summary,posts.map(p=>p.text).join('\n\n'));assert.deepEqual(result.summarySources,posts.map(p=>p.url));assert.equal(result.summaryKind,'excerpts');
 transport.jsonRequest=async()=>({answers:{subject:{choice:'999',probabilities:{999:1}},reaction:{choice:'unknown'},context:{choice:'0',probabilities:{0:.1}}}});
 assert.deepEqual(await summarizeTheme({title:'フェス'},posts),{});
 assert.deepEqual(await summarizeTheme({title:'フェス'},[{text:'説明文はあるがリンクが不正な投稿です。',url:'javascript:alert(1)'}]),{});
});
