import { useEffect, useRef, useState } from "react";

/**
 * Progress that feels honest: climbs quickly at first, slows down, and never
 * pretends to finish. Once `done` flips true it snaps to 100 and stays there.
 */
export function useSmartProgress(active: boolean, done: boolean, ceiling = 96) {
  const [value, setValue] = useState(active && !done ? 8 : 0);
  const timer = useRef<number | null>(null);

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

    setValue((current) => (current > 0 ? current : 6));
    timer.current = window.setInterval(() => {
      setValue((current) => {
        if (current >= ceiling) return ceiling;
        const remaining = ceiling - current;
        const step = Math.max(0.4, remaining * 0.06);
        return Math.min(ceiling, current + step);
      });
    }, 220);

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
