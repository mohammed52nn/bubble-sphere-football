import { cached, cacheGet, cacheSet } from "./cache.server";
import type {
  ClubVerification,
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
}

export interface Query {
  latinName: string;
  club: string | null;
  nationality: string | null;
  birthDate: string | null;
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
      .map(([id, rs]) => ({ id, rs, name: v(rs[0], "pLabel") ?? "" }))
      .filter((c) => nameScore(c.name, q.latinName) > 0);

    // same-name disambiguation: DOB first, then club history
    let pick = candidates.length === 1 ? candidates[0] : undefined;
    if (!pick && q.birthDate) pick = candidates.find((c) => v(c.rs[0], "dob")?.slice(0, 10) === q.birthDate);
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
      birthDate: v(pick.rs[0], "dob")?.slice(0, 10) ?? null,
      nationality: v(pick.rs[0], "countryLabel"),
      previousClub: previous?.team ?? null,
      since: current?.start ?? null,
      transferState,
      retired: false,
    };
  },
};

export const PROVIDERS: ClubSourceProvider[] = [sofascoreProvider, wikidataProvider];

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
  const key = `club:v2:${season}:${normName(q.latinName)}:${q.birthDate ?? ""}`;
  const lastKey = `${key}:last`;
  const ttl = (inTransferWindow() ? 2 : 12) * 60 * 60 * 1000;

  const wasCached = cacheGet<ClubVerification>(key) !== null;
  try {
    const result = await cached(key, ttl, () => runVerification(q, providers, season));
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
    const p = providers[i];
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
    const w = v.p.reliability * (v.id / 100);
    if (g) { g.members.push(v); g.weight += w; } else groups.push({ club: v.obs.club!, members: [v], weight: w });
  }
  groups.sort((a, b) => b.weight - a.weight);
  const top = groups[0];
  const contested = groups.length > 1 && groups[1].weight >= top.weight * 0.8;
  const best = top.members.sort((a, b) => b.id - a.id)[0];
  debug.identityScore = best.id;

  const agreesWithPrimary = sameClub(top.club, q.club);
  let score = best.id * 0.6 + best.p.reliability * 25;
  if (top.members.length > 1) score += 10; // independent agreement
  if (agreesWithPrimary) score += 10;
  if (best.obs.birthDate && best.obs.birthDate === q.birthDate) score += 5;
  if (contested) score -= 25;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const level = levelOf(score);

  // Fail-safe update rule: change only when identity is strong, evidence high, and not contested.
  const dobConfirmed = !!q.birthDate && best.obs.birthDate === q.birthDate;
  const strong = !contested && score >= 85 && (top.members.length > 1 || dobConfirmed);

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
    name: top.club,
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
    debug,
  };
}
