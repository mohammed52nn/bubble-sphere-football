import type { PlayerSeed } from "./types";

/** Players that appeared in this device's bubbles — names only, shown in the players hall. */
const KEY = "fb:seen-players";
const MAX = 30;

export type SeenPlayer = { latinName: string; displayName: string; club: string | null };

export function readSeenPlayers(): SeenPlayer[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SeenPlayer[];
    return Array.isArray(raw) ? raw.filter((p) => p && typeof p.latinName === "string" && p.latinName) : [];
  } catch {
    return [];
  }
}

export function rememberPlayers(seeds: PlayerSeed[]) {
  try {
    const fresh = seeds.map((s) => ({ latinName: s.latinName, displayName: s.displayName, club: s.club ?? null }));
    const seen = new Set<string>();
    const merged = [...fresh, ...readSeenPlayers()].filter((p) => {
      const k = p.latinName.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    localStorage.setItem(KEY, JSON.stringify(merged.slice(0, MAX)));
  } catch {
    /* storage unavailable — ignore */
  }
}
