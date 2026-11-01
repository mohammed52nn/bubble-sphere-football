import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { verifyPlayerClub } from "@/lib/club.functions";
import type { ClubVerification } from "@/lib/football/club-types";
import type { PlayerProfile } from "@/lib/football/types";

/** Developer-only: append ?debug=1 to the URL to see verification internals. */
export function isVerifyDebug() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
}

const UNAVAILABLE: ClubVerification = { status: "unavailable" };

function call(profile: PlayerProfile, deep: boolean) {
  return verifyPlayerClub({
    data: {
      latinName: profile.latinName,
      club: profile.club,
      nationality: profile.nationality,
      birthDate: profile.birthDate,
      debug: isVerifyDebug(),
      refresh: true,
      deep,
    },
  }).catch(() => UNAVAILABLE);
}

/** Background, fail-silent current-club check for every opened player. */
export function useCurrentClubVerification(profile: PlayerProfile | null) {
  const qc = useQueryClient();
  const [deepChecking, setDeepChecking] = useState(false);
  const queryKey = ["club-verify", profile?.latinName, profile?.birthDate, profile?.club, profile?.nationality];
  const query = useQuery({
    queryKey,
    enabled: !!profile,
    staleTime: 30 * 60 * 1000,
    refetchOnMount: "always",
    gcTime: 60 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    queryFn: () => (profile ? call(profile, false) : Promise.resolve(UNAVAILABLE)),
  });

  /** Manual refresh: wider live search (news, line-ups, official announcements); result replaces the shown one. */
  const deepCheck = useCallback(async (): Promise<ClubVerification> => {
    if (!profile) return UNAVAILABLE;
    setDeepChecking(true);
    try {
      const result = await call(profile, true);
      const prev = qc.getQueryData<ClubVerification>(queryKey);
      // Never replace a real verification with an empty one.
      if (result.status !== "unavailable" || !prev) qc.setQueryData(queryKey, result);
      return result.status === "unavailable" && prev ? prev : result;
    } finally {
      setDeepChecking(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, qc, ...queryKey]);

  return { ...query, deepCheck, deepChecking };
}
