import {axes, cities, Emotions} from './waveEmotion';
export const THEME_INTERVAL = 15 * 60 * 1000;
export type Theme = {id: string; title: string; query: string; category: string; rank: number; aliases: string[]};
export type ThemeList = {themes: Theme[]; updatedAt: string; nextUpdateAt: string; stale?: boolean};
export type SocialPost = {id: string; text: string; url: string; createdAt: string; author: string};
export type ThemeGroup = {id: string; label: string; emotions: Emotions; count: number; latitude: number; longitude: number; symbolic: boolean; locationNote: string};
export type ThemeReport = {theme: Theme; groups: ThemeGroup[]; count: number; updatedAt: string; sourceStart: string; sourceEnd: string; sources: {url: string; createdAt: string}[]; stale?: boolean};
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
    unique.set(key, {id: encodeURIComponent(key), title, query: `"${title.replace(/["\\]/g, '')}" lang:ja -filter:retweets`, category, rank: rank + 1, aliases: [title]});
  });
  const all = Array.from(unique.values()), picked: Theme[] = [];
  for (const category of ['スポーツ', '文化', '社会', '日常・話題']) {
    const item = all.find(theme => theme.category === category);
    if (item) picked.push(item);
  }
  for (const item of all) {if (picked.length >= 5) break; if (!picked.includes(item)) picked.push(item);}
  return picked.sort((a, b) => a.rank - b.rank);
}
export function parsePosts(input: unknown, now = Date.now()): SocialPost[] {
  if (!Array.isArray(input)) throw new Error('Invalid search response');
  const ids = new Set<string>(), texts = new Set<string>(), authors = new Set<string>();
  const posts: SocialPost[] = [];
  for (const item of input) {
    if (!/^\d+$/.test(String(item?.id)) || typeof item.text !== 'string' || !item.text.trim() || item.text.length > 3000) continue;
    const time = Number(item.createdUtc) * 1000, author = String(item.authorId || item.authorUsername || item.id);
    const normalized = normalize(item.text.replace(/https?:\/\/\S+/g, ''));
    if (!Number.isFinite(time) || time > now + 60000 || time < now - 24 * 60 * 60 * 1000 || ids.has(item.id) || texts.has(normalized) || authors.has(author)) continue;
    ids.add(item.id); texts.add(normalized); authors.add(author);
    posts.push({id: String(item.id), text: item.text, url: `https://x.com/i/web/status/${item.id}`, createdAt: new Date(time).toISOString(), author});
    if (posts.length === 8) break;
  }
  return posts;
}
const teams = [
  {id: 'jp', name: '日本代表', words: /日本代表|森保ジャパン|SAMURAI BLUE/i, latitude: 35.68, longitude: 139.69},
  {id: 'br', name: 'ブラジル代表', words: /ブラジル代表|セレソン/, latitude: -15.79, longitude: -47.88},
  {id: 'ar', name: 'アルゼンチン代表', words: /アルゼンチン代表/, latitude: -34.60, longitude: -58.38},
  {id: 'fr', name: 'フランス代表', words: /フランス代表/, latitude: 48.86, longitude: 2.35},
  {id: 'de', name: 'ドイツ代表', words: /ドイツ代表/, latitude: 52.52, longitude: 13.40},
  {id: 'es', name: 'スペイン代表', words: /スペイン代表/, latitude: 40.42, longitude: -3.70},
  {id: 'kr', name: '韓国代表', words: /韓国代表/, latitude: 37.57, longitude: 126.98},
  {id: 'gb', name: 'イングランド代表', words: /イングランド代表/, latitude: 51.51, longitude: -.13},
];
export function aggregateTheme(theme: Theme, posts: SocialPost[], emotions: Emotions[], now = Date.now()): ThemeReport {
  if (posts.length !== emotions.length || posts.length === 0) throw new Error('No analysis');
  // Mention groups are not inferred nationality, support, or sentiment toward a team.
  const mentions = posts.map(post => theme.category === 'スポーツ' ? teams.filter(team => team.words.test(post.text)) : []);
  const counts = new Map<string, number>();
  mentions.forEach(items => {if (items.length === 1) counts.set(items[0].id, (counts.get(items[0].id) || 0) + 1);});
  const leaders = Array.from(counts).sort((a,b) => b[1]-a[1]).slice(0,2).map(([id]) => id);
  const split = leaders.length === 2;
  const place = cities.find(city => theme.title.includes(city.name));
  const groups = new Map<string, ThemeGroup>();
  posts.forEach((post, i) => {
    const team = split && mentions[i].length === 1 && leaders.includes(mentions[i][0].id) ? mentions[i][0] : null;
    const id = team?.id || 'topic';
    let group = groups.get(id);
    if (!group) {
      group = {id, label: team ? `${team.name}に言及` : split ? '両チーム・その他' : 'この話題の反応', latitude: team?.latitude ?? place?.lat ?? 35.68, longitude: team?.longitude ?? place?.lon ?? 139.69, symbolic: !team && !place, locationNote: team ? '国の位置はチームを表します。投稿者の国籍・支持ではありません。' : place ? `${place.name}についての話題です。投稿者の所在地ではありません。` : '東京付近は表示上の起点です。投稿場所ではありません。', count: 0, emotions: zeroEmotions()};
      groups.set(id, group);
    }
    group.count++;
    axes.forEach(axis => {const n = emotions[i][axis]; if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('Invalid emotion'); group!.emotions[axis] += n;});
  });
  groups.forEach(group => axes.forEach(axis => group.emotions[axis] /= group.count));
  const times = posts.map(post => post.createdAt).sort();
  return {theme, groups: Array.from(groups.values()), count: posts.length, updatedAt: new Date(now).toISOString(), sourceStart: times[0], sourceEnd: times[times.length-1], sources: posts.map(({url, createdAt}) => ({url, createdAt}))};
}

export function themeFlowSpeed(report: ThemeReport | null, now = Date.now()): number {
  if (!report || report.count < 3 || now - Date.parse(report.updatedAt) >= 30 * 60 * 1000) return 1;
  const total = report.groups.reduce((sum, group) => sum + group.count, 0);
  if (!total) return 1;
  return report.groups.reduce((sum, group) => sum + group.count * (1 + group.emotions.joy*.12 + group.emotions.anger*.2 + group.emotions.anxiety*.15 - group.emotions.sadness*.12), 0) / total;
}
