import { useQuery } from "@tanstack/react-query";
import { verifyPlayerClub } from "@/lib/club.functions";
import type { PlayerProfile } from "@/lib/football/types";

/** Developer-only: append ?debug=1 to the URL to see verification internals. */
export function isVerifyDebug() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";
}

/** Background, fail-silent current-club check. Runs only after the profile has rendered. */
export function useCurrentClubVerification(profile: PlayerProfile | null) {
  return useQuery({
    queryKey: ["club-verify", profile?.latinName, profile?.birthDate, profile?.club, profile?.nationality],
    enabled: !!profile,
    staleTime: 30 * 60 * 1000,
    refetchOnMount: "always",
    gcTime: 60 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!profile) return { status: "unavailable" as const };
      try {
        return await verifyPlayerClub({
          data: {
            latinName: profile.latinName,
            club: profile.club,
            nationality: profile.nationality,
            birthDate: profile.birthDate,
            debug: isVerifyDebug(),
            refresh: true,
          },
        });
      } catch {
        return { status: "unavailable" as const };
      }
    },
  });
}
