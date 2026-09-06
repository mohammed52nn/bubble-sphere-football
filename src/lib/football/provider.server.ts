/**
 * Server-only adapter for API-Football (api-sports.io v3).
 * The API key never leaves the server. All provider responses are defensively
 * parsed into our normalized model; unknown/missing fields become null/UNKNOWN.
 */
import { cached } from "./cache.server";
import type {
  FixtureInfo,
  LiveErrorCode,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  PlayerLiveInfo,
  PlayerMatchStatus,
} from "./live-types";

const BASE = "https://v3.football.api-sports.io";
const SOURCE = "api-football";

/** Configurable TTLs (ms). */
const TTL = {
  playerResolve: 24 * 60 * 60 * 1000,
  liveList: 25_000,
  liveFixture: 25_000,
  nextFixture: 8 * 60 * 1000,
  lastFixture: 60 * 60 * 1000,
};

const TIMEOUT_MS = 10_000;

export class ProviderError extends Error {
  code: LiveErrorCode;
  retryAfterMs: number | null;
  constructor(code: LiveErrorCode, message: string, retryAfterMs: number | null = null) {
    super(message);
    this.code = code;
    this.retryAfterMs = retryAfterMs;
  }
}

function apiKey(): string {
  const key = process.env["FOOTBALL_API_KEY"];
  if (!key) throw new ProviderError("NOT_CONFIGURED", "football provider key missing");
  return key;
}

async function call(path: string): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { "x-apisports-key": apiKey() },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    const aborted = error instanceof Error && error.name === "AbortError";
    throw new ProviderError(aborted ? "TIMEOUT" : "UPSTREAM_ERROR", "provider request failed");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    console.warn("[live] provider auth rejected", response.status);
    throw new ProviderError("UNAUTHORIZED", "provider rejected credentials");
  }
  if (response.status === 429) {
    const header = response.headers.get("retry-after");
    const retryAfterMs = header ? Number(header) * 1000 : null;
    console.warn("[live] provider rate limited");
    throw new ProviderError("RATE_LIMITED", "provider rate limited", retryAfterMs);
  }
  if (!response.ok) {
    console.warn("[live] provider status", response.status);
    throw new ProviderError("UPSTREAM_ERROR", "provider error");
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ProviderError("BAD_RESPONSE", "provider returned malformed JSON");
  }
  if (json === null || typeof json !== "object") {
    throw new ProviderError("BAD_RESPONSE", "provider returned unexpected shape");
  }
  const body = json as Record<string, unknown>;
  const errors = body["errors"];
  if (Array.isArray(errors) && errors.length > 0) {
    console.warn("[live] provider errors array");
    throw new ProviderError("UPSTREAM_ERROR", "provider reported an error");
  }
  if (errors !== null && typeof errors === "object" && !Array.isArray(errors)) {
    const values = Object.values(errors as Record<string, unknown>);
    if (values.length > 0) {
      const text = String(values[0] ?? "");
      if (/token|key|subscri/i.test(text)) {
        throw new ProviderError("UNAUTHORIZED", "provider rejected credentials");
      }
      if (/limit|requests/i.test(text)) {
        throw new ProviderError("RATE_LIMITED", "provider rate limited");
      }
      throw new ProviderError("UPSTREAM_ERROR", "provider reported an error");
    }
  }
  return body;
}

/* ---------- defensive readers ---------- */

const obj = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
};
const num = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const LIVE_CODES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "INT", "LIVE"]);
const FINISHED_CODES = new Set(["FT", "AET", "PEN"]);

function statusOf(short: string | null): MatchStatus {
  if (!short) return "UNKNOWN";
  if (LIVE_CODES.has(short)) return "LIVE";
  if (FINISHED_CODES.has(short)) return "FINISHED";
  if (short === "NS" || short === "TBD") return "SCHEDULED";
  if (short === "PST") return "POSTPONED";
  if (short === "CANC" || short === "ABD" || short === "AWD" || short === "WO") return "CANCELLED";
  return "UNKNOWN";
}

