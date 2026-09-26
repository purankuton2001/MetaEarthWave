import {axes, colors} from '../lib/waveEmotion';
import {useMemo, useRef, useState} from 'react';
import {Html} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {Color, Quaternion, ShaderMaterial, Vector3} from 'three';
import {useWebSocket} from '../context/WebSocket';
import {activeTrendWaves, TrendWave, keywordSize} from '../lib/trendWaves';
import {translateGeoCoords} from '../utils';
import Fluid from '../../shader/Fluid.glsl';

const vertex=`varying vec2 uvWave; void main(){uvWave=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=Fluid+`
varying vec2 uvWave; uniform float time; uniform vec3 tint; uniform float analyzed;
void main(){
 vec2 p=uvWave*2.-1.;float r=length(p);
 float warp=(fluidNoise(vec3(p*4.,time*.3))-.5)*.12;
 float crest=pow(.5+.5*cos((r+warp)*24.-time*3.),5.);
 float edge=(1.-smoothstep(.6,1.,r))*smoothstep(0.,.10,r);
 vec3 color=mix(vec3(.85,.92,1.),tint,analyzed);
 gl_FragColor=vec4(color,edge*(.12+crest*.72));
}`;
function SourceWave({wave}:{wave:TrendWave}) {
 const {setSelectedTrend}=useWebSocket();
 const items=[wave]; const material=useRef<ShaderMaterial>(null!);
 const origin=items[0].origin;
 const center=useMemo(()=>translateGeoCoords(origin.latitude,origin.longitude,1.012),[origin.latitude,origin.longitude]);
 const orientation=useMemo(()=>new Quaternion().setFromUnitVectors(new Vector3(0,0,1),center.clone().normalize()),[center]);
 const uniforms=useMemo(()=>({time:{value:0},tint:{value:new Color('white')},analyzed:{value:0}}),[]);
 const analyzed=items.filter(item=>item.emotions);
 const tint=new Color(0,0,0);let weight=0;
 analyzed.forEach(item=>axes.forEach(axis=>{const strength=item.emotions![axis];tint.add(new Color(colors[axis]).multiplyScalar(strength));weight+=strength;}));
 if(weight)tint.multiplyScalar(1/weight);
 uniforms.tint.value.copy(tint);uniforms.analyzed.value=weight?1:0;
 useFrame((_,delta)=>{if(material.current)material.current.uniforms.time.value+=delta;});
 const activate=()=>setSelectedTrend(wave);
 const size=keywordSize(wave.theme,wave.emotions);
 let stop=0;const stops=axes.flatMap(axis=>{const start=stop;stop+=weight?wave.emotions![axis]/weight*100:20;return [`${colors[axis]} ${start}%`,`${colors[axis]} ${stop}%`];});
 const gradient=`linear-gradient(110deg,${stops.join(',')})`;
 const strongest=wave.emotions?axes.reduce((a,b)=>wave.emotions![a]>=wave.emotions![b]?a:b):null;
 const note=`${wave.theme.sourceCountries?.length||1}か国で話題 · 集計 ${wave.theme.rank}位`; 
 return <group position={center} quaternion={orientation}>
   <mesh onClick={event=>{event.stopPropagation();if(event.delta<5)activate();}}>
     <planeGeometry args={[.14+size/150,.14+size/150]}/>
     <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2}/>
   </mesh>
   <Html zIndexRange={[30,0]} center position={[0,0,.018]} occlude distanceFactor={1.2} style={{pointerEvents:'auto'}}>
     <button type="button" onClick={activate} aria-haspopup="dialog"
       aria-label={`${wave.theme.title} — 詳細を見る`}
       title={`${note}。${wave.emotions?'感情を分析済み':'感情を分析中／未取得'}。${origin.label}。出来事の発生地ではありません。`}
       style={{display:'block',textAlign:'center',width:125,maxWidth:125,fontFamily:'system-ui, sans-serif',textDecoration:'none',filter:`drop-shadow(0 2px 5px #25123c) drop-shadow(0 0 10px ${strongest?colors[strongest]:'#ffffff66'})`}}>
       <span style={{display:'block',fontSize:size*.85,fontWeight:800,lineHeight:1.12,overflowWrap:'anywhere',color:wave.emotions?'transparent':'#eef2ff',backgroundImage:wave.emotions?gradient:undefined,backgroundClip:'text',WebkitBackgroundClip:'text'}}>{wave.theme.title}</span>
       <span style={{display:'block',fontSize:8,color:'#fff',opacity:.85,marginTop:4}}>{note} ↗</span>
     </button>
   </Html>
 </group>;
}
export function TrendWaves() {
 const {trendWaves}=useWebSocket();const [clock,setClock]=useState(Date.now());const elapsed=useRef(0);
 useFrame((_,delta)=>{elapsed.current+=delta;if(elapsed.current>1){elapsed.current=0;setClock(Date.now());}});
 return <>{activeTrendWaves(trendWaves,clock).map(wave=><SourceWave key={wave.theme.id} wave={wave}/>)}</>;
}
