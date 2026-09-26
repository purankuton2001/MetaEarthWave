import {marketLabels} from '../lib/globalTrends';
import {useEffect, useState} from 'react';
import {useWebSocket} from '../context/WebSocket';
import {ThemeList, THEME_INTERVAL} from '../lib/themes';
import {observedTrendOrigin, TrendWave} from '../lib/trendWaves';

// Discovery stays on the globe. X links do not wait for post analysis.
export function ThemePanel() {
  const {setTrendWaves, setTheme} = useWebSocket();
  const [countries,setCountries]=useState<string[]>([]);
  const [error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
  useEffect(()=>{
    let live=true; let controller:AbortController|undefined;
    setTheme(null);
    async function refresh() {
      setLoading(true); setError('');
      controller?.abort(); controller=new AbortController(); const current=controller;
      const timeout=setTimeout(()=>current.abort(),65000);
      try {
        const response=await fetch('/api/themes',{signal:current.signal});
        const data:ThemeList & {code?:string;error?:string}=await response.json();
        if(!response.ok) throw new Error(data.code === 'TREND_CREDITS_EXHAUSTED' ? data.error : '話題を更新できませんでした。');
        if(live && current===controller) {
          const waves:TrendWave[]=data.themes.flatMap(theme=>{const origin=observedTrendOrigin(theme);return origin?[{theme,origin,updatedAt:data.updatedAt,analysisStatus:data.analysisAvailable===false?"unavailable":"pending" as const}]:[];});
          setTrendWaves(waves);setCountries(data.countries||[]);
          // Two analyses at a time; discovery and links are immediately usable.
          let offset=0;
          const analyze=async()=>{
            while(live && current===controller && offset<waves.length){
              const index=offset++;
              try {
                const result=await fetch(`/api/themes/${encodeURIComponent(waves[index].theme.id)}`,{signal:current.signal});
                if(!result.ok) throw new Error('Analysis failed');
                const report=await result.json();
                if(live && current===controller && report.emotions) {
                  waves[index]={...waves[index],theme:{...waves[index].theme,...report.theme},emotions:report.emotions,sampleCount:report.count,analyzedAt:report.updatedAt,analysisStatus:"complete"};setTrendWaves([...waves]);
                }
              } catch { if(live && current===controller){waves[index]={...waves[index],analysisStatus:"error"};setTrendWaves([...waves]);} }
            }
          };
          clearTimeout(timeout);
          if(data.analysisAvailable!==false) void Promise.all([analyze(),analyze()]);
          setError(data.analysisAvailable===false?'感情分析が利用できないため、色付けは保留中です。':data.missingCountries?.length?'一部の国を取得できていません。':data.stale?'更新できなかったため、前回の波を表示しています。':'');
        }
      } catch (e) {if(live && current===controller) setError(e instanceof Error && e.name !== 'AbortError' ? e.message : '話題を更新できませんでした。');}
      finally {clearTimeout(timeout);if(live && current===controller)setLoading(false);}
    }
    refresh();const timer=setInterval(refresh,THEME_INTERVAL);
    return ()=>{live=false;controller?.abort();clearInterval(timer);};
  },[revision]);
  return <aside aria-label="トレンドの波" style={{position:'absolute',left:16,top:16,zIndex:36,color:'white',background:'rgba(28,24,65,.65)',borderRadius:16,padding:'12px 16px',maxWidth:220,fontSize:12}}>
    <strong>WORLD IN WORDS</strong>
    <p style={{marginTop:5}}>{loading?'今の波を探しています…':'地球を回して世界の言葉へ。クリックで概要と感情を見られます。'}</p>
    <details style={{marginTop:6,fontSize:10}}><summary>集計・色の見方</summary><p style={{opacity:.7,fontSize:10,marginTop:5}}>{countries.map(c=>marketLabels[c]||c).join("・")}のトレンドを合算 · 6時間更新</p>
    <p style={{fontSize:10,opacity:.8,marginTop:5}}>色＝感情の混合／大きさ＝各国の順位・広がり＋感情の強さ。波の位置＝観測国。複数国では最も順位が高い国に表示します。</p></details>
    {error && <p role="status">{error} <button onClick={()=>setRevision(n=>n+1)} style={{textDecoration:'underline'}}>再試行</button></p>}
  </aside>;
}
