import { cached, cacheGet, cacheSet } from "./cache.server";
import type { ClubVerification } from "./club-types";

/** Replaceable provider contract — swap SofaScore for any other source later. */
export interface CurrentClubVerificationProvider {
  id: string;
  label: string;
  search(name: string): Promise<ProviderCandidate[]>;
  player(id: string): Promise<ProviderPlayer | null>;
}
export interface ProviderCandidate {
  id: string;
  name: string;
  team: string | null;
  nationality: string | null;
  position: string | null;
}
export interface ProviderPlayer extends ProviderCandidate {
  teamId: string | null;
  teamLogo: string | null;
  retired: boolean;
}

const UA = "Mozilla/5.0 (compatible; FootballBubbles/1.0)";

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

type Obj = Record<string, unknown>;
const o = (v: unknown): Obj => (v && typeof v === "object" ? (v as Obj) : {});
const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

export const sofascoreProvider: CurrentClubVerificationProvider = {
  id: "sofascore",
  label: "SofaScore",
  async search(name) {
    const json = o(await getJson(`https://api.sofascore.com/api/v1/search/all?q=${encodeURIComponent(name)}`));
    const results = Array.isArray(json["results"]) ? json["results"] : [];
    return results
      .map(o)
      .filter((r) => r["type"] === "player")
      .map((r) => {
        const e = o(r["entity"]);
        return {
          id: String(e["id"] ?? ""),
          name: s(e["name"]) ?? "",
          team: s(o(e.team)["name"]),
          nationality: s(o(e.country)["name"]),
          position: s(e["position"]),
        };
      })
      .filter((c) => c.id && c.name)
      .slice(0, 8);
  },
  async player(id) {
    const p = o(o(await getJson(`https://api.sofascore.com/api/v1/player/${encodeURIComponent(id)}`))["player"]);
    if (!p["id"]) return null;
    const team = o(p["team"]);
    return {
      id: String(p["id"]),
      name: s(p["name"]) ?? "",
      team: s(team["name"]),
      teamId: team["id"] ? String(team["id"]) : null,
      teamLogo: team["id"] ? `https://api.sofascore.app/api/v1/team/${team["id"]}/image` : null,
      nationality: s(o(p.country)["name"]),
      position: s(p["position"]),
      retired: p["retired"] === true,
    };
  },
};

/** Club name normalizer: "FC Barcelona" == "Barcelona" == "Barcelona FC". */
export function normalizeClub(name: string | null): string {
  if (!name) return "";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’-]/g, " ")
    .replace(/\b(fc|cf|sc|ac|afc|ssc|club|de|futbol|football|calcio|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export const sameClub = (a: string | null, b: string | null) => {
  const x = normalizeClub(a);
  const y = normalizeClub(b);
  return !!x && x === y;
};

const normName = (n: string) => normalizeClub(n).replace(/[^a-z ]/g, "");

/** Identity resolution: exact name match required; extra signals raise the score. */
function scoreCandidate(c: ProviderCandidate, q: Query): number {
  const a = normName(c.name);
  const b = normName(q.latinName);
  if (!a || !b) return 0;
  let score = 0;
  if (a === b) score += 0.6;
  else if (a.split(" ").at(-1) === b.split(" ").at(-1) && (a.includes(b) || b.includes(a))) score += 0.4;
  else return 0;
  if (q.club && sameClub(c.team, q.club)) score += 0.3;
  if (q.nationality && c.nationality && normName(c.nationality) === normName(q.nationality)) score += 0.1;
  return score;
}

interface Query {
  latinName: string;
  club: string | null;
  nationality: string | null;
}

const TTL = 6 * 60 * 60 * 1000;

export async function verifyCurrentClub(
  q: Query,
  provider: CurrentClubVerificationProvider = sofascoreProvider,
): Promise<ClubVerification> {
  const key = `club:${provider.id}:${normName(q.latinName)}`;
  const unavailable = (): ClubVerification => {
    // stale-while-revalidate: keep last good result if we have one
    return cacheGet<ClubVerification>(`${key}:last`) ?? { status: "unavailable" };
  };
  try {
    return await cached(key, TTL, async () => {
      const candidates = await provider.search(q.latinName);
      const ranked = candidates
        .map((c) => ({ c, score: scoreCandidate(c, q) }))
        .filter((r) => r.score >= 0.6)
        .sort((x, y) => y.score - x.score);
      const best = ranked[0];
      // ambiguous: two candidates with the same top score
      if (!best || (ranked[1] && ranked[1].score === best.score)) return { status: "unavailable" } as ClubVerification;
      const p = await provider.player(best.c.id);
      if (!p || !p["team"] || p["retired"] || normName(p["name"]) !== normName(best.c.name)) {
        return { status: "unavailable" } as ClubVerification;
      }
      const agrees = sameClub(p["team"], q.club);
      const confidence: "high" | "medium" = best.score >= 0.7 || agrees ? "high" : "medium";
      const result: ClubVerification = {
        status: agrees ? "confirmed" : confidence === "high" ? "changed" : "conflict",
        name: p["team"],
        teamId: p.teamId,
        logo: p.teamLogo,
        source: provider.label,
        verifiedAt: new Date().toISOString(),
        confidence,
        previousClub: q.club,
        changed: !agrees,
      };
      cacheSet(`${key}:last`, result, 7 * 24 * 60 * 60 * 1000);
      return result;
    });
  } catch {
    // short negative cache so we don't hammer a failing provider
    cacheSet(key, unavailable(), 10 * 60 * 1000);
    return unavailable();
  }
}
