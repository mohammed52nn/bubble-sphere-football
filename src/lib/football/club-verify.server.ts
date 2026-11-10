import { cached, cacheGet, cacheSet } from "./cache.server";
import type {
  ClubVerification,
  EvidenceItem,
  ConfidenceLevel,
  TransferState,
  VerificationDebug,
} from "./club-types";

/** Replaceable provider contract — each source returns one identity-checked observation. */
export interface ClubSourceProvider {
  id: string;
  label: string;
  /** 0..1 — structured-data reliability */
  reliability: number;
  observe(q: Query): Promise<Observation | null>;
}

export interface Observation {
  playerId: string;
  name: string;
  club: string | null;
  teamId: string | null;
  logo: string | null;
  birthDate: string | null; // YYYY-MM-DD
  nationality: string | null;
  previousClub: string | null;
  since: string | null; // ISO start date at current club, if known
  transferState: TransferState;
  retired: boolean;
  /** News-derived proof (only for the news provider). */
  evidence?: {
    outlets: number;
    lineup: boolean;
    official: boolean;
    headlines: string[];
    /** Step 2: player named in a recent line-up headline of the candidate club. */
    lineupConfirmed: boolean;
    items: EvidenceItem[];
  };
}

export interface Query {
  latinName: string;
  club: string | null;
  nationality: string | null;
  birthDate: string | null;
  refresh?: boolean;
  /** Manual "تحديث": wider news windows + official club channels. */
  deep?: boolean;
}

const UA = "FootballBubbles/1.0 (club verification; contact via app)";
type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

async function getJson(url: string, timeout = 6000): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json, application/sparql-results+json" },
    signal: AbortSignal.timeout(timeout),
  });
  if (res.status === 429) throw new Error("rate_limited");
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

/* ---------------- normalizers ---------------- */

export function normalizeClub(name: string | null): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’-]/g, " ")
    .replace(/\b(fc|cf|sc|ac|afc|ssc|club|de|futbol|football|calcio|the|sk|fk|as)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export const sameClub = (a: string | null, b: string | null) => {
  const x = normalizeClub(a);
  const y = normalizeClub(b);
  return !!x && !!y && (x === y || x.includes(y) || y.includes(x));
};
const normName = (n: string) => normalizeClub(n).replace(/[^a-z ]/g, "").trim();

function nameScore(a: string, b: string): number {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.split(" ").at(-1) === y.split(" ").at(-1) && (x.includes(y) || y.includes(x))) return 0.7;
  return 0;
}

/* ---------------- season awareness ---------------- */

export function seasonOf(d = new Date()): string {
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 6 ? y : y - 1; // seasons roll over in July
  return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
}
function inTransferWindow(d = new Date()) {
  const m = d.getUTCMonth();
  return m === 0 || m === 5 || m === 6 || m === 7; // Jan, Jun–Aug
}

/* ---------------- providers ---------------- */

/** SofaScore public JSON. Often blocks server requests (403) — failures are isolated. */
export const sofascoreProvider: ClubSourceProvider = {
  id: "sofascore",
  label: "SofaScore",
  reliability: 0.85,
  async observe(q) {
    const json = o(await getJson(`https://api.sofascore.com/api/v1/search/all?q=${encodeURIComponent(q.latinName)}`));
    const results = (Array.isArray(json["results"]) ? json["results"] : []).map(o);
    const players = results
      .filter((r) => r["type"] === "player")
      .map((r) => o(r["entity"]))
      .filter((e) => nameScore(s(e["name"]) ?? "", q.latinName) > 0);
    if (players.length !== 1 && !(players.length > 1 && q.club)) return null;
    const pick =
      players.length === 1 ? players[0] : players.find((e) => sameClub(s(o(e["team"])["name"]), q.club));
    if (!pick) return null;
    const p = o(o(await getJson(`https://api.sofascore.com/api/v1/player/${encodeURIComponent(String(pick["id"]))}`))["player"]);
    if (!p["id"]) return null;
    const team = o(p["team"]);
    const dob = typeof p["dateOfBirthTimestamp"] === "number"
      ? new Date((p["dateOfBirthTimestamp"] as number) * 1000).toISOString().slice(0, 10)
      : null;
    return {
      playerId: String(p["id"]),
      name: s(p["name"]) ?? "",
      club: s(team["name"]),
      teamId: team["id"] ? String(team["id"]) : null,
      logo: team["id"] ? `https://api.sofascore.app/api/v1/team/${team["id"]}/image` : null,
      birthDate: dob,
      nationality: s(o(p["country"])["name"]),
      previousClub: null,
      since: null,
      transferState: "UNKNOWN",
      retired: p["retired"] === true,
    };
  },
};

