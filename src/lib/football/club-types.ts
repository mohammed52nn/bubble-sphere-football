export type ClubVerification =
  | { status: "unavailable" }
  | {
      status: "confirmed" | "changed" | "conflict";
      name: string;
      teamId: string | null;
      logo: string | null;
      source: string;
      verifiedAt: string;
      confidence: "high" | "medium";
      previousClub: string | null;
      changed: boolean;
    };
