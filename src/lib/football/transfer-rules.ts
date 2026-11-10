/** Conservative headline-only extraction. Questions, speculation and opponents never establish a transfer. */
import { normAr } from './query-classify';
import type { RawArticle } from './news.server';
export interface TransferProof { club: string; items: RawArticle[]; outlets: number; loan: boolean }
const RUMOR = /\?|؟|\b(could|may|might|linked|interest|rumou?r|reportedly|target|talks|wants?|expected|set to|close to|vs|versus|against|denies?|rejects?)\b|شائع|اهتمام|مفاوض|يقترب|قد ينضم|محتمل|يرغب|يسعى|هل |ضد |أمام |امام |ينفي|نفي|لم ينضم|لم يوقع/i;
function destination(title: string, name: string): string | null {
  const t = normAr(title), n = normAr(name);
  if (!n || !t.includes(n) || RUMOR.test(title)) return null;
  const suffix = title.slice(title.toLowerCase().indexOf(name.toLowerCase()) + name.length);
  // Names with Arabic normalization differences use the normalized text only.
  const tail = title.toLowerCase().includes(name.toLowerCase()) ? suffix : t.slice(t.indexOf(n) + n.length);
  const match = tail.match(/^\s*(?:officially\s+)?(?:joins|signs for|has signed for|completes (?:his )?move to|ينضم (?:رسميا )?إلى|ينضم (?:رسميا )?الي|يوقع (?:رسميا )?(?:مع|لصالح)|يوقّع مع)\s+([^.!|:،,]+)/i)
    ?? title.match(/(?:official|رسميا|رسميًا)\s*[:：-]\s*([^:،,]+?)\s+(?:signs|announces signing of|يعلن التعاقد مع)\s+/i);
  const club = match?.[1]?.split(/\s+(?:on |in |from |after |until |for \d|بعقد|قادما|قادمًا|لمدة|في صفقة|حتى|بعد|قادماً)/i)[0]?.trim();
  return club && club.length >= 3 && club.length <= 65 ? club : null;
}
export function transferProof(articles: RawArticle[], names: string[], now = Date.now()): TransferProof | null {
  const groups = new Map<string, { club: string; items: RawArticle[] }>();
  for (const a of articles) {
    const stamp = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
    if (!Number.isFinite(stamp) || stamp > now || stamp < now - 120 * 86400000) continue;
    const club = names.map(n => destination(a.title,n)).find(Boolean);
    if (!club) continue;
    const key = normAr(club);
    const g = groups.get(key) ?? {club, items: []}; g.items.push(a); groups.set(key,g);
  }
  const candidates = [...groups.values()].map(g => ({...g, outlets: new Set(g.items.map(a => normAr(a.source).replace(/\s/g,''))).size})).filter(g => g.outlets >= 2);
  candidates.sort((a,b) => Math.max(...b.items.map(x => Date.parse(x.publishedAt ?? ''))) - Math.max(...a.items.map(x => Date.parse(x.publishedAt ?? ''))));
  const best = candidates[0];
  if (!best) return null;
  return {...best, loan: best.items.some(a => /\bloan\b|إعارة|اعاره/i.test(a.title))};
}
