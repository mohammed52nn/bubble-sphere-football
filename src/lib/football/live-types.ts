/** Client-safe normalized live match model (provider-agnostic). */

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "UNKNOWN";

export type PlayerMatchStatus =
  | "PLAYING"
  | "SUBBED_ON"
  | "SUBBED_OFF"
  | "SUBSTITUTE"
  | "NOT_IN_SQUAD"
  | "INJURED"
  | "SUSPENDED"
  | "UNKNOWN";

export type MatchEventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "penalty"
  | "own_goal"
  | "var"
  | "other";

export interface MatchEvent {
  id: string;
  minute: number | null;
  addedMinute?: number | null;
  type: MatchEventType;
  playerName?: string | null;
  teamName?: string | null;
}

export interface Score {
  home: number | null;
  away: number | null;
}

export interface FixtureInfo {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  kickoffUtc: string;
  status: MatchStatus;
  score: Score;
  minute?: number | null;
  competition?: string | null;
  events: MatchEvent[];
}

export interface PlayerLiveInfo {
  playerId: string;
  playerName: string;
  currentClub: string;
  currentClubId?: string | null;
  activeFixture: FixtureInfo | null;
  nextFixture: FixtureInfo | null;
  lastFixture: FixtureInfo | null;
  playerMatchStatus: PlayerMatchStatus;
  fetchedAtUtc: string;
  source?: string;
}

export type LiveErrorCode =
  | "NOT_CONFIGURED"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "TIMEOUT"
  | "BAD_RESPONSE"
  | "NOT_FOUND";

export interface LiveOk {
  ok: true;
  data: PlayerLiveInfo;
  fetchedAtUtc: string;
}

export interface LiveErr {
  ok: false;
  error: { code: LiveErrorCode; message: string; retryAfterMs?: number | null };
  fetchedAtUtc: string;
}

export type LiveResponse = LiveOk | LiveErr;

/** Arabic user-facing message per error category. */
export const LIVE_ERROR_TEXT: Record<LiveErrorCode, string> = {
  NOT_CONFIGURED: "بيانات المباريات المباشرة غير مُهيّأة بعد.",
  UNAUTHORIZED: "خطأ في إعداد بيانات المباشر.",
  RATE_LIMITED: "بيانات المباشر محدودة مؤقتًا، سنعيد المحاولة لاحقًا.",
  UPSTREAM_ERROR: "بيانات المباشر غير متوفرة الآن.",
  TIMEOUT: "انتهت مهلة تحديث المباشر، سنعيد المحاولة.",
  BAD_RESPONSE: "بيانات المباشر غير متوفرة الآن.",
  NOT_FOUND: "لا توجد بيانات مباريات لهذا اللاعب.",
};

/** Codes that must never be retried in a loop. */
export const NON_RETRYABLE: LiveErrorCode[] = ["NOT_CONFIGURED", "UNAUTHORIZED", "NOT_FOUND"];

export const PLAYER_STATUS_TEXT: Record<PlayerMatchStatus, string> = {
  PLAYING: "يلعب الآن",
  SUBBED_ON: "دخل بديلًا",
  SUBBED_OFF: "خرج مستبدلًا",
  SUBSTITUTE: "على مقاعد البدلاء",
  NOT_IN_SQUAD: "خارج قائمة المباراة",
  INJURED: "مصاب",
  SUSPENDED: "موقوف",
  UNKNOWN: "حالة اللاعب غير متوفرة",
};
