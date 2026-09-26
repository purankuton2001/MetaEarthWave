import type {TrendOrigin} from './trendWaves';
import {regions, RegionEstimate} from './regions';
import {axes, Emotions} from './waveEmotion';
export const THEME_INTERVAL = 6 * 60 * 60 * 1000;
export type Theme = {id: string; title: string; query: string; category: string; rank: number; aliases: string[]; globalScore?: number; sourceCountries?: string[]; summary?:string; summarySources?:string[]; summaryKind?:'excerpts'; origin?: TrendOrigin};
export type ThemeList = {themes: Theme[]; countries?: string[]; missingCountries?:string[]; analysisAvailable?:boolean; updatedAt: string; nextUpdateAt: string; stale?: boolean};
export type SocialPost = {id: string; text: string; url: string; createdAt: string; author: string; language: string; profileLocation: string};
export type ThemeGroup = {id: string; label: string; emotions: Emotions; count: number; latitude: number; longitude: number; symbolic: boolean; locationNote: string; radius: number; confidence: number; languageCount: number};
export type ThemeReport = {emotions: Emotions; theme: Theme; groups: ThemeGroup[]; count: number; unknownCount: number; targetCount: number; limited: boolean; updatedAt: string; sourceStart: string; sourceEnd: string; sources: {url: string; createdAt: string}[]; stale?: boolean};
export const zeroEmotions = (): Emotions => ({joy: 0, sadness: 0, anger: 0, anxiety: 0, empathy: 0});
const normalize = (text: string) => text.normalize('NFKC').replace(/[#＃\s]/g, '').toLowerCase();
export function selectThemes(input: unknown): Theme[] {
  if (!Array.isArray(input)) throw new Error('Invalid trends');
  const unique = new Map<string, Theme>();
  input.slice(0, 50).forEach((item, rank) => {
    if (typeof item?.name !== 'string' || !item.name.trim() || item.name.length > 120) return;
    const title = item.name.trim(), key = normalize(title);
    if (!key) return;
    const existing = unique.get(key);
    if (existing) {existing.aliases.push(title); return;}
    const context = String(item.context || '');
    const category = /sport|league|racing|equestrian|NPB|football/i.test(context) ? 'スポーツ' : /music|pop|entertainment|arts|culture/i.test(context) ? '文化' : /news|politic|business|weather/i.test(context) ? '社会' : '日常・話題';
    unique.set(key, {id: encodeURIComponent(key), title, query: `"${title.replace(/["\\]/g, '')}" -filter:retweets`, category, rank: rank + 1, aliases: [title]});
  });
  const all = Array.from(unique.values()), picked: Theme[] = [];
  for (const category of ['スポーツ', '文化', '社会', '日常・話題']) {
    const item = all.find(theme => theme.category === category);
    if (item) picked.push(item);
  }
  for (const item of all) {if (picked.length >= 5) break; if (!picked.includes(item)) picked.push(item);}
  return picked.sort((a, b) => a.rank - b.rank);
}
export function parsePosts(input: unknown, now = Date.now(), limit = 120): SocialPost[] {
  if (!Array.isArray(input)) throw new Error('Invalid search response');
  const ids = new Set<string>(), texts = new Set<string>(), authors = new Set<string>();
  const posts: SocialPost[] = [];
  for (const item of input) {
    if (!/^\d+$/.test(String(item?.id)) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 3000) continue;
    const time = Number(item.createdUtc) * 1000, author = String(item.authorId || item.authorUsername || item.id);
    const normalized = normalize(item.text.replace(/https?:\/\/\S+/g, ''));
    if (!Number.isFinite(time) || time > now + 60000 || time < now - 24 * 60 * 60 * 1000 || ids.has(item.id) || texts.has(normalized) || authors.has(author)) continue;
    ids.add(item.id); texts.add(normalized); authors.add(author);
    posts.push({id: String(item.id), text: item.text, url: `https://x.com/i/web/status/${item.id}`, createdAt: new Date(time).toISOString(), author, language: typeof item.lang === 'string' ? item.lang.slice(0,20) : '', profileLocation: typeof item.authorLocation === 'string' ? item.authorLocation.slice(0,160) : ''});
    if (posts.length === limit) break;
  }
  return posts;
}
export function aggregateTheme(theme: Theme, posts: SocialPost[], emotions: Emotions[], locations: RegionEstimate[], now = Date.now()): ThemeReport {
  if (posts.length !== emotions.length || posts.length !== locations.length || posts.length === 0) throw new Error('No analysis');
  const groups = new Map<string, ThemeGroup>();
  let unknownCount = 0;
  posts.forEach((post, i) => {
    axes.forEach(axis => {const n = emotions[i][axis]; if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('Invalid emotion');});
    const location = locations[i];
    const region = regions.find(item => item.id === location.regionId);
    if (!region) {unknownCount++; return;}
    let group = groups.get(region.id);
    if (!group) {
      group = {...region, emotions: zeroEmotions(), count: 0, symbolic: false, confidence: 0, languageCount: 0,
        locationNote: '発信地域の推定です。実際の所在地や国籍を確定するものではありません。'};
      groups.set(region.id, group);
    }
    group.count++; group.confidence += location.confidence;
    if (location.basis === 'language') group.languageCount++;
    axes.forEach(axis => group!.emotions[axis] += emotions[i][axis]);
  });
  groups.forEach(group => {axes.forEach(axis => group.emotions[axis] /= group.count); group.confidence /= group.count;});
  const times = posts.map(post => post.createdAt).sort();
  const overall = zeroEmotions();
  emotions.forEach(item=>axes.forEach(axis=>overall[axis]+=item[axis]/emotions.length));
  return {emotions: overall, theme, groups: Array.from(groups.values()).sort((a,b) => b.count-a.count), count: posts.length, unknownCount, targetCount: 120, limited: posts.length < 100,
    updatedAt: new Date(now).toISOString(), sourceStart: times[0], sourceEnd: times[times.length-1], sources: posts.map(({url, createdAt}) => ({url, createdAt}))};
}

export function themeFlowSpeed(report: ThemeReport | null, now = Date.now()): number {
  if (!report || report.count < 3 || now - Date.parse(report.updatedAt) >= 2 * THEME_INTERVAL) return 1;
  const total = report.groups.reduce((sum, group) => sum + group.count, 0);
  if (total < 3) return 1;
  return report.groups.reduce((sum, group) => sum + group.count * (1 + group.emotions.joy*.12 + group.emotions.anger*.2 + group.emotions.anxiety*.15 - group.emotions.sadness*.12), 0) / total;
}
