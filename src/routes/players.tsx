import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { StadiumBackground } from "@/components/football/StadiumBackground";
import { PlayerProfileOverlay } from "@/components/football/PlayerProfileOverlay";
import { verifyPlayerClub } from "@/lib/club.functions";
import { getPlayerProfile } from "@/lib/football.functions";
import { ROSTER } from "@/lib/football/roster";
import { relativeTime } from "@/lib/football/format";
import type { ClubVerification } from "@/lib/football/club-types";
import type { PlayerSeed } from "@/lib/football/types";

const URL = "https://bubble-sphere-football.lovable.app/players";
const TITLE = "صالة اللاعبين — النادي الحالي اليوم | فقاعات كرة القدم";
const DESCRIPTION =
  "صالة لاعبي كرة القدم مع ناديهم الحالي بتاريخ اليوم، مُثبتًا بأحدث الأخبار وتشكيلات الفرق مع مصدر كل خبر.";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PlayersPage,
});

const PARALLEL = 4;
let running = 0;
const waiting: (() => void)[] = [];
async function limited<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= PARALLEL) await new Promise<void>((r) => waiting.push(r));
  running++;
  try { return await fn(); } finally { running--; waiting.shift()?.(); }
}

function seedOf(p: { latinName: string; displayName: string }): PlayerSeed {
  return {
    id: p.latinName, displayName: p.displayName, latinName: p.latinName, club: null, nationality: null,
    position: null, fame: "known", reason: null, image: null, imageSource: null, imageKind: "fallback", hasNews: false,
  };
}

function PlayersPage() {
  const [filter, setFilter] = useState("");
  const [active, setActive] = useState<PlayerSeed | null>(null);

  const checks = useQueries({
    queries: ROSTER.map((p) => ({
      queryKey: ["hall-club", p.latinName],
      staleTime: 30 * 60 * 1000,
      retry: 0,
      refetchOnWindowFocus: false,
      queryFn: async (): Promise<ClubVerification> => {
        try {
          return await limited(() => verifyPlayerClub({ data: { latinName: p.latinName, club: null, nationality: null, birthDate: null } }));
        } catch {
          return { status: "unavailable" };
        }
      },
    })),
  });

  const list = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return ROSTER.map((p, i) => ({ p, c: checks[i]! })).filter(
      ({ p }) => !f || p.displayName.includes(f) || p.latinName.toLowerCase().includes(f),
    );
  }, [filter, checks]);

  const profile = useQuery({
    queryKey: ["profile", active?.latinName],
    enabled: active !== null,
    staleTime: 10 * 60 * 1000,
    retry: 0,
    queryFn: () => getPlayerProfile({ data: { latinName: active!.latinName, displayName: active!.displayName, refresh: false } }),
  });
  const refresh = useMutation({
    mutationFn: () => getPlayerProfile({ data: { latinName: active!.latinName, displayName: active!.displayName, refresh: true } }),
    onSuccess: () => { void profile.refetch(); toast.success("تم تحديث المعلومات."); },
    onError: () => toast.error("تعذّر تحديث المعلومات الآن."),
  });

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden px-4 py-10">
      <StadiumBackground />
      <div className="relative mx-auto max-w-4xl space-y-6">
        <header className="glass-card space-y-3 px-5 py-6 leading-relaxed">
          <h1 className="font-display text-2xl font-semibold text-foreground">صالة اللاعبين</h1>
          <p className="text-sm text-muted-foreground">
            النادي الحالي لكل لاعب بتاريخ اليوم. نبحث أولًا عن أخبار الانتقال والإعلانات الرسمية، ثم نتأكد من ظهور
            اللاعب في تشكيلة ذلك النادي في الأخبار الحديثة. لا نعرض ناديًا بلا دليل.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="glass-panel flex min-w-0 flex-1 items-center gap-2 rounded-full px-4 py-2">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="ابحث عن لاعب في الصالة"
                aria-label="تصفية اللاعبين"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
              />
            </label>
            <Link to="/" className="glass-panel rounded-full px-4 py-2 text-sm text-foreground">
              الفقاعات
            </Link>
          </div>
        </header>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map(({ p, c }) => (
            <li key={p.latinName}>
              <PlayerCard name={p.displayName} latin={p.latinName} check={c.data} loading={c.isFetching}
                onOpen={() => setActive(seedOf(p))} />
            </li>
          ))}
        </ul>
      </div>

      {active && (
        <PlayerProfileOverlay
          seed={active}
          profile={profile.data ?? null}
          loading={profile.isFetching}
          failed={profile.isError}
          refreshing={refresh.isPending}
          onRefresh={() => refresh.mutate()}
          onClose={() => setActive(null)}
        />
      )}
    </main>
  );
}

const BADGE = {
  confirmed_today: "مؤكد اليوم",
  likely: "مرجّح",
  none: "لم يُتحقق اليوم",
} as const;

function PlayerCard({ name, latin, check, loading, onOpen }: {
  name: string; latin: string; check: ClubVerification | undefined; loading: boolean; onOpen: () => void;
}) {
  const ok = check && check.status !== "unavailable" && check.status !== "conflict" ? check : null;
  const proof = ok?.proof ?? "none";
  const evidence = check && check.status !== "unavailable" ? (check.evidence ?? []) : [];
  return (
    <article className="glass-card h-full px-4 py-4">
      <button type="button" onClick={onOpen} className="block w-full text-start focus-visible:outline-none">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display truncate text-base font-semibold text-foreground">{name}</h2>
          <span className="truncate text-[11px] text-muted-foreground" style={{ direction: "ltr" }}>{latin}</span>
        </div>
        <p className="mt-1 text-sm text-silver">
          {ok ? ok.name : loading || !check ? "جارٍ التحقق من النادي…" : "لم يُتحقق اليوم"}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-accent/90" aria-hidden />
          <span>{check ? BADGE[ok ? proof : "none"] : "…"}</span>
          {ok && <><span aria-hidden>·</span><span>{relativeTime(ok.verifiedAt)}</span></>}
        </p>
      </button>
      {evidence.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-2">
          {evidence.slice(0, 3).map((e) => (
            <li key={e.url}>
              <a href={e.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                <span className="line-clamp-2">{e.title} — {e.source}{e.publishedAt ? ` · ${relativeTime(e.publishedAt)}` : ""}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
