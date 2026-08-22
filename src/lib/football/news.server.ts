import { cached } from "./cache.server";

const UA = "Mozilla/5.0 (compatible; FootballBubbles/1.0)";

export interface RawArticle {
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
}

function decode(text: string) {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function pick(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? decode(match[1]) : null;
}

async function googleNews(query: string, lang: "ar" | "en"): Promise<RawArticle[]> {
  const params =
    lang === "ar" ? "hl=ar&gl=EG&ceid=EG:ar" : "hl=en-GB&gl=GB&ceid=GB:en";
  const res = await fetch(
    `https://news.google.com/rss/search?q=${encodeURIComponent(`"${query}"`)}&${params}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.split("<item>").slice(1, 16);
  return items
    .map((block) => {
      const title = pick(block, "title");
      const link = pick(block, "link");
      const source = pick(block, "source") ?? (link ? new URL(link).hostname : null);
      const date = pick(block, "pubDate");
      if (!title || !link || !source) return null;
      return {
        title: title.replace(/\s+-\s+[^-]+$/, "").trim(),
        source,
        sourceUrl: link,
        publishedAt: date ? new Date(date).toISOString() : null,
      } satisfies RawArticle;
    })
    .filter((item): item is RawArticle => item !== null);
}

async function gdelt(query: string): Promise<RawArticle[]> {
  const res = await fetch(
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`"${query}"`)}&mode=artlist&maxrecords=10&format=json&sort=datedesc`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    articles?: { title?: string; url?: string; domain?: string; seendate?: string }[];
  };
  return (data.articles ?? [])
    .map((article) => {
      if (!article.title || !article.url) return null;
      const stamp = article.seendate?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
      return {
        title: article.title,
        source: article.domain ?? new URL(article.url).hostname,
        sourceUrl: article.url,
        publishedAt: stamp
          ? `${stamp[1]}-${stamp[2]}-${stamp[3]}T${stamp[4]}:${stamp[5]}:${stamp[6]}Z`
          : null,
      } satisfies RawArticle;
    })
    .filter((item): item is RawArticle => item !== null);
}

/** Real headlines only — Google News (Arabic then English), GDELT as fallback. */
export async function fetchArticles(arabicName: string, latinName: string): Promise<RawArticle[]> {
  return cached<RawArticle[]>(`news:${latinName}`, 15 * 60 * 1000, async () => {
    const results = await Promise.allSettled([
      googleNews(arabicName, "ar"),
      googleNews(latinName, "en"),
    ]);
    let articles = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    if (articles.length === 0) {
      articles = await gdelt(latinName).catch(() => []);
    }
    const seen = new Set<string>();
    return articles
      .filter((a) => {
        const key = a.title.slice(0, 40);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
      .slice(0, 12);
  });
}

/** Cheap freshness probe used for the "جديد" badge. */
export async function hasFreshNews(latinName: string): Promise<boolean> {
  return cached<boolean>(`fresh:${latinName}`, 30 * 60 * 1000, async () => {
    try {
      const articles = await gdelt(latinName);
      const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
      return articles.some((a) => a.publishedAt && Date.parse(a.publishedAt) > cutoff);
    } catch {
      return false;
    }
  });
}
