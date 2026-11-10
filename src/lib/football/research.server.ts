import { engineSearch } from "./search-engine.server";
import { ROSTER } from "./roster";
import { packFor } from "./player-pack";
import { wikidataFacts } from "./wikidata-facts.server";
import { cacheGet, cacheSet, cached } from "./cache.server";
import { fetchArticles } from "./news.server";
import { resolvePortrait } from "./wikipedia.server";
import type { DiscoveryResult, NewsItem, PlayerProfile, PlayerSeed } from "./types";



function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || /^(غير متوفر|unknown|n\/a|null|-)$/i.test(trimmed)) return null;
  return trimmed;
}

interface DiscoveryRaw {
  interpretation?: string;
  players?: {
    displayName?: string;
    latinName?: string;
    club?: string;
    nationality?: string;
    position?: string;
    fame?: PlayerSeed["fame"];
    reason?: string;
  }[];
}

async function enrich(raw: NonNullable<DiscoveryRaw["players"]>[number]): Promise<PlayerSeed | null> {
  const latinName = clean(raw.latinName);
  const displayName = clean(raw.displayName) ?? latinName;
  if (!latinName || !displayName) return null;
  const portrait = await resolvePortrait(latinName, displayName).catch(() => null);
  const pack = packFor(latinName);
  return {
    id: slug(latinName),
    displayName,
    latinName,
    club: clean(raw.club),
    nationality: clean(raw.nationality) ?? pack?.nationality ?? null,
    position: clean(raw.position) ?? pack?.position ?? null,
    fame: raw.fame ?? "known",
    reason: clean(raw.reason),
    image: portrait?.image ?? null,
    imageSource: portrait?.imageSource ?? null,
    imageKind: portrait?.image ? "photo" : "fallback",
    hasNews: false,
  };
}

/** AI unavailable (e.g. no credits): real players from the fixed roster, no invented clubs. */
async function rosterFallback(query: string | null, exclude: string[]): Promise<DiscoveryResult> {
  const q = query?.trim().toLowerCase() ?? "";
  const skip = new Set(exclude);
  let pool = ROSTER.filter((p) => !skip.has(slug(p.latinName)));
  if (q) pool = pool.filter((p) => p.latinName.toLowerCase().includes(q) || p.displayName.includes(q));
  pool = [...pool].sort(() => Math.random() - 0.5).slice(0, 8);
  const seeds = await Promise.all(
    pool.map((p) =>
      enrich({ latinName: p.latinName, displayName: p.displayName, fame: "known" } as never),
    ),
  );
  return {
    players: seeds.filter((s): s is PlayerSeed => s !== null),
    interpretation: null,
    degraded: true,
  };
}

export async function discover(query: string | null, exclude: string[]): Promise<DiscoveryResult> {
  if (!query?.trim()) return rosterFallback(null, exclude);
  const result = await engineSearch(query).catch(() => null);
  if (result?.hits.length) {
    const skip = new Set(exclude);
    const seeds = await Promise.all(result.hits.filter(p => !skip.has(slug(p.latinName))).map(p => enrich(p)));
    return { players: seeds.filter((p): p is PlayerSeed => p !== null), interpretation: result.interpretation, degraded: false };
  }
  const fallback = await rosterFallback(query, exclude);
  return { ...fallback, interpretation: fallback.players.length ? "عرضنا اللاعبين المطابقين للاسم." : "لم نجد نتيجة مؤكدة لهذا البحث الآن؛ جرّب الاسم الكامل أو أعد المحاولة." };
}

async function buildNews(arabicName: string, latinName: string, refresh: boolean): Promise<NewsItem[]> {
  const articles = await fetchArticles(arabicName, latinName, refresh).catch(() => []);
  return articles.map((a, index) => ({ ...a, id: `${slug(latinName)}-${index}`, summary: null, relevance: 0.5, reliability: 0.5 }));
}

function ageFrom(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const time = Date.parse(birthDate);
  if (Number.isNaN(time)) return null;
  const age = Math.floor((Date.now() - time) / (365.25 * 24 * 3600 * 1000));
  return age > 12 && age < 70 ? age : null;
}

