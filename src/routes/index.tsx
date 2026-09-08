import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { StadiumBackground } from "@/components/football/StadiumBackground";
import { ResearchBox } from "@/components/football/ResearchBox";
import { BubbleField } from "@/components/football/BubbleField";
import { PlayerProfileOverlay } from "@/components/football/PlayerProfileOverlay";
import { SmartLoaderInline, SmartLoaderScreen } from "@/components/football/SmartLoader";
import { useBubbleField } from "@/hooks/useBubbleField";
import { useOnline } from "@/hooks/useSmartProgress";
import { discoverPlayers, getPlayerProfile } from "@/lib/football.functions";
import type { PlayerSeed } from "@/lib/football/types";


const TITLE = "فقاعات كرة القدم — اكتشف اللاعبين";
const DESCRIPTION =
  "تجربة عربية ذكية لاكتشاف عالم كرة القدم من خلال اللاعبين: فقاعات عائمة، ملفات موثوقة، وأخبار حديثة بمصادرها.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [active, setActive] = useState<PlayerSeed | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [capacity, setCapacity] = useState(6);

  useEffect(() => {
    const measure = () => setCapacity(window.innerWidth >= 768 ? 8 : 6);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const discovery = useQuery({
    queryKey: ["discover", query, refreshCount],
    queryFn: () => discoverPlayers({ data: { query: query || null, exclude: [] } }),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const paused = active !== null || typing;

  const needSeeds = useCallback(async () => {
    const result = await discoverPlayers({ data: { query: query || null, exclude: [] } });
    return result.players;
  }, [query]);

  const field = useBubbleField({ capacity, paused, onNeedSeeds: needSeeds });
  const { reset } = field;

  const players = discovery.data?.players;
  useEffect(() => {
    if (players && players.length > 0) reset(players);
  }, [players, reset]);

  useEffect(() => {
    if (discovery.isError) toast.error("تعذّر إتمام البحث. حاول مرة أخرى.");
  }, [discovery.isError]);

  const online = useOnline();
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    if (field.bubbles.length > 0) setBooted(true);
  }, [field.bubbles.length]);

  const bootDone = booted;
  const searching = !bootDone ? false : discovery.isFetching;


  const profile = useQuery({
    queryKey: ["profile", active?.latinName],
    enabled: active !== null,
    staleTime: 10 * 60 * 1000,
    retry: 0,
    queryFn: () =>
      getPlayerProfile({
        data: {
          latinName: active!.latinName,
          displayName: active!.displayName,
          refresh: false,
        },
      }),
  });

  const refresh = useMutation({
    mutationFn: () =>
      getPlayerProfile({
        data: {
          latinName: active!.latinName,
          displayName: active!.displayName,
          refresh: true,
        },
      }),
    onSuccess: () => {
      void profile.refetch();
      toast.success("تم تحديث المعلومات.");
    },
    onError: () => toast.error("تعذّر تحديث المعلومات الآن."),
  });

  const interpretation = useMemo(
    () => discovery.data?.interpretation ?? null,
    [discovery.data?.interpretation],
  );

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <StadiumBackground />

      <SmartLoaderScreen
        active={!bootDone}
        done={bootDone}
        offline={!online}
        failed={discovery.isError}
        onRetry={() => void discovery.refetch()}
      />

      <ResearchBox
        value={query}
        busy={discovery.isFetching}
        interpretation={interpretation}
        onSubmit={(next) => setQuery(next)}
        onClear={() => setQuery("")}
        onShuffle={() => setRefreshCount((count) => count + 1)}
        onFocusChange={setTyping}
      />

      <SmartLoaderInline active={searching} done={!discovery.isFetching} />

      <BubbleField
        bubbles={field.bubbles}
        layouts={field.layouts}
        loading={!bootDone || (field.bubbles.length === 0 && discovery.isFetching)}
        failed={discovery.isError}
        onOpen={setActive}
        onRetry={() => void discovery.refetch()}
      />


      <p className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-[11px] text-muted-foreground">
        اضغط على أي فقاعة لعرض ملف اللاعب — لن تتغير الفقاعات أثناء القراءة.
      </p>

      {active && (
        <PlayerProfileOverlay
          seed={active}
          profile={profile.data ?? null}
          loading={profile.isLoading}
          failed={profile.isError}
          refreshing={refresh.isPending}
          onRefresh={() => refresh.mutate()}
          onClose={() => setActive(null)}
        />
      )}
    </main>
  );
}
