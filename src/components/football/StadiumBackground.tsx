import { useEffect } from "react";
import stadium from "@/assets/stadium.jpg";

/** Sparse, deterministic particles (same on server and client). */
const PARTICLES = Array.from({ length: 10 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
    return x - Math.floor(x);
  };
  return {
    left: 4 + r(1) * 92,
    top: 52 + r(2) * 46,
    size: 1.5 + r(3) * 2,
    duration: 22 + r(4) * 18,
    delay: -r(5) * 30,
    sway: (r(6) - 0.5) * 40,
  };
});

/**
 * Stadium stays readable: moderate blur + blue grading + haze + vignette,
 * with a very slow camera drift, soft fog, a restrained light beam and
 * a few floating particles. CSS transforms/opacity only.
 */
export function StadiumBackground() {
  useEffect(() => {
    const root = document.documentElement;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const lite =
      (nav.hardwareConcurrency ?? 8) <= 4 ||
      (nav.deviceMemory ?? 8) <= 4 ||
      nav.connection?.saveData === true;
    root.classList.toggle("fb-lite", lite);

    const onVisibility = () => root.classList.toggle("fb-paused", document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      root.classList.remove("fb-paused");
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <img
        src={stadium}
        alt=""
        width={1280}
        height={1920}
        className="animate-drift-bg h-full w-full object-cover [filter:blur(2.5px)_saturate(0.82)_brightness(0.74)]"
      />
      <div className="veil absolute inset-0" />
      <div className="light-beam absolute -inset-x-1/4 -top-[10%] h-[80%]" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 18%, oklch(0.82 0.08 222 / 13%) 0%, transparent 60%)",
        }}
      />
      <div className="fog-layer absolute -inset-x-[10%] bottom-0 h-[70%]" />
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle absolute"
          style={
            {
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--p-duration": `${p.duration}s`,
              "--p-delay": `${p.delay}s`,
              "--p-sway": `${p.sway}px`,
            } as React.CSSProperties
          }
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 50%, transparent 45%, oklch(0.09 0.04 260 / 70%) 100%)",
        }}
      />
    </div>
  );
}