function eventTypeOf(type: string | null, detail: string | null): MatchEventType {
  const t = (type ?? "").toLowerCase();
  const d = (detail ?? "").toLowerCase();
  if (t === "goal") {
    if (d.includes("own goal")) return "own_goal";
    if (d.includes("penalty")) return "penalty";
    return "goal";
  }
  if (t === "card") {
    if (d.includes("red")) return "red_card";
    if (d.includes("yellow")) return "yellow_card";
    return "other";
  }
  if (t === "subst") return "substitution";
  if (t === "var") return "var";
  return "other";
}

function toFixture(raw: unknown): FixtureInfo | null {
  const root = obj(raw);
  if (!root) return null;
  const fixture = obj(root["fixture"]);
  const teams = obj(root["teams"]);
  const goals = obj(root["goals"]);
  const league = obj(root["league"]);
  const id = str(fixture?.["id"]);
  const home = obj(teams?.["home"]);
  const away = obj(teams?.["away"]);
  const homeTeam = str(home?.["name"]);
  const awayTeam = str(away?.["name"]);
  const kickoff = str(fixture?.["date"]);
  if (!id || !homeTeam || !awayTeam || !kickoff) return null;
  const kickoffMs = Date.parse(kickoff);
  if (Number.isNaN(kickoffMs)) return null;

  const statusObj = obj(fixture?.["status"]);
  const events: MatchEvent[] = arr(root["events"])
    .map((item, index): MatchEvent | null => {
      const event = obj(item);
      if (!event) return null;
      const time = obj(event["time"]);
      const player = obj(event["player"]);
      const team = obj(event["team"]);
      return {
        id: `${id}-${index}`,
        minute: num(time?.["elapsed"]),
        addedMinute: num(time?.["extra"]),
        type: eventTypeOf(str(event["type"]), str(event["detail"])),
        playerName: str(player?.["name"]),
        teamName: str(team?.["name"]),
      };
    })
    .filter((event): event is MatchEvent => event !== null);

  return {
    id,
    homeTeam,
    awayTeam,
    homeTeamId: str(home?.["id"]),
    awayTeamId: str(away?.["id"]),
    kickoffUtc: new Date(kickoffMs).toISOString(),
    status: statusOf(str(statusObj?.["short"])),
    score: { home: num(goals?.["home"]), away: num(goals?.["away"]) },
    minute: num(statusObj?.["elapsed"]),
    competition: str(league?.["name"]),
    events,
  };
}

/* ---------- provider queries (each cached + de-duplicated) ---------- */

interface ResolvedPlayer {
  id: string;
  name: string;
  teamId: string | null;
  teamName: string | null;
}

async function resolvePlayer(latinName: string): Promise<ResolvedPlayer | null> {
  const key = `pl:${latinName.toLowerCase()}`;
  return cached<ResolvedPlayer | null>(key, TTL.playerResolve, async () => {
    const season = new Date().getUTCFullYear() - (new Date().getUTCMonth() < 6 ? 1 : 0);
    const body = await call(
      `/players?search=${encodeURIComponent(latinName)}&season=${season}`,
    );
    const first = obj(arr(body["response"])[0]);
    if (!first) return null;
    const player = obj(first["player"]);
    const id = str(player?.["id"]);
    const name = str(player?.["name"]);
    if (!id || !name) return null;
    const stats = obj(arr(first["statistics"])[0]);
    const team = obj(stats?.["team"]);
    return { id, name, teamId: str(team?.["id"]), teamName: str(team?.["name"]) };
  });
}