/** Wikidata — open, licensed (CC0) structured data with dated club stints and loan qualifiers. */
export const wikidataProvider: ClubSourceProvider = {
  id: "wikidata",
  label: "Wikidata",
  reliability: 0.75,
  async observe(q) {
    const search = o(
      await getJson(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=${encodeURIComponent(q.latinName)}&origin=*`,
      ),
    );
    const ids = (Array.isArray(search["search"]) ? search["search"] : [])
      .map(o)
      .map((r) => s(r["id"]))
      .filter((x): x is string => !!x && /^Q\d+$/.test(x));
    if (!ids.length) return null;

    const sparql = `SELECT ?p ?pLabel ?dob ?countryLabel ?team ?teamLabel ?start ?end ?acqLabel WHERE {
      VALUES ?p { ${ids.map((i) => `wd:${i}`).join(" ")} }
      ?p wdt:P106 wd:Q937857 .
      OPTIONAL { ?p wdt:P569 ?dob }
      OPTIONAL { ?p wdt:P1532 ?country }
      OPTIONAL {
        ?p p:P54 ?st . ?st ps:P54 ?team .
        FILTER NOT EXISTS { ?team wdt:P31/wdt:P279* wd:Q6979593 }
        FILTER NOT EXISTS { ?st wikibase:rank wikibase:DeprecatedRank }
        OPTIONAL { ?st pq:P580 ?start } OPTIONAL { ?st pq:P582 ?end } OPTIONAL { ?st pq:P1642 ?acq }
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }`;
    const res = o(
      await getJson(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`, 8000),
    );
    const rows = (Array.isArray(o(res["results"])["bindings"]) ? (o(res["results"])["bindings"] as unknown[]) : []).map(o);
    const v = (r: Obj, k: string) => s(o(r[k])["value"]);

    // group by person
    const people = new Map<string, Obj[]>();
    for (const r of rows) {
      const id = v(r, "p");
      if (!id) continue;
      people.set(id, [...(people.get(id) ?? []), r]);
    }
    const candidates = [...people.entries()]
      .map(([id, rs]) => ({ id, rs, name: v(rs[0]!, "pLabel") ?? "" }))
      .filter((c) => nameScore(c.name, q.latinName) > 0);

    // same-name disambiguation: DOB first, then club history
    let pick = candidates.length === 1 ? candidates[0] : undefined;
    if (!pick && q.birthDate) pick = candidates.find((c) => v(c.rs[0]!, "dob")?.slice(0, 10) === q.birthDate);
    if (!pick && q.club) {
      const byClub = candidates.filter((c) => c.rs.some((r) => sameClub(v(r, "teamLabel"), q.club)));
      if (byClub.length === 1) pick = byClub[0];
    }
    if (!pick) return null;

    const stints = pick.rs
      .filter((r) => v(r, "teamLabel"))
      .map((r) => ({
        team: v(r, "teamLabel")!,
        teamId: v(r, "team")?.split("/").pop() ?? null,
        start: v(r, "start"),
        end: v(r, "end"),
        loan: /loan/i.test(v(r, "acqLabel") ?? ""),
      }))
      .filter((st) => !/^Q\d+$/.test(st.team));
    const open = stints
      .filter((st) => !st.end && st.start)
      .sort((a, b) => (b.start ?? "").localeCompare(a.start ?? ""));
    const current = open[0] ?? null;
    const closed = stints.filter((st) => st.end).sort((a, b) => (b.end ?? "").localeCompare(a.end ?? ""));
    const previous = closed.find((st) => !current || !sameClub(st.team, current.team)) ?? null;

    let transferState: TransferState = "UNKNOWN";
    if (!current) transferState = closed.length ? "FREE_AGENT" : "UNKNOWN";
    else if (current.loan) transferState = "LOAN";
    else if (previous?.loan && stints.some((st) => st !== current && sameClub(st.team, current.team) && (st.end ?? "") <= (previous.start ?? "")))
      transferState = "RETURN_FROM_LOAN";
    else if (current.start && Date.now() - Date.parse(current.start) < 200 * 86400000) transferState = "NEW_SIGNING";
    else if (previous) transferState = "PERMANENT";

    return {
      playerId: pick.id.split("/").pop() ?? pick.id,
      name: pick.name,
      club: current?.team ?? null,
      teamId: current?.teamId ?? null,
      logo: null,
      birthDate: v(pick.rs[0]!, "dob")?.slice(0, 10) ?? null,
      nationality: v(pick.rs[0]!, "countryLabel"),
      previousClub: previous?.team ?? null,
      since: current?.start ?? null,
      transferState,
      retired: false,
    };
  },
};

/** Real completed-transfer headlines + independently fetched recent lineup proof; never spends AI credits. */
export const newsProvider: ClubSourceProvider = {
  id: "news", label: "أحدث الأخبار", reliability: 0.7,
  async observe(q) {
    const { searchHeadlines } = await import("./news.server");
    const { transferProof } = await import("./transfer-rules");
    const { ROSTER } = await import("./roster");
    const ar = ROSTER.find(p => normName(p.latinName) === normName(q.latinName))?.displayName;
    const names = [q.latinName, ...(ar ? [ar] : [])];
    const lists = await Promise.allSettled(names.map(name => searchHeadlines(`"${name}" (joins OR signs OR انتقال OR ينضم OR يوقع OR رسميا) when:${q.deep ? 120 : 60}d`, /[\u0600-\u06ff]/.test(name) ? "ar" : "en", q.refresh)));
    const articles = lists.flatMap(r => r.status === "fulfilled" ? r.value : []);
    const proof = transferProof(articles,names);
    if (!proof) return null;
    const lineupLists = await Promise.allSettled(names.map(name => searchHeadlines(`"${name}" "${proof.club}" (lineup OR "starting XI" OR "line-up" OR تشكيلة) when:21d`, /[\u0600-\u06ff]/.test(name) ? "ar" : "en", q.refresh)));
    const lineupHits = lineupLists.flatMap(r => r.status === "fulfilled" ? r.value : []).filter(a => {
      const date = Date.parse(a.publishedAt ?? "");
      return date >= Date.now() - 21 * 86400000 && date <= Date.now() && names.some(n => a.title.toLowerCase().includes(n.toLowerCase())) && a.title.toLowerCase().includes(proof.club.toLowerCase()) && /lineup|line-up|starting xi|تشكيل/i.test(a.title) && !/\?|؟|could|expected|predicted|متوقع|محتمل/i.test(a.title);
    });
    return {
      playerId: `news:${normName(q.latinName)}`, name: q.latinName, club: proof.club, teamId: null, logo: null,
      birthDate: null, nationality: q.nationality, previousClub: q.club, since: null,
      transferState: proof.loan ? "LOAN" : "NEW_SIGNING", retired: false,
      evidence: { outlets: proof.outlets, lineup: lineupHits.length > 0, official: true,
        headlines: proof.items.map(a => a.title), lineupConfirmed: lineupHits.length > 0,
        items: [ ...proof.items.slice(0,4).map(a => ({ title: a.title, url: a.sourceUrl, source: a.source, publishedAt: a.publishedAt, kind: "transfer" as const })),
          ...lineupHits.slice(0,2).map(a => ({ title: a.title, url: a.sourceUrl, source: a.source, publishedAt: a.publishedAt, kind: "lineup" as const })) ],
      },
    };
  },
};

export const PROVIDERS: ClubSourceProvider[] = [sofascoreProvider, wikidataProvider, newsProvider];

/* ---------------- identity + confidence ---------------- */

function identityScore(obs: Observation, q: Query): number {
  const n = nameScore(obs.name, q.latinName);
  if (!n) return 0;
  let score = n * 45;
  if (q.birthDate && obs.birthDate) {
    if (q.birthDate === obs.birthDate) score += 40;
    else return 0; // DOB mismatch → different person
  }
  if (q.nationality && obs.nationality && normName(obs.nationality) === normName(q.nationality)) score += 10;
  if (q.club && (sameClub(obs.club, q.club) || sameClub(obs.previousClub, q.club))) score += 15;
  if (obs.evidence?.lineupConfirmed) score += 20; // named in the club's own recent line-up
  return Math.min(100, score);
}

export function levelOf(score: number): ConfidenceLevel {
  if (score >= 95) return "very_high";
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  if (score >= 50) return "low";
  return "unverified";
}

/* ---------------- orchestrator ---------------- */

export async function verifyCurrentClub(
  q: Query,
  providers: ClubSourceProvider[] = PROVIDERS,
): Promise<ClubVerification> {
  const season = seasonOf();
  const key = `club:v6:${season}:${normName(q.latinName)}:${q.birthDate ?? ""}:${normalizeClub(q.club)}:${q.nationality ?? ""}`;
  const lastKey = `${key}:last`;
  const ttl = (inTransferWindow() ? 2 : 12) * 60 * 60 * 1000;

  const wasCached = !q.refresh && cacheGet<ClubVerification>(key) !== null;
  try {
    const result = await cached(key, ttl, () => runVerification(q, providers, season), q.refresh);
    if (result.status === "unavailable") {
      const last = cacheGet<ClubVerification>(lastKey);
      if (last && last.status !== "unavailable") return withCache({ ...last, state: "STALE" }, "stale");
    }
    if (result.status !== "unavailable") cacheSet(lastKey, result, 7 * 86400000);
    return withCache(result, wasCached ? "cached" : "fresh");
  } catch {
    const last = cacheGet<ClubVerification>(lastKey);
    cacheSet(key, last ?? { status: "unavailable" }, 10 * 60 * 1000);
    return last ? withCache({ ...last, ...(last.status !== "unavailable" ? { state: "STALE" as const } : {}) }, "stale") : { status: "unavailable" };
  }
}

function withCache(r: ClubVerification, cache: VerificationDebug["cache"]): ClubVerification {
  return r.debug ? { ...r, debug: { ...r.debug, cache } } : r;
}

async function runVerification(
  q: Query,
  providers: ClubSourceProvider[],
  season: string,
): Promise<ClubVerification> {
  const settled = await Promise.allSettled(providers.map((p) => p.observe(q)));
  const debug: VerificationDebug = {
    playerIds: {},
    identityScore: 0,
    primaryClub: q.club,
    sourcesChecked: [],
    reason: "",
    cache: "fresh",
  };

  const valid: { p: ClubSourceProvider; obs: Observation; id: number }[] = [];
  settled.forEach((r, i) => {
    const p = providers[i]!;
    if (r.status === "rejected") {
      debug.sourcesChecked.push({ source: p.label, ok: false, club: null, note: String((r.reason as Error)?.message ?? "error") });
      return;
    }
    const obs = r.value;
    if (!obs) {
      debug.sourcesChecked.push({ source: p.label, ok: false, club: null, note: "not_found_or_ambiguous" });
      return;
    }
    const id = identityScore(obs, q);
    debug.playerIds[p.id] = obs.playerId;
    if (id < 55 || obs.retired || !obs.club) {
      debug.sourcesChecked.push({ source: p.label, ok: false, club: obs.club, note: id < 55 ? `identity_low(${id})` : obs.retired ? "retired" : "no_club" });
      return;
    }
    debug.sourcesChecked.push({ source: p.label, ok: true, club: obs.club, note: `identity ${id}` });
    valid.push({ p, obs, id });
  });

  if (!valid.length) {
    debug.reason = "no source produced a confident identity match";
    return { status: "unavailable", debug };
  }

  // Group by club and pick the club with the most weighted support (recency as tiebreak).
  const groups: { club: string; members: typeof valid; weight: number }[] = [];
  for (const v of valid) {
    const g = groups.find((x) => sameClub(x.club, v.obs.club));
    // Fresh news proof (line-ups / official announcements from ≥2 outlets) outranks stale structured data.
    const ev = v.obs.evidence;
    const newsBoost = ev && (ev.lineup || ev.official) ? 0.6 + Math.min(ev.outlets, 5) * 0.1 : 0;
    const w = v.p.reliability * (v.id / 100) + newsBoost;
    if (g) { g.members.push(v); g.weight += w; } else groups.push({ club: v.obs.club!, members: [v], weight: w });
  }
  groups.sort((a, b) => b.weight - a.weight);
  const top = groups[0]!;
  const contested = groups.length > 1 && groups[1]!.weight >= top.weight * 0.8;
  const best = top.members.sort((a, b) => b.id - a.id)[0]!;
  debug.identityScore = best.id;
  const news = top.members.find((m) => m.obs.evidence)?.obs.evidence;
  const newsStrong = !!news && (news.lineup || news.official) && news.outlets >= 2;
  if (news) debug.reason = `news: ${news.outlets} outlets — ${news.headlines.join(" | ").slice(0, 300)}`;

  const agreesWithPrimary = sameClub(top.club, q.club);
  let score = best.id * 0.6 + best.p.reliability * 25;
  if (top.members.length > 1) score += 10; // independent agreement
  if (agreesWithPrimary) score += 10;
  if (best.obs.birthDate && best.obs.birthDate === q.birthDate) score += 5;
  if (newsStrong) score += 15 + (news!.lineup && news!.official ? 10 : 0) + (news!.outlets >= 3 ? 5 : 0);
  if (news?.lineupConfirmed) score += 15;
  if (contested) score -= 25;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const level = levelOf(score);

  // Fail-safe update rule: change only when identity is strong, evidence high, and not contested.
  const dobConfirmed = !!q.birthDate && best.obs.birthDate === q.birthDate;
  const strong = !contested && score >= 85 && (top.members.length > 1 || dobConfirmed || newsStrong);

  let status: "confirmed" | "changed" | "conflict";
  let state: "AGREEMENT" | "VERIFIED" | "CONFLICT" | "RECENT_CHANGE" | "UNVERIFIED";
  if (contested) { status = "conflict"; state = "CONFLICT"; debug.reason = "sources disagree"; }
  else if (agreesWithPrimary) { status = "confirmed"; state = top.members.length > 1 ? "AGREEMENT" : "VERIFIED"; debug.reason = "verified matches existing club"; }
  else if (strong) { status = "changed"; state = "RECENT_CHANGE"; debug.reason = "strong evidence of new club"; }
  else { status = "conflict"; state = "UNVERIFIED"; debug.reason = "differs from existing club but evidence too weak"; }

  const now = new Date().toISOString();
  return {
    status,
    state,
    name: await arabicClubName(top.club),
    teamId: best.obs.teamId,
    logo: top.members.find((m) => m.obs.logo)?.obs.logo ?? null,
    source: top.members.map((m) => m.p.label).join(" + "),
    verifiedAt: now,
    season,
    confidence: score >= 85 ? "high" : "medium",
    score,
    level,
    previousClub: status === "changed" ? q.club : best.obs.previousClub,
    changed: status === "changed",
    changeDetectedAt: status === "changed" ? now : null,
    transferState: top.members.find((m) => m.obs.transferState !== "UNKNOWN")?.obs.transferState ?? "UNKNOWN",
    evidence: [...(news?.items ?? []), ...recordEvidence(top.members)],
    proof: proofOf(status, newsStrong, !!news?.lineupConfirmed, !!news),
    debug,
  };
}

/** Structured-database records backing the chosen club, so "why this club" is never empty. */
function recordEvidence(members: { p: ClubSourceProvider; obs: Observation }[]): EvidenceItem[] {
  const out: EvidenceItem[] = [];
  for (const { p, obs } of members) {
    if (obs.evidence || !obs.club) continue;
    const url =
      p.id === "wikidata" ? `https://www.wikidata.org/wiki/${obs.playerId}`
      : p.id === "sofascore" ? `https://www.sofascore.com/player/p/${obs.playerId}`
      : null;
    if (!url) continue;
    const since = obs.since ? ` منذ ${obs.since.slice(0, 10)}` : "";
    const loan = obs.transferState === "LOAN" ? " (إعارة)" : "";
    out.push({ title: `${obs.club}${loan}${since}`, url, source: p.label, publishedAt: null, kind: "record" });
  }
  return out;
}

/** Best-effort Arabic label for a club via Wikidata; falls back to the original name. */
async function arabicClubName(name: string): Promise<string> {
  if (!name || /[\u0600-\u06FF]/.test(name)) return name;
  try {
    return await cached(`club-ar:v2:${name.toLowerCase()}`, 7 * 24 * 3600 * 1000, async () => {
      const h = { headers: { "User-Agent": "FootballBubbles/1.0" }, signal: AbortSignal.timeout(5000) };
      const r = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&type=item&limit=7&search=${encodeURIComponent(name)}`,
        h,
      );
      const hits = ((await r.json()) as { search?: { id: string; description?: string }[] }).search ?? [];
      if (!hits.length) return name;
      // Prefer the football club entry over a city/person/stadium with the same name.
      const clubHits = hits.filter((s) => /football|soccer|club|team/i.test(s.description ?? ""));
      const ids = (clubHits.length ? clubHits : hits).slice(0, 3).map((s) => s.id);
      const e = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels&languages=ar&ids=${ids.join("|")}`,
        { headers: { "User-Agent": "FootballBubbles/1.0" }, signal: AbortSignal.timeout(5000) },
      );
      const data = (await e.json()) as { entities?: Record<string, { labels?: { ar?: { value: string } } }> };
      for (const id of ids) {
        const ar = data.entities?.[id]?.labels?.ar?.value;
        if (ar) return ar;
      }
      return name;
    }); // network errors throw, so failures are never cached
  } catch {
    return name;
  }
}

/** Two-step proof: news (transfer/official/line-up) + the club's own line-up naming the player. */
export function proofOf(
  status: "confirmed" | "changed" | "conflict",
  newsStrong: boolean,
  lineupConfirmed: boolean,
  hasNews: boolean,
): "confirmed_today" | "likely" | "none" {
  if (status !== "conflict" && newsStrong && lineupConfirmed) return "confirmed_today";
  if (hasNews || lineupConfirmed) return "likely";
  return "none";
}
