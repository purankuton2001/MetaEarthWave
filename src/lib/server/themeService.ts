import {markets, candidatesFromFeeds, aliasQuestions, combineTrends} from '../globalTrends';
import {decodeRegion, regionQuestions, RegionEstimate} from '../regions';
import {Emotions} from '../waveEmotion';
import {createHash} from 'crypto';
import {analyzeEmotions} from './analyzeEmotions';
import {aggregateTheme, parsePosts, selectThemes, ThemeList, ThemeReport, THEME_INTERVAL} from '../themes';
import {summarizeTheme} from './summarizeTheme';
import {jsonRequest} from './jsonRequest';

// Single-flight + bounded TTL cache. Hosting instances have separate caches.
const cache = new Map<string, {value: any; expires: number}>();
const pending = new Map<string, Promise<any>>();
const failures = new Map<string, {until: number; error: unknown}>();
async function cached<T>(key: string, produce: () => Promise<T>): Promise<T> {
  const previous = cache.get(key);
  if (previous && previous.expires > Date.now()) return previous.value;
  if (pending.has(key)) return pending.get(key)!;
  const failure = failures.get(key);
  if (failure && failure.until > Date.now()) {
    if (previous && previous.expires + THEME_INTERVAL > Date.now()) return {...previous.value, stale: true};
    throw failure.error;
  }
  const promise = produce().then(value => {
    if (cache.size >= 24) cache.delete(cache.keys().next().value);
    cache.set(key, {value, expires: Date.now() + THEME_INTERVAL}); failures.delete(key); return value;
  }).catch(error => {
    if (failures.size >= 12) failures.clear();
    failures.set(key, {until: Date.now() + 60000, error});
    if (previous && previous.expires + THEME_INTERVAL > Date.now()) return {...previous.value, stale: true};
    throw error;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
function treg(endpoint: string, body?: unknown, country = 'Japan') {
  if (!process.env.TREG_TOKEN) throw new Error('Treg unavailable');
  const url = new URL(`https://treg.to/call/${endpoint}`);
  if (!body) url.searchParams.set('country', country);
  const bucket = Math.floor(Date.now() / THEME_INTERVAL);
  const key = createHash('sha256').update(`${url}:${JSON.stringify(body)}:${bucket}`).digest('hex');
  const headers: Record<string,string> = {'X-Treg-Token': process.env.TREG_TOKEN, 'Idempotency-Key': key, 'X-Treg-Max-Age': String(THEME_INTERVAL / 1000)};
  if (process.env.TREG_ORG) headers['X-Treg-Org'] = process.env.TREG_ORG;
  return jsonRequest(url, headers, body);
}
export function listThemes(): Promise<ThemeList> {
  return cached('list', async () => {
    const results=await Promise.allSettled(markets.map(async country=>{
      const response=await treg('tikhub.x.twitter-web-fetch-trending',undefined,country);
      if(response.code!==200 || !Array.isArray(response.data?.trends) || !response.data.trends.length)throw new Error('Trends unavailable');
      return {country,trends:response.data.trends};
    }));
    const feeds=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
    if(!feeds.length) {
      if (results.some(r=>r.status==='rejected' && r.reason instanceof Error && /HTTP 402/.test(r.reason.message))) throw new Error('Trend credits exhausted');
      throw new Error('Empty trends');
    }
    const candidates=candidatesFromFeeds(feeds);
    let answers:any={};
    let analysisAvailable=Boolean(process.env.TYPESAFE_API_KEY);
    if(process.env.TYPESAFE_API_KEY){
      try{
        const result=await jsonRequest(new URL('/v1/systemone',process.env.TYPESAFE_BASE_URL||'https://api.typesafe.ai'),{Authorization:`Bearer ${process.env.TYPESAFE_API_KEY}`},{model:process.env.TYPESAFE_DEFAULT_MODEL||'jev-latest',state:candidates,questions:aliasQuestions(candidates)},30000);
        answers=result.answers||{};
      }catch(error){
        if(error instanceof Error && /HTTP (402|401|403)/.test(error.message)) analysisAvailable=false;
        // Exact duplicate merging still works when semantic matching is unavailable.
      }
    }
    const themes=combineTrends(candidates,answers);
    return {themes,analysisAvailable,countries:feeds.map(f=>f.country),missingCountries:markets.filter(c=>!feeds.some(f=>f.country===c)),updatedAt:new Date().toISOString(),nextUpdateAt:new Date(Date.now()+THEME_INTERVAL).toISOString()};
  });
}
export async function analyzeTheme(id: string): Promise<ThemeReport> {
  const list = await listThemes();
  const theme = list.themes.find(item => item.id === id);
  if (!theme) throw new Error('Unknown theme');
  if(list.analysisAvailable===false)throw new Error('Analysis unavailable');
  if (!process.env.TYPESAFE_API_KEY) throw new Error('Jev unavailable');
  return cached(`theme:${id}`, async () => {
    const raw: unknown[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    let posts = parsePosts(raw);
    for (let page = 0; page < 12 && posts.length < 120; page++) {
      const response = await treg('anyapi.x.search.posts', {query: theme.query, limit: 50, queryType: 'Latest', ...(cursor ? {cursor} : {})});
      const data = response.output?.data;
      if (!Array.isArray(data?.items)) throw new Error('Invalid search response');
      raw.push(...data.items);
      posts = parsePosts(raw);
      const next = data.nextCursor;
      if (!data.items.length || typeof next !== 'string' || !next || cursors.has(next)) break;
      cursors.add(next); cursor = next;
    }
    if (!posts.length) throw new Error('No recent posts');
    const summary = theme.summary ? Promise.resolve({}) : summarizeTheme(theme, posts).catch(() => ({}));
    const emotions: Emotions[] = new Array(posts.length);
    const locations: RegionEstimate[] = new Array(posts.length);
    let offset = 0;
    let failed = false;
    // Batch region estimates only. Emotion requests stay isolated, with at most three workers.
    async function worker() {
      while (!failed && offset < posts.length) {
        const start = offset; offset += 10;
        const slice = posts.slice(start, start + 10);
        const batch: Record<string, unknown> = {};
        slice.forEach((post, i) => {
          const regional = regionQuestions(i);
          batch[`p${i}_region`] = regional.region; batch[`p${i}_basis`] = regional.basis;
        });
        const result = await jsonRequest(new URL('/v1/systemone', process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai'), {Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`}, {
          model: process.env.TYPESAFE_DEFAULT_MODEL || 'jev-latest',
          state: {posts: slice.map(({text, language, profileLocation}) => ({text, language, profileLocation}))}, questions: batch,
        }, 30000);
        for (let i = 0; i < slice.length; i++) {
          if (failed) return;
          locations[start+i] = decodeRegion(result?.answers?.[`p${i}_region`], result?.answers?.[`p${i}_basis`]);
          emotions[start+i] = await analyzeEmotions(slice[i].text);
        }
      }
    }
    await Promise.all([0, 1, 2].map(() => worker().catch(error => {failed = true; throw error;})));
    return aggregateTheme({...theme, ...await summary}, posts, emotions, locations);
  });
}