/** All live fixtures once, shared by every player card (team-level dedupe). */
async function liveFixtureForTeam(teamId: string): Promise<FixtureInfo | null> {
  const list = await cached<FixtureInfo[]>("live:all", TTL.liveList, async () => {
    const body = await call(`/fixtures?live=all`);
    return arr(body["response"])
      .map(toFixture)
      .filter((fixture): fixture is FixtureInfo => fixture !== null);
  });
  const match = list.find(
    (fixture) => fixture.homeTeamId === teamId || fixture.awayTeamId === teamId,
  );
  if (!match) return null;
  // Detail call adds events + lineups for participation.
  return cached<FixtureInfo | null>(`fx:${match.id}`, TTL.liveFixture, async () => {
    const body = await call(`/fixtures?id=${encodeURIComponent(match.id)}`);
    return toFixture(arr(body["response"])[0]) ?? match;
  });
}

async function participationFor(
  fixtureId: string,
  playerId: string,
  fixture: FixtureInfo,
): Promise<PlayerMatchStatus> {
  const raw = await cached<Record<string, unknown>>(`lu:${fixtureId}`, TTL.liveFixture, () =>
    call(`/fixtures/lineups?fixture=${encodeURIComponent(fixtureId)}`),
  );
  const teams = arr(raw["response"]);
  if (teams.length === 0) return "UNKNOWN";

  let inStart = false;
  let onBench = false;
  for (const team of teams) {
    const node = obj(team);
    for (const entry of arr(node?.["startXI"])) {
      const player = obj(obj(entry)?.["player"]);
      if (str(player?.["id"]) === playerId) inStart = true;
    }
    for (const entry of arr(node?.["substitutes"])) {
      const player = obj(obj(entry)?.["player"]);
      if (str(player?.["id"]) === playerId) onBench = true;
    }
  }
  if (!inStart && !onBench) return "NOT_IN_SQUAD";

  const subEvents = fixture.events.filter((event) => event.type === "substitution");
  // Provider names the incoming player in `playerName` for substitutions; we can
  // only match by name, so treat it as a soft signal and never invent a status.
  const nameHit = subEvents.length > 0;
  if (inStart) return nameHit ? "PLAYING" : "PLAYING";
  return onBench ? "SUBSTITUTE" : "UNKNOWN";
}

async function nextFixtureForTeam(teamId: string): Promise<FixtureInfo | null> {
  return cached<FixtureInfo | null>(`next:${teamId}`, TTL.nextFixture, async () => {
    const body = await call(`/fixtures?team=${encodeURIComponent(teamId)}&next=1`);
    return toFixture(arr(body["response"])[0]);
  });
}

async function lastFixtureForTeam(teamId: string): Promise<FixtureInfo | null> {
  return cached<FixtureInfo | null>(`last:${teamId}`, TTL.lastFixture, async () => {
    const body = await call(`/fixtures?team=${encodeURIComponent(teamId)}&last=1`);
    return toFixture(arr(body["response"])[0]);
  });
}

/** Main entry: normalized live info for one player (by Latin name + club hint). */
export async function playerLiveInfo(input: {
  latinName: string;
  displayName: string;
  club: string | null;
}): Promise<PlayerLiveInfo> {
  const resolved = await resolvePlayer(input.latinName);
  if (!resolved) throw new ProviderError("NOT_FOUND", "player not found at provider");

  const club = resolved.teamName ?? input.club ?? "—";
  const teamId = resolved.teamId;

  const base: PlayerLiveInfo = {
    playerId: resolved.id,
    playerName: input.displayName,
    currentClub: club,
    currentClubId: teamId,
    activeFixture: null,
    nextFixture: null,
    lastFixture: null,
    playerMatchStatus: "UNKNOWN",
    fetchedAtUtc: new Date().toISOString(),
    source: SOURCE,
  };

  if (!teamId) return base;

  const active = await liveFixtureForTeam(teamId);
  if (active) {
    let status: PlayerMatchStatus = "UNKNOWN";
    try {
      status = await participationFor(active.id, resolved.id, active);
    } catch {
      status = "UNKNOWN";
    }
    return { ...base, activeFixture: active, playerMatchStatus: status };
  }

  const [next, last] = await Promise.all([
    nextFixtureForTeam(teamId).catch(() => null),
    lastFixtureForTeam(teamId).catch(() => null),
  ]);

  return { ...base, nextFixture: next, lastFixture: last };
}
