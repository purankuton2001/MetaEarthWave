import {Box,Button,Modal,ModalBody,ModalCloseButton,ModalContent,ModalFooter,ModalHeader,ModalOverlay,Text} from '@chakra-ui/react';
import {useWebSocket} from '../context/WebSocket';
import {axes,colors,labels} from '../lib/waveEmotion';
import {marketLabels} from '../lib/globalTrends';
import {trendSearchUrl} from '../lib/trendWaves';

export function TrendModal(){
 const {selectedTrend,setSelectedTrend,trendWaves}=useWebSocket();
 const wave=trendWaves.find(item=>item.theme.id===selectedTrend?.theme.id)||selectedTrend;
 const close=()=>setSelectedTrend(null);
 if(!wave)return null;
 const {theme,emotions}=wave;
 const countries=(theme.sourceCountries||[]).map(c=>marketLabels[c]||c);
 const stale=Date.now()-Date.parse(wave.updatedAt)>=30*60*1000;
 const status=wave.analysisStatus==='pending'?'感情を分析しています。結果が届くとここに表示されます。':wave.analysisStatus==='error'?'感情分析を取得できませんでした。次の更新で再試行します。':'感情分析は現在利用できません。未分析の値は表示していません。';
 return <Modal isOpen={Boolean(selectedTrend)} onClose={close} isCentered scrollBehavior="inside" size="lg">
  <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)"/>
  <ModalContent bg="#241e43" color="white" border="1px solid #bc9ef075" borderRadius="24px" mx={4} maxHeight="85vh">
   <ModalHeader pr={12} overflowWrap="anywhere">{theme.title}</ModalHeader><ModalCloseButton aria-label="詳細を閉じる"/>
   <ModalBody>
    <Text fontSize="sm" color="#d4c3ff" mb={2}>{theme.summaryKind === 'excerpts' ? '概要（投稿から抜粋）' : '概要'}</Text>
    <Text fontSize="sm" lineHeight={1.8} whiteSpace="pre-wrap" mb={2}>{theme.summary || (wave.analysisStatus === 'pending' ? '関連投稿から概要を確認しています…' : '概要に使える情報を取得できませんでした。関連投稿は「Xで見る」から確認できます。')}</Text>
    {theme.summaryKind === 'excerpts' && <Box mb={3} fontSize="xs" color="whiteAlpha.700">
      <Text>取得した投稿からの抜粋です。投稿の主張を事実と確認したものではありません。</Text>
      {(theme.summarySources || []).filter(url => /^https:\/\/x\.com\/i\/web\/status\/\d+$/.test(url)).map((url,i)=><Button key={url} as="a" href={url} target="_blank" rel="noopener noreferrer" variant="link" size="xs" color="cyan.100" mr={3} mt={2}>元投稿 {i+1} ↗</Button>)}
    </Box>}
    <Text fontSize="sm" lineHeight={1.8}>取得した各国のXトレンドを合算した話題です。{countries.length}か国で登場し、今回の集計では{theme.rank}位です。</Text>
    <Text fontSize="sm" mt={2} color="whiteAlpha.800">{countries.join('・')}</Text>
    <Text fontSize="xs" mt={2} color="whiteAlpha.700">波の位置：{wave.origin.label}。複数国では最も順位が高い観測国を代表にしています。出来事の発生地ではありません。</Text>
    <Text fontSize="xs" mt={2} color="whiteAlpha.700">国ごとの順位と登場国数から集計しています。投稿総数や世界全体の順位を示すものではありません。</Text>
    {theme.aliases.length>1 && <Text fontSize="sm" mt={3}>関連する表記：{theme.aliases.join(' / ')}</Text>}
    <Text fontSize="sm" color="#d4c3ff" mt={6} mb={3}>感情パラメーター</Text>
    {!emotions && <Text role="status" fontSize="sm" mb={4}>{status}</Text>}
    <Box display="grid" gridGap={3}>
     {axes.map(axis=>{const value=emotions?Math.round(emotions[axis]*100):null;return <Box key={axis}>
      <Box display="flex" justifyContent="space-between" fontSize="sm" mb={1}><Text color={colors[axis]}>{labels[axis]}</Text><Text>{value===null?'未分析':`${value} / 100`}</Text></Box>
      <Box height="6px" borderRadius="full" bg="whiteAlpha.200" overflow="hidden" role={value===null?undefined:'meter'} aria-label={labels[axis]} aria-valuemin={value===null?undefined:0} aria-valuemax={value===null?undefined:100} aria-valuenow={value===null?undefined:value}>
       {value!==null && <Box height="100%" width={`${value}%`} bg={colors[axis]} borderRadius="full"/>}
      </Box>
     </Box>;})}
    </Box>
    {emotions && <Text fontSize="xs" mt={3} color="whiteAlpha.700">{wave.sampleCount??'—'}件の投稿から推定。5つの感情は独立した強さで、合計100にはなりません。</Text>}
    <Text fontSize="xs" mt={5} color={stale?'#ffe0a5':'whiteAlpha.600'}>{stale?'過去の取得結果 · ':''}話題の取得 {new Date(wave.updatedAt).toLocaleString('ja-JP')}</Text>
   </ModalBody>
   <ModalFooter gap={3}><Button variant="ghost" onClick={close}>地球に戻る</Button><Button as="a" href={trendSearchUrl(theme)} target="_blank" rel="noopener noreferrer" colorScheme="cyan">Xで見る ↗</Button></ModalFooter>
  </ModalContent>
 </Modal>;
}
