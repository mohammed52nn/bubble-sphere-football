import { cacheGet, cacheSet, cached } from './cache.server';
export interface RawArticle { title: string; source: string; sourceUrl: string; publishedAt: string | null }
const UA = 'FootballBubbles/1.0';
function decode(text: string) {
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
}
function pick(block: string, tag: string) { const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')); return match?.[1] ? decode(match[1]) : null; }
const REGIONS = { EG: 'hl=ar&gl=EG&ceid=EG:ar', SA: 'hl=ar&gl=SA&ceid=SA:ar', GB: 'hl=en-GB&gl=GB&ceid=GB:en', ES: 'hl=es&gl=ES&ceid=ES:es' };
export async function searchHeadlines(rawQuery: string, lang: 'ar' | 'en', refresh = false, region: keyof typeof REGIONS = lang === 'ar' ? 'EG' : 'GB'): Promise<RawArticle[]> {
  return cached(`hl:v2:${region}:${rawQuery}`, 20 * 60000, async () => {
    const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(rawQuery)}&${REGIONS[region]}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`news_${res.status}`);
    return (await res.text()).split('<item>').slice(1,31).flatMap(block => {
      const title = pick(block,'title'), link = pick(block,'link'), source = pick(block,'source'), date = pick(block,'pubDate');
      const stamp = date ? Date.parse(date) : NaN;
      if (!title || !link || !source || !/^https?:\/\//.test(link)) return [];
      return [{ title: title.replace(new RegExp(`\\s+-\\s+${source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`),''), source, sourceUrl: link, publishedAt: Number.isFinite(stamp) ? new Date(stamp).toISOString() : null }];
    });
  }, refresh);
}
async function gdelt(name: string): Promise<RawArticle[]> {
  const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${name}"`)}&mode=artlist&maxrecords=20&format=json&sort=datedesc&timespan=30d`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) return [];
  const data = await res.json() as { articles?: {title?: string; url?: string; domain?: string; seendate?: string}[] };
  return (data.articles ?? []).flatMap(a => {
    if (!a.title || !a.url) return [];
    const t = a.seendate?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    return [{ title: a.title, source: a.domain ?? new URL(a.url).hostname, sourceUrl: a.url, publishedAt: t ? `${t[1]}-${t[2]}-${t[3]}T${t[4]}:${t[5]}:${t[6]}Z` : null }];
  });
}
export function mergeArticles(articles: RawArticle[], days = 30, now = Date.now()): RawArticle[] {
  const seen = new Set<string>();
  return articles.filter(a => {
    const date = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
    if (!Number.isFinite(date) || date < now - days * 86400000 || date > now + 86400000) return false;
    const key = a.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
    if (seen.has(key) || seen.has(a.sourceUrl)) return false;
    seen.add(key); seen.add(a.sourceUrl); return true;
  }).sort((a,b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}
export async function fetchArticles(arabicName: string, latinName: string, refresh = false): Promise<RawArticle[]> {
  const key = `news:v2:${latinName}`;
  return cached(key, 15 * 60000, async () => {
    const query = `("${arabicName.replace(/"/g,'')}" OR "${latinName.replace(/"/g,'')}")`;
    const read = async (days: number) => {
      const results = await Promise.allSettled([
        searchHeadlines(`${query} when:${days}d`, 'ar', refresh, 'EG'),
        searchHeadlines(`${query} when:${days}d`, 'ar', refresh, 'SA'),
        searchHeadlines(`"${latinName}" when:${days}d`, 'en', refresh, 'GB'),
        searchHeadlines(`"${latinName}" when:${days}d`, 'en', refresh, 'ES'),
      ]);
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    };
    let articles = mergeArticles(await read(7));
    if (articles.length < 6) articles = mergeArticles([...articles, ...await read(30), ...await gdelt(latinName).catch(() => [])]);
    if (articles.length) cacheSet(`${key}:last`, articles, 7 * 86400000);
    return (articles.length ? articles : mergeArticles(cacheGet<RawArticle[]>(`${key}:last`) ?? [])).slice(0,16);
  }, refresh);
}
export async function hasFreshNews(latinName: string): Promise<boolean> {
  return (await fetchArticles(latinName,latinName).catch(() => [])).some(a => a.publishedAt && Date.parse(a.publishedAt) > Date.now() - 3 * 86400000);
}
