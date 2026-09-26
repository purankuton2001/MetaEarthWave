// Component integration test: real React hooks/context, controlled location/API.
const fs=require('node:fs'),ts=require('typescript'),Module=require('node:module');
const assert=require('node:assert/strict'),{test}=require('node:test');
require.extensions['.ts']=require.extensions['.tsx']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,jsx:ts.JsxEmit.React}}).outputText,f);
const React=require('react'),reconcile=require('react-reconciler');
const originalLoad=Module._load;
Module._load=function(name,parent,...args){
 if(name==='@chakra-ui/react')return new Proxy({},{get:(_,key)=>String(key)});
 if(name==='next-auth/react')return {useSession:()=>({data:null}),signIn:()=>{throw Error('X login must not run');}};
 if(name==='./EmotionPreview')return {EmotionPreview:()=>null};
 return originalLoad.call(this,name,parent,...args);
};
const {TweetPannel}=require('../src/components/TweetPannel.tsx');
const {EarthStateProvider,useWebSocket}=require('../src/context/WebSocket.tsx');
Module._load=originalLoad;
const append=(p,c)=>p.children.push(c),remove=(p,c)=>{p.children=p.children.filter(x=>x!==c);};
const renderer=reconcile({supportsMutation:true,isPrimaryRenderer:true,now:Date.now,
 getRootHostContext:()=>({}),getChildHostContext:()=>({}),getPublicInstance:x=>x,
 prepareForCommit:()=>null,resetAfterCommit:()=>{},createInstance:(type,props)=>({type,props,children:[]}),createTextInstance:text=>({text}),
 appendInitialChild:append,appendChild:append,appendChildToContainer:append,removeChild:remove,removeChildFromContainer:remove,
 insertBefore:(p,c,b)=>p.children.splice(p.children.indexOf(b),0,c),insertInContainerBefore:(p,c,b)=>p.children.splice(p.children.indexOf(b),0,c),
 finalizeInitialChildren:()=>false,shouldSetTextContent:()=>false,prepareUpdate:()=>true,commitUpdate:(n,_,t,old,props)=>{n.props=props;},commitTextUpdate:(n,o,t)=>{n.text=t;},
 scheduleTimeout:setTimeout,cancelTimeout:clearTimeout,noTimeout:-1,clearContainer:c=>{c.children=[];}});
const wait=()=>new Promise(r=>setTimeout(r,30));
const find=(node,predicate)=>predicate(node)?node:(node.children||[]).map(c=>find(c,predicate)).find(Boolean);
test('deliver uses browser location and cached emotion; failure preserves input and allows retry',async()=>{
 const nav=Object.getOwnPropertyDescriptor(globalThis,'navigator'),oldFetch=globalThis.fetch;
 let state,closed=0,analysisCalls=0,locationFails=false;
 const emotions={joy:.86,sadness:.02,anger:0,anxiety:.1,empathy:.04};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation:{getCurrentPosition(ok,fail){locationFails?fail({code:3}):ok({coords:{latitude:35.68,longitude:139.69}});}}}});
 globalThis.fetch=async(url)=>{if(url==='/api/wave-emotion'){return {ok:true,json:async()=>({mode:'jev',emotions})};}throw Error('Unexpected API');};
 const fetchBase=globalThis.fetch;globalThis.fetch=async(url,init)=>{if(init?.method==='POST')analysisCalls++;return fetchBase(url,init);};
 function Capture(){state=useWebSocket();return null;}
 const container={children:[]},root=renderer.createContainer(container,0,false,null);
 try {
  renderer.updateContainer(React.createElement(EarthStateProvider,null,React.createElement(Capture),React.createElement(TweetPannel,{isOpen:true,onOpen(){},onClose(){closed++;}})),root,null,()=>{});
  await wait();renderer.flushPassiveEffects();await wait();
  const input=()=>find(container,n=>n.type==='Textarea');
  const deliver=()=>find(container,n=>n.type==='Button'&&n.props.children==='波を届ける');
  input().props.onChange({target:{value:'動作確認：うれしい！'}});await wait();renderer.flushPassiveEffects();await wait();
  assert.equal(deliver().props.isDisabled,false);assert.equal(analysisCalls,1);
  await deliver().props.onClick();await wait();
  assert.equal(closed,1);assert.equal(state.tweets.length,1);assert.deepEqual(state.tweets[0].loc,[35.68,139.69]);assert.deepEqual(state.tweets[0].emotions,emotions);assert.equal(input().props.value,'');assert.equal(analysisCalls,1);
  input().props.onChange({target:{value:'もう一つの波'}});await wait();renderer.flushPassiveEffects();await wait();locationFails=true;
  await deliver().props.onClick();await wait();assert.equal(state.tweets.length,1);assert.equal(closed,1);assert.equal(input().props.value,'もう一つの波');assert.equal(deliver().props.isDisabled,false);
  assert.match(find(container,n=>n.props?.role==='alert').props.children,/タイムアウト/);
  locationFails=false;await deliver().props.onClick();await wait();assert.equal(state.tweets.length,2);assert.equal(closed,2);
 } finally {renderer.updateContainer(null,root,null,()=>{});renderer.flushPassiveEffects();globalThis.fetch=oldFetch;if(nav)Object.defineProperty(globalThis,'navigator',nav);else delete globalThis.navigator;}
});
