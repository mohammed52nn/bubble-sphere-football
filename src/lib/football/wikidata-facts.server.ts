/** Licensed CC0 facts. Current club/number are selected from dated, non-deprecated senior-club statements. */
import { cached } from './cache.server';
import type { CareerStep } from './types';
export interface WikidataFacts {
  qid: string; birthDate: string | null; nationality: string | null; position: string | null;
  height: string | null; club: string | null; foot: string | null; shirtNumber: string | null;
  career: CareerStep[]; achievements: string[];
}
type Snak = { datavalue?: { value?: unknown } };
type Statement = { rank?: string; mainsnak?: Snak; qualifiers?: Record<string, Snak[]> };
type Entity = { labels?: Record<string, { value: string }>; claims?: Record<string, Statement[]> };
const value = (snak?: Snak) => snak?.datavalue?.value;
const id = (v: unknown): string | null => v && typeof v === 'object' && 'id' in v && typeof v.id === 'string' ? v.id : null;
const time = (v: unknown): string | null => v && typeof v === 'object' && 'time' in v && typeof v.time === 'string' ? v.time.replace(/^\+/, '').slice(0, 10) : null;
async function json(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': 'FootballBubbles/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error(`wikidata_${res.status}`);
  return res.json();
}
const statements = (e: Entity, p: string) => (e.claims?.[p] ?? []).filter(s => s.rank !== 'deprecated');
export async function wikidataFacts(latinName: string, refresh = false): Promise<WikidataFacts | null> {
  return cached(`facts:v2:${latinName}`, 86400000, async () => {
    const search = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=6&search=${encodeURIComponent(latinName)}`);
    const ids: string[] = (search.search ?? []).map((s: { id: string }) => s.id).filter((s: string) => /^Q\d+$/.test(s));
    if (!ids.length) return null;
    const data = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels&languages=ar|en&ids=${ids.join('|')}`);
    const qid = ids.find(q => statements(data.entities[q], 'P106').some(s => id(value(s.mainsnak)) === 'Q937857'));
    if (!qid) return null;
    const e: Entity = data.entities[qid];
    const refs = new Set<string>();
    for (const claims of Object.values(e.claims ?? {})) for (const s of claims) { const ref = id(value(s.mainsnak)); if (ref) refs.add(ref); }
    const labels: Record<string, Entity> = {};
    const all = [...refs];
    for (let i = 0; i < all.length; i += 50) {
      const d = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|claims&languages=ar|en&ids=${all.slice(i, i + 50).join('|')}`);
      Object.assign(labels, d.entities);
    }
    const label = (ref: string | null) => ref ? labels[ref]?.labels?.['ar']?.value ?? labels[ref]?.labels?.['en']?.value ?? null : null;
    const pick = (p: string) => value(statements(e, p)[0]?.mainsnak);
    const stints = statements(e, 'P54').map(s => ({
      team: id(value(s.mainsnak)), start: time(value(s.qualifiers?.['P580']?.[0])),
      end: time(value(s.qualifiers?.['P582']?.[0])), number: value(s.qualifiers?.['P1618']?.[0]),
    })).filter(s => s.team && !statements(labels[s.team] ?? {}, 'P31').some(c => ['Q6979593','Q1194951','Q1500'].includes(id(value(c.mainsnak)) ?? '')));
    const today = new Date().toISOString().slice(0, 10);
    const current = stints.filter(s => s.start && s.start <= today && (!s.end || s.end > today)).sort((a,b) => (b.start ?? '').localeCompare(a.start ?? ''))[0];
    const h = pick('P2048');
    const amount = h && typeof h === 'object' && 'amount' in h ? Number(h.amount) : NaN;
    const unit = h && typeof h === 'object' && 'unit' in h ? String(h.unit) : '';
    const height = Number.isFinite(amount) ? `${Math.round(unit.endsWith('Q11573') ? amount * 100 : amount)} سم` : null;
    const career: CareerStep[] = stints.sort((a,b) => (a.start ?? '').localeCompare(b.start ?? '')).flatMap(s => {
      const club = label(s.team); return club ? [{ club, period: `${s.start?.slice(0,4) ?? ''}–${s.end?.slice(0,4) ?? ''}`, note: null }] : [];
    });
    return { qid, birthDate: time(pick('P569')), nationality: label(id(pick('P1532'))) ?? label(id(pick('P27'))),
      position: label(id(pick('P413'))), height, club: label(current?.team ?? null), foot: label(id(pick('P8006'))),
      shirtNumber: typeof current?.number === 'string' ? current.number : null,
      career, achievements: [...new Set(statements(e,'P166').map(s => label(id(value(s.mainsnak)))).filter((s): s is string => !!s))] };
  }, refresh);
}
