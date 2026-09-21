import {createHash} from 'crypto';
import {axes, decodeEmotions, questions} from '../waveEmotion';
import {aggregateTheme, parsePosts, selectThemes, ThemeList, ThemeReport, THEME_INTERVAL} from '../themes';
import {jsonRequest} from './jsonRequest';

// Single-flight + bounded TTL cache. Hosting instances have separate caches.
const cache = new Map<string, {value: any; expires: number}>();
const pending = new Map<string, Promise<any>>();
const failures = new Map<string, number>();
async function cached<T>(key: string, produce: () => Promise<T>): Promise<T> {
  const previous = cache.get(key);
  if (previous && previous.expires > Date.now()) return previous.value;
  if (pending.has(key)) return pending.get(key)!;
  if ((failures.get(key) || 0) > Date.now()) {
    if (previous && previous.expires + THEME_INTERVAL > Date.now()) return {...previous.value, stale: true};
    throw new Error('Retry later');
  }
  const promise = produce().then(value => {
    if (cache.size >= 12) cache.delete(cache.keys().next().value);
    cache.set(key, {value, expires: Date.now() + THEME_INTERVAL}); failures.delete(key); return value;
  }).catch(error => {
    if (failures.size >= 12) failures.clear();
    failures.set(key, Date.now() + 60000);
    if (previous && previous.expires + THEME_INTERVAL > Date.now()) return {...previous.value, stale: true};
    throw error;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}
function treg(endpoint: string, body?: unknown) {
  if (!process.env.TREG_TOKEN) throw new Error('Treg unavailable');
  const url = new URL(`https://treg.to/call/${endpoint}`);
  if (!body) url.searchParams.set('country', 'Japan');
  const bucket = Math.floor(Date.now() / THEME_INTERVAL);
  const key = createHash('sha256').update(`${endpoint}:${JSON.stringify(body)}:${bucket}`).digest('hex');
  const headers: Record<string,string> = {'X-Treg-Token': process.env.TREG_TOKEN, 'Idempotency-Key': key, 'X-Treg-Max-Age': '900'};
  if (process.env.TREG_ORG) headers['X-Treg-Org'] = process.env.TREG_ORG;
  return jsonRequest(url, headers, body);
}
export function listThemes(): Promise<ThemeList> {
  return cached('list', async () => {
    const response = await treg('tikhub.x.twitter-web-fetch-trending');
    if (response.code !== 200) throw new Error('Trends failed');
    const themes = selectThemes(response.data?.trends);
    if (!themes.length) throw new Error('Empty trends');
    return {themes, updatedAt: new Date().toISOString(), nextUpdateAt: new Date(Date.now() + THEME_INTERVAL).toISOString()};
  });
}
export async function analyzeTheme(id: string): Promise<ThemeReport> {
  const list = await listThemes();
  const theme = list.themes.find(item => item.id === id);
  if (!theme) throw new Error('Unknown theme');
  if (!process.env.TYPESAFE_API_KEY) throw new Error('Jev unavailable');
  return cached(`theme:${id}`, async () => {
    const response = await treg('anyapi.x.search.posts', {query: theme.query, limit: 20, queryType: 'Latest'});
    const posts = parsePosts(response.output?.data?.items);
    if (!posts.length) throw new Error('No recent posts');
    const batch: Record<string, unknown> = {};
    posts.forEach((post, i) => {
      const base = questions();
      axes.forEach(axis => {batch[`p${i}_${axis}`] = {...base[axis], instructions: `state.posts[${i}]だけを対象にする。他の投稿と混ぜない。 ${base[axis].instructions}`};});
    });
    const result = await jsonRequest(new URL('/v1/systemone', process.env.TYPESAFE_BASE_URL || 'https://api.typesafe.ai'), {Authorization: `Bearer ${process.env.TYPESAFE_API_KEY}`}, {model: process.env.TYPESAFE_DEFAULT_MODEL || 'jev-latest', state: {posts: posts.map(post => post.text)}, questions: batch}, 25000);
    const emotions = posts.map((_, i) => decodeEmotions({answers: Object.fromEntries(axes.map(axis => [axis, result?.answers?.[`p${i}_${axis}`]]))}));
    return aggregateTheme(theme, posts, emotions);
  });
}