export async function profileFor(args: {
  latinName: string;
  displayName: string;
  refresh?: boolean;
}): Promise<PlayerProfile> {
  const key = `profile:${slug(args.latinName)}`;
  // Keep the last good profile: a failed refresh must never wipe known details.
  const previous = cacheGet<PlayerProfile>(`${key}:last`) ?? cacheGet<PlayerProfile>(key);

  return cached<PlayerProfile>(key, 30 * 60 * 1000, async () => {
    const pack = packFor(args.latinName);
    const [portrait, facts, news] = await Promise.all([
      resolvePortrait(args.latinName, args.displayName).catch(() => null),
      wikidataFacts(args.latinName, args.refresh).catch(() => null),
      buildNews(args.displayName, args.latinName, args.refresh === true),
    ]);
    const ai: Record<string, unknown> = {
      fullName: pack?.fullName ?? previous?.fullName,
      birthDate: facts?.birthDate ?? pack?.birthDate ?? previous?.birthDate,
      nationality: facts?.nationality ?? pack?.nationality ?? previous?.nationality,
      position: facts?.position ?? pack?.position ?? previous?.position,
      height: facts?.height ?? pack?.height ?? previous?.height,
      club: facts?.club ?? previous?.club,
      preferredFoot: facts?.foot ?? pack?.foot ?? previous?.preferredFoot,
      shirtNumber: facts?.shirtNumber ?? previous?.shirtNumber,
      bio: pack?.bio ?? portrait?.bio ?? previous?.bio,
      career: facts?.career.length ? facts.career : pack?.career ?? previous?.career,
      achievements: pack?.achievements.length ? pack.achievements : facts?.achievements.length ? facts.achievements : previous?.achievements,
      confidence: facts || pack ? 0.9 : previous?.confidence ?? 0.4,
    };
    const sources = [...(previous?.sources ?? [])];
    if (facts) sources.push({ label: "ويكي بيانات", url: `https://www.wikidata.org/wiki/${facts.qid}` });
    if (pack) sources.push({ label: "المعلومات الأساسية — ويكيبيديا", url: `https://en.wikipedia.org/wiki/${encodeURIComponent(args.latinName.replace(/ /g, '_'))}` });
    const birthDate = clean(ai["birthDate"]);

    if (portrait?.pageUrl) sources.push({ label: "ويكيبيديا", url: portrait.pageUrl });

    const result: PlayerProfile = {
      id: slug(args.latinName),
      fullName: clean(ai["fullName"]),
      displayName: clean(ai["displayName"]) ?? args.displayName,
      latinName: clean(ai["latinName"]) ?? args.latinName,
      nationality: clean(ai["nationality"]),
      birthDate,
      age: ageFrom(birthDate),
      club: clean(ai["club"]),
      position: clean(ai["position"]),
      preferredFoot: clean(ai["preferredFoot"]),
      shirtNumber: clean(ai["shirtNumber"]),
      height: clean(ai["height"]),
      marketValue: clean(ai["marketValue"]),
      rating: clean(ai["rating"]),
      // Arabic AI bio first; the Wikipedia summary is a fallback (may be English).
      bio: clean(ai["bio"]) ?? portrait?.bio ?? null,
      career: Array.isArray(ai["career"])
        ? (ai["career"] as { period?: string; club?: string; note?: string }[])
            .map((step) => ({
              period: clean(step.period) ?? "",
              club: clean(step.club) ?? "",
              note: clean(step.note),
            }))
            .filter((step) => step.club)
        : [],
      achievements: Array.isArray(ai["achievements"])
        ? (ai["achievements"] as unknown[])
            .map((item) => clean(item))
            .filter((item): item is string => item !== null)
        : [],
      stats: Array.isArray(ai["stats"])
        ? (ai["stats"] as { label?: string; value?: string }[])
            .map((stat) => ({ label: clean(stat.label) ?? "", value: clean(stat.value) ?? "" }))
            .filter((stat) => stat.label && stat.value)
        : [],
      image: portrait?.image ?? previous?.image ?? null,
      imageSource: portrait?.imageSource ?? previous?.imageSource ?? null,
      imageKind: portrait?.image || previous?.image ? "photo" : "fallback",
      news: news.length ? news : previous?.news ?? [],
      sources: [...new Map(sources.map(s => [s.url, s])).values()],
      confidence:
        typeof ai["confidence"] === "number" ? Math.min(1, Math.max(0, ai["confidence"])) : 0.6,
      lastUpdated: new Date().toISOString(),
    };
    cacheSet(`${key}:last`, result, 7 * 86400000);
    return result;
  }, args.refresh === true);
}
