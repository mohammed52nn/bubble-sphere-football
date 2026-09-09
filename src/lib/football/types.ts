export type Fame = "global" | "known" | "emerging" | "unknown";

export interface PlayerSeed {
  id: string;
  displayName: string; // Arabic display name
  latinName: string; // English/Latin name
  club: string | null;
  nationality: string | null;
  position: string | null;
  fame: Fame;
  reason: string | null;
  image: string | null;
  imageSource: string | null;
  imageKind: "photo" | "fallback";
  hasNews: boolean;
}

export interface CareerStep {
  period: string;
  club: string;
  note: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sourceUrl: string;
  publishedAt: string | null;
  summary: string | null;
  relevance: number;
  reliability: number;
}

export interface PlayerProfile {
  id: string;
  fullName: string | null;
  displayName: string;
  latinName: string;
  nationality: string | null;
  birthDate: string | null;
  age: number | null;
  club: string | null;
  position: string | null;
  preferredFoot: string | null;
  shirtNumber: string | null;
  height: string | null;
  marketValue: string | null;
  rating: string | null;
  bio: string | null;
  career: CareerStep[];
  achievements: string[];
  stats: { label: string; value: string }[];
  image: string | null;
  imageSource: string | null;
  imageKind: "photo" | "fallback";
  news: NewsItem[];
  sources: { label: string; url: string }[];
  confidence: number;
  aiStatus: "not_requested" | "enhanced" | "unavailable";
  lastUpdated: string;
}

export interface DiscoveryResult {
  players: PlayerSeed[];
  interpretation: string | null;
  degraded: boolean;
}

export const UNAVAILABLE = "غير متوفر من مصدر موثوق.";
