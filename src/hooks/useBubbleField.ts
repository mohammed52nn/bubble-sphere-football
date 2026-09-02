import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BubbleLayout } from "@/components/football/PlayerBubble";
import { seededRandom } from "@/lib/football/format";
import type { PlayerSeed } from "@/lib/football/types";

export interface Bubble {
  key: string;
  seed: PlayerSeed;
  slot: number;
  phase: "entering" | "live" | "exiting";
}

const ENTER_MS = 1500;
const EXIT_MS = 1100;
const MIN_CYCLE = 35000;
const MAX_CYCLE = 50000;

/** Deterministic slot geometry: a soft grid with per-seed jitter. */
function layoutFor(slot: number, seedId: string, capacity: number): BubbleLayout {
  const cols = capacity <= 6 ? 2 : 3;
  const rows = Math.ceil(capacity / cols);
  const col = slot % cols;
  const row = Math.floor(slot / cols) % rows;

  const baseSize = cols === 2 ? 36 : 24;
  const size = baseSize * (0.86 + seededRandom(seedId, 11) * 0.3);

  const cellW = 100 / cols;
  const topPad = 4;
  const usableH = 92 - topPad;
  const cellH = usableH / rows;

  const jitterX = (seededRandom(seedId, 12) - 0.5) * cellW * 0.34;
  const jitterY = (seededRandom(seedId, 13) - 0.5) * cellH * 0.34;

  const left = Math.min(
    100 - size - 2,
    Math.max(2, (col + 0.5) * cellW - size / 2 + jitterX),
  );
  const top = Math.max(topPad, topPad + row * cellH + cellH * 0.12 + jitterY);
  const depth = 0.82 + seededRandom(seedId, 14) * 0.18;

  return { left, top, size, depth };
}

export function useBubbleField(options: {
  capacity: number;
  paused: boolean;
  onNeedSeeds?: () => Promise<PlayerSeed[]>;
}) {
  const { capacity, paused, onNeedSeeds } = options;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const pool = useRef<PlayerSeed[]>([]);
  const used = useRef<Set<string>>(new Set());
  const timers = useRef<number[]>([]);
  const fetching = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    },
    [],
  );

  /** Replace the whole field (new search / re-discovery). */
  const reset = useCallback(
    (seeds: PlayerSeed[]) => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      used.current = new Set(seeds.map((seed) => seed.id));
      const visible = seeds.slice(0, capacity);
      pool.current = seeds.slice(capacity);
      setBubbles(
        visible.map((seed, index) => ({
          key: `${seed.id}-0`,
          seed,
          slot: index,
          phase: "entering" as const,
        })),
      );
      later(
        () => setBubbles((current) => current.map((b) => ({ ...b, phase: "live" as const }))),
        ENTER_MS,
      );
    },
    [capacity, later],
  );

  const topUp = useCallback(async (): Promise<PlayerSeed | null> => {
    const next = pool.current.shift();
    if (next) return next;
    if (!onNeedSeeds || fetching.current) return null;
    fetching.current = true;
    try {
      const seeds = await onNeedSeeds();
      const fresh = seeds.filter((seed) => !used.current.has(seed.id));
      fresh.forEach((seed) => used.current.add(seed.id));
      pool.current.push(...fresh);
    } catch {
      /* keep the field as-is on failure */
    } finally {
      fetching.current = false;
    }
    return pool.current.shift() ?? null;
  }, [onNeedSeeds]);

  const swapOne = useCallback(async () => {
    const current = bubbles;
    if (current.length === 0) return;
    const target = current[Math.floor(Math.random() * current.length)];
    if (!target) return;
    const incoming = await topUp();
    if (!incoming) return;

    setBubbles((list) =>
      list.map((b) => (b.key === target.key ? { ...b, phase: "exiting" as const } : b)),
    );
    later(() => {
      setBubbles((list) =>
        list.map((b) =>
          b.key === target.key
            ? {
                key: `${incoming.id}-${Date.now()}`,
                seed: incoming,
                slot: target.slot,
                phase: "entering" as const,
              }
            : b,
        ),
      );
      later(
        () =>
          setBubbles((list) =>
            list.map((b) => (b.phase === "entering" ? { ...b, phase: "live" as const } : b)),
          ),
        ENTER_MS,
      );
    }, EXIT_MS);
  }, [bubbles, later, topUp]);

  // One lifecycle tick every 35–50s, frozen while paused.
  useEffect(() => {
    if (paused || bubbles.length === 0) return;
    const delay = MIN_CYCLE + Math.random() * (MAX_CYCLE - MIN_CYCLE);
    const id = window.setTimeout(() => {
      if (!pausedRef.current) void swapOne();
    }, delay);
    return () => window.clearTimeout(id);
  }, [paused, bubbles, swapOne]);

  const layouts = useMemo(
    () => new Map(bubbles.map((b) => [b.key, layoutFor(b.slot, b.seed.id, capacity)])),
    [bubbles, capacity],
  );

  return {
    bubbles,
    layouts,
    reset,
    visibleIds: useMemo(() => bubbles.map((b) => b.seed.id), [bubbles]),
    usedIds: used,
  };
}
