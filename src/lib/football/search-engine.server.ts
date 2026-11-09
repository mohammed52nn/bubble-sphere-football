/** Self-sufficient search engine: Wikidata + fixed keyword tables. No AI credits needed. */
import { cached } from "./cache.server";
import { classifyQuery } from "./query-classify";

const UA = "FootballBubbles/1.0 (https://bubble-sphere-football.lovable.app)";

export interface EngineHit {
  latinName: string;
  displayName: string;
  club: string | null;
}

export interface EngineResult {
  hits: EngineHit[];
  interpretation: string;
}

async function getJson(url: string, timeout = 15000): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/sparql-results+json, application/json" },
    signal: AbortSignal.timeout(timeout),
  });
  if (!res.ok) throw new Error(`wikidata_${res.status}`);
  return res.json();
}

async function sparql(query: string): Promise<Record<string, string>[]> {
  const data = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`);
  return ((data.results?.bindings ?? []) as Record<string, { value: string }>[]).map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v.value])),
  );
}

const LABELS = `OPTIONAL { ?p rdfs:label ?en FILTER(lang(?en)="en") }
  OPTIONAL { ?p rdfs:label ?ar FILTER(lang(?ar)="ar") }`;

function toHits(rows: Record<string, string>[]): EngineHit[] {
  const seen = new Set<string>();
  const hits: EngineHit[] = [];
  for (const r of rows) {
    const latin = r["en"];
    if (!latin || seen.has(r["p"]!)) continue;
    seen.add(r["p"]!);
    hits.push({ latinName: latin, displayName: r["ar"] ?? latin, club: r["teamL"] ?? null });
  }
  return hits;
}

/** Current squad (stints without end date, started recently), most notable first. */
async function squadOf(clubQid: string, limit = 9): Promise<EngineHit[]> {
  const rows = await sparql(`SELECT ?p ?en ?ar ?links ?teamL WHERE {
    ?p p:P54 ?st . ?st ps:P54 wd:${clubQid} . FILTER NOT EXISTS { ?st pq:P582 ?e }
    ?st pq:P580 ?start FILTER(YEAR(?start) >= ${new Date().getUTCFullYear() - 8})
    ?p wdt:P106 wd:Q937857 ; wdt:P569 ?dob FILTER(YEAR(?dob) >= ${new Date().getUTCFullYear() - 40})
    ?p wikibase:sitelinks ?links .
    OPTIONAL { wd:${clubQid} rdfs:label ?teamL FILTER(lang(?teamL)="ar") }
    ${LABELS} } ORDER BY DESC(?links) LIMIT ${limit + 3}`);
  return toHits(rows).slice(0, limit);
}

async function leaguePlayers(leagueQid: string): Promise<EngineHit[]> {
  const rows = await sparql(`SELECT ?p ?en ?ar ?links ?teamL WHERE {
    ?team wdt:P118 wd:${leagueQid} . ?p p:P54 ?st . ?st ps:P54 ?team . FILTER NOT EXISTS { ?st pq:P582 ?e }
    ?st pq:P580 ?start FILTER(YEAR(?start) >= ${new Date().getUTCFullYear() - 6})
    ?p wdt:P106 wd:Q937857 ; wikibase:sitelinks ?links . FILTER(?links > 15)
    OPTIONAL { ?team rdfs:label ?teamL FILTER(lang(?teamL)="ar") }
    ${LABELS} } ORDER BY DESC(?links) LIMIT 40`);
  return shuffleTop(toHits(rows), 9);
}

async function nationPlayers(nationQid: string): Promise<EngineHit[]> {
  const rows = await sparql(`SELECT ?p ?en ?ar ?links WHERE {
    ?p wdt:P1532 wd:${nationQid} ; wdt:P106 wd:Q937857 ; wdt:P569 ?dob
    FILTER(YEAR(?dob) >= ${new Date().getUTCFullYear() - 37})
    ?p wikibase:sitelinks ?links . FILTER(?links > 12)
    ${LABELS} } ORDER BY DESC(?links) LIMIT 30`);
  return shuffleTop(toHits(rows), 9);
}

/** Keep the most notable first, vary the rest so repeated searches feel alive. */
function shuffleTop(hits: EngineHit[], n: number): EngineHit[] {
  const head = hits.slice(0, 3);
  const tail = hits.slice(3).sort(() => Math.random() - 0.5);
  return [...head, ...tail].slice(0, n);
}

interface Entity { qid: string; kind: "player" | "club" | "national"; en: string; ar: string | null; clubQid: string | null; clubAr: string | null }

/** Resolve a free-text name to a footballer, club or national team (Arabic + English search). */
async function resolveEntity(text: string): Promise<Entity | null> {
  const lang = /[\u0600-\u06FF]/.test(text) ? "ar" : "en";
  const search = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&type=item&limit=8&language=${lang}&uselang=${lang}&search=${encodeURIComponent(text)}`,
    9000,
  );
  const ids: string[] = (search.search ?? []).map((s: { id: string }) => s.id).filter((id: string) => /^Q\d+$/.test(id));
  if (!ids.length) return null;
  const rows = await sparql(`SELECT ?p ?en ?ar ?kind ?club ?clubAr WHERE {
    VALUES ?p { ${ids.map((i) => `wd:${i}`).join(" ")} }
    { ?p wdt:P106 wd:Q937857 . BIND("player" AS ?kind)
      OPTIONAL { ?p p:P54 ?st . ?st ps:P54 ?club . FILTER NOT EXISTS { ?st pq:P582 ?e }
        ?club wdt:P31/wdt:P279* wd:Q476028 .
        OPTIONAL { ?st pq:P580 ?since }
        OPTIONAL { ?club rdfs:label ?clubAr FILTER(lang(?clubAr)="ar") } } }
    UNION { ?p wdt:P31/wdt:P279* wd:Q6979593 . BIND("national" AS ?kind) }
    UNION { ?p wdt:P31/wdt:P279* wd:Q476028 . BIND("club" AS ?kind) }
    ${LABELS} }`);
  if (!rows.length) return null;
  const order = (r: Record<string, string>) => ids.indexOf(r["p"]!.split("/").pop()!);
  rows.sort((a, b) => order(a) - order(b));
  const best = rows[0]!;
  const qid = best["p"]!.split("/").pop()!;
  const mine = rows.filter((r) => r["p"] === best["p"] && r["club"]);
  const clubRow = mine[mine.length - 1];
  return {
    qid,
    kind: best["kind"] as Entity["kind"],
    en: best["en"] ?? text,
    ar: best["ar"] ?? null,
    clubQid: clubRow?.["club"]?.split("/").pop() ?? null,
    clubAr: clubRow?.["clubAr"] ?? null,
  };
}

