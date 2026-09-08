import { useEffect, useRef, useState } from "react";

/**
 * Progress that feels honest: climbs quickly at first, slows down, and never
 * pretends to finish. Once `done` flips true it snaps to 100 and stays there.
 */
export function useSmartProgress(active: boolean, done: boolean, ceiling = 95) {
  const [value, setValue] = useState(active && !done ? 1 : 0);
  const timer = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const clear = () => {
      if (timer.current !== null) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };

    if (done) {
      clear();
      setValue(100);
      return clear;
    }

    if (!active) {
      clear();
      setValue(0);
      return clear;
    }

    // Always start fresh from 1%.
    setValue(1);
    startRef.current = Date.now();

    timer.current = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      let next: number;
      if (elapsed < 4000) {
        // Phase 1: 1% -> 70% over ~4s with a gentle ease-out curve.
        const t = elapsed / 4000;
        const eased = 1 - Math.pow(1 - t, 2);
        next = 1 + 69 * eased;
      } else {
        // Phase 2: slow asymptotic climb from 70% toward the ceiling.
        const over = elapsed - 4000;
        next = 70 + (ceiling - 70) * (1 - Math.exp(-over / 8000));
      }
      setValue(Math.min(next, ceiling));
    }, 120);

    return clear;
  }, [active, done, ceiling]);

  return Math.round(value);
}

/** Rotates through stage labels while loading, without ever going backwards. */
export function useStageLabel(active: boolean, stages: string[], everyMs = 2400) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setIndex((current) => Math.min(current + 1, stages.length - 1));
    }, everyMs);
    return () => window.clearInterval(id);
  }, [active, stages.length, everyMs]);

  return stages[Math.min(index, stages.length - 1)] ?? "";
}

/** Live online/offline state, safe for SSR. */
export function useOnline() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
