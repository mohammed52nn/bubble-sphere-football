import { AiUnavailableError, NO_HALLUCINATION_RULES, researchJson } from "./ai.server";
import { cacheDrop, cached } from "./cache.server";
import { fetchArticles, hasFreshNews } from "./news.server";
import { resolvePortrait } from "./wikipedia.server";
import type { DiscoveryResult, NewsItem, PlayerProfile, PlayerSeed } from "./types";

const str = { type: "string" } as const;

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

const discoverySchema = {
  type: "object",
  additionalProperties: false,
  required: ["interpretation", "players"],
  properties: {
    interpretation: str,
    players: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["displayName", "latinName", "club", "nationality", "position", "fame", "reason"],
        properties: {
          displayName: str,
          latinName: str,
          club: str,
          nationality: str,
          position: str,
          fame: { type: "string", enum: ["global", "known", "emerging", "unknown"] },
          reason: str,
        },
      },
    },
  },
} as const;

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
  const [portrait, fresh] = await Promise.all([
    resolvePortrait(latinName, displayName).catch(() => null),
    hasFreshNews(latinName).catch(() => false),
  ]);
  return {
    id: slug(latinName),
    displayName,
    latinName,
    club: clean(raw.club),
    nationality: clean(raw.nationality),
    position: clean(raw.position),
    fame: raw.fame ?? "known",
    reason: clean(raw.reason),
    image: portrait?.image ?? null,
    imageSource: portrait?.imageSource ?? null,
    imageKind: portrait?.image ? "photo" : "fallback",
    hasNews: fresh,
  };
}

export async function discover(query: string | null, exclude: string[]): Promise<DiscoveryResult> {
  const key = `discover:${query ?? "__home__"}:${exclude.slice(0, 12).sort().join(",")}`;
  return cached<DiscoveryResult>(key, query ? 20 * 60 * 1000 : 10 * 60 * 1000, async () => {
    const user = query
      ? [
          `استعلام المستخدم: "${query}"`,
          "افهم المقصود (قد يكون اسم لاعب، لاعب + نادٍ، دوري، جنسية، أو سؤال طبيعي).",
          "أعد 7 لاعبين حقيقيين مرتبطين بالاستعلام. إذا كان الاستعلام عن لاعب محدد فاجعله الأول ثم لاعبين مرتبطين به (نفس النادي/المنتخب/المركز).",
        ].join("\n")
      : [
          "أنشئ مجموعة اكتشاف من 7 لاعبين حقيقيين نشطين حاليًا، متنوعين في الدوريات والجنسيات والمراكز.",
          "التوزيع المستهدف: 2 عالميون جدًا، 2 متوسطو الشهرة، 2 صاعدون، 1 أقل شهرة.",
        ].join("\n");

    const excludeNote = exclude.length
      ? `\nتجنّب تكرار هؤلاء اللاعبين: ${exclude.slice(0, 20).join(", ")}.`
      : "";

    const data = await researchJson<DiscoveryRaw>({
      system: `${NO_HALLUCINATION_RULES} أعد لاعبين حقيقيين فقط بأسمائهم الصحيحة.`,
      user: `${user}${excludeNote}\nحقل interpretation: جملة عربية قصيرة تشرح كيف فهمت الاستعلام.`,
      schemaName: "discovery",
      schema: discoverySchema,
    });

    const seeds = (
      await Promise.all((data.players ?? []).slice(0, 8).map((player) => enrich(player)))
    ).filter((seed): seed is PlayerSeed => seed !== null);

    const unique = new Map<string, PlayerSeed>();
    for (const seed of seeds) if (!unique.has(seed.id)) unique.set(seed.id, seed);

    return {
      players: [...unique.values()].slice(0, 8),
      interpretation: clean(data.interpretation),
      degraded: false,
    };
  });
}

const profileSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "fullName",
    "displayName",
    "latinName",
    "nationality",
    "birthDate",
    "club",
    "position",
    "preferredFoot",
    "shirtNumber",
    "height",
    "marketValue",
    "rating",
    "career",
    "achievements",
    "stats",
    "confidence",
  ],
  properties: {
    fullName: str,
    displayName: str,
    latinName: str,
    nationality: str,
    birthDate: str,
    club: str,
    position: str,
    preferredFoot: str,
    shirtNumber: str,
    height: str,
    marketValue: str,
    rating: str,
    confidence: { type: "number" },
    career: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["period", "club", "note"],
        properties: { period: str, club: str, note: str },
      },
    },
    achievements: { type: "array", items: str },
    stats: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: { label: str, value: str },
      },
    },
  },
} as const;

const newsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "summary", "relevance", "reliability"],
        properties: {
          index: { type: "number" },
          summary: str,
          relevance: { type: "number" },
          reliability: { type: "number" },
        },
      },
    },
  },
} as const;

async function buildNews(arabicName: string, latinName: string): Promise<NewsItem[]> {
  const articles = await fetchArticles(arabicName, latinName).catch(() => []);
  if (articles.length === 0) return [];

  let enriched: { index: number; summary: string; relevance: number; reliability: number }[] = [];
  try {
    const data = await researchJson<{ items?: typeof enriched }>({
      system: `${NO_HALLUCINATION_RULES} لا تلخّص إلا ما يظهر فعلًا في العنوان المعطى، ولا تضف تفاصيل غير موجودة. حافظ على صيغة "بحسب تقارير" إن كان العنوان تقريرًا أو شائعة.`,
      user: [
        `اللاعب: ${arabicName} (${latinName}).`,
        "أمامك عناوين أخبار حقيقية. لكل عنوان: اكتب ملخصًا عربيًا من سطر واحد لا يتجاوز معنى العنوان،",
        "وقيّم relevance (0-1) صلة الخبر باللاعب، و reliability (0-1) موثوقية المصدر.",
        "استبعد ما لا يتعلق باللاعب عبر relevance منخفض.",
        JSON.stringify(
          articles.map((article, index) => ({
            index,
            title: article.title,
            source: article.source,
            publishedAt: article.publishedAt,
          })),
        ),
      ].join("\n"),
      schemaName: "news_analysis",
      schema: newsSchema,
    });
    enriched = data.items ?? [];
  } catch {
    enriched = [];
  }

  const byIndex = new Map(enriched.map((item) => [item.index, item]));
  return articles
    .map((article, index) => {
      const meta = byIndex.get(index);
      return {
        id: `${slug(latinName)}-${index}`,
        title: article.title,
        source: article.source,
        sourceUrl: article.sourceUrl,
        publishedAt: article.publishedAt,
        summary: clean(meta?.summary),
        relevance: meta?.relevance ?? 0.5,
        reliability: meta?.reliability ?? 0.5,
      } satisfies NewsItem;
    })
    .filter((item) => item.relevance >= 0.35)
    .sort((a, b) => {
      const freshness =
        Date.parse(b.publishedAt ?? "0") / 1e11 - Date.parse(a.publishedAt ?? "0") / 1e11;
      return (
        freshness * 0.6 +
        (b.relevance - a.relevance) * 0.25 +
        (b.reliability - a.reliability) * 0.15
      );
    })
    .slice(0, 8);
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
  if (args.refresh) cacheDrop(key);
  if (args.refresh) cacheDrop(`news:${args.latinName}`);

  return cached<PlayerProfile>(key, 30 * 60 * 1000, async () => {
    const [portraitResult, aiResult, newsResult] = await Promise.allSettled([
      resolvePortrait(args.latinName, args.displayName),
      researchJson<Record<string, unknown>>({
        system: `${NO_HALLUCINATION_RULES} املأ الحقول المؤكدة فقط، واترك الباقي "".`,
        user: [
          `ابنِ ملفًا للاعب: ${args.displayName} (${args.latinName}).`,
          "career: أهم 5 محطات. achievements: أهم 6 إنجازات حقيقية. stats: 4 أرقام موثوقة (مثل المباريات/الأهداف).",
          "confidence: رقم بين 0 و 1 يمثل ثقتك بدقة الملف.",
          "القيمة السوقية والتقييم: اتركهما \"\" إن لم تكن واثقًا.",
        ].join("\n"),
        schemaName: "player_profile",
        schema: profileSchema,
      }),
      buildNews(args.displayName, args.latinName),
    ]);

    if (aiResult.status === "rejected" && portraitResult.status === "rejected") {
      throw new AiUnavailableError("research_failed");
    }

    const ai = (aiResult.status === "fulfilled" ? aiResult.value : {}) as Record<string, unknown>;
    const portrait = portraitResult.status === "fulfilled" ? portraitResult.value : null;
    const news = newsResult.status === "fulfilled" ? newsResult.value : [];
    const birthDate = clean(ai["birthDate"]);

    const sources: { label: string; url: string }[] = [];
    if (portrait?.pageUrl) sources.push({ label: "ويكيبيديا", url: portrait.pageUrl });

    return {
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
      bio: portrait?.bio ?? null,
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
      image: portrait?.image ?? null,
      imageSource: portrait?.imageSource ?? null,
      imageKind: portrait?.image ? "photo" : "fallback",
      news,
      sources,
      confidence:
        typeof ai["confidence"] === "number" ? Math.min(1, Math.max(0, ai["confidence"])) : 0.6,
      lastUpdated: new Date().toISOString(),
    };
  });
}