/** Classify and answer a query from open data. Returns null when nothing matched. */
export async function engineSearch(query: string): Promise<EngineResult | null> {
  const intent = classifyQuery(query);
  return cached<EngineResult | null>(`engine:${query.trim().toLowerCase()}`, 6 * 60 * 60 * 1000, async () => {
    if (intent.kind === "league") {
      const hits = await leaguePlayers(intent.league.qid);
      return hits.length ? { hits, interpretation: `عرضنا نجومًا من ${intent.league.label}.` } : null;
    }
    if (intent.kind === "nation") {
      const hits = await nationPlayers(intent.nation.qid);
      return hits.length ? { hits, interpretation: `عرضنا لاعبين من ${intent.nation.label}.` } : null;
    }
    const entity = await resolveEntity(intent.text);
    if (!entity) return null;
    if (entity.kind === "club") {
      const hits = await squadOf(entity.qid);
      const name = entity.ar ?? entity.en;
      return hits.length ? { hits, interpretation: `عرضنا لاعبي ${name} الحاليين.` } : null;
    }
    if (entity.kind === "national") {
      const nat = await sparql(`SELECT ?c WHERE { wd:${entity.qid} wdt:P1532|wdt:P17 ?c } LIMIT 1`).catch(() => []);
      const country = nat[0]?.["c"]?.split("/").pop();
      const hits = country ? await nationPlayers(country) : [];
      return hits.length ? { hits, interpretation: `عرضنا لاعبين من ${entity.ar ?? entity.en}.` } : null;
    }
    const player: EngineHit = { latinName: entity.en, displayName: entity.ar ?? entity.en, club: entity.clubAr };
    const mates = entity.clubQid ? await squadOf(entity.clubQid, 8).catch(() => []) : [];
    const hits = [player, ...mates.filter((m) => m.latinName !== player.latinName)].slice(0, 8);
    return {
      hits,
      interpretation: entity.clubAr
        ? `عرضنا ${player.displayName} ومعه لاعبون من ${entity.clubAr}.`
        : `عرضنا ${player.displayName}.`,
    };
  });
}
