export type VerificationState =
  | "AGREEMENT"
  | "VERIFIED"
  | "CONFLICT"
  | "UNVERIFIED"
  | "RECENT_CHANGE"
  | "STALE";

export type TransferState =
  | "PERMANENT"
  | "LOAN"
  | "RETURN_FROM_LOAN"
  | "FREE_AGENT"
  | "RETIRED"
  | "NEW_SIGNING"
  | "UNKNOWN";

export type ConfidenceLevel = "very_high" | "high" | "medium" | "low" | "unverified";

export interface VerificationDebug {
  playerIds: Record<string, string>;
  identityScore: number;
  primaryClub: string | null;
  sourcesChecked: { source: string; ok: boolean; club: string | null; note: string }[];
  reason: string;
  cache: "fresh" | "cached" | "stale";
}

export type ClubVerification =
  | { status: "unavailable"; debug?: VerificationDebug }
  | {
      status: "confirmed" | "changed" | "conflict";
      state: VerificationState;
      name: string;
      teamId: string | null;
      logo: string | null;
      source: string;
      verifiedAt: string;
      season: string;
      confidence: "high" | "medium";
      score: number;
      level: ConfidenceLevel;
      previousClub: string | null;
      changed: boolean;
      changeDetectedAt: string | null;
      transferState: TransferState;
      debug?: VerificationDebug;
    };
