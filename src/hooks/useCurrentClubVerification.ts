import { useQuery } from "@tanstack/react-query";
import { verifyPlayerClub } from "@/lib/club.functions";
import type { PlayerProfile } from "@/lib/football/types";

/** Background, fail-silent current-club check. Runs only after the profile has rendered. */
export function useCurrentClubVerification(profile: PlayerProfile | null) {
  return useQuery({
    queryKey: ["club-verify", profile?.latinName],
    enabled: !!profile,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        return await verifyPlayerClub({
          data: {
            latinName: profile!.latinName,
            club: profile!.club,
            nationality: profile!.nationality,
          },
        });
      } catch {
        return { status: "unavailable" as const };
      }
    },
  });
}
