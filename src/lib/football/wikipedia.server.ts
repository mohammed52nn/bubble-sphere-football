import { cached } from "./cache.server";

interface Summary {
  title?: string;
  extract?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
  type?: string;
}

const UA = "FootballBubbles/1.0 (educational app)";

async function summary(lang: "ar" | "en", title: string): Promise<Summary | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`,
      { headers: { "User-Agent": UA, Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Summary;
    if (data.type === "disambiguation") return null;
    return data;
  } catch {
    return null;
  }
}

async function searchTitle(lang: "ar" | "en", query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&origin=*&srsearch=${encodeURIComponent(query)}`,
      { headers: { "User-Agent": UA } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { query?: { search?: { title?: string }[] } };
    return data.query?.search?.[0]?.title ?? null;
  } catch {
    return null;
  }
}

export interface WikiPortrait {
  image: string | null;
  imageSource: string | null;
  bio: string | null;
  pageUrl: string | null;
}

/**
 * Real-photo resolution ladder: exact page (en) -> exact page (ar) ->
 * search (en "<name> footballer") -> search (ar). Never returns a broken URL.
 */
export async function resolvePortrait(latinName: string, arabicName: string): Promise<WikiPortrait> {
  const key = `wiki:${latinName}|${arabicName}`;
  return cached<WikiPortrait>(key, 12 * 60 * 60 * 1000, async () => {
    const attempts: Array<() => Promise<Summary | null>> = [
      () => summary("en", latinName),
      () => summary("ar", arabicName),
      async () => {
        const t = await searchTitle("en", `${latinName} footballer`);
        return t ? summary("en", t) : null;
      },
      async () => {
        const t = await searchTitle("ar", `${arabicName} لاعب كرة قدم`);
        return t ? summary("ar", t) : null;
      },
    ];

    let bio: string | null = null;
    let pageUrl: string | null = null;

    for (const attempt of attempts) {
      const data = await attempt();
      if (!data) continue;
      bio = bio ?? (data.extract?.trim() || null);
      pageUrl = pageUrl ?? (data.content_urls?.desktop?.page ?? null);
      const image = data.originalimage?.source ?? data.thumbnail?.source ?? null;
      if (image) {
        return {
          image: image.replace(/\/\d+px-/, "/640px-"),
          imageSource: data.content_urls?.desktop?.page ?? `https://wikipedia.org`,
          bio,
          pageUrl,
        };
      }
    }
    return { image: null, imageSource: null, bio, pageUrl };
  });
}
