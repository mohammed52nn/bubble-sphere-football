/** Real basic facts from Wikidata (no AI). Used when the AI service is unavailable. */
export interface WikidataFacts {
  qid: string;
  birthDate: string | null;
  nationality: string | null;
  position: string | null;
  height: string | null;
  club: string | null;
  foot: string | null;
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "FootballBubbles/1.0 (https://bubble-sphere-football.lovable.app)", Accept: "application/json" },
    signal: AbortSignal.timeout(9000),
  });
  if (!res.ok) throw new Error(`wikidata_${res.status}`);
  return res.json();
}

export async function wikidataFacts(latinName: string): Promise<WikidataFacts | null> {
  const search = await getJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=6&search=${encodeURIComponent(latinName)}`,
  );
  const ids: string[] = (search.search ?? []).map((s: { id: string }) => s.id);
  if (ids.length === 0) return null;
  const values = ids.map((id) => `wd:${id}`).join(" ");
  const sparql = `SELECT ?p ?dob ?natL ?posL ?height ?teamL ?footL WHERE {
    VALUES ?p { ${values} } ?p wdt:P106 wd:Q937857 .
    OPTIONAL { ?p wdt:P569 ?dob }
    OPTIONAL { ?p wdt:P1532 ?nat . ?nat rdfs:label ?natL FILTER(lang(?natL)="ar") }
    OPTIONAL { ?p wdt:P413 ?pos . ?pos rdfs:label ?posL FILTER(lang(?posL)="ar") }
    OPTIONAL { ?p wdt:P2048 ?height }
    OPTIONAL { ?p wdt:P8017 ?f . ?f rdfs:label ?footL FILTER(lang(?footL)="ar") }
    OPTIONAL { ?p p:P54 ?st . ?st ps:P54 ?team . FILTER NOT EXISTS { ?st pq:P582 ?end }
      ?team wdt:P31/wdt:P279* wd:Q476028 . ?team rdfs:label ?teamL FILTER(lang(?teamL)="ar") }
  } LIMIT 20`;
  const data = await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`);
  const rows: Record<string, { value: string }>[] = data.results?.bindings ?? [];
  if (rows.length === 0) return null;
  // Keep the first matching search result (best name match).
  const order = (uri: string) => ids.indexOf(uri.split("/").pop() ?? "");
  rows.sort((a, b) => order(a["p"]!.value) - order(b["p"]!.value));
  const qid = rows[0]!["p"]!.value;
  const mine = rows.filter((r) => r["p"]!.value === qid);
  const pick = (k: string) => mine.find((r) => r[k])?.[k]?.value ?? null;
  const h = pick("height");
  const hNum = h ? Number(h) : NaN;
  return {
    qid: qid.split("/").pop()!,
    birthDate: pick("dob")?.slice(0, 10) ?? null,
    nationality: pick("natL"),
    position: pick("posL"),
    height: Number.isFinite(hNum) ? `${hNum < 3 ? Math.round(hNum * 100) : Math.round(hNum)} سم` : null,
    club: pick("teamL"),
    foot: pick("footL"),
  };
}
